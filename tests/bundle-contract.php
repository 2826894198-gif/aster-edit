<?php
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local') throw new RuntimeException('Local CLI only.');

$checks = 0;
$check = function (bool $ok, string $label) use (&$checks): void {
    if (!$ok) throw new RuntimeException($label);
    $checks++;
    WP_CLI::log('PASS ' . $label);
};
$prefix = 'test-only-bundle-' . bin2hex(random_bytes(4));
$keys = [$prefix . ':01', $prefix . ':02', $prefix . ':full-set'];
$created = [];
try {
    foreach ($keys as $index => $key) {
        $product = new WC_Product_Simple();
        $product->set_name('TEST ONLY Bundle ' . $index);
        $product->set_sku(Aster_Catalog::sku($key));
        $product->set_status('publish');
        $product->set_catalog_visibility('hidden');
        $product->set_regular_price($index === 2 ? '15' : '10');
        $product->set_price($index === 2 ? '15' : '10');
        $product->set_manage_stock(false);
        $product->set_stock_quantity(null);
        $product->set_stock_status('instock');
        $product->set_backorders('no');
        $product->update_meta_data('_aster_catalog_key', $key);
        $product->update_meta_data('_aster_commerce_approved', 'yes');
        if ($index === 2) {
            $product->update_meta_data('_aster_bundle_contract', 'v1');
            $product->update_meta_data('_aster_bundle_components', [
                ['catalog_key' => $keys[0], 'quantity' => 1, 'name' => 'TEST ONLY Bowl'],
                ['catalog_key' => $keys[1], 'quantity' => 1, 'name' => 'TEST ONLY Plate'],
            ]);
        }
        $created[] = $product->save();
    }
    $bundle = wc_get_product($created[2]);
    $check(Aster_Bundle_Contract::validate($bundle, 20), 'An available set accepts bounded quantity without numeric stock');
    $check($bundle->is_purchasable(), 'Set is purchasable while every component is available');
    $check(Aster_Bundle_Contract::validate_selection([
        ['product_id' => $created[2], 'quantity' => 2],
        ['product_id' => $created[0], 'quantity' => 1],
    ]), 'A set and its standalone piece can coexist without numeric stock accounting');
    $component = wc_get_product($created[0]);
    $component->set_stock_status('outofstock');
    $component->save();
    $check(!Aster_Bundle_Contract::validate($bundle, 1), 'One out-of-stock component makes the set unavailable');
    $check(!$bundle->is_purchasable(), 'Set is not purchasable while a component is out of stock');
    $component->set_stock_status('instock');
    $component->save();
    $bundle->set_stock_status('outofstock');
    $bundle->save();
    $check(!Aster_Bundle_Contract::validate($bundle, 1), 'Explicit set out-of-stock state also blocks purchase');
    $bundle->set_stock_status('instock');
    $bundle->save();
    $bundle->update_meta_data('_aster_bundle_components', []);
    $bundle->save();
    $check(!Aster_Bundle_Contract::validate($bundle, 1), 'Incomplete component metadata fails closed');
    $check(!Aster_Bundle_Contract::validate_selection([['product_id' => $created[2], 'quantity' => 1]]), 'A malformed set cannot bypass aggregate validation');
    $bundle->update_meta_data('_aster_bundle_components', [
        ['catalog_key' => $keys[0], 'quantity' => 1, 'name' => 'TEST ONLY Bowl'],
        ['catalog_key' => $keys[1], 'quantity' => 1, 'name' => 'TEST ONLY Plate'],
    ]);
    $bundle->save();
    $order_line = new WC_Order_Item_Product();
    $order_line->set_quantity(2);
    Aster_Bundle_Contract::order_meta($order_line, 'test-only', Aster_Bundle_Contract::cart_data($bundle));
    $fulfilled = json_decode($order_line->get_meta('_aster_bundle_components'), true);
    $check(count($fulfilled) === 2 && $fulfilled[0]['quantity_per_set'] === 1 && $fulfilled[0]['total_quantity'] === 2 && str_contains($order_line->get_meta('Set contents'), '2 × TEST ONLY Bowl'), 'One order line records the total component count for two sets');
    WP_CLI::success($checks . ' bundle contract checks passed. No order or payment created.');
} finally {
    foreach (array_reverse($created) as $id) {
        $product = wc_get_product($id);
        if ($product && str_starts_with($product->get_name(), 'TEST ONLY Bundle ') && in_array($product->get_meta('_aster_catalog_key'), $keys, true)) $product->delete(true);
    }
}
