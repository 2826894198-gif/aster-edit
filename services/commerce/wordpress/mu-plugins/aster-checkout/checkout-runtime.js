(function ($) {
  'use strict';
  // Adapted from JWK's native selected-method/updated_checkout handling.
  // Official Woo/PPCP alone submit forms and operate provider fields/buttons.
  const config = window.AsterNativeCheckout || {};
  let submitTimer, updateTimer, submitting = false, querying = false;
  function form() { return document.querySelector('form.checkout'); }
  function selectedMethod() {
    return document.querySelector('input[name="payment_method"]:checked')?.value || '';
  }
  function refreshPrimaryAction() {
    const button = document.getElementById('place_order');
    if (!button || submitting || form()?.classList.contains('processing')) return;
    const labels = { 'ppcp-credit-card-gateway': 'Pay securely', 'ppcp-gateway': 'Continue with PayPal', 'ppcp-applepay': 'Continue with Apple Pay', 'ppcp-googlepay': 'Continue with Google Pay' };
    const label = labels[selectedMethod()];
    if (label) { button.textContent = label; button.value = label; button.dataset.value = label; }
    // Never change provider-owned display, eligibility or disabled styles.
  }
  function status(message, links = [], error = false) {
    const checkout = form();
    if (!checkout) return;
    let panel = document.getElementById('aster-checkout-feedback');
    if (!panel) {
      panel = document.createElement('div'); panel.id = 'aster-checkout-feedback';
      panel.className = 'aster-checkout-feedback'; checkout.before(panel);
    }
    panel.replaceChildren(); panel.hidden = !message;
    panel.setAttribute('role', error ? 'alert' : 'status');
    panel.setAttribute('aria-live', error ? 'assertive' : 'polite');
    if (!message) return;
    const text = document.createElement('p'); text.textContent = message; panel.append(text);
    links.forEach(({label, href, action}) => {
      const element = document.createElement(action ? 'button' : 'a'); element.textContent = label;
      if (action) { element.type = 'button'; element.addEventListener('click', action); }
      else element.href = href;
      panel.append(element);
    });
  }
  function invalidNativeFields() {
    const checkout = form(); if (!checkout) return [];
    const fields = [...checkout.querySelectorAll('.validate-required input, .validate-required select, .validate-required textarea, #terms')];
    return fields.filter(field => {
      if (field.disabled || field.type === 'hidden' || field.closest('fieldset.wc-credit-card-form')) return false;
      const row = field.closest('.form-row') || field.closest('.woocommerce-terms-and-conditions-wrapper');
      if (!row || row.getClientRects().length === 0 || getComputedStyle(row).display === 'none') return false;
      if (field.type === 'checkbox') return !field.checked;
      return !field.value.trim() || (field.type === 'email' && !field.validity.valid);
    });
  }
  function validateNativeFields() {
    const invalid = invalidNativeFields();
    if (!invalid.length) return true;
    const labels = invalid.map(field => {
      field.setAttribute('aria-invalid', 'true');
      const row = field.closest('.form-row'); row?.classList.add('woocommerce-invalid');
      return field.id === 'terms' ? 'terms and conditions' : (row?.querySelector('label')?.textContent || field.name).replace(/\s*\*\s*|\s*\(required\)\s*/g, '').trim();
    });
    status(`Please complete ${[...new Set(labels)].join(', ')} before continuing.`, [], true);
    const first = invalid[0];
    // Select2 hides its native select; its visible control owns focus.
    const focus = first.tagName === 'SELECT' ? first.closest('.form-row')?.querySelector('.select2-selection') || first : first;
    focus.focus(); focus.scrollIntoView({block:'center', behavior:'auto'});
    return false;
  }
  function stopSubmitWatch() { clearTimeout(submitTimer); submitting = false; }
  function beginSubmitWatch() {
    if (submitting) return;
    submitting = true; clearTimeout(submitTimer);
    submitTimer = setTimeout(() => checkStatus(true), 45000);
  }
  function recoveryLink(result) {
    if (!result.recovery_url) return [];
    const url = new URL(result.recovery_url, location.origin);
    if (url.origin !== location.origin || !/^\/checkout\/(?:order-pay|order-received)\/[0-9]+\/$/.test(url.pathname)) return [];
    return [{label:result.safe_action === 'view_order' ? 'View order' : 'Continue this order', href:url.href}];
  }
  async function checkStatus(timedOut = false, showReadyMessage = true) {
    if (querying || !config.statusUrl) return;
    querying = true;
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 12000);
    status('Checking your payment status…');
    try {
      const response = await fetch(config.statusUrl, {method:'POST', credentials:'same-origin', cache:'no-store', redirect:'error', signal:controller.signal,
        headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body:new URLSearchParams({nonce:config.nonce})});
      if (!response.ok) throw new Error('status_unavailable');
      const result = await response.json();
      const links = recoveryLink(result);
      if (result.customer_state === 'ready') {
        if (showReadyMessage) status('Checkout did not finish. Reload this checkout to continue with your saved bag.', [{label:'Reload checkout', href:location.pathname + location.search}], true);
        else status('');
      } else if (result.safe_action === 'view_order') {
        status('Your payment has been confirmed for this order.', links);
      } else if (links.length) {
        status('Your order is saved. Continue with this same order to complete payment.', links);
      } else {
        status('Your payment result is still being checked. Check again before making another payment.', [
          {label:'Check again', action:() => checkStatus()}, {label:'Order help', href:config.orderStatusUrl}
        ], timedOut);
      }
    } catch {
      status('We could not confirm the payment result. Check your order before trying another payment.', [
        {label:'Check again', action:() => checkStatus()}, {label:'Order help', href:config.orderStatusUrl}
      ], true);
    } finally { clearTimeout(timer); querying = false; }
    // No request replay, forced unblock, form resubmit, or automatic charge.
  }
  document.addEventListener('click', event => {
    if (!event.target.closest?.('#place_order, #ppc-button-ppcp-gateway-v6, #ppc-button-ppcp-applepay-v6, #ppc-button-ppcp-googlepay-v6')) return;
    if (!validateNativeFields()) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    beginSubmitWatch();
  }, true);
  document.addEventListener('submit', event => {
    if (event.target !== form()) return;
    if (!validateNativeFields()) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    beginSubmitWatch();
  }, true);
  document.addEventListener('input', event => {
    if (event.target.closest?.('#customer_details')) event.target.removeAttribute('aria-invalid');
  });
  $(document.body).on('payment_method_selected', refreshPrimaryAction);
  $(document.body).on('update_checkout', () => {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(() => status('Delivery totals are taking longer to update. Reload this checkout if the loading indicator does not clear.', [
      {label:'Reload checkout', href:location.pathname + location.search}
    ], true), 30000);
  });
  $(document.body).on('updated_checkout', () => { clearTimeout(updateTimer); refreshPrimaryAction(); });
  $(document.body).on('checkout_error', () => {
    stopSubmitWatch(); refreshPrimaryAction(); checkStatus(false, false);
  });
  $(refreshPrimaryAction);
})(jQuery);
