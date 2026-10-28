<?php
/** JWK CheckoutPage composition; native Woo form-checkout 9.4.0 hooks retained. */
defined('ABSPATH') || exit;
?>
<div class="aster-checkout-tools"><?php do_action('woocommerce_before_checkout_form', $checkout); ?></div>
<?php
if (!$checkout->is_registration_enabled() && $checkout->is_registration_required() && !is_user_logged_in()) {
    echo esc_html(apply_filters('woocommerce_checkout_must_be_logged_in_message', __('You must be logged in to checkout.', 'woocommerce')));
    return;
}
?>
<form name="checkout" method="post" class="checkout woocommerce-checkout" action="<?php echo esc_url(wc_get_checkout_url()); ?>" enctype="multipart/form-data" aria-label="Checkout">
    <?php if ($checkout->get_checkout_fields()): ?>
        <?php do_action('woocommerce_checkout_before_customer_details'); ?>
        <div class="col2-set" id="customer_details">
            <div class="col-1"><?php do_action('woocommerce_checkout_billing'); ?></div>
            <div class="col-2"><?php do_action('woocommerce_checkout_shipping'); ?></div>
            <?php do_action('woocommerce_checkout_after_customer_details'); ?>
        </div>
    <?php endif; ?>
    <aside class="aster-checkout-side" aria-labelledby="order_review_heading">
        <?php do_action('woocommerce_checkout_before_order_review_heading'); ?>
        <div class="aster-order-card-heading">
            <div><p class="aster-eyebrow">Order &amp; payment</p><h2 id="order_review_heading">Your order</h2></div>
            <span class="aster-currency-chip"><?php echo esc_html(get_woocommerce_currency()); ?></span>
        </div>
        <?php do_action('woocommerce_checkout_before_order_review'); ?>
        <div id="order_review" class="woocommerce-checkout-review-order">
            <?php do_action('woocommerce_checkout_order_review'); ?>
        </div>
        <?php do_action('woocommerce_checkout_after_order_review'); ?>
        <a class="aster-checkout-edit" href="<?php echo esc_url(wc_get_cart_url()); ?>">Edit your checkout bag</a>
    </aside>
</form>
<?php do_action('woocommerce_after_checkout_form', $checkout); ?>
