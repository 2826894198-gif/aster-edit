<?php defined('ABSPATH') || exit; ?>
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Order preview · Aster Edit</title><?php wp_head(); ?></head><body class="aster-commerce-site aster-phase-one"><?php aster_commerce_header(); ?>
<main id="commerce-main" class="aster-native-content ae-result-content"><a class="aster-back-link" href="<?php echo esc_url(home_url('/aster-preview/')); ?>">← Local preview</a><?php echo Aster_Phase_One::html($preview_order,true); ?></main>
<?php aster_commerce_footer();wp_footer(); ?></body></html>
