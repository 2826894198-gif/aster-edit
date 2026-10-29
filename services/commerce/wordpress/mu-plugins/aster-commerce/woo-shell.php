<?php defined('ABSPATH') || exit; ?>
<!doctype html>
<html <?php language_attributes(); ?>><head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width,initial-scale=1"><?php wp_head(); ?></head>
<body <?php body_class('aster-commerce-site' . (is_checkout() && !aster_checkout_open() ? ' aster-checkout-closed' : '') . (is_account_page() && is_user_logged_in() ? ' aster-account-signed-in' : '')); ?>><?php wp_body_open(); aster_commerce_header(); ?>
<main id="commerce-main" class="aster-native-content<?php echo is_account_page() ? (is_user_logged_in() ? ' aster-account-content' : ' aster-auth-content') : ''; ?>">
  <?php if (is_account_page() && is_user_logged_in()): ?>
    <div class="aster-page-heading aster-account-page-heading"><h1><?php echo esc_html(aster_account_heading()); ?></h1><a href="<?php echo esc_url(aster_storefront_url('/shop')); ?>">Return to shop <span aria-hidden="true">→</span></a></div>
  <?php else: ?>
    <div class="aster-page-heading"><a class="aster-back-link" href="<?php echo esc_url(aster_storefront_url('/shop')); ?>">← Back to shop</a><p class="aster-eyebrow">Aster Edit · <?php echo is_cart() ? 'Checkout bag' : (is_checkout() ? 'Checkout' : 'Your account'); ?></p><h1><?php echo esc_html(is_cart() ? 'Checkout bag.' : (is_checkout() ? (is_order_received_page() ? 'Your order.' : (is_checkout_pay_page() && !aster_checkout_open() ? 'Payment unavailable.' : (function_exists('aster_refined_checkout_active') && aster_refined_checkout_active() ? 'Checkout' : 'The final details.'))) : aster_account_heading())); ?></h1></div>
  <?php endif; ?>
  <?php if (wp_get_environment_type() === 'local' && !is_account_page()): ?><p class="aster-local-note">Local preview · Test data only. Live payments are disabled.</p><?php endif; ?>
  <?php if (is_checkout() && !is_order_received_page() && !is_checkout_pay_page() && !aster_checkout_open()): ?><p class="aster-checkout-notice" role="status">Checkout is not open yet. You can review your details and shipping estimate, but orders and payments are unavailable. Your bag will be kept.</p><?php endif; ?>
  <?php if (is_checkout() && !aster_customer_mail_ready() && !is_checkout_pay_page()): ?><p class="aster-checkout-notice" role="status"><?php echo is_order_received_page() ? 'Keep the order number shown below. Order emails are currently off; use your order number and checkout email on our ' : (function_exists('aster_refined_checkout_active') && aster_refined_checkout_active() ? 'Order emails are off. Save your order number and use our ' : 'Order emails are currently off. After placing an order, save the order number on the confirmation page. You can check its status with the order number and checkout email on our '); ?><a href="<?php echo esc_url(home_url('/order-status/')); ?>">order status page</a>.</p><?php endif; ?>
  <?php if (is_account_page() && is_wc_endpoint_url('lost-password') && !aster_customer_mail_ready()): ?>
    <section class="aster-account-recovery-unavailable" role="status">
      <p>Email password recovery is not available yet. For help accessing an existing account, contact <a href="mailto:support@example.test">support@example.test</a>.</p>
      <a class="aster-payment-account-link" href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">Return to sign in</a>
    </section>
  <?php elseif (is_checkout_pay_page() && !aster_checkout_open()): ?>
    <section class="aster-payment-unavailable" role="status">
      <p>Payment for this order is temporarily unavailable. No payment can be submitted from this page.</p>
      <p>For help with an existing order, contact <a href="mailto:support@example.test">support@example.test</a>.</p>
      <a class="aster-payment-account-link" href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">View your account</a>
    </section>
  <?php elseif (is_cart() && WC()->cart && WC()->cart->is_empty()): ?>
    <section class="aster-empty-cart" aria-labelledby="aster-empty-cart-title">
      <h2 id="aster-empty-cart-title">Your checkout bag is empty.</h2>
      <p>Review the pieces you selected on Aster Edit before continuing to checkout.</p>
      <a href="<?php echo esc_url(aster_storefront_url('/shop#bag')); ?>">Review your selection</a>
    </section>
  <?php else: ?>
    <?php while (have_posts()) { the_post(); the_content(); } ?>
  <?php endif; ?>
</main>
<?php aster_commerce_footer(); wp_footer(); ?>
</body></html>
