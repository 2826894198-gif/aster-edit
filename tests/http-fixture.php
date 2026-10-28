<?php
if (!defined('WP_CLI') || !WP_CLI || !defined('ASTER_COMMERCE_ENV') || ASTER_COMMERCE_ENV !== 'local') throw new RuntimeException('Local fixtures only.');
$orders = wc_get_orders(['limit' => 1, 'meta_key' => '_aster_fixture', 'meta_value' => 'guest-access-v1']);
if (!$orders) WP_CLI::error('Run commerce.php first.');
$order = $orders[0];
$mode = $args[0] ?? 'info';
if ($mode === 'catalog-ids') {
    $manifest=json_decode(file_get_contents('/workspace/catalog/launch-drafts.v1.json'),true);
    WP_CLI::log(wp_json_encode(array_map(static fn($row) => wc_get_product_id_by_sku(Aster_Catalog::sku($row['catalog_key'])), $manifest['products'])));
} elseif ($mode === 'drain') {
    $ids = as_get_scheduled_actions(['hook' => 'aster_deliver_order_access', 'group' => 'aster-order-access', 'status' => 'pending', 'per_page' => 100], 'ids');
    // Use the real Action Scheduler runner so completion/failure is recorded.
    ActionScheduler_QueueRunner::instance()->run('aster-local-http-test');
    WP_CLI::log(wp_json_encode(['queued_before' => count($ids)]));
} elseif ($mode === 'reset') {
    global $wpdb;
    // This entire database is the loopback-only synthetic test environment.
    $wpdb->query('DELETE FROM ' . Aster_Order_Access::table('access_rates'));
    $wpdb->delete(Aster_Order_Access::table('access_tokens'), ['email_hash' => Aster_Order_Access::email_hash('guest-access@aster.test')]);
    WP_CLI::log(wp_json_encode(['order_number' => (string) $order->get_id(), 'email' => 'guest-access@aster.test']));
} else {
    WP_CLI::log(wp_json_encode(['order_number' => (string) $order->get_id(), 'email' => 'guest-access@aster.test']));
}
