(() => {
  'use strict';
  const root = document.querySelector('[data-care-api]');
  if (!root) {
    // Support previously issued email links on the first-batch lookup route.
    if (document.querySelector('[data-guest-api]') && new URLSearchParams(location.hash.slice(1)).has('access')) location.replace('/aster-preview/care/?view=recovery' + location.hash);
    return;
  }
  const $ = s => root.querySelector(s);
  const api = root.dataset.careApi;
  const emailFrame = $('.ae-mail-frame');
  if (emailFrame) {
    const fitEmail = () => {
      const doc = emailFrame.contentDocument;
      if (doc?.body) emailFrame.style.height = Math.max(320, doc.documentElement.scrollHeight, doc.body.scrollHeight) + 'px';
    };
    emailFrame.addEventListener('load', fitEmail);
    if (emailFrame.contentDocument?.readyState === 'complete') fitEmail();
    addEventListener('resize', fitEmail);
  }
  const call = async (path, body) => {
    const response = await fetch(api + path, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(20000), headers: { 'X-WP-Nonce': root.dataset.wpNonce, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Please try again.');
    return data;
  };
  const busy = async (button, status, fn) => {
    const label = button.textContent;
    button.disabled = true; button.textContent = 'Please wait…';
    if (status) status.textContent = '';
    try { await fn(); }
    catch (error) { if (status) status.textContent = error.name === 'TimeoutError' ? 'This is taking longer than expected. Please try again.' : error.message; }
    finally { button.disabled = false; button.textContent = label; }
  };
  root.querySelectorAll('[data-care-form]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    busy(event.submitter, form.querySelector('[role=status]'), async () => {
      const result = await call(form.dataset.careForm, Object.fromEntries(new FormData(form)));
      form.querySelector('[role=status]').textContent = result.message;
    });
  }));
  let privateOpen = false;
  const loadOrder = async () => {
    const data = await call('order-access/order'); privateOpen = true;
    $('#ae-verified-order').hidden = false;
    $('#ae-private-title').textContent = `Order #${data.order_number}`;
    $('#ae-private-info').textContent = `${data.status_label} · ${data.currency} ${data.total} · ${data.items.map(item => `${item.name} × ${item.quantity}`).join(', ')}`;
    $('#ae-verified-order').focus();
  };
  $('#ae-claim-order')?.addEventListener('click', event => busy(event.currentTarget, $('#ae-claim-status'), async () => {
    const data = await call('account/claim-order', {});
    $('#ae-claim-status').textContent = data.message;
    const link = document.createElement('a'); link.href = data.url; link.textContent = 'View in my account →';
    $('#ae-claim-status').append(document.createElement('br'), link);
    $('#ae-claim-order').hidden = true;
  }));
  let page = 1;
  let reviewGeneration = 0;
  const loadReviews = async (append = false) => {
    if (!$('#ae-public-reviews')) return;
    const generation = ++reviewGeneration;
    const data = await call(`reviews?product=${encodeURIComponent(root.dataset.product)}&page=${page}`);
    if (generation !== reviewGeneration) return;
    $('#ae-review-summary').textContent = data.count ? `${data.average} / 5 · ${data.count} approved purchase review${data.count === 1 ? '' : 's'}` : 'No published purchase reviews yet.';
    const list = $('#ae-public-reviews');
    if (!append) list.replaceChildren();
    list.hidden = data.count === 0;
    for (const review of data.reviews) {
      const card = document.createElement('article'); card.className = 'ae-review-card';
      const header = document.createElement('header');
      const name = document.createElement('strong'); name.textContent = review.name;
      const rating = document.createElement('span'); rating.textContent = `${review.rating} / 5 ★`; header.append(name, rating);
      const proof = document.createElement('span'); proof.className = 'ae-small'; proof.textContent = `${review.test_only ? 'TEST ONLY · Synthetic preview · ' : ''}Verified purchase · ${review.date}`;
      const text = document.createElement('p'); text.textContent = review.text;
      const variant = document.createElement('span'); variant.className = 'ae-small'; variant.textContent = review.variant;
      card.append(header, proof, text, variant);
      if (review.photos.length) {
        const photos = document.createElement('div'); photos.className = 'ae-review-photos';
        review.photos.forEach(photo => { const link = document.createElement('a'); link.href = photo.full_url; link.target = '_blank'; link.rel = 'noopener'; const img = document.createElement('img'); img.src = photo.url; img.alt = 'Photo shared with this purchase review'; img.width = 88; img.height = 88; img.loading = 'lazy'; link.append(img); photos.append(link); });
        card.append(photos);
      }
      list.append(card);
    }
    $('#ae-review-more').hidden = !data.has_more;
  };
  $('#ae-review-more')?.addEventListener('click', event => busy(event.currentTarget, $('#ae-review-access-status'), async () => { page++; await loadReviews(true); }));
  const loadPurchase = async () => {
    const data = await call('reviews/purchase?order=' + encodeURIComponent(root.dataset.order));
    $('#ae-review-entry').hidden = true; $('#ae-review-editor').hidden = false;
    $('#ae-purchase-label').textContent = `${data.test_only ? 'TEST ONLY · ' : ''}Order #${data.order} · Your email and order number will not appear publicly.`;
    const select = $('#review-item'); select.replaceChildren();
    for (const item of data.items) { const option = document.createElement('option'); option.value = item.id; const variant = item.variant && !item.name.endsWith(' · '+item.variant) ? ' · '+item.variant : ''; option.textContent = `${item.name}${variant}${item.reviewed ? ' · Review received' : ''}`; option.disabled = item.reviewed; select.append(option); }
    const available = [...select.options].find(o => !o.disabled);
    if (available) select.value = available.value;
    else { $('#ae-purchase-review').hidden = true; $('#ae-review-access-status').textContent = 'A review has already been received for every piece in this order.'; }
    const showPiece = () => {
      const item = data.items.find(piece => String(piece.id) === select.value) || data.items[0];
      if (!item) return;
      root.dataset.product = item.product;
      $('#ae-review-product-name').textContent = item.name;
      $('#ae-review-product-variant').textContent = item.variant;
      $('#ae-review-product-image').src = item.image || '';
      $('#ae-review-product-image').hidden = !item.image;
      $('#ae-review-product-image').alt = item.name;
      page = 1; loadReviews().catch(error => { $('#ae-review-summary').textContent = error.message; });
    };
    select.onchange = showPiece; showPiece();
  };
  let photos = [];
  const reader = file => new Promise((resolve, reject) => { const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.onerror = () => reject(new Error('This photo could not be read.')); fr.readAsDataURL(file); });
  $('#review-photos')?.addEventListener('change', async event => {
    const status = $('#ae-purchase-review [role=status]');
    photos = []; $('#ae-photo-preview').replaceChildren();
    $('#ae-photo-consent').hidden = true; $('[name=photo_consent]').required = false; $('[name=photo_consent]').checked = false;
    try {
      const files = [...event.target.files];
      if (files.length > 6 || files.some(file => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 2097152)) throw new Error('Choose up to six JPEG, PNG or WebP photos, 2 MB each.');
      photos = await Promise.all(files.map(reader));
      for (const src of photos) { const img = document.createElement('img'); img.src = src; img.alt = 'Selected review photo'; img.width = 72; img.height = 72; $('#ae-photo-preview').append(img); }
      $('#ae-photo-consent').hidden = photos.length === 0; $('[name=photo_consent]').required = photos.length > 0; status.textContent = '';
    } catch (error) { event.target.value = ''; status.textContent = error.message; }
  });
  $('#review-text')?.addEventListener('input', event => { $('#ae-review-counter').textContent = `${[...event.target.value].length} / 2000`; });
  $('#ae-purchase-review')?.addEventListener('submit', event => {
    event.preventDefault(); const form = event.currentTarget;
    busy(event.submitter, form.querySelector('[role=status]'), async () => {
      const data = Object.fromEntries(new FormData(form));
      const result = await call('reviews', { ...data, order: Number(root.dataset.order), item: Number(data.item), rating: Number(data.rating), consent: data.consent === 'on', photo_consent: data.photo_consent === 'on', photos });
      $('#ae-review-editor').hidden = true;
      $('#ae-review-access-status').textContent = result.message;
      $('#ae-review-access-status').tabIndex = -1; $('#ae-review-access-status').focus();
    });
  });
  // Fragments never enter HTTP requests, logs or referrer URLs. An explicit
  // button consumes the one-use link, so a mail scanner cannot consume it.
  const showPrivateLink = () => {
    const fragments = new URLSearchParams(location.hash.slice(1));
    const orderToken = fragments.get('access'), reviewToken = fragments.get('review');
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    if (!orderToken && !reviewToken) return false;
    $('[data-private-link]')?.remove();
    const box = document.createElement('section'); box.className = 'ae-care-notice';
    box.dataset.privateLink = 'true';
    const intro = document.createElement('p'); intro.textContent = 'Your private link is ready. Open it on this device to continue.';
    const button = document.createElement('button'); button.className = 'ae-button'; button.textContent = orderToken ? 'Open private order link' : 'Verify purchase & write a review';
    const status = document.createElement('p'); status.className = 'ae-form-status'; status.setAttribute('role', 'status'); box.append(intro,button,status);
    $('.ae-care-nav').after(box);
    button.addEventListener('click', () => busy(button, status, async () => {
      await call(orderToken ? 'order-access/exchange' : 'reviews/access', { token: orderToken || reviewToken });
      if (orderToken) await loadOrder(); else await loadPurchase();
      box.remove();
    }));
    return true;
  };
  addEventListener('hashchange', showPrivateLink);
  if (!showPrivateLink()) {
    if ($('#ae-verified-order')) loadOrder().catch(() => {});
    if ($('#ae-review-editor')) loadPurchase().catch(() => {});
  }
  if ($('#ae-public-reviews')) loadReviews().catch(error => { $('#ae-review-summary').textContent = error.message; });
  addEventListener('pagehide', () => { if (privateOpen) $('#ae-verified-order').hidden = true; if ($('#ae-review-editor')) { $('#ae-review-editor').hidden = true; $('#ae-purchase-review')?.reset(); photos = []; } });
  addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
})();
