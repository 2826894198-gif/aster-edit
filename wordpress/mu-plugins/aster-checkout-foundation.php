<?php
/** Owner-authorized JWK checkout foundation adapted to Aster, 2026-10-15. */
defined('ABSPATH') || exit;
function aster_checkout_foundation_review(): bool {
    if (function_exists('aster_checkout_interface_review') && aster_checkout_interface_review()) return true;
    if (isset($_GET['aster_foundation_review'])) return $_GET['aster_foundation_review'] === '1';
    $path = untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && $path === '/checkout') return false;
    return ($_COOKIE['aster_foundation_review'] ?? '') === '1';
}
function aster_checkout_foundation_active(): bool {
    return wp_get_environment_type() === 'local' || get_option('aster_checkout_foundation_enabled') === 'yes' || aster_checkout_foundation_review();
}
add_action('init', static function () {
    $path = untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
    if (!isset($_GET['aster_foundation_review']) && !(($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && $path === '/checkout' && isset($_COOKIE['aster_foundation_review']))) return;
    $review = ($_GET['aster_foundation_review'] ?? '') === '1';
    setcookie('aster_foundation_review', $review ? '1' : '', ['expires' => $review ? time() + 1800 : time() - 3600, 'path' => '/', 'secure' => is_ssl(), 'httponly' => true, 'samesite' => 'Lax']);
    if (!$review) unset($_COOKIE['aster_foundation_review']);
});
foreach (['Config','PaymentAssessment','PaymentStateMachine','PaymentOperationLock','PayPalVerifier','PaymentAttemptRepository','PaymentDeletionGuard','SinglePageCheckoutExperience','PayPalCheckoutOrderFirst','CheckoutRuntime'] as $class) require_once __DIR__ . '/aster-checkout/' . $class . '.php';
// The copied native lifecycle and ledger share these immutable key names.
class_alias('Aster\\Checkout\\CheckoutRuntime', 'Aster\\Checkout\\CheckoutAttemptRegistry');
add_action('plugins_loaded', static function () {
    if (!aster_checkout_foundation_active() || !class_exists('WooCommerce')) return;
    $runtime = new \Aster\Checkout\CheckoutRuntime();
    $runtime->register();
}, 40);
add_action('woocommerce_after_checkout_validation', static function ($data, $errors) {
    if (aster_checkout_foundation_review()) $errors->add('aster_foundation_review', 'Checkout review: no order or payment was submitted.');
}, -100, 2);
add_action('woocommerce_paypal_payments_create_order_request_started', static function () {
    if (aster_checkout_foundation_review()) throw new RuntimeException('Checkout review: order and payment writes are disabled.');
}, 0);
add_filter('pre_http_request', static function ($pre, $args, $url) {
    if (!aster_checkout_foundation_review()) return $pre;
    $host = wp_parse_url($url, PHP_URL_HOST) ?: ''; $path = wp_parse_url($url, PHP_URL_PATH) ?: '';
    if (preg_match('/(^|\.)paypal\.com$/D', $host) && in_array(strtoupper($args['method'] ?? 'GET'), ['POST','PATCH','DELETE'], true)
        && preg_match('#^/(?:v2/(?:checkout/orders|payments)|v1/payments)#', $path)) return new WP_Error('aster_foundation_review', 'Order and payment writes are disabled in checkout review.');
    return $pre;
}, 100, 3);
