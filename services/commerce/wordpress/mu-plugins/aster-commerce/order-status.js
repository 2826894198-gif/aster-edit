(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const base = $('main').dataset.api;
  const mailReady = $('#request-form').dataset.mailReady === 'true';
  // Fragment is never sent in the HTTP request. Remove it before any further request.
  const takeLink = () => {
    const raw = new URLSearchParams(location.hash.slice(1)).get('access');
    if (location.hash) history.replaceState(null, '', location.pathname);
    return raw;
  };
  let token = takeLink();
  const message = text => { $('#message').textContent = text; };
  const call = async (path, body) => {
    const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Please try again.');
    return data;
  };
  const clear = () => { $('#order').hidden = true; $('#order-title').textContent = ''; $('#order-summary').textContent = ''; $('#items').replaceChildren(); $('#totals').replaceChildren(); };
  const showOrder = order => {
    clear();
    $('#request-form').hidden = true; $('#verify').hidden = true; $('#order').hidden = false;
    $('#order-title').textContent = `Order #${order.order_number}`;
    $('#order-summary').textContent = `${order.status_label} · ${order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}`;
    for (const item of order.items) { const li = document.createElement('li'); li.textContent = `${item.name} × ${item.quantity} — ${order.currency} ${item.line_total} (before tax)`; $('#items').append(li); }
    for (const [label, value] of [['Shipping (before tax)', order.shipping_total], ['Tax', order.tax_total], ['Order total', order.total], ['Refunded', order.refunded_total]]) { const dt = document.createElement('dt'); const dd = document.createElement('dd'); dt.textContent = label; dd.textContent = `${order.currency} ${value}`; $('#totals').append(dt, dd); }
    message(mailReady ? 'Read-only access is open for up to 15 minutes.' : 'This is the current order status. Save your order number for future checks.');
  };
  const load = async () => showOrder(await call('order-access/order'));
  const busy = async (button, fn) => { button.disabled = true; try { await fn(); } catch (error) { message(error.message); } finally { button.disabled = false; } };
  $('#request-form').addEventListener('submit', event => { event.preventDefault(); busy(event.submitter, async () => { const data = await call(mailReady ? 'order-access-requests' : 'order-access/lookup', { order_number: $('#order-number').value.trim(), email: $('#order-email').value.trim() }); if (mailReady) message(data.message); else showOrder(data); }); });
  $('#exchange').addEventListener('click', event => busy(event.currentTarget, async () => {
    try { await call('order-access/exchange', { token }); token = null; await load(); }
    catch (error) { token = null; $('#verify').hidden = true; $('#request-form').hidden = false; throw error; }
  }));
  $('#logout').addEventListener('click', event => busy(event.currentTarget, async () => { if (mailReady) await call('order-access/logout', {}); clear(); $('#request-form').hidden = false; message('Order details closed.'); }));
  if (token) { $('#request-form').hidden = true; $('#verify').hidden = false; }
  else if (mailReady) load().catch(() => {});
  addEventListener('hashchange', () => {
    token = takeLink();
    if (token) { clear(); message(''); $('#request-form').hidden = true; $('#verify').hidden = false; }
  });
  // Avoid retaining order details in a browser back/forward cache snapshot.
  addEventListener('pagehide', clear);
  addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
})();
