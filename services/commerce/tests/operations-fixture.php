<?php
if (wp_get_environment_type() !== 'local' || !defined('WP_CLI') || !WP_CLI) throw new RuntimeException('Local CLI only.');
Aster_Operations::roles();
$ids = [];
foreach (['support' => 'aster_support', 'fulfillment' => 'aster_fulfillment', 'finance' => 'aster_finance', 'customer' => 'customer'] as $name => $role) {
    $login = 'aster_ops_' . $name . '_fixture'; $user = get_user_by('login', $login);
    if (!$user) {
        $id = wp_insert_user(['user_login' => $login, 'user_email' => 'test-only-ops-' . $name . '@aster.test', 'user_pass' => wp_generate_password(48), 'display_name' => 'TEST ONLY — ' . $name, 'role' => $role]);
        if (is_wp_error($id)) throw new RuntimeException('Fixture user could not be created.');
        update_user_meta($id, '_aster_ops_fixture', 'yes'); $user = get_user_by('id', $id);
    }
    if (get_user_meta($user->ID, '_aster_ops_fixture', true) !== 'yes' || $user->roles !== [$role]) throw new RuntimeException('Refusing to change existing user permissions.');
    $ids[$name] = $user->ID;
}
$orders = wc_get_orders(['limit' => 1, 'meta_key' => '_aster_fixture', 'meta_value' => 'operations-v1']);
if ($orders) $order = $orders[0];
else {
    $order = wc_create_order(['status' => 'pending', 'customer_id' => $ids['customer']]);
    $order->set_billing_email('test-only-ops-customer@aster.test');
    $order->set_shipping_first_name('TEST ONLY'); $order->set_shipping_last_name('DO NOT SHIP');
    $order->set_shipping_address_1('TEST ONLY — 123 Fixture Road'); $order->set_shipping_city('Test City'); $order->set_shipping_country('US');
    $order->add_product(wc_get_product(wc_get_product_id_by_sku('ASTER-TEST-ONLY-001')), 1);
    $order->update_meta_data('_aster_fixture', 'operations-v1'); $order->calculate_totals(); $order->save();
}
if (($args[0] ?? '') === 'auth') {
    $result = ['order_id' => $order->get_id(), 'users' => []];
    foreach ($ids as $role => $id) {
        wp_set_current_user($id);
        $expiration = time() + 1800;
        $token = WP_Session_Tokens::get_instance($id)->create($expiration);
        $logged = wp_generate_auth_cookie($id, $expiration, 'logged_in', $token);
        $_COOKIE[LOGGED_IN_COOKIE] = $logged;
        $result['users'][$role] = ['cookie' => LOGGED_IN_COOKIE . '=' . $logged . '; ' . AUTH_COOKIE . '=' . wp_generate_auth_cookie($id, $expiration, 'auth', $token), 'nonce' => wp_create_nonce('wp_rest')];
    }
    // Captured privately by the Node test runner. Never print this mode in tool output.
    echo wp_json_encode($result);
    return;
}
$checks = 0;
$check = static function ($ok, $label) use (&$checks) { if (!$ok) WP_CLI::error($label); $checks++; WP_CLI::log('PASS ' . $label); };
foreach (['support', 'fulfillment', 'finance'] as $role) {
    wp_set_current_user($ids[$role]);
    $check(Aster_Operations::allowed('aster_orders_read'), $role . ' may read scoped orders');
    foreach (['manage_options', 'manage_woocommerce', 'edit_shop_orders', 'edit_others_shop_orders', 'edit_users', 'edit_products'] as $cap) $check(!current_user_can($cap), $role . ' lacks broad ' . $cap);
    $detail = Aster_Operations::detail($order);
    $check(array_key_exists('notes', $detail) === ($role === 'support'), $role . ' note visibility is scoped');
    $check(array_key_exists('shipping_address', $detail) === ($role === 'fulfillment'), $role . ' shipping address visibility is scoped');
    $check(array_key_exists('payment_review', $detail) === ($role === 'finance'), $role . ' payment review visibility is scoped');
    $check(!$detail['dispatch_allowed'], $role . ' cannot dispatch an unpaid order');
}
wp_set_current_user($ids['customer']);
$check(!Aster_Operations::allowed('aster_orders_read'), 'Customer cannot enter staff workbench');
wp_set_current_user(0);
$check(!Aster_Operations::allowed('aster_orders_read'), 'Guest cannot enter staff workbench');
$order->set_status('processing'); $order->set_transaction_id('TEST_ONLY_NOT_PROVIDER_EVIDENCE'); $order->set_date_paid(time()); // Memory only, never saved.
$check(!Aster_Operations::summary($order)['dispatch_allowed'], 'A paid-looking Woo object cannot bypass provider reconciliation gate');
WP_CLI::success($checks . ' operations permission checks passed. No paid status persisted.');
