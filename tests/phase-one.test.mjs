import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const base='http://127.0.0.1:8088';
const output=execFileSync('docker',['compose','run','--rm','cli','eval-file','/workspace/tests/phase-one.php','auth'],{encoding:'utf8',maxBuffer:1024*1024});
const data=JSON.parse(output.trim());
test('local overview, real native order result and customer account use the new feature',async()=>{
  const hub=await fetch(base+'/aster-preview/');assert.equal(hub.status,200);const html=await hub.text();
  assert.match(html,/phase-one@aster\.test/);assert.match(html,/noindex/);assert.doesNotMatch(html,/jointly operated|Cherrycom/);
  const links=[...html.matchAll(/href="([^"]+aster-preview\/\?order=[^"]+)"/g)].map(x=>x[1].replaceAll('&amp;','&').replaceAll('&#038;','&').replaceAll('&#38;','&'));
  assert.equal(links.length,6);
  for (const url of links) {
    const r=await fetch(url);const text=await r.text();assert.equal(r.status,200);assert.match(text,/class="ae-order"/);assert.match(text,/simulated payment status/);
    assert.match(r.headers.get('cache-control'),/no-store|no-cache/);
  }
  const native=await fetch(data.account_result_url,{headers:{Cookie:data.auth.customer.cookie}});assert.match(await native.text(),/class="ae-order"/);
  const wrong=await fetch(data.account_result_url.replace(/key=[^&]+/,'key=invalid'),{headers:{Cookie:data.auth.customer.cookie}});assert.doesNotMatch(await wrong.text(),/Your order note|class="ae-order"/);
  const account=await fetch(base+'/my-account/view-order/'+data.account_order+'/',{headers:{Cookie:data.auth.customer.cookie}});
  assert.match(await account.text(),/class="ae-order"/);
  const foreign=await fetch(base+'/my-account/view-order/'+data.fixtures.shipped+'/',{headers:{Cookie:data.auth.customer.cookie}});
  assert.doesNotMatch(await foreign.text(),/TEST-ORDER-001|class="ae-order"/);
});
test('guest lookup rejects foreign origins and incorrect identities and returns a read-only detail',async()=>{
  const page=await fetch(base+'/order-status/');assert.match(page.headers.get('content-security-policy'),/img-src 'self'/);
  async function lookup(email,origin=base) { return fetch(base+'/wp-json/aster/v1/order-access/lookup',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Aster-Order-View':'detail'},body:JSON.stringify({order_number:String(data.fixtures.shipped),email})}); }
  assert.equal((await lookup('phase-one@aster.test','https://example.test')).status,403);
  assert.equal((await lookup('wrong@aster.test')).status,404);
  const r=await lookup('phase-one@aster.test');assert.equal(r.status,200);
  const body=await r.json();assert.match(body.detail_html,/TEST-ORDER-001/);assert.doesNotMatch(body.detail_html,/wc_order_|billing_email|phase-one@aster.test|Continue this order/);
  assert.match(r.headers.get('cache-control'),/no-store/);
});
test('shipment editor is available through the authenticated native Woo order screen',async()=>{
  const r=await fetch(base+'/wp-admin/admin.php?page=wc-orders&action=edit&id='+data.fixtures.shipped,{headers:{Cookie:data.auth.admin.cookie}});
  const html=await r.text();assert.equal(r.status,200);assert.match(html,/aster_shipment_nonce/);assert.match(html,/name="aster_shipment\[tracking_number\]"/);assert.match(html,/TEST-ORDER-001/);
});
