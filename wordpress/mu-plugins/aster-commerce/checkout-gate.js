(() => {
  'use strict';
  const stop = () => {
    const explanation = 'Payments are not available in this preview. Your selection will remain in your bag.';
    for (const notice of document.querySelectorAll('.wc-block-checkout__no-payment-methods-notice .wc-block-components-notice-banner__content')) {
      if (notice.textContent !== explanation) notice.textContent = explanation;
    }
    for (const announcement of document.querySelectorAll('.a11y-speak-region')) {
      if (announcement.textContent?.includes('There are no payment methods available. Please contact us for help placing your order.')) {
        announcement.textContent = explanation;
      }
    }
    for (const button of document.querySelectorAll('.wc-block-components-checkout-place-order-button')) {
      const label = button.querySelector('.wc-block-components-checkout-place-order-button__text');
      if (label && label.textContent !== 'Checkout unavailable') label.textContent = 'Checkout unavailable';
      if (button.disabled) continue;
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      button.setAttribute('title', 'Checkout is not open yet');
    }
  };
  stop();
  new MutationObserver(stop).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
})();
