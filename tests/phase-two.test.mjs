import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const base='http://127.0.0.1:8088', inbox='http://127.0.0.1:8028';
const cli=(...args)=>execFileSync('docker',['compose','run','--rm','cli','eval-file','/workspace/tests/phase-two-fixture.php',...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const fixture=JSON.parse(cli('setup'));
const decode=s=>s.replace(/&amp;|&#038;/g,'&');
const field=(html,name)=>decode(html.match(new RegExp(`<input[^>]*name="${name}"[^>]*value="([^"]*)"`))?.[1] ?? '');
function client(auth='') {
  const jar=new Map(auth ? [[fixture.cookie_name,auth]] : []);
  return async(path,body,extra={})=>{
    const r=await fetch(new URL(path,base),{method:body===undefined?'GET':'POST',redirect:'manual',headers:{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),Origin:base,...(body===undefined?{}:{'Content-Type':'application/json'}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
    for(const line of r.headers.getSetCookie()){const pair=line.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}
    return r;
  };
}
const mailList=async()=> (await (await fetch(inbox+'/api/v1/messages?limit=200')).json()).messages;
const detail=async id=> (await fetch(inbox+'/api/v1/message/'+id)).json();

test('local screens and native email samples retain accurate order states',async()=>{
  const visitor=client();
  for(const view of ['','recovery','emails','alerts','reviews']){
    const r=await visitor('/aster-preview/care/?view='+view);assert.equal(r.status,200);assert.match(r.headers.get('x-robots-tag'),/noindex/);
    const html=await r.text();assert.match(html,/Second feature batch/);assert.doesNotMatch(html,/joint.operation|co.operated|共同运营/i);
  }
  for(const [sample,phrase] of [['pending','Payment has not been confirmed'],['checking','Please do not pay again'],['paid','Payment is recorded'],['shipped','Recorded shipment update'],['refunded','Recorded refund']]){
    const html=await (await visitor('/aster-preview/care/?view=emails&mail='+sample)).text();
    assert.match(html,new RegExp(phrase));assert.match(html,/Olive/);assert.match(html,/68/);assert.match(html,/TEST ONLY/);
    if(sample==='pending'||sample==='checking')assert.doesNotMatch(html,/Thank you for your order\./);
    const page=await (await visitor('/aster-preview/care/?view=emails')).text();
    const response=await fetch(base+'/aster-preview/care/?view=emails',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({_wpnonce:field(page,'_wpnonce'),care_action:sample})});
    assert.equal(response.status,200);
  }
  const messages=await mailList();
  for(const pattern of [/Awaiting payment/,/Checking payment/,/Paid/,/Refunded/])assert.ok(messages.some(m=>m.To?.some(t=>t.Address==='phase-one@aster.test')&&pattern.test(m.Subject)),`Local inbox includes ${pattern}`);
});

test('private order links are single use; a matching unverified signup alone cannot claim',async()=>{
  const user=client(fixture.cookie), headers={'X-WP-Nonce':fixture.nonce};
  assert.equal((await user('/wp-json/aster/v1/account/claim-order',{},headers)).status,403);
  const guest=client();assert.equal((await guest('/wp-json/aster/v1/order-access/exchange',{token:fixture.order_link})).status,200);
  assert.equal((await client()('/wp-json/aster/v1/order-access/exchange',{token:fixture.order_link})).status,401);
  const second=await user('/wp-json/aster/v1/order-access/exchange',{token:fixture.order_link});assert.equal(second.status,401);
  // Issue a fresh one-use proof only in the local CLI, never print a token.
  const raw=execFileSync('docker',['compose','run','--rm','cli','eval',`$o=wc_get_order(${fixture.order}); echo Aster_Order_Access::issue($o->get_id(),Aster_Order_Access::email_hash($o->get_billing_email()));`],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  assert.equal((await user('/wp-json/aster/v1/order-access/exchange',{token:raw},headers)).status,200);
  const claimed=await user('/wp-json/aster/v1/account/claim-order',{},headers);assert.equal(claimed.status,200);
  assert.equal(JSON.parse(cli('inspect')).owner,fixture.user);
  assert.equal((await user('/wp-json/aster/v1/account/claim-order',{},headers)).status,403,'Proof session is revoked after claim');
  const inaccessible=await client()('/wp-json/aster/v1/order-access/order');assert.equal(inaccessible.status,401);
});

test('email-only order recovery is generic, private and delivers a real local email',async()=>{
  const guest=client();
  const known=await guest('/wp-json/aster/v1/account/recover-orders',{email:fixture.email});
  const unknown=await guest('/wp-json/aster/v1/account/recover-orders',{email:'missing-phase-two@aster.test'});
  assert.equal(known.status,202);assert.equal(unknown.status,202);assert.deepEqual(await known.json(),await unknown.json());
  assert.equal((await guest('/wp-json/aster/v1/account/recover-orders',{email:fixture.email},{Origin:'https://untrusted.test'})).status,403);
  execFileSync('docker',['compose','run','--rm','cli','eval',`$ids=wc_get_orders(['billing_email'=>'${fixture.email}','limit'=>10,'return'=>'ids']); Aster_Care::recover_order_links($ids,Aster_Order_Access::email_hash('${fixture.email}'));`],{stdio:['ignore','pipe','pipe']});
  const messages=await mailList();const hit=messages.find(m=>m.Subject==='Aster Edit · Your private order links'&&m.To?.some(t=>t.Address===fixture.email));assert.ok(hit);
  const mail=await detail(hit.ID);assert.match(mail.HTML,/#access=[a-f0-9]{64}/);assert.match(mail.HTML,/15 minutes/);
});

test('purchase reviews: item binding, consent, moderation, private photos and idempotent retry',async()=>{
  const guest=client();
  const payload={item:fixture.item,name:'TEST ONLY Reviewer',text:'Synthetic local review for checking moderation and photo handling. This is not a real customer testimonial.',rating:4,consent:true,photo_consent:true,photos:[fixture.photo]};
  assert.equal((await guest('/wp-json/aster/v1/reviews',payload)).status,403);
  assert.equal((await guest('/wp-json/aster/v1/reviews/access',{token:fixture.review_link})).status,200);
  assert.equal((await client()('/wp-json/aster/v1/reviews/access',{token:fixture.review_link})).status,401);
  const access=await(await guest('/wp-json/aster/v1/reviews/purchase')).json();assert.equal(access.items[0].id,fixture.item);assert.equal(access.test_only,true);
  assert.equal((await guest('/wp-json/aster/v1/reviews',{...payload,item:fixture.other_item})).status,400,'Foreign item rejected');
  assert.equal((await guest('/wp-json/aster/v1/reviews',{...payload,consent:false})).status,400);
  assert.equal((await guest('/wp-json/aster/v1/reviews',{...payload,photo_consent:false})).status,400);
  assert.equal((await guest('/wp-json/aster/v1/reviews',payload,{'Origin':'https://untrusted.test'})).status,403);
  const submitted=await guest('/wp-json/aster/v1/reviews',payload);assert.equal(submitted.status,201,await submitted.text());
  assert.equal((await guest('/wp-json/aster/v1/reviews',payload)).status,200,'Same payload is idempotent');
  assert.equal((await guest('/wp-json/aster/v1/reviews',{...payload,rating:5})).status,409);
  let stored=JSON.parse(cli('inspect'));assert.equal(stored.status,'0');assert.equal(stored.photo_ids.length,1);
  const photo=stored.photo_ids[0];
  assert.equal((await guest('/wp-json/aster/v1/review-photo/'+photo)).status,404,'Pending photo is private');
  const before=await(await guest('/wp-json/aster/v1/reviews?product='+fixture.product)).json();assert.ok(!before.reviews.some(r=>r.id===stored.comment));
  assert.equal(cli('moderate',String(stored.comment),'approve'),'OK');
  const after=await(await guest('/wp-json/aster/v1/reviews?product='+fixture.product)).json();const published=after.reviews.find(r=>r.id===stored.comment);assert.ok(published);assert.equal(published.test_only,true);assert.equal(published.verified,true);
  assert.ok(!JSON.stringify(after).includes(fixture.email),'Email is private');assert.ok(!JSON.stringify(after).includes('order_id'),'Order ID is private');
  assert.equal((await guest(published.photos[0].url)).status,200);
  const file=execFileSync('docker',['compose','run','--rm','cli','eval',`echo get_post_meta(${photo},'_wp_attached_file',true);`],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  assert.equal((await guest('/wp-content/uploads/'+file)).status,403,'Raw private upload URL is denied');
  assert.equal(cli('moderate',String(stored.comment),'hold'),'OK');
  assert.equal((await guest('/wp-json/aster/v1/review-photo/'+photo)).status,404,'Unapproval immediately hides photo');
  cli('moderate',String(stored.comment),'approve');
  assert.match(cli('checks'),/Success:/);
});
