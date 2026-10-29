<?php defined('ABSPATH') || exit; ?>
<!doctype html>
<html <?php language_attributes(); ?>><head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width,initial-scale=1"><?php wp_head(); ?></head>
<body <?php body_class('aster-commerce-site'); ?>><?php wp_body_open(); aster_commerce_header(); ?>
<main id="commerce-main" class="aster-native-content aster-legal-content">
  <div class="aster-page-heading"><a class="aster-back-link" href="<?php echo esc_url(aster_storefront_url('/shop')); ?>">← Back to shop</a><p class="aster-eyebrow">Aster Edit · Information</p><h1><?php echo esc_html(is_page('privacy-policy') ? 'Privacy policy.' : 'Store terms.'); ?></h1></div>
  <article class="aster-legal-copy"><?php while (have_posts()) { the_post(); the_content(); } ?></article>
</main>
<?php aster_commerce_footer(); wp_footer(); ?></body></html>
