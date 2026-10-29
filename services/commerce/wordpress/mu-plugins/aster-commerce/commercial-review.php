<?php
defined('ABSPATH') || exit;

final class Aster_Commercial_Review {
    public static function validate(array $source, array $review): array {
        if (($review['schema_version'] ?? null) !== 1 || ($review['environment'] ?? null) !== 'local-test-only' || ($review['currency'] ?? null) !== 'USD') {
            throw new InvalidArgumentException('Invalid commercial review header.');
        }
        $source_rows = Aster_Catalog::validate($source);
        $source_keys = array_column($source_rows, 'catalog_key');
        $items = $review['items'] ?? null;
        if (!is_array($items) || count($items) !== count($source_keys) || array_diff($source_keys, array_keys($items)) || array_diff(array_keys($items), $source_keys)) {
            throw new InvalidArgumentException('Commercial review must cover the exact source catalog.');
        }
        $counts = ['available' => 0, 'out-of-stock' => 0, 'gift-only' => 0];
        foreach ($items as $key => $item) {
            $availability = $item['availability'] ?? '';
            if (!isset($counts[$availability]) || ($item['approved'] ?? null) !== false) {
                throw new InvalidArgumentException('Invalid review state: ' . $key);
            }
            $price = $item['price'] ?? null;
            if (($availability === 'gift-only' && $price !== null) || ($availability !== 'gift-only' && (!is_int($price) || $price <= 0))) {
                throw new InvalidArgumentException('Invalid review price: ' . $key);
            }
            $counts[$availability]++;
        }
        if ($counts !== ['available' => 34, 'out-of-stock' => 2, 'gift-only' => 2]) {
            throw new InvalidArgumentException('Unexpected commercial review totals.');
        }
        $shipping = $review['shipping'] ?? [];
        if (($shipping['free_shipping_threshold'] ?? null) !== 150 || ($shipping['international_shipping_below_threshold'] ?? null) !== 30 || ($shipping['enforcement'] ?? null) !== 'pending-policy-review') {
            throw new InvalidArgumentException('Shipping review does not match the approved display policy.');
        }
        $sets = $review['set_offers'] ?? null;
        if (!is_array($sets) || count($sets) !== 4) throw new InvalidArgumentException('Four set offers are required.');
        foreach ($sets as $key => $set) {
            if (!is_string($key) || !preg_match('/^[a-z0-9-]+:full-set$/D', $key) || !is_array($set)) throw new InvalidArgumentException('Invalid set key.');
            if (!is_string($set['name'] ?? null) || $set['name'] === '' || !is_int($set['price'] ?? null) || $set['price'] <= 0 || !in_array($set['availability'] ?? null, ['available', 'out-of-stock'], true) || ($set['includes_gift'] ?? null) !== true || ($set['approved'] ?? null) !== false) {
                throw new InvalidArgumentException('Invalid set offer: ' . $key);
            }
            $components = $set['components'] ?? null;
            if (!is_array($components) || !$components) throw new InvalidArgumentException('Set components are required: ' . $key);
            $prefix = substr($key, 0, -strlen('full-set'));
            foreach ($components as $component_key => $quantity) {
                if (!isset($items[$component_key]) || !str_starts_with($component_key, $prefix) || $quantity !== 1 || $items[$component_key]['availability'] === 'gift-only') {
                    throw new InvalidArgumentException('Invalid set component: ' . $key);
                }
            }
            $expected_components = array_values(array_filter(array_keys($items), static fn($item_key) => str_starts_with($item_key, $prefix) && $items[$item_key]['availability'] !== 'gift-only'));
            $actual_components = array_keys($components);
            sort($expected_components); sort($actual_components);
            if ($actual_components !== $expected_components) throw new InvalidArgumentException('Set must contain every non-gift form exactly once: ' . $key);
            $has_unavailable_component = (bool) array_filter(array_keys($components), static fn($component_key) => $items[$component_key]['availability'] !== 'available');
            if (($set['availability'] === 'available') === $has_unavailable_component) throw new InvalidArgumentException('Set availability does not match its components: ' . $key);
        }
        return ['items' => $items, 'sets' => $sets, 'counts' => $counts];
    }

    public static function apply(array $source, array $review, bool $apply = false): array {
        global $wpdb;
        $validated = self::validate($source, $review);
        $source_rows = Aster_Catalog::validate($source);
        $source_by_key = [];
        foreach ($source_rows as $source_row) $source_by_key[$source_row['catalog_key']] = $source_row;
        $lock = 'aster_commercial_' . substr(hash('sha256', $wpdb->prefix), 0, 20);
        if ((int) $wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 5)', $lock)) !== 1) {
            throw new RuntimeException('Another commercial review sync is running.');
        }
        try {
            $plan = [];
            foreach ($validated['items'] as $key => $item) {
                $id = wc_get_product_id_by_sku(Aster_Catalog::sku($key));
                $product = $id ? wc_get_product($id) : null;
                if (!$product || $product->get_meta('_aster_catalog_key') !== $key) {
                    throw new RuntimeException('Missing catalog product: ' . $key);
                }
                if ($product->get_status() !== 'draft' || $product->get_meta('_aster_commerce_approved') === 'yes') {
                    throw new RuntimeException('Refusing to overwrite approved or published state: ' . $key);
                }
                $plan[] = [$product, $key, $item];
            }
            $set_plan = [];
            foreach ($validated['sets'] as $key => $set) {
                $id = wc_get_product_id_by_sku(Aster_Catalog::sku($key));
                $product = $id ? wc_get_product($id) : null;
                if ($product && ($product->get_meta('_aster_catalog_key') !== $key || $product->get_meta('_aster_bundle_contract') !== 'v1' || $product->get_status() !== 'draft' || $product->get_meta('_aster_commerce_approved') === 'yes')) {
                    throw new RuntimeException('Refusing to overwrite conflicting set state: ' . $key);
                }
                $component_rows = [];
                foreach ($set['components'] as $component_key => $quantity) {
                    $component_source = $source_by_key[$component_key];
                    $component_rows[] = ['catalog_key' => $component_key, 'quantity' => $quantity, 'name' => $component_source['name']];
                }
                $set_plan[] = [$product, $key, $set, $component_rows];
            }
            if ($apply) {
                $wpdb->query('START TRANSACTION');
                try {
                    update_option('woocommerce_currency', 'USD');
                    foreach ($plan as [$product, $key, $item]) {
                        $price = $item['price'] === null ? '' : wc_format_decimal($item['price'], 2);
                        $product->set_regular_price($price);
                        $product->set_sale_price('');
                        $product->set_price($price);
                        $product->set_status('draft');
                        $product->set_catalog_visibility('hidden');
                        if ($item['availability'] === 'available') {
                            $product->set_manage_stock(false);
                            $product->set_stock_quantity(null);
                            $product->set_stock_status('instock');
                        } else {
                            $product->set_manage_stock(false);
                            $product->set_stock_quantity(null);
                            $product->set_stock_status('outofstock');
                        }
                        $product->set_backorders('no');
                        $product->update_meta_data('_aster_commerce_approved', 'no');
                        $product->update_meta_data('_aster_catalog_state', 'commercial-policy-review-pending');
                        $product->update_meta_data('_aster_display_price_reviewed', $price === '' ? 'gift-only' : 'yes');
                        $product->update_meta_data('_aster_display_availability', $item['availability']);
                        $product->update_meta_data('_aster_commercial_reviewed_on', $review['reviewed_on']);
                        $product->save();
                    }
                    foreach ($set_plan as [$product, $key, $set, $component_rows]) {
                        $product = $product ?: new WC_Product_Simple();
                        $price = wc_format_decimal($set['price'], 2);
                        $product->set_name($product->get_meta('_aster_customer_name') ?: $set['name']);
                        $product->set_sku(Aster_Catalog::sku($key));
                        $product->set_regular_price($price);
                        $product->set_sale_price('');
                        $product->set_price($price);
                        $product->set_status('draft');
                        $product->set_catalog_visibility('hidden');
                        if ($set['availability'] === 'available') {
                            $product->set_manage_stock(false);
                            $product->set_stock_quantity(null);
                            $product->set_stock_status('instock');
                        } else {
                            $product->set_manage_stock(false);
                            $product->set_stock_quantity(null);
                            $product->set_stock_status('outofstock');
                        }
                        $product->set_backorders('no');
                        $product->update_meta_data('_aster_catalog_key', $key);
                        $product->update_meta_data('_aster_bundle_contract', 'v1');
                        $product->update_meta_data('_aster_bundle_components', $component_rows);
                        $product->update_meta_data('_aster_includes_complimentary_gift', 'yes');
                        $product->update_meta_data('_aster_commerce_approved', 'no');
                        $product->update_meta_data('_aster_catalog_state', 'commercial-policy-review-pending');
                        $product->update_meta_data('_aster_display_price_reviewed', 'yes');
                        $product->update_meta_data('_aster_display_availability', $set['availability']);
                        $product->update_meta_data('_aster_commercial_reviewed_on', $review['reviewed_on']);
                        $product->save();
                    }
                    update_option('aster_display_shipping_review', [
                        'currency' => 'USD',
                        'free_shipping_threshold' => 150,
                        'international_shipping_below_threshold' => 30,
                        'enforcement' => 'pending-policy-review',
                    ], false);
                    $wpdb->query('COMMIT');
                } catch (Throwable $e) {
                    $wpdb->query('ROLLBACK');
                    throw $e;
                }
            }
            return [
                'products' => count($plan),
                'counts' => $validated['counts'],
                'currency' => 'USD',
                'shipping_enforced' => false,
                'sets_mapped' => count($set_plan),
                'sale_gate_open' => false,
                'mode' => $apply ? 'applied' : 'dry-run',
            ];
        } finally {
            $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $lock));
        }
    }
}
