import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('wordpress/mu-plugins/aster-commerce/checkout-handoff.js', 'utf8');
const token = 'a'.repeat(64);
const checkout = 'http://127.0.0.1:8088/checkout/';
const item = {name:'TEST ONLY — Ceramic integration fixture', quantity:1, unit_price:'1.00'};

function fixture({same = false, conflict = false, failWrite = false, returnedUrl = checkout, legacy = false} = {}) {
  const nodes = new Map();
  const createElement = () => ({hidden:true, disabled:false, textContent:'', children:[], classList:{add() {}}, append(node) {this.children.push(node);}, replaceChildren() {this.children = [];}, addEventListener(name, callback) {this[name] = callback;}});
  const get = id => { if (!nodes.has(id)) nodes.set(id, createElement()); return nodes.get(id); };
  get('commerce-main').dataset = {endpoint:'http://127.0.0.1:8088/', checkout, directEntry:'1'};
  if (legacy) get('commerce-main').dataset = {endpoint:'http://127.0.0.1:8088/'};
  const events = {}, requests = [], navigation = [];
  const location = {origin:'http://127.0.0.1:8088', pathname:'/checkout/', search:'?aster_handoff=1', hash:`#handoff=${token}`, replace(url) {navigation.push(['replace', url]);}, assign(url) {navigation.push(['assign', url]);}};
  vm.runInNewContext(source, {
    document:{getElementById:get, createElement}, location,
    history:{replaceState() {location.hash = ''; }}, URL, URLSearchParams, Intl, AbortController, setTimeout, clearTimeout,
    addEventListener(name, callback) {events[name] = callback;},
    async fetch(url, options) {
      requests.push({url, ...options, body:JSON.parse(options.body)});
      if (url.includes('aster_handoff_review')) return {ok:true, json:async () => ({proof:'test-proof', currency:'USD', can_continue:!same && !conflict, same_selection:same, items:[item], existing_items: conflict ? [{...item, quantity:2}] : [], checkout_url:returnedUrl})};
      if (failWrite) throw new TypeError('TEST ONLY: response lost after cart write');
      return {ok:true, json:async () => ({checkout_url:returnedUrl})};
    },
  });
  return {get, requests, navigation, events, location};
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('empty cart transfers once and opens the sole native checkout without another Continue click', async () => {
  const state = fixture(); await flush();
  assert.deepEqual(state.requests.map(request => request.url.split('=')[1]), ['aster_handoff_review','aster_handoff_confirm']);
  assert.equal(state.requests[0].credentials, 'same-origin');
  assert.deepEqual(state.requests[1].body, {token, proof:'test-proof'});
  assert.deepEqual(state.navigation, [['replace', checkout]]);
  assert.equal(state.get('handoff-review').hidden, true);
  assert.equal(state.location.hash, '', 'Token removed before exchange');
});

test('identical existing cart proceeds without writing or duplicating items', async () => {
  const state = fixture({same:true}); await flush();
  assert.equal(state.requests.length, 1);
  assert.deepEqual(state.navigation, [['replace', checkout]]);
});

test('a different cart stays unchanged and requires an explicit recovery choice', async () => {
  const state = fixture({conflict:true}); await flush();
  assert.equal(state.requests.length, 1);
  assert.equal(state.navigation.length, 0);
  assert.equal(state.get('handoff-existing').hidden, false);
  assert.equal(state.get('handoff-confirm').hidden, true);
  assert.match(state.get('handoff-title').textContent, /other pieces/);
});

test('uncertain cart write is never replayed by another fragment event', async () => {
  const state = fixture({failWrite:true}); await flush();
  assert.equal(state.requests.length, 2);
  assert.equal(state.navigation.length, 0);
  assert.equal(state.get('handoff-recovery').hidden, false);
  state.location.hash = `#handoff=${token}`;
  await state.events.hashchange(); await flush();
  assert.equal(state.requests.length, 2);
  assert.equal(state.get('handoff-recovery').hidden, false);
});

test('an unexpected same-origin destination cannot replace checkout or enter order-pay', async () => {
  const state = fixture({same:true, returnedUrl:'http://127.0.0.1:8088/checkout/order-pay/999/'}); await flush();
  assert.equal(state.navigation.length, 0);
  assert.match(state.get('handoff-message').textContent, /return to your bag/);
});

test('restoring a used preparation page cannot automatically resubmit its cart write', async () => {
  const state = fixture(); await flush();
  state.events.pagehide();
  await state.events.pageshow({persisted:true}); await flush();
  assert.equal(state.requests.length, 2);
  assert.match(state.get('handoff-title').textContent, /Selection unavailable/);
});

test('a previously opened legacy page can finish safely during a gated rollout', async () => {
  const state = fixture({legacy:true}); await flush();
  assert.equal(state.navigation.length, 0);
  assert.equal(state.get('handoff-confirm').hidden, false);
  state.get('handoff-confirm').click(); await flush();
  assert.deepEqual(state.navigation, [['assign', checkout]]);
});
