<?php
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local') throw new RuntimeException('Local fixture checks only.');
$checks = 0;
$check = static function ($condition, $label) use (&$checks) { if (!$condition) throw new RuntimeException($label); $checks++; };
$beforeOrders = (int)wc_get_orders(['paginate' => true, 'limit' => 1])->total;
$option = get_option('aster_checkout_interface_enabled');
$beforeLocale = (new WC_Countries())->get_country_locale();
$check(!aster_checkout_interface_active(), 'Unpublished public checkout retains its previous presentation');
$_GET['aster_interface_review'] = '1';
$_SERVER['REQUEST_URI'] = '/checkout/';
$_SERVER['REQUEST_METHOD'] = 'GET';
try {
    $check(aster_checkout_interface_active() && aster_refined_checkout_active(), 'Selected interface uses one native classic checkout');
    $check(aster_checkout_foundation_review(), 'Interface preview inherits the financial-write guard');
    $fields = WC()->checkout()->get_checkout_fields('billing');
    $check(!array_diff(['billing_email', 'billing_first_name', 'billing_last_name', 'billing_country', 'billing_address_1', 'billing_address_2', 'billing_city', 'billing_state', 'billing_postcode', 'billing_phone'], array_keys($fields)), 'Native billing fields remain available');
    $check($fields['billing_address_1']['priority'] < $fields['billing_country']['priority'] && $fields['billing_phone']['priority'] < $fields['billing_city']['priority'], 'Delivery field tab order matches the selected interface');
    $check(empty($fields['billing_address_2']['required']) && empty($fields['billing_address_2']['label_class']), 'Optional second address has a visible native label');
    $locale = (new WC_Countries())->get_country_locale();
    foreach (['default', 'US', 'GB', 'DE', 'AE'] as $country) {
        foreach (['state', 'postcode', 'city', 'country', 'phone'] as $key) {
            foreach (['required', 'hidden'] as $attribute) {
                $check(($locale[$country][$key][$attribute] ?? null) === ($beforeLocale[$country][$key][$attribute] ?? null), 'Country-specific address requirement retained');
            }
        }
    }
    $check($locale['default']['address_1']['priority'] === 40 && $locale['default']['country']['priority'] === 60, 'Browser locale updates retain the selected field order');
    $_SERVER['REQUEST_URI'] = '/my-account/edit-address/billing/';
    $accountLocale = (new WC_Countries())->get_country_locale();
    $check($accountLocale['default']['country']['priority'] === $beforeLocale['default']['country']['priority'], 'Account address forms are outside the checkout presentation filters');
    $_SERVER['REQUEST_URI'] = '/checkout/';
    $path = apply_filters('woocommerce_locate_template', '/native/payment-method.php', 'checkout/payment-method.php');
    $check(str_ends_with($path, '/aster-checkout-interface/payment-method.php'), 'Payment-choice presentation uses the scoped native adapter');
    $gateway = new class extends WC_Payment_Gateway {
        public function __construct() { $this->id = 'ppcp-credit-card-gateway'; $this->has_fields = true; $this->chosen = true; }
        public function payment_fields() { echo '<div data-testid="provider-owned-fixture">TEST ONLY provider output</div>'; }
    };
    $html = wc_get_template_html('checkout/payment-method.php', ['gateway' => $gateway]);
    $check(str_contains($html, 'data-testid="provider-owned-fixture"') && substr_count($html, 'name="payment_method"') === 1, 'Official gateway retains ownership of the selected payment fields');
    $errors = new WP_Error(); do_action('woocommerce_after_checkout_validation', [], $errors);
    $check($errors->get_error_message('aster_foundation_review') !== '', 'Interface preview cannot create a Woo order');
    $result = apply_filters('pre_http_request', false, ['method' => 'POST'], 'https://api-m.paypal.com/v2/checkout/orders');
    $check(is_wp_error($result) && $result->get_error_code() === 'aster_foundation_review', 'Interface preview cannot create a provider order');
    unset($_GET['aster_interface_review']); $_COOKIE['aster_interface_review'] = '1';
    $_SERVER['REQUEST_METHOD'] = 'POST'; $_SERVER['REQUEST_URI'] = '/?wc-ajax=update_order_review';
    $check(aster_checkout_interface_review(), 'Native AJAX preserves the review guard');
    $_SERVER['REQUEST_METHOD'] = 'GET'; $_SERVER['REQUEST_URI'] = '/checkout/';
    $check(!aster_checkout_interface_review(), 'Ordinary checkout exits temporary review');
} finally { unset($_GET['aster_interface_review'], $_COOKIE['aster_interface_review']); }
$check(get_option('aster_checkout_interface_enabled') === $option, 'Review does not publish itself');
$check((int)wc_get_orders(['paginate' => true, 'limit' => 1])->total === $beforeOrders, 'Interface verification created no order');
WP_CLI::success("$checks interface, native gateway ownership, country rules and preview isolation checks passed.");
