(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const message = text => { $('ops-message').textContent = text; };
  let page = 1, pages = 1, listGeneration = 0, detailGeneration = 0, selected = null;
  const labels = { payment_not_confirmed: 'Payment not confirmed', payment_evidence_incomplete: 'Payment evidence incomplete', refund_review: 'Refund review', do_not_fulfill: 'Do not fulfill', dispatch_integration_pending: 'Dispatch not enabled' };
  function element(tag, text, attrs = {}) {
    const node = document.createElement(tag); if (text !== undefined) node.textContent = text;
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }
  async function api(path, body) {
    const response = await fetch(asterOperations.api + path, { credentials: 'same-origin', cache: 'no-store', headers: { 'X-WP-Nonce': asterOperations.nonce, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Request failed. Reload and check the order before retrying.');
    return result;
  }
  async function list() {
    const generation = ++listGeneration;
    try {
      const data = await api(`orders?page=${page}&status=${encodeURIComponent($('ops-status').value)}`);
      if (generation !== listGeneration) return;
      pages = Math.max(data.pages, 1); $('ops-rows').replaceChildren();
      for (const order of data.orders) {
        const row = element('tr'); const cell = element('td'); const link = element('button', `#${order.number}`, { type: 'button', class: 'button-link' });
        link.addEventListener('click', () => open(order.id)); cell.append(link); row.append(cell);
        for (const value of [order.status_label, `${order.currency} ${order.total}`, order.flags.map(f => labels[f] || f).join(' · ')]) row.append(element('td', value));
        $('ops-rows').append(row);
      }
      if (!data.orders.length) { const row = element('tr'); row.append(element('td', 'No matching orders.', { colspan: '4' })); $('ops-rows').append(row); }
      $('ops-page').textContent = `${data.total} orders · Page ${page} of ${pages}`;
      $('ops-prev').disabled = page <= 1; $('ops-next').disabled = page >= pages;
    } catch (error) { if (generation === listGeneration) message(error.message); }
  }
  function block(title) { const section = element('section'); section.append(element('h3', title)); $('ops-detail').append(section); return section; }
  function editor(section, order, action, controls, submitLabel) {
    const form = element('form');
    for (const control of controls) form.append(control);
    const button = element('button', submitLabel, { type: 'submit', class: 'button button-primary' }); form.append(button); section.append(form);
    let pending = null;
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (button.disabled) return;
      const payload = Object.fromEntries(new FormData(form)); const signature = JSON.stringify(payload);
      if (!pending || pending.signature !== signature) pending = { id: crypto.randomUUID(), signature };
      button.disabled = true;
      try {
        await api(`orders/${order.id}/${action}`, { ...payload, revision: order.revision, request_id: pending.id });
        message(action === 'note' ? 'Internal note saved. No customer email sent.' : 'Shipment draft saved. Nothing was marked dispatched or sent to the customer.');
        if (selected === order.id) await open(order.id);
      } catch (error) { message(error.message); button.disabled = false; }
    });
  }
  async function open(id) {
    const generation = ++detailGeneration; selected = id;
    try {
      const order = await api(`orders/${id}`);
      if (generation !== detailGeneration) return;
      const detail = $('ops-detail'); const title = element('h2', `Order #${order.number}`, { tabindex: '-1' }); detail.replaceChildren(title, element('p', `${order.status_label} · ${order.currency} ${order.total}`));
      const back = element('button', 'Back to orders', { type: 'button', class: 'button-link aster-ops-back' }); back.addEventListener('click', () => $('ops-search').scrollIntoView({ block: 'start' })); detail.append(back);
      detail.append(element('p', 'Dispatch is locked until payment reconciliation and shipping acceptance are completed.', { class: 'aster-ops-warning' }));
      const items = block('Pieces');
      for (const item of order.items) items.append(element('p', `${item.name} × ${item.quantity}`));
      if (order.payment_review) {
        const payment = block('Payment review');
        const facts = order.payment_review;
        for (const [label, value] of [['Method', facts.method || 'Not supplied'], ['Transaction reference', facts.transaction_id || 'Not supplied'], ['Paid at', facts.paid_at || 'Not recorded'], ['Woo paid status', facts.woo_paid_status ? 'Yes — not provider reconciliation' : 'No'], ['Refunded', `${order.currency} ${facts.refunded_total}`], ['Provider reconciliation', 'Not connected']]) payment.append(element('p', `${label}: ${value}`));
      }
      if (order.shipping_address) {
        const shipment = block('Shipment preparation');
        const address = Object.entries(order.shipping_address).filter(([, value]) => value).map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value}`).join('\n');
        shipment.append(element('p', address || 'No shipping address recorded.', { class: 'aster-ops-address' }));
        const carrierLabel = element('label', 'Carrier', { for: 'ops-carrier' });
        const carrier = element('select', undefined, { name: 'carrier', id: 'ops-carrier', required: '' });
        carrier.append(element('option', 'Choose carrier', { value: '' }));
        for (const name of ['UPS', 'FedEx', 'DHL', 'USPS', 'Other']) carrier.append(element('option', name, { value: name }));
        const trackingLabel = element('label', 'Tracking reference (internal draft)', { for: 'ops-tracking' });
        const tracking = element('input', undefined, { name: 'tracking_number', id: 'ops-tracking', maxlength: '80', pattern: '[A-Za-z0-9 -]+', required: '' });
        carrier.value = order.shipment_draft?.carrier || ''; tracking.value = order.shipment_draft?.tracking_number || '';
        editor(shipment, order, 'shipment-draft', [carrierLabel, carrier, trackingLabel, tracking], 'Save draft');
      }
      if (order.notes) {
        const notes = block('Internal notes');
        const noteHistory = element('div', undefined, { class: 'aster-ops-history', tabindex: '0', 'aria-label': 'Internal note history' });
        for (const note of [...order.notes].reverse()) noteHistory.append(element('p', `${note.created_at} · Staff ${note.actor_id}\n${note.text}`, { class: 'aster-ops-note' }));
        if (order.notes.length) notes.append(noteHistory);
        editor(notes, order, 'note', [element('label', 'New internal note', { for: 'ops-note' }), element('textarea', undefined, { id: 'ops-note', name: 'text', rows: '3', maxlength: '2000', required: '' })], 'Save note');
      }
      const history = block('Activity');
      if (!order.events.length) history.append(element('p', 'No Aster operations recorded.'));
      const activity = element('div', undefined, { class: 'aster-ops-history', tabindex: '0', 'aria-label': 'Activity history' });
      for (const event of [...order.events].reverse()) activity.append(element('p', `${event.created_at} · Staff ${event.actor_id} · ${event.action.replaceAll('_', ' ')}`));
      if (order.events.length) history.append(activity);
      if (matchMedia('(max-width:1100px)').matches) { title.focus({ preventScroll: true }); detail.scrollIntoView({ block: 'start' }); }
    } catch (error) { if (generation === detailGeneration) message(error.message); }
  }
  $('ops-search').addEventListener('submit', event => { event.preventDefault(); open($('ops-order-id').value.trim()); });
  $('ops-status').addEventListener('change', () => { page = 1; list(); });
  $('ops-prev').addEventListener('click', () => { if (page > 1) { page--; list(); } });
  $('ops-next').addEventListener('click', () => { if (page < pages) { page++; list(); } });
  $('ops-refresh').addEventListener('click', () => { message(''); list(); if (selected) open(selected); });
  list();
})();
