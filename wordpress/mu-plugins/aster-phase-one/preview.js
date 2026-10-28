(() => {
  'use strict';
  const root = document.querySelector('[data-guest-api]');
  let lookup = null;
  let refreshing = false;
  let generation = 0;
  async function loadOrder() {
    if (!lookup || refreshing) return;
    refreshing = true;
    const requestGeneration = ++generation;
    const submit = document.querySelector('#ae-lookup button');
    const message = document.querySelector('#ae-lookup-message');
    submit.disabled = true; submit.textContent = 'Checking your order…'; message.textContent = '';
    try {
      const response = await fetch(root.dataset.guestApi + 'order-access/lookup', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'X-Aster-Order-View':'detail' }, body: JSON.stringify(lookup), signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (requestGeneration !== generation) return;
      if (!response.ok) throw new Error(data.message || 'Check your order details and try again.');
      if (!data.detail_html) throw new Error('Order details are unavailable. Please contact support.');
      const result = document.querySelector('#ae-guest-result');
      // This HTML is rendered and escaped by our same-origin order API, after access checks.
      result.innerHTML = data.detail_html;
      result.hidden = false; result.tabIndex = -1;
      document.querySelector('#ae-close-order').hidden = false;
      root.classList.add('has-order');
      result.focus({preventScroll:true}); result.scrollIntoView({block:'start'});
    } catch (error) {
      if (requestGeneration !== generation) return;
      message.textContent = error.name === 'TimeoutError' ? 'This is taking longer than expected. Try again or contact support.' : error.message;
    } finally { if (requestGeneration === generation) { refreshing = false; submit.disabled = false; submit.textContent = 'View order status'; } }
  }
  if (root) {
    document.querySelector('#ae-lookup').addEventListener('submit', event => {
      event.preventDefault();
      lookup = { order_number: document.querySelector('#ae-order-number').value.trim(), email: document.querySelector('#ae-order-email').value.trim() };
      loadOrder();
    });
    document.querySelector('#ae-close-order').addEventListener('click', () => {
      generation++; refreshing = false;
      document.querySelector('#ae-lookup button').disabled = false;
      document.querySelector('#ae-lookup button').textContent = 'View order status';
      document.querySelector('#ae-guest-result').replaceChildren();
      document.querySelector('#ae-guest-result').hidden = true;
      document.querySelector('#ae-close-order').hidden = true;
      document.querySelector('#ae-lookup-message').textContent = '';
      root.classList.remove('has-order'); lookup = null;
      document.querySelector('#ae-order-number').focus();
    });
    addEventListener('pagehide', () => { generation++; document.querySelector('#ae-guest-result').replaceChildren(); lookup = null; });
    addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  }
  const note = document.querySelector('#order_comments');
  const count = document.querySelector('#ae-note-count');
  if (note && count) { const update = () => { count.textContent = `${[...note.value].length} / 500`; }; note.addEventListener('input', update); update(); }
  let dialog;
  let returnFocus;
  function openHelp(button) {
    const number = button.closest('[data-order]').dataset.order;
    returnFocus = button;
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.className = 'ae-dialog';
      dialog.setAttribute('aria-labelledby', 'ae-help-title');
      dialog.innerHTML = '<header><span class="aster-eyebrow">ORDER HELP</span><button type="button" aria-label="Close order help">×</button></header><h2 id="ae-help-title">A note to our team.</h2><p class="ae-help-reference"></p><label for="ae-help-topic">What can we help with?</label><select id="ae-help-topic"><option value="Payment">Payment</option><option value="Shipping or address">Shipping or address</option><option value="Damaged or incorrect item">Damaged or incorrect item</option><option value="Other question">Other question</option></select><label for="ae-help-details">Your question</label><textarea id="ae-help-details" maxlength="1000" placeholder="Tell us what you would like us to check."></textarea><details class="ae-draft"><summary>Preview email draft</summary><pre class="ae-inquiry-preview" tabindex="0" aria-label="Your email draft"></pre></details><div class="ae-dialog-actions"><a class="ae-button ae-open-email">Open email</a><button type="button" class="ae-button ae-secondary ae-copy">Copy message</button></div><p>This opens a draft in your email app. Send it there when you are ready, or copy it to email support@example.test.</p><p role="status" aria-live="polite"></p>';
      document.body.append(dialog);
      dialog.querySelector('header button').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => returnFocus?.focus());
      dialog.querySelector('.ae-copy').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(dialog.querySelector('pre').textContent); dialog.querySelector('[role=status]').textContent = 'Message copied. You can paste it into your email.'; }
        catch { dialog.querySelector('[role=status]').textContent = 'Copy is unavailable. Select the draft above and copy it manually.'; }
      });
    }
    const topic = dialog.querySelector('select'), details = dialog.querySelector('textarea');
    topic.value = 'Payment'; details.value = '';
    dialog.querySelector('[role=status]').textContent = '';
    dialog.querySelector('.ae-help-reference').textContent = `Order #${number}`;
    const update = () => {
      const message = `Hello Aster Edit,\n\nI’m contacting you about order #${number}.\nTopic: ${topic.value}\n\n${details.value.trim() || 'Please check this order and let me know the next step.'}\n\nThank you.`;
      dialog.querySelector('pre').textContent = message;
      dialog.querySelector('.ae-open-email').href = `mailto:support@example.test?subject=${encodeURIComponent(`Order #${number} · ${topic.value}`)}&body=${encodeURIComponent(message)}`;
    };
    topic.onchange = update; details.oninput = update; update();
    dialog.showModal(); topic.focus();
  }
  document.addEventListener('click', event => {
    const help = event.target.closest('.ae-help');
    if (help) openHelp(help);
    const refresh = event.target.closest('.ae-refresh');
    if (refresh) { if (root) loadOrder(); else location.reload(); }
  });
})();
