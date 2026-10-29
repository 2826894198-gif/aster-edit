import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const base = 'http://127.0.0.1:8088';
const decode = value => value.replace(/&amp;|&#038;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"');
const field = (html, name) => {
  const tag = html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0];
  assert.ok(tag, `Native field ${name} is present`);
  return decode(tag.match(/value="([^"]*)"/)?.[1] ?? '');
};
function client() {
  const jar = new Map();
  return async function request(path, body) {
    let url = new URL(path, base).href;
    for (let i = 0; i < 8; i++) {
      assert.equal(new URL(url).origin, base, 'No external test traffic');
      const response = await fetch(url, { redirect: 'manual', method: body ? 'POST' : 'GET', headers: { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '), ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded', Origin: base } : {}) }, ...(body ? { body: new URLSearchParams(body) } : {}) });
      for (const line of response.headers.getSetCookie()) {
        const pair = line.split(';')[0], index = pair.indexOf('=');
        jar.set(pair.slice(0, index), pair.slice(index + 1));
      }
      if (response.status >= 300 && response.status < 400) { url = new URL(response.headers.get('location'), url).href; body = undefined; continue; }
      return { response, html: await response.text() };
    }
    throw new Error('Unexpected redirect loop');
  };
}
async function mailFor(email, match) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const inbox = await (await fetch('http://127.0.0.1:8028/api/v1/messages?limit=100')).json();
    const hit = inbox.messages.find(m => m.To?.some(to => to.Address === email) && match.test(m.Subject));
    if (hit) return (await fetch(`http://127.0.0.1:8028/api/v1/message/${hit.ID}`)).json();
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Expected local account email did not arrive');
}
function resetLink(mail) {
  const links = (mail.HTML ?? '').match(/href="[^"]+"/g) ?? [];
  const link = links.map(s => decode(s.slice(6, -1))).find(s => s.startsWith(base) && /key=/.test(s));
  assert.ok(link, 'Actual Woo email contains a password setup link');
  return link;
}
async function setFixturePassword(request, url, password) {
  const { html } = await request(url);
  const body = { wc_reset_password: 'true', password_1: password, password_2: password };
  for (const name of ['reset_key', 'reset_login', 'woocommerce-reset-password-nonce']) body[name] = field(html, name);
  const result = await request('/my-account/lost-password/', body);
  assert.match(result.html, /Your password has been reset successfully/);
}

test('one account task per view; email and password registration without email round trip', async () => {
  const register = (await client()('/my-account/?view=register')).html;
  assert.match(register, /Create your account\./);
  assert.match(register, /name="email"/);
  assert.match(register, /name="password"/);
  assert.doesNotMatch(register, /name="username"|woocommerce-login-nonce|We’ll email you a link/);
  assert.match(register, /woocommerce-register-nonce/);
  assert.match(register, /woocommerce-privacy-policy-text/);
  const login = (await client()('/my-account/')).html;
  assert.match(login, /Welcome back\./);
  assert.doesNotMatch(login, /woocommerce-register-nonce/);
  assert.match(login, /autocomplete="current-password"/);
  assert.match(login, /lost-password/);
});

test('real HTTP + Mailpit: direct registration → login; separate optional password recovery', async () => {
  // Unique fictional local customer only. No real accounts, external emails or payments.
  const email = `test-only-account-${randomBytes(5).toString('hex')}@aster.test`;
  const request = client();
  const firstPassword = randomBytes(24).toString('base64url');
  const register = (await request('/my-account/?view=register')).html;
  const created = await request('/my-account/?view=register', { email, password: firstPassword, register: 'Register', 'woocommerce-register-nonce': field(register, 'woocommerce-register-nonce') });
  assert.ok(created.html.includes('woocommerce-MyAccount-navigation'), 'Account is immediately accessible without email verification');
  assert.match(created.html, /class="aster-page-heading aster-account-page-heading"/);
  assert.match(created.html, /<h1>My account<\/h1>/);
  assert.match(created.html, /No orders yet\./);
  assert.match(created.html, /Explore collections/);
  assert.match(created.html, /my-account\/aster-help\//);
  assert.match(created.html, /Manage addresses/);
  assert.doesNotMatch(created.html, /woocommerce-MyAccount-navigation-link--payment-methods|From your account dashboard you can view/);
  const orders = (await request('/my-account/orders/')).html;
  assert.match(orders, /No orders yet\./);
  assert.doesNotMatch(orders, /Confirm your email address to check for past orders/);
  const addresses = (await request('/my-account/edit-address/')).html;
  assert.match(addresses, /Add Billing address|Add Shipping address/);
  const profile = (await request('/my-account/edit-account/')).html;
  assert.match(profile, /save-account-details-nonce/);
  const help = (await request('/my-account/aster-help/')).html;
  assert.match(help, /<h1>Help<\/h1>/);
  assert.match(help, /How can we help\?/);
  assert.match(help, /Look up a guest order/);
  assert.match(help, /support@example\.test/);
  assert.match(help, /Read shipping &amp; returns/);
  const closedPayment = (await request('/my-account/payment-methods/')).html;
  assert.match(closedPayment, /Payment methods are unavailable\./);
  assert.doesNotMatch(closedPayment, /ADD PAYMENT METHOD/);
  const logoutUrl = decode(created.html.match(/href="([^"]*customer-logout[^"]*)"/)?.[1] ?? '');
  assert.ok(logoutUrl, 'Native account logout link is present');
  assert.match((await request(logoutUrl)).html, /Welcome back\./);
  const welcome = await mailFor(email, /account/i);
  assert.ok(!/key=/.test(welcome.HTML ?? ''), 'Welcome email is notification only, not password setup');
  const login = async password => {
    const visitor = client();
    const form = (await visitor('/my-account/')).html;
    return visitor('/my-account/', { username: email, password, login: 'Log in', 'woocommerce-login-nonce': field(form, 'woocommerce-login-nonce') });
  };
  assert.match((await login(firstPassword)).html, /woocommerce-MyAccount-navigation/);
  const recover = client();
  const recoveryForm = (await recover('/my-account/lost-password/')).html;
  const sent = await recover('/my-account/lost-password/', { wc_reset_password: 'true', user_login: email, 'woocommerce-lost-password-nonce': field(recoveryForm, 'woocommerce-lost-password-nonce') });
  assert.match(sent.html, /Password reset email has been sent/);
  const recoveryMail = await mailFor(email, /reset/i);
  const secondPassword = randomBytes(24).toString('base64url');
  await setFixturePassword(client(), resetLink(recoveryMail), secondPassword);
  assert.doesNotMatch((await login(firstPassword)).html, /woocommerce-MyAccount-navigation/);
  assert.match((await login(secondPassword)).html, /woocommerce-MyAccount-navigation/);
  const reused = (await client()(resetLink(recoveryMail))).html;
  assert.match(reused, /invalid|expired/i);
});
