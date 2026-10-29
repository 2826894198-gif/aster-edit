import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { storefrontOrigin } from './local-origin.mjs';
const base = 'http://127.0.0.1:8088';

test('all shared canvas regions use pure white, including the footer', () => {
  const css = fs.readFileSync('wordpress/mu-plugins/aster-commerce/commerce.css', 'utf8');
  for (const token of ['bg', 'paper', 'soft']) assert.ok(css.includes(`--aster-${token}:#ffffff;`));
  assert.match(css, /\.aster-header\{[^}]*background:#ffffff;/);
  assert.match(css, /\.aster-commerce-footer\{background:#ffffff;color:var\(--aster-ink\)/);
  assert.doesNotMatch(css, /background:#(?:fffefa|fffcf8|292b2e)/);
});

test('order access uses the independent Aster presentation, not the retired test-card design', async () => {
  const response = await fetch(`${base}/order-status/`);
  const html = await response.text();
  assert.match(html, /class="aster-commerce-site(?: [^"]*)?"/);
  assert.match(html, /commerce\.css\?v=/);
  assert.doesNotMatch(html, /order-status\.css/);
  assert.match(html, /class="aster-wordmark"/);
  if (html.includes('aster-phase-one')) {
    assert.match(html, /id="ae-lookup"/);
    assert.match(html, /id="ae-guest-result"/);
    assert.match(html, /id="ae-close-order"/);
  } else {
    assert.match(html, /id="request-form"/);
    assert.match(html, /id="exchange"/);
    assert.match(html, /id="logout"/);
  }
  assert.match(response.headers.get('content-security-policy'), /font-src 'self'/);
  assert.match(response.headers.get('cache-control'), /no-cache|no-store/);
});

test('native account forms and the empty cart use one shared Aster shell', async () => {
  for (const [route, marker] of [['my-account/', 'woocommerce-login-nonce'], ['my-account/lost-password/', 'woocommerce-lost-password-nonce'], ['cart/', 'aster-empty-cart']]) {
    const response = await fetch(`${base}/${route}`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.ok(html.includes(marker), `${route} preserves native controls`);
    assert.match(html, /aster-commerce-site/);
    assert.match(html, /aster-commerce-footer/);
    assert.match(html, /commerce\.css/);
    assert.doesNotMatch(html, /Great things are on the horizon/);
    assert.ok(html.includes(`href="${storefrontOrigin}/shop#bag" aria-label="Review your selection"`));
    if (route === 'cart/') {
      assert.match(html, /Your checkout bag is empty\./);
      assert.match(html, /Review the pieces you selected on Aster Edit/);
    }
  }
});

test('closed checkout rejects Store API order submission before order creation', async () => {
  const submission = await fetch(`${base}/wp-json/wc/store/v1/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(submission.status, 503);
  assert.equal((await submission.json()).code, 'aster_checkout_closed');
});

test('font files are local licensed copies; typography does not depend on the frontend server', async () => {
  for (const name of ['cormorant-garamond', 'inter']) {
    for (const weight of [400, 500, 600]) {
      const file = `${name}-latin-${weight}-normal.woff2`;
      const local = fs.readFileSync(`wordpress/mu-plugins/aster-commerce/fonts/${file}`);
      assert.equal(local.subarray(0, 4).toString(), 'wOF2');
      const response = await fetch(`${base}/wp-content/mu-plugins/aster-commerce/fonts/${file}`);
      assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), local);
    }
  }
  for (const license of ['Inter-LICENSE', 'Cormorant-Garamond-LICENSE']) assert.match(fs.readFileSync(`wordpress/mu-plugins/aster-commerce/fonts/${license}`, 'utf8'), /OPEN FONT LICENSE/);
});
