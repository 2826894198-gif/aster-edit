<?php
/** Plugin Name: Aster commerce boundaries */
defined('ABSPATH') || exit;
require_once __DIR__ . '/aster-commerce/catalog.php';
require_once __DIR__ . '/aster-commerce/commercial-review.php';
require_once __DIR__ . '/aster-commerce/bundle-contract.php';
require_once __DIR__ . '/aster-commerce/shipping-policy.php';
require_once __DIR__ . '/aster-commerce/order-access.php';
require_once __DIR__ . '/aster-commerce/presentation.php';
require_once __DIR__ . '/aster-commerce/checkout-handoff.php';
require_once __DIR__ . '/aster-commerce/operations.php';

// Price entry or accidental publication alone cannot open the launch gate.
add_filter('woocommerce_is_purchasable', function ($purchasable, $product) {
    if ($product->get_meta('_aster_catalog_key') && $product->get_meta('_aster_commerce_approved') !== 'yes') return false;
    return $purchasable;
}, 20, 2);
