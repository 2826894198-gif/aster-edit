(() => {
  'use strict';
  const main = document.getElementById('commerce-main');
  const message = document.getElementById('handoff-message');
  const title = document.getElementById('handoff-title');
  const intro = document.getElementById('handoff-intro');
  const review = document.getElementById('handoff-review');
  const confirm = document.getElementById('handoff-confirm');
  const demo = document.getElementById('handoff-demo');
  const directEntry = main.dataset.directEntry === '1';
  let token = '', proof = '', generation = 0, writePending = false;
  const attempted = new Set();
  async function post(url, body, credentials = 'same-origin') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, { method: 'POST', credentials, cache: 'no-store', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Please return to your selection and try again.');
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }
  const endpoint = action => `${main.dataset.endpoint}?wc-ajax=aster_handoff_${action}`;
  function openCheckout(url) {
    const next = new URL(url);
    const expected = new URL(main.dataset.checkout || '/checkout/', location.origin);
    if (next.origin !== location.origin || next.href !== expected.href) throw new Error('Please return to your bag to continue.');
    // Replace the preparation state, so Back does not revisit a used token.
    if (directEntry) location.replace(next.href);
    else location.assign(next.href);
  }
  async function confirmSelection(current) {
    if (writePending || attempted.has(token)) return;
    writePending = true;
    attempted.add(token);
    confirm.disabled = true;
    message.textContent = 'Opening checkout…';
    const selectionToken = token, selectionProof = proof;
    try {
      const result = await post(endpoint('confirm'), { token: selectionToken, proof: selectionProof });
      if (current === generation) openCheckout(result.checkout_url);
    } catch (error) {
      if (current === generation) {
        // Never replay a cart write whose response may have been lost.
        message.textContent = `${error.message} You can review your bag before trying again.`;
        document.getElementById('handoff-recovery').hidden = false;
        confirm.hidden = true;
      }
    } finally {
      writePending = false;
    }
  }
  function line(container, item, price) {
    const li = document.createElement('li');
    li.className = 'aster-handoff-line';
    if (item.image_url) {
      const image = document.createElement('img');
      image.className = 'aster-handoff-image';
      image.src = item.image_url;
      image.alt = '';
      image.width = 88;
      image.height = 88;
      image.decoding = 'async';
      image.onerror = () => { image.remove(); li.classList.add('aster-handoff-no-image'); };
      li.append(image);
    } else li.classList.add('aster-handoff-no-image');
    const name = document.createElement('span');
    name.className = 'aster-handoff-name';
    name.textContent = `${item.name} × ${item.quantity}`;
    li.append(name);
    if (price) {
      const amount = document.createElement('span');
      amount.className = 'aster-handoff-price';
      amount.textContent = price;
      li.append(amount);
    }
    container.append(li);
  }
  async function openSelection() {
    const current = ++generation;
    const fragment = new URLSearchParams(location.hash.slice(1));
    token = fragment.get('handoff') || '';
    history.replaceState(null, '', location.pathname + location.search);
    proof = ''; review.hidden = true; confirm.hidden = true; document.getElementById('handoff-same').hidden = true; document.getElementById('handoff-recovery').hidden = true; document.getElementById('handoff-existing').hidden = true;
    title.textContent = directEntry ? 'Opening checkout.' : 'Ready for your table.';
    intro.hidden = false;
    intro.textContent = directEntry ? 'Checking your pieces and opening your checkout.' : 'Review your pieces, then continue to checkout.';
    if (writePending || attempted.has(token)) {
      intro.hidden = true;
      message.textContent = 'Your selection was already submitted. Review your checkout bag before continuing.';
      document.getElementById('handoff-recovery').hidden = false;
      return;
    }
    if (!/^[a-f0-9]{64}$/.test(token)) {
      title.textContent = 'Selection unavailable.';
      intro.hidden = true;
      message.textContent = 'Choose your pieces in the shop to continue. Selection links are valid for five minutes.';
      return;
    }
    message.textContent = 'Checking your selection…';
    try {
      const result = await post(endpoint('review'), { token });
      if (current !== generation) return;
      proof = result.proof;
      if (directEntry && result.same_selection) {
        openCheckout(result.checkout_url);
        return;
      }
      if (directEntry && result.can_continue) {
        if (demo) demo.hidden = true;
        await confirmSelection(current);
        return;
      }
      const items = document.getElementById('handoff-items'); items.replaceChildren();
      const money = new Intl.NumberFormat('en', { style: 'currency', currency: result.currency });
      for (const item of result.items) line(items, item, `${money.format(Number(item.unit_price))} each`);
      const existing = document.getElementById('handoff-existing-items'); existing.replaceChildren();
      for (const item of result.existing_items) line(existing, item, `${money.format(Number(item.unit_price))} each`);
      document.getElementById('handoff-existing').hidden = result.can_continue || result.same_selection;
      document.getElementById('handoff-same').hidden = !result.same_selection;
      if (!result.can_continue && !result.same_selection) {
        title.textContent = 'Your checkout bag has other pieces.';
        intro.textContent = 'A different selection is already in your bag. Review it before choosing more pieces.';
      }
      confirm.hidden = !result.can_continue; confirm.disabled = false;
      review.hidden = false; message.textContent = '';
      if (demo) demo.hidden = true;
    } catch (error) {
      if (current === generation) {
        title.textContent = 'Selection unavailable.';
        intro.hidden = true;
        message.textContent = error.message;
      }
    }
  }
  confirm.addEventListener('click', () => {
    if (confirm.disabled) return;
    confirmSelection(generation);
  });
  demo?.addEventListener('click', async () => {
    demo.disabled = true;
    try {
      const result = await post(main.dataset.create, { items: [{ catalog_key: 'test-only:ceramic', quantity: 1 }], entry: 'checkout' }, 'omit');
      location.assign(result.handoff_url);
    } catch (error) { message.textContent = error.message; demo.disabled = false; }
  });
  addEventListener('hashchange', openSelection);
  addEventListener('pagehide', () => { ++generation; token = ''; proof = ''; review.hidden = true; });
  addEventListener('pageshow', event => { if (event.persisted) openSelection(); });
  openSelection();
})();
