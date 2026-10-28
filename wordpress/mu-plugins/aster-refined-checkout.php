<?php
/** Aster's reviewed layout on the official Woo classic checkout. */
defined('ABSPATH') || exit;

function aster_refined_checkout_published(): bool { return get_option('aster_refined_checkout_enabled') === 'yes'; }
function aster_refined_checkout_active(): bool {
    if (function_exists('aster_checkout_interface_active') && aster_checkout_interface_active()) return true;
    if (aster_refined_checkout_published()) return true;
    if (isset($_GET['aster_checkout_review'])) return $_GET['aster_checkout_review'] === '1';
    $path = untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && $path === '/checkout') return false;
    return ($_COOKIE['aster_checkout_review'] ?? '') === '1';
}

// Give the official plugin a real classic-checkout page to inspect during
// review without changing the published checkout page or its public URL.
add_filter('option_woocommerce_checkout_page_id', static function ($id) {
    return aster_refined_checkout_active() && !aster_refined_checkout_published()
        ? (get_option('aster_refined_checkout_page_id') ?: $id) : $id;
});
add_filter('woocommerce_is_checkout', static function ($checkout) {
    $path = untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
    return $checkout || (aster_refined_checkout_active() && $path === '/checkout');
});
add_filter('woocommerce_get_checkout_url', static function ($url) {
    return aster_refined_checkout_active() && !aster_refined_checkout_published()
        ? home_url('/checkout/?aster_checkout_review=1') : $url;
});

// Disable Fastlane only in the reviewed flow; the already-enabled official
// Advanced Card gateway still owns every hosted field and payment operation.
add_filter('option_woocommerce_ppcp-axo-gateway_settings', static function ($settings) {
    if (aster_refined_checkout_active()) $settings['enabled'] = 'no';
    return $settings;
});
add_filter('option_woocommerce-ppcp-data-styling', static function ($settings) {
    if (!aster_refined_checkout_active() || !is_array($settings)) return $settings;
    $change = static function ($location, $fields) {
        if (is_object($location)) {
            $location = clone $location;
            foreach ($fields as $key => $value) $location->$key = $value;
            return $location;
        }
        return is_array($location) ? array_replace($location, $fields) : $location;
    };
    foreach (['cart', 'express_checkout', 'mini_cart', 'product'] as $location) {
        if (isset($settings[$location])) $settings[$location] = $change($settings[$location], ['enabled' => false]);
    }
    if (isset($settings['classic_checkout'])) {
        $settings['classic_checkout'] = $change($settings['classic_checkout'], ['enabled' => true,
            'methods' => ['ppcp-gateway', 'ppcp-applepay', 'ppcp-googlepay'], 'color' => 'black', 'layout' => 'vertical']);
    }
    return $settings;
});

add_action('init', static function () {
    $path = untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
    $leave_review = !isset($_GET['aster_checkout_review']) && ($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && $path === '/checkout' && isset($_COOKIE['aster_checkout_review']);
    if (!isset($_GET['aster_checkout_review']) && !$leave_review) return;
    $review = ($_GET['aster_checkout_review'] ?? '') === '1';
    setcookie('aster_checkout_review', $review ? '1' : '', [
        'expires' => $review ? time() + 1800 : time() - 3600,
        'path' => '/', 'secure' => is_ssl(), 'httponly' => true, 'samesite' => 'Lax',
    ]);
    if (!$review) unset($_COOKIE['aster_checkout_review']);
});
add_filter('woocommerce_ajax_get_endpoint', static function ($url) {
    return aster_refined_checkout_active() && !aster_refined_checkout_published()
        ? str_replace('%25%25endpoint%25%25', '%%endpoint%%', add_query_arg('aster_checkout_review', '1', $url)) : $url;
});

add_filter('body_class', static function ($classes) {
    if (aster_refined_checkout_active() && is_checkout() && !is_order_received_page() && !is_checkout_pay_page()) $classes[] = 'aster-refined-checkout';
    return $classes;
});
add_filter('the_posts', static function ($posts, $query) {
    if (aster_refined_checkout_published() || !aster_refined_checkout_active() || !$query->is_main_query() || !is_checkout() || is_order_received_page() || is_checkout_pay_page()) return $posts;
    foreach ($posts as $index => $post) {
        if ($post->post_type !== 'page') continue;
        $post = clone $post;
        $post->post_content = '[woocommerce_checkout]';
        $posts[$index] = $post;
        // This server uses the request-local core object cache. Make explicit
        // get_post() checks see the same reviewed content as the main query.
        if (!wp_using_ext_object_cache()) wp_cache_set($post->ID, $post, 'posts');
    }
    return $posts;
}, 10, 2);
add_action('wp', static function () {
    if (!aster_refined_checkout_active() || !is_checkout() || is_order_received_page() || is_checkout_pay_page()) return;
    if (function_exists('aster_checkout_interface_active') && aster_checkout_interface_active()) return;
    remove_action('woocommerce_checkout_order_review', 'woocommerce_checkout_payment', 20);
    add_action('woocommerce_checkout_before_order_review_heading', static function () { echo '<div class="aster-checkout-side"><aside class="aster-checkout-summary" aria-labelledby="order_review_heading">'; });
    add_action('woocommerce_checkout_after_order_review', static function () {
        echo '</aside><section class="aster-checkout-payment" aria-labelledby="aster-checkout-payment-title"><h2 id="aster-checkout-payment-title">Payment</h2>';
        woocommerce_checkout_payment();
        echo '</section></div>';
    });
});

add_filter('woocommerce_checkout_fields', static function ($fields) {
    if (aster_refined_checkout_active()) $fields['billing']['billing_email']['priority'] = 5;
    return $fields;
});
add_filter('woocommerce_available_payment_gateways', static function ($gateways) {
    if (!aster_refined_checkout_active()) return $gateways;
    $payment = get_option('woocommerce-ppcp-data-payment', []);
    if (empty($payment['applepay_validated'])) unset($gateways['ppcp-applepay']);
    $ordered = [];
    foreach (['ppcp-credit-card-gateway', 'ppcp-gateway', 'ppcp-googlepay', 'ppcp-applepay'] as $id) {
        if (isset($gateways[$id])) { $ordered[$id] = $gateways[$id]; unset($gateways[$id]); }
    }
    return $ordered + $gateways;
}, 30);
add_filter('gettext', static function ($translated, $text, $domain) {
    if (!aster_refined_checkout_active() || $domain !== 'woocommerce') return $translated;
    if (function_exists('aster_checkout_interface_active') && aster_checkout_interface_active()) return $translated;
    return ['Billing details' => 'Contact & delivery', 'Your order' => 'Order summary'][$text] ?? $translated;
}, 20, 3);
add_filter('woocommerce_cart_item_name', static function ($name, $item) {
    if (!aster_refined_checkout_active() || !is_checkout()) return $name;
    if (function_exists('aster_checkout_interface_active') && aster_checkout_interface_active()) return $name;
    $product = $item['data'] ?? null;
    $image = $product instanceof WC_Product ? aster_storefront_product_image((string)$product->get_meta('_aster_catalog_key')) : null;
    return $image ? '<span class="aster-checkout-line"><img src="' . esc_url($image) . '" width="64" height="64" alt=""><span>' . $name . '</span></span>' : $name;
}, 20, 2);
add_action('wp_enqueue_scripts', static function () {
    if (!aster_refined_checkout_active() || !is_checkout() || is_order_received_page() || is_checkout_pay_page()) return;
    $root = __DIR__ . '/aster-commerce/';
    wp_enqueue_style('aster-refined-checkout', plugins_url('aster-commerce/refined-checkout.css', __FILE__), ['aster-commerce-presentation'], filemtime($root . 'refined-checkout.css'));
    wp_enqueue_script('aster-refined-checkout', plugins_url('aster-commerce/refined-checkout.js', __FILE__), ['jquery', 'wc-checkout'], filemtime($root . 'refined-checkout.js'), true);
}, 100);

// The review URL renders real native controls but cannot submit orders or
// authorize/capture a payment. Normal checkout keeps its existing gates.
add_action('woocommerce_after_checkout_validation', static function ($data, $errors) {
    if (aster_refined_checkout_active() && !aster_refined_checkout_published()) $errors->add('aster_layout_review', 'This checkout layout is a review. No order or payment has been submitted.');
}, 99, 2);
add_filter('pre_http_request', static function ($pre, $args, $url) {
    if (!aster_refined_checkout_active() || aster_refined_checkout_published()) return $pre;
    $host = wp_parse_url($url, PHP_URL_HOST) ?: '';
    $path = wp_parse_url($url, PHP_URL_PATH) ?: '';
    if (preg_match('/(^|\.)paypal\.com$/D', $host) && in_array(strtoupper($args['method'] ?? 'GET'), ['POST', 'PATCH', 'DELETE'], true) && preg_match('#^/(v2/checkout/orders|v1/payments)#', $path)) return new WP_Error('aster_layout_review', 'Order and payment writes are disabled in this layout review.');
    return $pre;
}, 99, 3);
