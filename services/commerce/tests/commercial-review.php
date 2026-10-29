<?php
if (!defined('WP_CLI') || !WP_CLI || !defined('ASTER_COMMERCE_ENV') || ASTER_COMMERCE_ENV !== 'local') throw new RuntimeException('Local tests only.');
$checks = 0;
$check = function ($ok, $name) use (&$checks) { if (!$ok) WP_CLI::error($name); $checks++; WP_CLI::log('PASS ' . $name); };
$reject = function ($callback) { try { $callback(); return false; } catch (Throwable $e) { return true; } };
$source = json_decode(file_get_contents('/workspace/catalog/launch-drafts.v1.json'), true, 512, JSON_THROW_ON_ERROR);
$review = json_decode(file_get_contents('/workspace/catalog/commercial-review.v1.json'), true, 512, JSON_THROW_ON_ERROR);

$validated = Aster_Commercial_Review::validate($source, $review);
$check(count($validated['items']) === 38, 'Commercial review covers all 38 stable catalog keys');
$check($validated['counts'] === ['available' => 34, 'out-of-stock' => 2, 'gift-only' => 2], 'Commercial review separates available, unavailable and gift-only items');
$check(count($validated['sets']) === 4, 'Four full sets have an explicit component contract');
$bad = $review; unset($bad['items']['fangju-yellow-petal:07']);
$check($reject(fn() => Aster_Commercial_Review::validate($source, $bad)), 'Incomplete commercial review fails closed');
$bad = $review; $bad['items']['suhuo-matte-ivory:01']['price'] = 1;
$check($reject(fn() => Aster_Commercial_Review::validate($source, $bad)), 'Gift-only item cannot receive a standalone price');
$bad = $review; $bad['items']['fangju-yellow-petal:01']['approved'] = true;
$check($reject(fn() => Aster_Commercial_Review::validate($source, $bad)), 'Review sync cannot open the sale gate');
$bad = $review; unset($bad['set_offers']['fangju-yellow-petal:full-set']['components']['fangju-yellow-petal:07']);
$check($reject(fn() => Aster_Commercial_Review::validate($source, $bad)), 'A full set cannot omit a non-gift series component');

$dry = Aster_Commercial_Review::apply($source, $review, false);
$check($dry['products'] === 38 && !$dry['sale_gate_open'] && !$dry['shipping_enforced'], 'Dry run plans all products without opening sale or shipping enforcement');
$applied = Aster_Commercial_Review::apply($source, $review, true);
$check($applied['mode'] === 'applied' && $applied['sets_mapped'] === 4, 'Four full sets are mapped as separate hidden Woo products');

$prices = $available = $out = $gifts = 0;
foreach ($review['items'] as $key => $item) {
    $product = wc_get_product(wc_get_product_id_by_sku(Aster_Catalog::sku($key)));
    $check($product && $product->get_status() === 'draft' && $product->get_catalog_visibility() === 'hidden' && $product->get_meta('_aster_commerce_approved') === 'no' && !$product->is_purchasable(), 'Sale gate remains closed for ' . $key);
    if ($item['availability'] === 'available') {
        $available++;
        $prices += $product->get_price() === wc_format_decimal($item['price'], 2) ? 1 : 0;
        $check($product->is_in_stock() && !$product->managing_stock() && $product->get_stock_quantity() === null && !$product->backorders_allowed(), 'Display availability synced without invented quantity for ' . $key);
    } elseif ($item['availability'] === 'out-of-stock') {
        $out++;
        $prices += $product->get_price() === wc_format_decimal($item['price'], 2) ? 1 : 0;
        $check(!$product->is_in_stock() && !$product->managing_stock() && $product->get_stock_quantity() === null, 'Explicit unavailable state synced without a numeric quantity for ' . $key);
    } else {
        $gifts++;
        $check($product->get_price() === '' && !$product->is_in_stock() && !$product->managing_stock() && $product->get_stock_quantity() === null, 'Gift remains unpriced and unavailable standalone without a numeric quantity for ' . $key);
    }
}
$check($prices === 36 && $available === 34 && $out === 2 && $gifts === 2, 'Woo contains 36 reviewed prices, 34 selectable states, 2 unavailable states and 2 gifts');
foreach ($review['set_offers'] as $key => $set) {
    $product = wc_get_product(wc_get_product_id_by_sku(Aster_Catalog::sku($key)));
    $components = $product ? Aster_Bundle_Contract::components($product) : [];
    $check($product && $product->get_status() === 'draft' && $product->get_catalog_visibility() === 'hidden' && $product->get_meta('_aster_commerce_approved') === 'no' && !$product->is_purchasable(), 'Set sale gate remains closed for ' . $key);
    $check($product->get_price() === wc_format_decimal($set['price'], 2) && count($components) === count($set['components']) && $product->get_meta('_aster_includes_complimentary_gift') === 'yes', 'Set price, gift flag and components are tracked for ' . $key);
    $check(($set['availability'] === 'available') === $product->is_in_stock(), 'Set display availability is synchronized for ' . $key);
    $check(!$product->managing_stock() && $product->get_stock_quantity() === null, 'Set uses binary availability without numeric quantity for ' . $key);
    $check(!Aster_Bundle_Contract::validate($product, 1), 'Unapproved component records keep set checkout closed for ' . $key);
    $cart_data = Aster_Bundle_Contract::cart_data($product);
    $order_line = new WC_Order_Item_Product();
    $order_line->set_quantity(1);
    Aster_Bundle_Contract::order_meta($order_line, 'test-only', $cart_data);
    $check($order_line->get_meta('_aster_bundle_contract') === 'v1' && count(json_decode($order_line->get_meta('_aster_bundle_components'), true)) === count($components) && str_contains($order_line->get_meta('Set contents'), ' × '), 'Set stays one line while fulfillment metadata retains every component for ' . $key);
}
$shipping = get_option('aster_display_shipping_review');
$check(get_woocommerce_currency() === 'USD' && $shipping['free_shipping_threshold'] === 150 && $shipping['international_shipping_below_threshold'] === 30 && $shipping['enforcement'] === 'pending-policy-review', 'USD and display shipping threshold are recorded but not enforced');
WP_CLI::success($checks . ' commercial review checks passed. No product published and no checkout opened.');
