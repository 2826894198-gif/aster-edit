<?php
/** Owner-selected JWK checkout composition, adapted to Aster's native Woo flow. */
defined('ABSPATH') || exit;

function aster_checkout_interface_review(): bool {
    if (isset($_GET['aster_interface_review'])) return $_GET['aster_interface_review'] === '1';
    $path = untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && $path === '/checkout') return false;
    return ($_COOKIE['aster_interface_review'] ?? '') === '1';
}
function aster_checkout_interface_active(): bool {
    return get_option('aster_checkout_interface_enabled') === 'yes' || aster_checkout_interface_review();
}
function aster_checkout_interface_context(): bool {
    if (!aster_checkout_interface_active()) return false;
    // Country data can initialize before the main query. Scope by the actual
    // checkout route/endpoints so account address forms keep their own layout.
    $path = untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
    if ($path === '/checkout') return true;
    $ajax = $_GET['wc-ajax'] ?? '';
    return is_string($ajax) && in_array($ajax, ['checkout', 'update_order_review'], true);
}
function aster_checkout_interface_page(): bool {
    return aster_checkout_interface_active() && is_checkout() && !is_order_received_page() && !is_checkout_pay_page();
}
function aster_checkout_interface_asset(string $name): string {
    return plugins_url('aster-checkout-interface/' . $name, __FILE__);
}
function aster_checkout_interface_method(string $id): array {
    return [
        'ppcp-credit-card-gateway' => ['Credit or debit card', 'Secure card payment', 'Pay securely by card', 'Your card details are handled securely by PayPal.', 'credit-card.svg'],
        'ppcp-gateway' => ['PayPal', 'Pay with your PayPal account', 'Pay with PayPal', 'Authorize securely with PayPal and return to your order.', 'paypal-logo.svg'],
    ][$id] ?? ['', '', '', '', ''];
}

add_action('init', static function () {
    $path = untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
    if (!isset($_GET['aster_interface_review']) && !(($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && $path === '/checkout' && isset($_COOKIE['aster_interface_review']))) return;
    $review = ($_GET['aster_interface_review'] ?? '') === '1';
    setcookie('aster_interface_review', $review ? '1' : '', ['expires' => $review ? time() + 1800 : time() - 3600, 'path' => '/', 'secure' => is_ssl(), 'httponly' => true, 'samesite' => 'Lax']);
    if (!$review) unset($_COOKIE['aster_interface_review']);
});
add_filter('body_class', static function ($classes) {
    if (aster_checkout_interface_page()) $classes[] = 'aster-jwk-checkout';
    return $classes;
});
add_filter('template_include', static function ($template) {
    return aster_checkout_interface_page() ? __DIR__ . '/aster-checkout-interface/checkout-shell.php' : $template;
}, 110);
add_filter('woocommerce_locate_template', static function ($template, $name) {
    if (!aster_checkout_interface_context() || (function_exists('is_checkout_pay_page') && is_checkout_pay_page())) return $template;
    $files = ['checkout/form-checkout.php', 'checkout/form-billing.php', 'checkout/review-order.php', 'checkout/payment-method.php'];
    return in_array($name, $files, true) ? __DIR__ . '/aster-checkout-interface/' . basename($name) : $template;
}, 40, 2);

// Keep native country/state requirements, validation and autocomplete. Only the
// presentation order changes; locale updates must retain the same field order.
function aster_checkout_interface_priorities(): array {
    return ['email' => 5, 'first_name' => 10, 'last_name' => 20, 'company' => 30,
        'address_1' => 40, 'address_2' => 50, 'country' => 60, 'phone' => 70,
        'city' => 80, 'state' => 90, 'postcode' => 100];
}
add_filter('woocommerce_checkout_fields', static function ($fields) {
    if (!aster_checkout_interface_context()) return $fields;
    foreach (aster_checkout_interface_priorities() as $key => $priority) {
        if (isset($fields['billing']['billing_' . $key])) $fields['billing']['billing_' . $key]['priority'] = $priority;
    }
    if (isset($fields['billing']['billing_email'])) $fields['billing']['billing_email']['label'] = 'Email';
    if (isset($fields['billing']['billing_address_2'])) {
        $fields['billing']['billing_address_2']['label'] = 'Address line 2';
        $fields['billing']['billing_address_2']['label_class'] = [];
        $fields['billing']['billing_address_2']['placeholder'] = '';
    }
    return $fields;
}, 200);
add_filter('woocommerce_get_country_locale_default', static function ($locale) {
    if (!aster_checkout_interface_context()) return $locale;
    foreach (aster_checkout_interface_priorities() as $key => $priority) {
        if (isset($locale[$key])) $locale[$key]['priority'] = $priority;
    }
    if (isset($locale['address_2'])) {
        $locale['address_2']['label'] = 'Address line 2';
        $locale['address_2']['placeholder'] = '';
    }
    return $locale;
}, 200);
add_filter('woocommerce_get_country_locale', static function ($locales) {
    if (!aster_checkout_interface_context()) return $locales;
    foreach ($locales as &$locale) {
        foreach (aster_checkout_interface_priorities() as $key => $priority) {
            if (isset($locale[$key])) $locale[$key]['priority'] = $priority;
        }
    }
    unset($locale);
    return $locales;
}, 200);
add_filter('woocommerce_shipping_package_name', static function ($name, $index) {
    if (!aster_checkout_interface_page()) return $name;
    return count(WC()->shipping()->get_packages()) > 1 ? 'Shipping ' . ($index + 1) : 'Shipping';
}, 40, 2);

add_action('woocommerce_review_order_before_payment', static function () {
    if (!aster_checkout_interface_page()) return;
    $cups = Aster_Shipping_Policy::cups_only(['contents' => WC()->cart->get_cart()]);
    echo '<p class="aster-checkout-shipping-note">' . ($cups ? '<strong>Cup-only orders ship free.</strong> ' : 'Shipping is calculated from your bag and delivery address. ') . 'Import duties and taxes are paid by the recipient.</p>';
    echo '<div class="aster-payment-heading"><div><p class="aster-eyebrow">Payment method</p><h3 id="aster-checkout-payment-title">Choose how to pay</h3></div><img src="' . esc_url(aster_checkout_interface_asset('icons/lock-key.svg')) . '" width="20" height="20" alt=""></div>';
}, 5);
add_action('woocommerce_review_order_after_payment', static function () {
    if (!aster_checkout_interface_page() || aster_customer_mail_ready()) return;
    echo '<p class="aster-checkout-mail-note">Order emails are currently off. Save your order number and check your <a href="' . esc_url(home_url('/order-status/')) . '">order status</a> at any time.</p>';
});
add_action('wp_enqueue_scripts', static function () {
    if (!aster_checkout_interface_page()) return;
    wp_enqueue_style('aster-checkout-interface', aster_checkout_interface_asset('interface.css'), ['aster-refined-checkout', 'aster-checkout-foundation'], filemtime(__DIR__ . '/aster-checkout-interface/interface.css'));
}, 120);
