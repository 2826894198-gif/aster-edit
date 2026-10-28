<?php
/** Read-only, deliberately excludes credentials, customer data and order identifiers. */
$_SERVER['HTTP_HOST'] = $argv[2] ?? 'commerce.example.test';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/checkout/';
$_SERVER['HTTPS'] = 'on';
require $argv[1];
require_once ABSPATH . 'wp-admin/includes/plugin.php';
$out = ['wordpress' => get_bloginfo('version'), 'woocommerce' => defined('WC_VERSION') ? WC_VERSION : null];
$out['plugins'] = [];
foreach (get_plugins() as $file => $plugin) {
    if (preg_match('/woocommerce|paypal|stripe|wintopay|cartadicredito|customer.operations/i', $file)) $out['plugins'][$file] = ['version' => $plugin['Version'], 'active' => is_plugin_active($file)];
}
$out['flags'] = [];
foreach (['ASTER_COMMERCE_ENV','ASTER_CHECKOUT_OPEN','ASTER_CUSTOMER_MAIL_READY','AGCO_SINGLE_PAGE_CHECKOUT_ENABLED','AGCO_PAYPAL_CHECKOUT_ENABLED','AGCO_WINTOPAY_CHECKOUT_ENABLED','AGCO_STRIPE_REDIRECT_ENABLED','AGCO_STRIPE_COMBINED_CHECKOUT_ENABLED','AGCO_STRIPE_WALLETS_ENABLED'] as $key) if (defined($key)) $out['flags'][$key] = constant($key);
$out['checkout'] = [];
foreach (['woocommerce_currency','woocommerce_calc_taxes','woocommerce_enable_guest_checkout','woocommerce_enable_signup_and_login_from_checkout','aster_refined_checkout_enabled','woocommerce_default_country'] as $key) $out['checkout'][$key] = get_option($key);
$page = get_post(get_option('woocommerce_checkout_page_id'));
$out['checkout']['page_content'] = $page ? $page->post_content : null;
$out['gateways'] = [];
foreach (WC()->payment_gateways()->payment_gateways() as $id => $gateway) {
    $settings = $gateway->settings;
    $data = ['enabled' => $gateway->enabled, 'title' => $gateway->title, 'class' => get_class($gateway), 'supports' => $gateway->supports];
    foreach (['testmode','sandbox_on','sandbox','capture','intent','button_layout','smart_button_locations','disable_funding','enabled','title','inline_cc_form','payment_action'] as $key) if (isset($settings[$key])) $data[$key] = $settings[$key];
    foreach ($settings as $key => $value) if (preg_match('/secret|client_id|api_key|merchant|account_id|webhook_id/i', $key)) $data['configured_fields'][$key] = !empty($value);
    $out['gateways'][$id] = $data;
}
foreach (['woocommerce-ppcp-data-payment','woocommerce-ppcp-data-general','woocommerce-ppcp-data-styling'] as $key) {
    $value = get_option($key, []);
    if ($key === 'woocommerce-ppcp-data-styling') { $out['paypal_settings'][$key] = $value; continue; }
    foreach ((array)$value as $name => $setting) {
        if (preg_match('/enabled|validated|vault|capture|intent|sandbox|mode|button|fastlane|card|wallet|country|currency|ship|brand|landing|locale/i', $name) && !preg_match('/secret|key|id|token|email/i', $name)) $out['paypal_settings'][$key][$name] = $setting;
        elseif (preg_match('/secret|client|merchant|webhook|token/i', $name)) $out['paypal_settings'][$key][$name . '_present'] = !empty($setting);
    }
}
global $wpdb;
$table = $wpdb->prefix . 'wc_orders';
if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) === $table) $out['order_counts'] = $wpdb->get_results("SELECT status, payment_method, COUNT(*) AS count FROM $table WHERE type = 'shop_order' GROUP BY status, payment_method", ARRAY_A);
echo wp_json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), "\n";
