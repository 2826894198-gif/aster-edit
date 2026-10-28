<?php
defined('ABSPATH') || exit;
if ($has_orders) {
    require WC()->plugin_path() . '/templates/myaccount/orders.php';
    return;
}
do_action('woocommerce_before_account_orders', false);
?>
<section class="aster-account-empty" aria-labelledby="aster-account-empty-orders-title">
  <p class="aster-account-kicker">ORDER HISTORY</p>
  <h2 id="aster-account-empty-orders-title">No orders yet.</h2>
  <p>Once an order is placed, its details and current status will appear here.</p>
  <a href="<?php echo esc_url(aster_storefront_url('/shop')); ?>">Explore the collection <span aria-hidden="true">→</span></a>
</section>
<?php do_action('woocommerce_after_account_orders', false); ?>
