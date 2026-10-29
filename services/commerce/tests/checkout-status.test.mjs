import test from 'node:test';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:8088';
test('a real native Woo session can check status, while another session and wrong origins cannot',async()=>{
  const jar=new Map();
  async function request(path,body,headers={},form=false) {
    const response=await fetch(new URL(path,base),{method:body?'POST':'GET',redirect:'manual',headers:{Origin:base,Cookie:[...jar].map(([key,value])=>`${key}=${value}`).join('; '),...(body?{'Content-Type':form?'application/x-www-form-urlencoded':'application/json'}:{}),...headers},...(body?{body:form?new URLSearchParams(body):JSON.stringify(body)}:{})});
    for (const cookie of response.headers.getSetCookie()) {const pair=cookie.split(';')[0], split=pair.indexOf('=');jar.set(pair.slice(0,split),pair.slice(split+1));}
    return response;
  }
  const issue=await request('/wp-json/aster/v1/checkout-handoffs',{items:[{catalog_key:'test-only:ceramic',quantity:1}],entry:'checkout'});
  assert.equal(issue.status,201);
  const handoff=new URL((await issue.json()).handoff_url),token=handoff.hash.slice('#handoff='.length);
  const review=await request('/?wc-ajax=aster_handoff_review',{token});assert.equal(review.status,200);
  const proof=(await review.json()).proof;
  assert.equal((await request('/?wc-ajax=aster_handoff_confirm',{token,proof})).status,200);
  const html=await (await request('/checkout/?aster_checkout_review=1')).text();
  const config=JSON.parse(html.match(/var AsterNativeCheckout = (\{[^\n]+\});/)[1]);
  const ready=await request(config.statusUrl,{nonce:config.nonce},{},true);assert.equal(ready.status,200);
  assert.deepEqual(await ready.json(),{customer_state:'ready',safe_action:'reload_checkout',payment_locked:false});
  assert.match(ready.headers.get('cache-control'),/no-store|no-cache/);
  assert.equal((await request(config.statusUrl,{nonce:config.nonce},{Origin:'https://example.test'},true)).status,403);
  assert.equal((await request(config.statusUrl,{nonce:'invalid'},{},true)).status,403);
  const foreign=await fetch(new URL(config.statusUrl,base),{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({nonce:config.nonce})});
  assert.equal(foreign.status,403);
});
