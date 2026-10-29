<?php
/**
 * Plugin Name: Aster Environment Boundary
 * Description: Local commerce isolation; no custom payment processing.
 * Version: 0.1.0
 */

defined('ABSPATH') || exit;

function aster_is_isolated_environment(): bool {
    return defined('ASTER_COMMERCE_ENV') && in_array(ASTER_COMMERCE_ENV, ['local', 'staging'], true);
}

function aster_customer_mail_ready(): bool {
    return defined('ASTER_COMMERCE_ENV') && ASTER_COMMERCE_ENV === 'local'
        || (defined('ASTER_CUSTOMER_MAIL_READY') && ASTER_CUSTOMER_MAIL_READY === true);
}

function aster_checkout_open(): bool {
    return defined('ASTER_CHECKOUT_OPEN') && ASTER_CHECKOUT_OPEN === true;
}

// Reject order submissions before Woo's Store API can create a pending order.
// Checkout opens only after an explicit server-side release decision.
add_filter('rest_pre_dispatch', function ($result, $server, $request) {
    if (!aster_checkout_open()
        && $request->get_method() === 'POST'
        && preg_match('~^/wc/store(?:/v[0-9]+)?/checkout/?$~', $request->get_route())) {
        return new WP_Error('aster_checkout_closed', 'Checkout is not open yet. Your bag has been kept.', ['status' => 503]);
    }
    return $result;
}, 10, 3);

add_action('woocommerce_after_checkout_validation', function ($data, $errors) {
    if (!aster_checkout_open()) $errors->add('aster_checkout_closed', 'Checkout is not open yet. Your bag has been kept.');
}, 10, 2);

add_filter('woocommerce_valid_order_statuses_for_payment', function ($statuses) {
    return aster_checkout_open() ? $statuses : [];
}, PHP_INT_MAX);

// Keep the loopback-only local fixture isolated from live PayPal. Staging uses
// the official plugin's unmodified live API flow for merchant onboarding and
// payment testing; its public checkout remains controlled separately.
add_filter('pre_http_request', function ($result, $args, $url) {
    if (!defined('ASTER_COMMERCE_ENV') || ASTER_COMMERCE_ENV !== 'local') {
        return $result;
    }
    $host = strtolower((string) wp_parse_url($url, PHP_URL_HOST));
    if ($host === 'paypal.com' || str_ends_with($host, '.paypal.com')) {
        $sandbox = $host === 'sandbox.paypal.com' || str_ends_with($host, '.sandbox.paypal.com');
        if (!$sandbox) {
            return new WP_Error('aster_live_paypal_blocked', 'Live PayPal requests are disabled in this isolated environment.');
        }
    }
    return $result;
}, 10, 3);

add_filter('pre_option_blog_public', function ($value) {
    return aster_is_isolated_environment() ? '0' : $value;
});

add_action('send_headers', function () {
    if (aster_is_isolated_environment()) {
        header('X-Robots-Tag: noindex, nofollow, noarchive', true);
    }
});

// All local WordPress mail goes to a container-only SMTP sink. No relay is
// configured and the SMTP port is not published to the host.
add_action('phpmailer_init', function ($mailer) {
    if (defined('ASTER_COMMERCE_ENV') && ASTER_COMMERCE_ENV === 'local') {
        $mailer->isSMTP();
        $mailer->Host = 'mailpit';
        $mailer->Port = 1025;
        $mailer->SMTPAuth = false;
        $mailer->SMTPSecure = '';
        $mailer->SMTPAutoTLS = false;
    }
});

// Staging has no authenticated sender. Never fall back to the server's PHP mail
// transport and accidentally send customer/admin messages as a live store.
add_filter('pre_wp_mail', function ($result) {
    if (defined('ASTER_COMMERCE_ENV') && ASTER_COMMERCE_ENV === 'staging' && !aster_customer_mail_ready()) {
        return false;
    }
    return $result;
}, 10, 1);

// Local fixtures expose only the official Sandbox gateway. Staging must let
// WooCommerce and the official PayPal plugin decide gateway availability so
// live onboarding and subsequent payment tests are not silently overridden.
add_filter('woocommerce_available_payment_gateways', function ($gateways) {
    if (!defined('ASTER_COMMERCE_ENV') || ASTER_COMMERCE_ENV !== 'local') {
        return $gateways;
    }
    $settings = get_option('woocommerce-ppcp-settings', []);
    $sandbox = isset($settings['sandbox_on']) && in_array($settings['sandbox_on'], [true, 1, '1', 'yes'], true);
    if (!$sandbox) {
        return [];
    }
    return array_intersect_key($gateways, array_flip(['ppcp-gateway']));
}, PHP_INT_MAX);

add_action('rest_api_init', function () {
    register_rest_route('aster/v1', '/health', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function () {
            $response = new WP_REST_Response([
                'service' => 'aster-commerce',
                'contract_version' => '1',
                'woocommerce_loaded' => class_exists('WooCommerce'),
                'environment' => defined('ASTER_COMMERCE_ENV') ? ASTER_COMMERCE_ENV : 'unconfigured',
            ]);
            $response->header('Cache-Control', 'no-store');
            return $response;
        },
    ]);
});
