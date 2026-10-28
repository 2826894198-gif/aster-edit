<?php defined('ABSPATH') || exit; ?>
<section class="aster-account-empty" aria-labelledby="aster-account-payment-title">
  <p class="aster-account-kicker">PAYMENT SETTINGS</p>
  <h2 id="aster-account-payment-title">Payment methods are unavailable.</h2>
  <p>Checkout is not open yet, so new payment methods cannot be added to this account.</p>
  <a href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">Return to your account <span aria-hidden="true">→</span></a>
</section>
