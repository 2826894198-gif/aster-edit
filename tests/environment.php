<?php
if (!defined('WP_CLI') || !WP_CLI || !defined('ASTER_COMMERCE_ENV') || ASTER_COMMERCE_ENV !== 'local') {
    throw new RuntimeException('Tests run only in the isolated local database.');
}
$checks = 0;
$check = function ($condition, $message) use (&$checks) {
    if (!$condition) WP_CLI::error($message);
    $checks++;
    WP_CLI::log('PASS ' . $message);
};

$check(class_exists('WooCommerce'), 'WooCommerce loaded');
$check(is_plugin_active('woocommerce-paypal-payments/woocommerce-paypal-payments.php'), 'Official PayPal Payments active');
$check(get_option('woocommerce_custom_orders_table_enabled') === 'yes', 'HPOS enabled');
$check(get_option('blog_public') === '0', 'No search indexing');
$check(get_option('woocommerce-ppcp-settings')['sandbox_on'] === true, 'Sandbox configured');

foreach (['https://api-m.paypal.com/v1/oauth2/token', 'https://api.paypal.com/v2/checkout/orders'] as $url) {
    $response = apply_filters('pre_http_request', false, [], $url);
    $check(is_wp_error($response) && $response->get_error_code() === 'aster_live_paypal_blocked', 'Live PayPal blocked before HTTP request');
}
$check(apply_filters('pre_http_request', false, [], 'https://api-m.sandbox.paypal.com/v2/checkout/orders') === false, 'Sandbox may pass through HTTP guard (no request sent)');

foreach (['cart', 'checkout', 'my-account'] as $slug) {
    $page = get_page_by_path($slug);
    $check($page && $page->post_status === 'publish', 'Native page present: ' . $slug);
}
$check(str_contains(get_page_by_path('checkout')->post_content, 'wp:woocommerce/checkout'), 'Checkout uses Woo Blocks');
$check(WC()->payment_gateways()->get_available_payment_gateways() === [], 'No payable gateway without merchant credentials');

$product = wc_get_product(wc_get_product_id_by_sku('ASTER-TEST-ONLY-001'));
$check($product && $product->get_regular_price() === '1.00', 'Synthetic fixture product exists');

// Exercise Woo CRUD and ownership using synthetic, explicitly marked fixtures.
$username = 'aster_test_customer';
$user = get_user_by('login', $username);
$customer_id = $user ? $user->ID : wc_create_new_customer('customer@aster.test', $username, wp_generate_password(40));
$check(!is_wp_error($customer_id), 'Synthetic customer can be created');
$customer = new WC_Customer($customer_id);
$customer->set_billing_first_name('Test');
$customer->set_billing_last_name('Customer');
$customer->set_billing_email('customer@aster.test');
$customer->save();
$orders = wc_get_orders(['limit' => 1, 'meta_key' => '_aster_fixture', 'meta_value' => 'ownership-v1']);
if ($orders) {
    $order = $orders[0];
} else {
    $order = wc_create_order(['customer_id' => $customer_id, 'status' => 'pending']);
    $order->set_billing_email('customer@aster.test');
    $order->set_billing_first_name('Test');
    $order->set_billing_last_name('Snapshot');
    $order->add_product($product, 1);
    $order->update_meta_data('_aster_fixture', 'ownership-v1');
    $order->calculate_totals();
    $order->save();
}
$check($order->get_status() === 'pending' && !$order->is_paid(), 'Local fixture order remains unpaid; no simulated payment success');
$check($order->get_transaction_id() === '', 'No provider transaction fabricated');
$check(!aster_checkout_open(), 'Checkout remains explicitly closed');
$check(apply_filters('woocommerce_valid_order_statuses_for_payment', ['pending', 'failed']) === [], 'Closed checkout removes order payment actions');
$pending_text = apply_filters('woocommerce_thankyou_order_received_text', 'Thank you.', $order);
$check(str_contains($pending_text, 'payment is still pending') && !str_contains($pending_text, 'Thank you.'), 'Order confirmation distinguishes pending payment');
$failed_display_order = new WC_Order();
$failed_display_order->set_status('failed');
$failed_text = apply_filters('woocommerce_thankyou_order_received_text', 'Thank you.', $failed_display_order);
$check(str_contains($failed_text, 'Payment was not completed'), 'Order confirmation distinguishes failed payment');
$customer->set_billing_last_name('Changed');
$customer->save();
$check(wc_get_order($order->get_id())->get_billing_last_name() === 'Snapshot', 'Changing customer address does not rewrite order snapshot');
wp_set_current_user($customer_id);
$check(current_user_can('view_order', $order->get_id()), 'Owner may view own order');
$other = get_user_by('login', 'aster_other_test_customer');
$other_id = $other ? $other->ID : wc_create_new_customer('other@aster.test', 'aster_other_test_customer', wp_generate_password(40));
if (is_wp_error($other_id)) WP_CLI::error($other_id->get_error_message());
wp_set_current_user($other_id);
$check(!current_user_can('view_order', $order->get_id()), 'Different customer cannot view order');
wp_set_current_user(0);
$check(!current_user_can('view_order', $order->get_id()), 'Unauthenticated visitor cannot view account order');

$check(wp_mail('mail-check@aster.test', 'ASTER LOCAL SMTP ISOLATION CHECK', 'Synthetic message for the local mail sink only.'), 'Local mail accepted by SMTP sink');
WP_CLI::success($checks . ' local checks passed. No PayPal create/approve/capture/refund request was sent.');
