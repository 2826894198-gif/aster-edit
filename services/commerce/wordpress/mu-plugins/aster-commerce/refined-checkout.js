(function ($) {
  'use strict';
  function arrange() {
    const list = document.querySelector('.aster-refined-checkout #payment .payment_methods');
    if (!list) return;
    const methods = [...list.children].filter(item => item.matches('li') && item.querySelector('label') && getComputedStyle(item).display !== 'none');
    list.style.setProperty('--aster-panel-row', Math.ceil(methods.length / 2) + 1);
    methods.forEach((item, index) => {
      const label = item.querySelector('label');
      label.style.gridRow = Math.floor(index / 2) + 1;
      label.style.gridColumn = methods.length % 2 && index === methods.length - 1 ? '1 / -1' : String(index % 2 + 1);
    });
    const frame = list.getBoundingClientRect();
    methods.forEach(item => {
      const input = item.querySelector('input.input-radio');
      const rect = item.querySelector('label').getBoundingClientRect();
      if (!input) return;
      Object.assign(input.style, { left: `${rect.left - frame.left}px`, top: `${rect.top - frame.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    });
  }
  $(function () {
    arrange();
    // Official wallet eligibility removes its hiding style asynchronously.
    // Reflow the choices when the SDK changes the DOM; do not expose a wallet
    // before its native eligibility control does.
    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; arrange(); });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  $(document.body).on('updated_checkout', arrange);
  $(window).on('resize', arrange);
})(jQuery);
