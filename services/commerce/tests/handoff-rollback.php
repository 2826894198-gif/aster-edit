<?php
if (wp_get_environment_type() !== 'local' || !defined('WP_CLI') || !WP_CLI) throw new RuntimeException('Local CLI only.');
// A fresh CLI guest cart, never a browser/user cart.
wc_load_cart();
if (!WC()->cart->is_empty() || get_current_user_id()) throw new RuntimeException('Expected isolated guest cart.');
$id = wc_get_product_id_by_sku('ASTER-TEST-ONLY-001');
$calls = 0;
$reject_second = function ($valid) use (&$calls) { return ++$calls === 2 ? false : $valid; };
add_filter('woocommerce_add_to_cart_validation', $reject_second);
$result = Aster_Checkout_Handoff::add_selection([['product_id' => $id, 'quantity' => 1], ['product_id' => $id, 'quantity' => 1]]);
remove_filter('woocommerce_add_to_cart_validation', $reject_second);
if ($result || $calls !== 2 || !WC()->cart->is_empty() || WC()->cart->get_removed_cart_contents()) throw new RuntimeException('Failed batch left cart lines behind.');
if (WC()->session->get('cart', [])) throw new RuntimeException('Failed batch was persisted.');
$throw_after_insert = static function () { throw new RuntimeException('TEST ONLY simulated extension failure.'); };
add_action('woocommerce_add_to_cart', $throw_after_insert, 9999);
$result = Aster_Checkout_Handoff::add_selection([['product_id' => $id, 'quantity' => 1]]);
remove_action('woocommerce_add_to_cart', $throw_after_insert, 9999);
if ($result || !WC()->cart->is_empty() || WC()->session->get('cart', []) || WC()->cart->get_removed_cart_contents()) throw new RuntimeException('Post-insert hook failure left cart state behind.');
WP_CLI::success('Rejected second add rolls back the first line and leaves no recoverable partial cart. No order or payment created.');
WP_CLI::success('Post-insert extension exception also rolls back cart state.');
