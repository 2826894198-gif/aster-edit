<?php
// Execute only through WP-CLI in the local container after WooCommerce is active.
if (!defined('WP_CLI') || !WP_CLI || !defined('ASTER_COMMERCE_ENV') || ASTER_COMMERCE_ENV !== 'local') {
    throw new RuntimeException('Local WP-CLI only.');
}
if (!class_exists('WooCommerce')) {
    WP_CLI::error('Activate WooCommerce first.');
}

$options = [
    'blog_public' => '0',
    'permalink_structure' => '/%postname%/',
    'woocommerce_currency' => 'USD', // TEST FIXTURE, not a launch-market decision.
    'woocommerce_default_country' => 'US:CA',
    'woocommerce_allowed_countries' => 'specific',
    'woocommerce_specific_allowed_countries' => ['US'],
    'woocommerce_ship_to_countries' => 'specific',
    'woocommerce_specific_ship_to_countries' => ['US'],
    'woocommerce_enable_guest_checkout' => 'yes',
    'woocommerce_enable_signup_and_login_from_checkout' => 'yes',
    'woocommerce_enable_myaccount_registration' => 'yes',
    'woocommerce_registration_generate_username' => 'yes',
    'woocommerce_registration_generate_password' => 'no',
    'woocommerce_custom_orders_table_enabled' => 'yes',
    'woocommerce_custom_orders_table_data_sync_enabled' => 'no',
    'woocommerce_manage_stock' => 'yes',
    'woocommerce_hold_stock_minutes' => '60',
    'woocommerce_calc_taxes' => 'no', // Local fixture only; never copy to production.
    'woocommerce_email_from_name' => 'Aster Commerce LOCAL TEST',
    'woocommerce_email_from_address' => 'shop@aster.test',
];
foreach ($options as $key => $value) {
    update_option($key, $value);
}

foreach (['bacs', 'cheque', 'cod'] as $gateway) {
    $key = 'woocommerce_' . $gateway . '_settings';
    $settings = get_option($key, []);
    $settings['enabled'] = 'no';
    update_option($key, $settings);
}
$paypal = get_option('woocommerce-ppcp-settings', []);
$paypal['sandbox_on'] = true;
update_option('woocommerce-ppcp-settings', $paypal);

// Only create absent pages. Reruns never overwrite custom content or passwords.
foreach ([
    ['cart', 'Cart', '<!-- wp:woocommerce/cart /-->', 'woocommerce_cart_page_id'],
    ['checkout', 'Checkout', '<!-- wp:woocommerce/checkout /-->', 'woocommerce_checkout_page_id'],
    ['my-account', 'My account', '[woocommerce_my_account]', 'woocommerce_myaccount_page_id'],
] as [$slug, $title, $content, $option]) {
    $existing = get_page_by_path($slug);
    $id = $existing ? $existing->ID : wp_insert_post([
        'post_type' => 'page', 'post_status' => 'publish', 'post_name' => $slug,
        'post_title' => $title, 'post_content' => $content,
    ], true);
    if (is_wp_error($id)) WP_CLI::error($id->get_error_message());
    update_option($option, (int) $id);
}

// One synthetic, shippable SKU proves data plumbing; it is not Aster merchandise.
$id = wc_get_product_id_by_sku('ASTER-TEST-ONLY-001');
if (!$id) {
    $product = new WC_Product_Simple();
    $product->set_name('TEST ONLY — Ceramic integration fixture');
    $product->set_sku('ASTER-TEST-ONLY-001');
    $product->set_status('publish');
    $product->set_catalog_visibility('hidden');
    $product->set_regular_price('1.00');
    $product->set_manage_stock(true);
    $product->set_stock_quantity(10);
    $product->set_weight('0.5');
    $product->set_description('Fictional local integration data. Not merchandise. No real payment.');
    $product->save();
}

$zone = null;
foreach (WC_Shipping_Zones::get_zones() as $row) {
    if ($row['zone_name'] === 'TEST ONLY — US fixture') $zone = new WC_Shipping_Zone($row['zone_id']);
}
if (!$zone) {
    $zone = new WC_Shipping_Zone();
    $zone->set_zone_name('TEST ONLY — US fixture');
    $zone->add_location('US', 'country');
    $zone->save();
    $instance = $zone->add_shipping_method('flat_rate');
    update_option('woocommerce_flat_rate_' . $instance . '_settings', [
        'title' => 'TEST ONLY shipping', 'tax_status' => 'none', 'cost' => '2.00',
    ]);
}
flush_rewrite_rules();
WP_CLI::success('Local fixture configured; PayPal remains unconnected. No real products or customer records imported.');
