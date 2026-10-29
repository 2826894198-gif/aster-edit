import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const script = readFileSync(new URL('../wordpress/mu-plugins/aster-checkout/checkout-runtime.js',import.meta.url),'utf8');
function harness(reply, invalid = []) {
  const elements = {}, events = {}, hooks = {}, timers = new Map(), requests = [];
  function node(tag) {
    return {tagName:tag.toUpperCase(), children:[], attributes:{}, dataset:{}, textContent:'',
      append(...items){this.children.push(...items);},replaceChildren(){this.children=[];},
      setAttribute(key,value){this.attributes[key]=value;},addEventListener(name,handler){this[name]=handler;}};
  }
  const checkout = {classList:{contains:()=>false},querySelectorAll:()=>invalid,before:panel=>{elements['aster-checkout-feedback']=panel;}};
  elements.place_order = {...node('button'),style:{display:'none'}};
  const document = {body:{},getElementById:id=>elements[id],createElement:node,
    querySelector:selector=>selector==='form.checkout'?checkout:{value:'ppcp-credit-card-gateway'},
    addEventListener:(name,handler)=>events[name]=handler};
  function $(arg) {if (typeof arg==='function') arg(); return {on:(names,callback)=>names.split(' ').forEach(name=>hooks[name]=callback)};}
  const window={jQuery:$,AsterNativeCheckout:{statusUrl:'/?wc-ajax=aster_checkout_status',nonce:'TEST',orderStatusUrl:'/order-status/'}};
  vm.runInNewContext(script,{window,document,jQuery:$,location:{origin:'https://commerce.example.test',pathname:'/checkout/',search:''},
    URL,URLSearchParams,AbortController,Error,getComputedStyle:()=>({display:'block'}),
    setTimeout:(fn,ms)=>{const key=Symbol();timers.set(key,{fn,ms});return key;},clearTimeout:key=>timers.delete(key),
    fetch:async(url,options)=>{requests.push({url,options});return typeof reply==='function'?reply():{ok:true,json:async()=>reply};}});
  return {elements,events,hooks,timers,requests,checkout,click(){const event={target:{closest:()=>elements.place_order},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};events.click(event);return event;}};
}
const settle=async()=>{for(let i=0;i<8;i++) await Promise.resolve();};
test('missing contact details are announced and focused before the SDK can submit',()=>{
  const row={getClientRects:()=>[{}],classList:{add(){}},querySelector:()=>({textContent:'Email address *'})};
  const field={type:'email',name:'billing_email',id:'billing_email',value:'',closest:selector=>selector==='fieldset.wc-credit-card-form'?null:row,setAttribute(){},focus(){this.focused=true;},scrollIntoView(){}};
  const h=harness({},[field]); const click=h.click();
  assert.equal(click.prevented,true); assert.equal(click.stopped,true); assert.equal(field.focused,true);
  assert.match(h.elements['aster-checkout-feedback'].children[0].textContent,/Email address/);
  assert.equal(h.requests.length,0);
});
test('a payment timeout checks status only, and leaves provider display controls intact',async()=>{
  const h=harness({customer_state:'processing',safe_action:'check_status'});h.click();
  const watch=[...h.timers.values()].find(t=>t.ms===45000);assert.ok(watch);watch.fn();await settle();
  assert.equal(h.requests.length,1); assert.equal(h.requests[0].url,'/?wc-ajax=aster_checkout_status');
  assert.equal(h.requests[0].options.body.toString(),'nonce=TEST');
  assert.equal(h.elements.place_order.style.display,'none');
  assert.match(h.elements['aster-checkout-feedback'].children[0].textContent,/before making another payment/);
  assert.equal(h.elements['aster-checkout-feedback'].children[1].type,'button');
});
test('unavailable status never retries the checkout or claims a declined payment',async()=>{
  const h=harness(()=>{throw new TypeError('offline');});h.hooks.checkout_error();await settle();
  assert.equal(h.requests.length,1);
  assert.match(h.elements['aster-checkout-feedback'].children[0].textContent,/could not confirm/);
  assert.ok(h.elements['aster-checkout-feedback'].children.every(child=>!child.textContent.includes('declined')));
});
test('only a server-authorized same-origin original-order link is exposed',async()=>{
  for(const href of ['https://evil.test/checkout/order-pay/1/','https://commerce.example.test/my-account/']) {
    const h=harness({customer_state:'saved',safe_action:'resume_same_order',recovery_url:href});h.hooks.checkout_error();await settle();
    assert.ok(!h.elements['aster-checkout-feedback'].children.some(child=>child.href===href));
  }
  const h=harness({customer_state:'saved',safe_action:'resume_same_order',recovery_url:'https://commerce.example.test/checkout/order-pay/42/?key=test'});
  h.hooks.checkout_error();await settle();
  assert.equal(h.elements['aster-checkout-feedback'].children[1].textContent,'Continue this order');
});
test('normal native validation errors remain visible without an unnecessary reload instruction',async()=>{
  const h=harness({customer_state:'ready',safe_action:'reload_checkout'});h.hooks.checkout_error();await settle();
  assert.equal(h.elements['aster-checkout-feedback'].hidden,true);
});
