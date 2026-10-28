<?php
if (!defined('WP_CLI') || !WP_CLI || !defined('ASTER_COMMERCE_ENV') || ASTER_COMMERCE_ENV !== 'local') throw new RuntimeException('Local tests only.');
$checks = 0;
$check = function ($ok, $name) use (&$checks) { if (!$ok) WP_CLI::error($name); $checks++; WP_CLI::log('PASS ' . $name); };
$reject = function ($callback) { try { $callback(); return false; } catch (Throwable $e) { return true; } };
$manifest = json_decode(file_get_contents('/workspace/catalog/launch-drafts.v1.json'), true, 512, JSON_THROW_ON_ERROR);
$check(count(Aster_Catalog::validate($manifest)) === 38, 'Six series / 38 archived single-piece products');
$bad = $manifest; $bad['products'][] = $bad['products'][0];
$check($reject(fn() => Aster_Catalog::validate($bad)), 'Duplicate catalog key rejected before writes');
$bad = $manifest; $bad['products'][0]['commercial']['price'] = '25.00';
$check($reject(fn() => Aster_Catalog::validate($bad)), 'Draft importer rejects supplied prices');
$first = Aster_Catalog::import($manifest, true);
$second = Aster_Catalog::import($manifest, true);
$check(array_column($first, 'product_id') === array_column($second, 'product_id'), 'Re-import retains all 38 Woo IDs');
$check(count(array_unique(array_column($first, 'product_id'))) === 38, 'No duplicate product mapping');
$safe = true;
foreach ($first as $mapping) {
    $p = wc_get_product($mapping['product_id']);
    $state = $p->get_meta('_aster_catalog_state');
    $safe = $safe && $p->get_status() === 'draft' && $p->get_catalog_visibility() === 'hidden' && !$p->is_purchasable() && !$p->backorders_allowed() && $p->get_meta('_aster_commerce_approved') === 'no' && $p->get_meta('_aster_source_record')['purchase_url'] && in_array($state, ['pricing-and-commercial-review-pending', 'commercial-policy-review-pending'], true);
    if ($state === 'pricing-and-commercial-review-pending') $safe = $safe && $p->get_price() === '' && !$p->is_in_stock() && !$p->managing_stock() && $p->get_stock_quantity() === null;
}
$check($safe, 'Source refresh preserves all 38 hidden, unapproved, non-purchasable products and provenance');
$p = wc_get_product($first[0]['product_id']);
$p->set_status('publish'); $p->set_regular_price('99.00'); $p->set_price('99.00'); // In memory only.
$check(!$p->is_purchasable(), 'Accidental price/publication cannot bypass commercial approval gate');

$orders = wc_get_orders(['limit' => 1, 'meta_key' => '_aster_fixture', 'meta_value' => 'guest-access-v1']);
if ($orders) { $order = $orders[0]; } else {
    $order = wc_create_order(['status' => 'pending', 'customer_id' => 0]);
    $order->set_billing_email('guest-access@aster.test');
    $order->set_billing_first_name('TEST ONLY');
    $order->set_billing_last_name('Guest access fixture');
    $order->set_billing_address_1('TEST ONLY — DO NOT SHIP');
    $order->add_product(wc_get_product(wc_get_product_id_by_sku('ASTER-TEST-ONLY-001')), 2);
    $order->update_meta_data('_aster_fixture', 'guest-access-v1');
    $order->calculate_totals(); $order->save();
}
$hash = Aster_Order_Access::email_hash('guest-access@aster.test');
$check($hash === Aster_Order_Access::email_hash(' GUEST-ACCESS@aster.test '), 'Email matching normalized and keyed');
$check(!Aster_Order_Access::eligible($order, Aster_Order_Access::email_hash('wrong@aster.test')), 'Wrong email cannot issue order access');
$check($reject(fn() => Aster_Order_Access::issue($order->get_id(), Aster_Order_Access::email_hash('wrong@aster.test'))), 'Wrong-email token creation fails closed');
$token = Aster_Order_Access::issue($order->get_id(), $hash);
global $wpdb;
$table = Aster_Order_Access::table('access_tokens');
$row = Aster_Order_Access::record($token, 'link');
$check($row && $row->token_hash !== $token && $row->email_hash === $hash, 'Database holds token digest, not bearer secret');
$check(Aster_Order_Access::record($token, 'session') === null, 'Email link cannot be used as a session');
$session = Aster_Order_Access::exchange($token);
$check(is_string($session) && Aster_Order_Access::record($session, 'session'), 'One-time link grants scoped read-only session');
$check(Aster_Order_Access::exchange($token) === null, 'Consumed link cannot be replayed');
$check(Aster_Order_Access::record(str_repeat('0', 64), 'session') === null, 'Invented session rejected');
$expired = Aster_Order_Access::issue($order->get_id(), $hash);
$wpdb->update($table, ['expires_at' => time() - 1], ['token_hash' => hash('sha256', $expired)]);
$check(Aster_Order_Access::exchange($expired) === null, 'Expired email link rejected');
$order->set_billing_email('changed-guest@aster.test'); $order->save();
$check(Aster_Order_Access::record($session, 'session') === null, 'Billing email change revokes existing access immediately');
$order->set_billing_email('guest-access@aster.test'); $order->save();
$wpdb->update($table, ['expires_at' => time() - 1], ['token_hash' => hash('sha256', $session)]);
$check(Aster_Order_Access::record($session, 'session') === null, 'Expired session rejected');
$rate = 'test-' . wp_generate_uuid4();
$check(Aster_Order_Access::limit($rate, 2, 60) && Aster_Order_Access::limit($rate, 2, 60) && !Aster_Order_Access::limit($rate, 2, 60), 'Rate bucket rejects excess attempts');
Aster_Order_Access::cleanup();
$check(!$wpdb->get_var($wpdb->prepare("SELECT token_hash FROM $table WHERE token_hash=%s", hash('sha256', $expired))), 'Expired credentials purged');
$erasers = apply_filters('wp_privacy_personal_data_erasers', []);
$erase = $erasers['aster-order-access']['callback'];
$erase('guest-access@aster.test');
$check(!$wpdb->get_var($wpdb->prepare("SELECT token_hash FROM $table WHERE email_hash=%s", $hash)), 'Privacy eraser revokes temporary order access');
$fresh = wc_get_order($order->get_id());
$check(!$fresh->is_paid() && $fresh->get_transaction_id() === '' && $fresh->get_customer_id() === 0, 'Guest access never marks paid or links an account');

// Exercise the installed Woo native email-verification boundary, not a second account system.
$verification = wc_get_container()->get(\Automattic\WooCommerce\Internal\CustomerEmailVerification\EmailVerificationService::class);
$existing = get_user_by('login', 'aster_account_verification_fixture');
$uid = $existing ? $existing->ID : wc_create_new_customer('account-proof@aster.test', 'aster_account_verification_fixture', wp_generate_password(40));
$check(!is_wp_error($uid), 'Native synthetic account created');
wp_update_user(['ID' => $uid, 'user_email' => 'account-proof@aster.test']);
$verification->clear_verification($uid);
$guest_orders = wc_get_orders(['limit' => 1, 'meta_key' => '_aster_fixture', 'meta_value' => 'account-verification-v1']);
$guest = $guest_orders ? $guest_orders[0] : wc_create_order(['status' => 'pending']);
$guest->set_customer_id(0); $guest->set_billing_email('account-proof@aster.test');
$guest->set_billing_first_name('TEST ONLY'); $guest->set_billing_last_name('Account verification fixture');
$guest->update_meta_data('_aster_fixture', 'account-verification-v1'); $guest->save();
wp_set_current_user($uid);
$check(!$verification->is_verified($uid) && !current_user_can('view_order', $guest->get_id()), 'Unverified account cannot claim an email-matching guest order');
$key = $verification->create_verification_key($uid);
$check($verification->check_verification_key($uid, $key) && !$verification->check_verification_key($uid, 'invented'), 'Native verification checks the emailed secret');
// Test-only service invocation: does not claim that a browser/email verification was performed.
$verification->mark_verified($uid);
$check($verification->is_verified($uid) && wc_get_order($guest->get_id())->get_customer_id() === $uid, 'Native verified-email event links historical guest order');
$check(current_user_can('view_order', $guest->get_id()), 'Verified owner can view the linked order');
$check(!$verification->check_verification_key($uid, $key), 'Native verification clears consumed key');
wp_update_user(['ID' => $uid, 'user_email' => 'changed-account-proof@aster.test']);
$check(!$verification->is_verified($uid), 'Account email change invalidates native verification');
wp_update_user(['ID' => $uid, 'user_email' => 'account-proof@aster.test']);
$verification->clear_verification($uid);
wp_set_current_user(0);
WP_CLI::success($checks . ' commerce checks passed. Guest fixture order: ' . $order->get_id() . '. No payment sent.');
