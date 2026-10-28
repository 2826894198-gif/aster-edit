<?php
defined('ABSPATH') || exit;

$orders_url = wc_get_endpoint_url('orders', '', wc_get_page_permalink('myaccount'));
$addresses_url = wc_get_endpoint_url('edit-address', '', wc_get_page_permalink('myaccount'));
$profile_url = wc_get_endpoint_url('edit-account', '', wc_get_page_permalink('myaccount'));
?>
<section class="aster-account-help-page" aria-labelledby="aster-account-help-page-title">
  <div class="aster-account-help-intro">
    <p class="aster-account-kicker">ACCOUNT SUPPORT</p>
    <h2 id="aster-account-help-page-title">How can we help?</h2>
    <p>Find an order, update your details, or contact customer care.</p>
  </div>
  <div class="aster-account-help-options">
    <section aria-labelledby="aster-help-orders-title">
      <p class="aster-account-kicker">ORDERS</p>
      <h3 id="aster-help-orders-title">Find your order</h3>
      <p>Review the details and current status of orders placed on this account.</p>
      <div class="aster-account-help-links">
        <a href="<?php echo esc_url($orders_url); ?>">View your orders <span aria-hidden="true">→</span></a>
        <a href="<?php echo esc_url(home_url('/order-status/')); ?>">Look up a guest order <span aria-hidden="true">→</span></a>
      </div>
    </section>
    <section aria-labelledby="aster-help-details-title">
      <p class="aster-account-kicker">YOUR DETAILS</p>
      <h3 id="aster-help-details-title">Manage your account</h3>
      <p>Keep your delivery details and account information up to date.</p>
      <div class="aster-account-help-links">
        <a href="<?php echo esc_url($addresses_url); ?>">Manage addresses <span aria-hidden="true">→</span></a>
        <a href="<?php echo esc_url($profile_url); ?>">Profile &amp; security <span aria-hidden="true">→</span></a>
      </div>
    </section>
  </div>
  <section class="aster-account-help-contact" aria-labelledby="aster-help-contact-title">
    <div>
      <p class="aster-account-kicker">CUSTOMER CARE</p>
      <h3 id="aster-help-contact-title">Need a hand?</h3>
      <p>For help with an order or your account, email us. Include your order number if you have one.</p>
    </div>
    <a href="mailto:support@example.test">support@example.test <span aria-hidden="true">→</span></a>
  </section>
  <div class="aster-account-help-policy">
    <span>Looking for delivery or return terms?</span>
    <a href="<?php echo esc_url(aster_storefront_url('/shipping-returns')); ?>">Read shipping &amp; returns <span aria-hidden="true">→</span></a>
  </div>
</section>
