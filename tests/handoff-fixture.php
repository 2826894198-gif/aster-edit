<?php
if (wp_get_environment_type() !== 'local' || !defined('WP_CLI') || !WP_CLI) throw new RuntimeException('Local CLI only.');
global $wpdb;
$mode = $args[0] ?? '';
if ($mode === 'stats') {
    echo wp_json_encode(['orders' => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}wc_orders"), 'fixture_stock' => wc_get_product(wc_get_product_id_by_sku('ASTER-TEST-ONLY-001'))->get_stock_quantity()]);
} elseif ($mode === 'reset-rate') {
    $ip = $args[1] ?? '';
    if (!filter_var($ip, FILTER_VALIDATE_IP) || filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) throw new RuntimeException('Private local bridge IP only.');
    $removed = 0;
    foreach (['handoff-create:', 'handoff-exchange:'] as $scope) $removed += $wpdb->delete(Aster_Order_Access::table('access_rates'), ['bucket_hash' => hash_hmac('sha256', $scope . $ip, wp_salt('nonce'))]);
    echo wp_json_encode(['local_counters_reset' => $removed]);
} elseif ($mode === 'price') {
    $p = wc_get_product(wc_get_product_id_by_sku('ASTER-TEST-ONLY-001'));
    if (!$p || !str_starts_with($p->get_name(), 'TEST ONLY')) throw new RuntimeException('Not a fixture.');
    $old = $p->get_regular_price();
    if (!is_numeric($args[1] ?? null)) throw new RuntimeException('Numeric fixture price required.');
    $p->set_regular_price($args[1]); $p->set_price($args[1]); $p->save();
    echo wp_json_encode(['previous' => $old]);
} elseif ($mode === 'expire') {
    if (!preg_match('/^[a-f0-9]{64}$/D', $args[1] ?? '')) throw new RuntimeException('Invalid test link.');
    $wpdb->update(Aster_Checkout_Handoff::table(), ['expires_at' => time() - 1], ['token_hash' => Aster_Checkout_Handoff::digest($args[1])]);
    echo wp_json_encode(['expired' => true]);
} else throw new RuntimeException('Unknown fixture mode.');
