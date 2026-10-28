<?php
defined('ABSPATH') || exit;

$customer_id = get_current_user_id();
$recent_orders = wc_get_orders(['customer_id' => $customer_id, 'limit' => 1, 'orderby' => 'date', 'order' => 'DESC']);
$recent_order = $recent_orders[0] ?? null;
$payment_state = $recent_order && class_exists('Aster_Phase_One') ? Aster_Phase_One::state($recent_order) : null;
$orders_url = wc_get_endpoint_url('orders', '', wc_get_page_permalink('myaccount'));
$addresses_url = wc_get_endpoint_url('edit-address', '', wc_get_page_permalink('myaccount'));
$profile_url = wc_get_endpoint_url('edit-account', '', wc_get_page_permalink('myaccount'));
$billing_saved = (bool) wc_get_account_formatted_address('billing');
$shipping_saved = (bool) wc_get_account_formatted_address('shipping');
?>
<section class="aster-account-order-feature<?php echo $recent_order ? ' has-order' : ' is-empty'; ?>" aria-labelledby="aster-account-order-title">
  <div class="aster-account-order-copy">
    <p class="aster-account-kicker">YOUR ORDERS</p>
    <?php if ($recent_order instanceof WC_Order): ?>
      <h2 id="aster-account-order-title">Your latest order.</h2>
      <p class="aster-account-order-summary">Order #<?php echo esc_html($recent_order->get_order_number()); ?> <span aria-hidden="true">·</span> <?php echo esc_html(wc_format_datetime($recent_order->get_date_created())); ?></p>
      <?php if (class_exists('Aster_Phase_One') && Aster_Phase_One::fixture($recent_order)): ?><p class="ae-preview-label">TEST ONLY · Synthetic local order · No payment was made.</p><?php endif; ?>
      <dl class="aster-account-order-facts"><div><dt>Status</dt><dd><?php echo esc_html(wc_get_order_status_name($recent_order->get_status())); ?></dd></div><div><dt>Payment</dt><dd><?php echo esc_html($payment_state ? $payment_state['label'] : 'Not confirmed'); ?></dd></div><div><dt>Total</dt><dd><?php echo wp_kses_post(wc_price($recent_order->get_total(),['currency'=>$recent_order->get_currency()])); ?></dd></div></dl>
      <a class="aster-account-primary" href="<?php echo esc_url($recent_order->get_view_order_url()); ?>">View order details</a>
      <a class="aster-account-text-link" href="<?php echo esc_url($orders_url); ?>">All orders <span aria-hidden="true">→</span></a>
    <?php else: ?>
      <h2 id="aster-account-order-title">No orders yet.</h2>
      <p>When you place an order, its status and details will appear here.</p>
      <a class="aster-account-primary" href="<?php echo esc_url(aster_storefront_url('/collections')); ?>">Explore collections</a>
      <a class="aster-account-text-link" href="<?php echo esc_url(aster_storefront_url('/shop#bag')); ?>">Review your selection <span aria-hidden="true">→</span></a>
    <?php endif; ?>
  </div>
  <img class="aster-account-order-image" src="<?php echo esc_url(aster_commerce_asset('images/account-empty-suhuo.jpg')); ?>" alt="" loading="lazy" width="800" height="800">
</section>
<div class="aster-account-secondary">
  <section aria-labelledby="aster-account-addresses-title">
    <h2 id="aster-account-addresses-title">Delivery details</h2>
    <p><?php echo $shipping_saved || $billing_saved ? esc_html(($shipping_saved ? 'Shipping saved' : 'No shipping address') . ' · ' . ($billing_saved ? 'Billing saved' : 'No billing address')) : 'No address saved.'; ?></p>
    <a href="<?php echo esc_url($addresses_url); ?>">Manage addresses <span aria-hidden="true">→</span></a>
  </section>
  <section aria-labelledby="aster-account-profile-title">
    <h2 id="aster-account-profile-title">Profile &amp; security</h2>
    <p>Keep your details up to date.</p>
    <a href="<?php echo esc_url($profile_url); ?>">Edit account <span aria-hidden="true">→</span></a>
  </section>
</div>
<section class="aster-account-help" aria-labelledby="aster-account-help-title">
  <h2 id="aster-account-help-title">Need a hand?</h2>
  <a href="mailto:support@example.test">Contact customer care <span aria-hidden="true">→</span></a>
</section>
<?php do_action('woocommerce_account_dashboard'); do_action('woocommerce_before_my_account'); do_action('woocommerce_after_my_account'); ?>
