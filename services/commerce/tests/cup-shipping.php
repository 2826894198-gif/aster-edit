<?php
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local') throw new RuntimeException('Local tests only.');
$cups = [];
foreach (['purple-grey', 'olive', 'deep-green'] as $colour) {
    $key = 'rolling-bead-cup:' . $colour;
    $product = wc_get_product(wc_get_product_id_by_sku(Aster_Catalog::sku($key)));
    if (!$product || !$product->is_purchasable() || !$product->is_in_stock() || (float)$product->get_price() !== 68.0) throw new RuntimeException('Cup not configured: ' . $key);
    $cups[] = $product;
    $resolved = Aster_Checkout_Handoff::resolve([['catalog_key' => $key, 'quantity' => 2]]);
    if (is_wp_error($resolved) || $resolved[0]['product_id'] !== $product->get_id() || (float)$resolved[0]['unit_price'] !== 68.0) throw new RuntimeException('Cup handoff mismatch.');
    if (!str_ends_with((string)aster_storefront_product_image($key), '/' . $colour . '-white-v1.png')) throw new RuntimeException('Wrong colour image.');
}
$plate = wc_get_product(wc_get_product_id_by_sku(Aster_Catalog::sku('fangju-yellow-petal:05')));
if (!$plate) throw new RuntimeException('Existing tableware required.');
WC()->cart = new WC_Cart();
$cases = [[68, [$cups[0]], 0], [136, [$cups[1]], 0], [68, [$cups[2]], 0], [204, $cups, 0], [39, [$plate], 30], [107, [$cups[0], $plate], 30], [149.99, [$cups[0], $plate], 30], [150, [$cups[0], $plate], 0], [175, [$cups[0], $plate], 0]];
foreach ($cases as [$subtotal, $products, $cost]) {
    WC()->cart->set_cart_contents_total((float)$subtotal);
    $package = ['contents' => array_map(static fn($p) => ['data' => $p, 'quantity' => 1], $products)];
    $rates = ['flat' => new WC_Shipping_Rate('flat_rate:1', 'International shipping', 30, [], 'flat_rate', 1), 'free' => new WC_Shipping_Rate('free_shipping:2', 'Free shipping', 0, [], 'free_shipping', 2)];
    $selected = Aster_Shipping_Policy::one_rate($rates, $package);
    $rate = reset($selected);
    if (count($selected) !== 1 || (float)$rate->get_cost() !== (float)$cost || Aster_Shipping_Policy::free_available(false, $package, null) !== ($cost === 0)) throw new RuntimeException('Shipping mismatch at subtotal ' . $subtotal);
}
WP_CLI::success('Three cup mappings/images and nine cup/mixed/tableware shipping cases passed. No order or payment created.');
