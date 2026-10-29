<?php defined('ABSPATH') || exit; ?>
<!doctype html><html <?php language_attributes(); ?>><head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width,initial-scale=1"><?php wp_head(); ?></head><body <?php body_class('aster-commerce-site'); ?>><?php wp_body_open(); aster_commerce_header(); ?>
<main id="commerce-main" class="aster-native-content ae-result-content"><a class="aster-back-link" href="<?php echo esc_url(home_url('/aster-preview/')); ?>">← Local preview</a><?php echo do_shortcode('[woocommerce_checkout]'); ?></main>
<?php aster_commerce_footer(); wp_footer(); ?></body></html>
