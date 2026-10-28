(() => {
  'use strict';

  // Woo Cart Blocks changes the cart in place. Reload once after the final
  // item is removed so the PHP shell renders its branded empty checkout bag
  // and the header count reflects the new Woo session state.
  let hadItem = false;
  let checking = false;
  const flag = 'aster-cart-empty-refresh';
  const sync = () => {
    if (document.querySelector('.wc-block-cart-items__row')) {
      hadItem = true;
      sessionStorage.removeItem(flag);
    }
    if (!hadItem || checking || !document.querySelector('.wc-block-cart__empty-cart__title')) return;
    if (sessionStorage.getItem(flag)) return;
    checking = true;
    fetch('/wp-json/wc/store/v1/cart', { credentials: 'same-origin', cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((cart) => {
        if (!cart || !Array.isArray(cart.items) || cart.items.length !== 0) return;
        sessionStorage.setItem(flag, '1');
        window.location.reload();
      })
      .catch(() => {})
      .finally(() => { checking = false; });
  };
  sync();
  new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: true });
})();
