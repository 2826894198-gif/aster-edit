<?php defined('ABSPATH') || exit; ?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width,initial-scale=1"><?php wp_head(); ?></head>
<body <?php body_class('aster-commerce-site' . (!aster_checkout_open() ? ' aster-checkout-closed' : '')); ?>>
<?php wp_body_open(); aster_commerce_header(); ?>
<main id="commerce-main" class="aster-native-content">
    <header class="aster-checkout-intro">
        <div><p class="aster-eyebrow">One-page checkout</p><h1>Review your order</h1></div>
        <p>Enter your delivery details, then choose how to pay.</p>
    </header>
    <?php if (aster_checkout_interface_review()): ?>
        <p class="aster-interface-review-note" role="status">Checkout preview · Orders and payments cannot be submitted from this preview.</p>
    <?php elseif (wp_get_environment_type() === 'local'): ?>
        <p class="aster-interface-review-note" role="status">Local preview · Test data only. Live payments are disabled.</p>
    <?php endif; ?>
    <?php if (!aster_checkout_open()): ?>
        <p class="aster-checkout-notice" role="status">Checkout is not open yet. You can review your details and shipping estimate, but orders and payments are unavailable. Your bag will be kept.</p>
    <?php endif; ?>
    <?php while (have_posts()) { the_post(); the_content(); } ?>
</main>
<?php aster_commerce_footer(); wp_footer(); ?>
</body></html>
