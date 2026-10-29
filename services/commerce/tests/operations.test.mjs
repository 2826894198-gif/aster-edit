import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const base = 'http://127.0.0.1:8088';
const fixture = JSON.parse(execFileSync('docker', ['compose', 'run', '--rm', 'cli', 'eval-file', '/workspace/tests/operations-fixture.php', 'auth'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim());
async function request(role, path, body, extra = {}) {
  const user = fixture.users[role];
  return fetch(`${base}/wp-json/aster/v1/ops/${path}`, { headers: { Origin: base, ...(user ? { Cookie: user.cookie, 'X-WP-Nonce': user.nonce } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...extra }, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) });
}
const target = `orders/${fixture.order_id}`;
const detail = async role => { const r = await request(role, target); assert.equal(r.status, 200); return r.json(); };
async function customerMailCount() {
  const inbox = await (await fetch('http://127.0.0.1:8028/api/v1/messages?limit=100')).json();
  return inbox.messages.filter(m => m.To?.some(to => to.Address === 'test-only-ops-customer@aster.test')).length;
}
const initialMailCount = await customerMailCount();

test('real authenticated REST: role-specific views and native admin workbench', async () => {
  for (const role of ['guest', 'customer']) assert.equal((await request(role, 'orders')).status, 403);
  for (const role of ['support', 'fulfillment', 'finance']) {
    const r = await request(role, target); assert.equal(r.status, 200); assert.match(r.headers.get('cache-control'), /no-store/);
    assert.equal(r.headers.get('access-control-allow-origin'), null);
    const order = await r.json(); assert.equal(order.dispatch_allowed, false);
    assert.equal('notes' in order, role === 'support'); assert.equal('shipping_address' in order, role === 'fulfillment'); assert.equal('payment_review' in order, role === 'finance');
    assert.ok(!JSON.stringify(order).includes('test-only-ops-customer@aster.test'), 'No unnecessary customer email');
    assert.ok(!JSON.stringify(order.events).includes('fingerprint'));
    const native = await fetch(`${base}/wp-json/wc/v3/orders/${fixture.order_id}`, { headers: { Cookie: fixture.users[role].cookie, 'X-WP-Nonce': fixture.users[role].nonce } });
    assert.equal(native.status, 403, 'Narrow staff role cannot bypass via broad Woo order API');
    const admin = await fetch(`${base}/wp-admin/admin.php?page=aster-orders`, { headers: { Cookie: fixture.users[role].cookie } });
    const html = await admin.text(); assert.equal(admin.status, 200); assert.ok(html.includes('id="ops-rows"') && html.includes('id="ops-detail"'), 'Actual admin workbench renders for narrow role');
  }
  assert.equal((await request('support', 'orders?page=0')).status, 400);
  assert.equal((await request('support', 'orders?status=not-real')).status, 400);
  const list = await (await request('support', 'orders?page=1')).json(); assert.ok(list.orders.length <= 20);
});

test('internal note writes: nonce, role, same-origin, optimistic revision and idempotent replay', async () => {
  const start = await detail('support');
  const body = { revision: start.revision, request_id: randomUUID(), text: 'TEST ONLY — internal note, no customer email.' };
  for (const role of ['guest', 'customer', 'fulfillment', 'finance']) assert.equal((await request(role, `${target}/note`, body)).status, 403);
  assert.equal((await request('support', `${target}/note`, body, { 'X-WP-Nonce': 'invalid' })).status, 403);
  assert.equal((await request('support', `${target}/note`, body, { Origin: 'https://attacker.test' })).status, 403);
  const replies = await Promise.all(Array.from({ length: 6 }, () => request('support', `${target}/note`, body)));
  for (const reply of replies) assert.equal(reply.status, 200);
  const results = await Promise.all(replies.map(r => r.json()));
  assert.equal(results.filter(r => !r.replayed).length, 1);
  const after = await detail('support'); assert.equal(after.revision, start.revision + 1); assert.equal(after.notes.length, start.notes.length + 1);
  assert.equal((await request('support', `${target}/note`, { ...body, text: 'Different body' })).status, 409);
  assert.equal((await request('support', `${target}/note`, { ...body, request_id: randomUUID() })).status, 409);
});

test('shipment preparation is private draft only; stale concurrent edits cannot silently overwrite', async () => {
  const start = await detail('fulfillment');
  const draft = { revision: start.revision, request_id: randomUUID(), carrier: 'Other', tracking_number: 'TEST-ONLY-NOT-A-REAL-SHIPMENT' };
  for (const role of ['support', 'finance', 'customer']) assert.equal((await request(role, `${target}/shipment-draft`, draft)).status, 403);
  assert.equal((await request('fulfillment', `${target}/shipment-draft`, { ...draft, tracking_number: 'https://attacker.test/' })).status, 400);
  const concurrent = await Promise.all([request('fulfillment', `${target}/shipment-draft`, draft), request('fulfillment', `${target}/shipment-draft`, { ...draft, request_id: randomUUID(), tracking_number: 'TEST-ONLY-SECOND-DRAFT' })]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]);
  const after = await detail('fulfillment'); assert.equal(after.shipment_draft.state, 'draft'); assert.equal(after.status, 'pending'); assert.equal(after.dispatch_allowed, false);
  assert.ok(!('shipment_draft' in await detail('support')));
  assert.ok(!('shipment_draft' in await detail('finance')));
  assert.equal((await request('fulfillment', `${target}/dispatch`, { request_id: randomUUID() })).status, 404, 'There is no dispatch writer to bypass payment gates');
  const fin = await detail('finance'); assert.equal(fin.payment_review.woo_paid_status, false); assert.equal(fin.payment_review.transaction_id, ''); assert.equal(fin.payment_review.provider_reconciled, false);
});

test('different staff roles serialize edits; private preparation never appears in customer order view', async () => {
  const start = await detail('support');
  const replies = await Promise.all([
    request('support', `${target}/note`, { revision: start.revision, request_id: randomUUID(), text: 'TEST ONLY — cross-role internal note.' }),
    request('fulfillment', `${target}/shipment-draft`, { revision: start.revision, request_id: randomUUID(), carrier: 'Other', tracking_number: 'TEST-ONLY-CROSS-ROLE-DRAFT' }),
  ]);
  assert.deepEqual(replies.map(r => r.status).sort(), [200, 409]);
  assert.equal((await detail('support')).revision, start.revision + 1);
  const customer = await fetch(`${base}/my-account/view-order/${fixture.order_id}/`, { headers: { Cookie: fixture.users.customer.cookie } });
  const html = await customer.text(); assert.equal(customer.status, 200);
  assert.ok(html.includes('TEST ONLY — Ceramic integration fixture'), 'Owner can see their actual order');
  for (const privateText of ['cross-role internal note', 'internal note, no customer email', 'TEST-ONLY-NOT-A-REAL-SHIPMENT', 'TEST-ONLY-SECOND-DRAFT', 'TEST-ONLY-CROSS-ROLE-DRAFT', '_aster_operations_v1']) assert.ok(!html.includes(privateText), 'Private staff preparation stays out of customer order view');
  assert.equal(await customerMailCount(), initialMailCount, 'Internal saves did not send customer mail');
});
