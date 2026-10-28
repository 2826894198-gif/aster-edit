import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { storefrontOrigin } from './local-origin.mjs';
const base = 'http://127.0.0.1:8088';
const route = `${base}/wp-json/aster/v1/checkout-handoffs`;
const items = [{ catalog_key: 'test-only:ceramic', quantity: 2 }];
const cli = (...args) => JSON.parse(execFileSync('docker', ['compose', 'run', '--rm', 'cli', 'eval-file', '/workspace/tests/handoff-fixture.php', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim());
const gateway = execFileSync('docker', ['inspect', 'aster-commerce-dev-wordpress-1', '--format', '{{range .NetworkSettings.Networks}}{{.Gateway}}{{end}}'], { encoding: 'utf8' }).trim();
cli('reset-rate', gateway);
async function create(body = { items, entry: 'checkout' }, origin = storefrontOrigin) {
  return fetch(route, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
async function issue() {
  const r = await create(); assert.equal(r.status, 201);
  const data = await r.json(), url = new URL(data.handoff_url);
  assert.equal(data.expires_in, 300); assert.equal(url.origin, base); assert.equal(url.pathname, '/checkout/');
  assert.equal(url.searchParams.get('aster_handoff'), '1');
  for (const [key,value] of url.searchParams) { assert.ok(['aster_handoff','aster_checkout_review'].includes(key)); assert.equal(value,'1'); }
  const token = url.hash.slice('#handoff='.length); assert.match(token, /^[a-f0-9]{64}$/);
  return token;
}
function client() {
  const jar = new Map();
  const request = async (path, body, extra = {}, form = false) => {
    const r = await fetch(new URL(path, base), { redirect: 'manual', headers: { Origin: base, Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '), ...(body ? { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' } : {}), ...extra }, method: body ? 'POST' : 'GET', ...(body ? { body: form ? new URLSearchParams(body) : JSON.stringify(body) } : {}) });
    for (const c of r.headers.getSetCookie()) { const pair = c.split(';')[0], i = pair.indexOf('='); jar.set(pair.slice(0, i), pair.slice(i + 1)); }
    return r;
  };
  return { request, review: token => request('/?wc-ajax=aster_handoff_review', { token }), confirm: (token, proof) => request('/?wc-ajax=aster_handoff_confirm', { token, proof }), cart: async () => (await request('/wp-json/wc/store/v1/cart')).json() };
}

test('strict selection contract, commercial gate and exact-origin credential-free CORS', async () => {
  const blocked = await create({ items }, 'https://attacker.test');
  assert.equal(blocked.status, 403); assert.equal(blocked.headers.get('access-control-allow-origin'), null);
  const preflight = await fetch(route, { method: 'OPTIONS', headers: { Origin: storefrontOrigin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'Content-Type' } });
  assert.equal(preflight.headers.get('access-control-allow-origin'), storefrontOrigin);
  assert.equal(preflight.headers.get('access-control-allow-credentials'), null);
  for (const body of [{ items, price: '0.01' }, { items: [] }, { items: [...items, ...items] }, { items: [{ ...items[0], quantity: -1 }] }, { items: [{ ...items[0], quantity: 1.5 }] }, { items: [{ ...items[0], quantity: '1' }] }, { items: [{ ...items[0], unit_price: '0.01' }] }]) assert.equal((await create(body)).status, 400);
  for (const key of ['fangju-yellow-petal:05', 'fangju-yellow-petal:full-set', 'unknown:product']) assert.equal((await create({ items: [{ catalog_key: key, quantity: 1 }] })).status, 409);
  assert.equal((await create({ items: [{ ...items[0], quantity: 20 }] })).status, 409, 'Insufficient stock rejected');
  const ok = await create(); assert.equal(ok.status, 201); assert.match(ok.headers.get('cache-control'), /no-store/);
  assert.equal(ok.headers.get('access-control-allow-credentials'), null);
  const legacy = await create({ items });
  assert.equal(new URL((await legacy.json()).handoff_url).pathname, '/checkout-handoff/', 'Existing browser tabs retain a recognized entry URL');
  assert.equal((await create({ items, entry: 'https://attacker.test' })).status, 400, 'Capability is not a custom redirect');
});

test('real Woo cart: session-bound preflight, eight concurrent confirmations, no orders/payments', async () => {
  const before = cli('stats');
  const a = client(), b = client(), token = await issue();
  assert.equal((await a.confirm(token, 'unreviewed')).status, 409);
  const response = await a.review(token); assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(response.headers.get('cache-control'), /no-store/);
  const review = await response.json(); assert.equal(review.can_continue, true); assert.equal(typeof review.items[0].unit_price, 'string'); assert.equal(Number(review.items[0].unit_price), 1); assert.equal(review.items[0].quantity, 2);
  assert.equal((await a.cart()).items_count, 0, 'Review never adds pieces');
  assert.equal((await b.confirm(token, review.proof)).status, 409, 'Proof is bound to the reviewing native session');
  assert.equal((await b.review(token)).status, 409, 'Cannot rebind another device');
  const attempts = await Promise.all(Array.from({ length: 8 }, () => a.confirm(token, review.proof)));
  assert.equal(attempts.filter(r => r.status === 200).length, 1);
  assert.equal(attempts.filter(r => r.status === 410).length, 7);
  const cart = await a.cart(); assert.equal(cart.items_count, 2); assert.equal(cart.items[0].quantity, 2); assert.equal(cart.items[0].prices.price, '100');
  const again = await issue(), existing = await (await a.review(again)).json();
  assert.equal(existing.can_continue, false); assert.equal(existing.existing_items[0].quantity, 2);
  assert.equal(Number(existing.existing_items[0].unit_price), 1, 'Existing bag review shows its current unit price');
  assert.equal(existing.same_selection, true, 'An identical existing bag can proceed without duplicate cart lines');
  assert.equal((await a.confirm(again, existing.proof)).status, 409);
  assert.equal((await a.cart()).items_count, 2, 'Existing bag neither replaced nor merged');
  assert.deepEqual(cli('stats'), before, 'Handoff creates no orders and reserves/decrements no inventory');
});

test('two different selections cannot race to replace a bag; price changes invalidate review', async () => {
  const a = client(), first = await issue(), second = await issue();
  const one = await (await a.review(first)).json(), two = await (await a.review(second)).json();
  const attempts = await Promise.all([a.confirm(first, one.proof), a.confirm(second, two.proof)]);
  assert.equal(attempts.filter(r => r.status === 200).length, 1);
  assert.equal(attempts.filter(r => r.status === 409).length, 1);
  assert.equal((await a.cart()).items_count, 2);
  const b = client(), priced = await issue(), quote = await (await b.review(priced)).json();
  const old = cli('price', '1.25').previous;
  try { assert.equal((await b.confirm(priced, quote.proof)).status, 409); assert.equal((await b.cart()).items_count, 0); }
  finally { cli('price', old); }
});

test('expired tokens and foreign-origin exchanges fail; page is no-store with no-referrer', async () => {
  const a = client(), token = await issue();
  assert.equal((await a.request('/?wc-ajax=aster_handoff_review', { token }, { Origin: storefrontOrigin })).status, 403);
  cli('expire', token); assert.equal((await a.review(token)).status, 410);
  const page = await fetch(`${base}/checkout-handoff/`);
  assert.equal(page.status, 200); assert.equal(page.headers.get('referrer-policy'), 'no-referrer');
  assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.match(page.headers.get('cache-control'), /no-cache|no-store/);
  assert.ok(!(await page.text()).includes('id="handoff-demo"'), 'Test entry absent from ordinary customer route');
  const direct = await fetch(`${base}/checkout/?aster_handoff=1`, { redirect: 'manual' });
  assert.equal(direct.status, 200, 'An empty bag can initialize on the checkout path before Woo redirects');
  assert.equal(direct.headers.get('referrer-policy'), 'no-referrer');
  assert.match(await direct.text(), /data-direct-entry="1"/);
  const invalidMethod = await fetch(`${base}/checkout/?aster_handoff=1`, { method: 'POST', redirect: 'manual' });
  assert.equal(invalidMethod.status, 405, 'The preparation route cannot submit a checkout order');
});

test('signed-in native Woo identity survives handoff without REST login nonce or email detour', async () => {
  const a = client();
  const html = await (await a.request('/my-account/?view=register')).text();
  const nonce = html.match(/name="woocommerce-register-nonce"[^>]*value="([^"]+)"/)?.[1];
  assert.ok(nonce);
  const registered = await a.request('/my-account/?view=register', { email: `test-only-handoff-${randomBytes(5).toString('hex')}@aster.test`, password: randomBytes(24).toString('base64url'), register: 'Register', 'woocommerce-register-nonce': nonce }, {}, true);
  assert.equal(registered.status, 302);
  assert.ok((await (await a.request('/my-account/')).text()).includes('woocommerce-MyAccount-navigation'));
  const token = await issue(), review = await (await a.review(token)).json();
  assert.equal(review.can_continue, true);
  assert.equal((await a.confirm(token, review.proof)).status, 200);
  const checkout = await a.request('/checkout/');
  assert.equal(checkout.status, 200);
  const page = await checkout.text();
  assert.ok(page.includes('wp-block-woocommerce-checkout') || page.includes('class="checkout woocommerce-checkout"'), 'Native Woo checkout is reached with the selected classic interface or Blocks');
  assert.ok((await (await a.request('/my-account/')).text()).includes('woocommerce-MyAccount-navigation'), 'Still signed in');
});
