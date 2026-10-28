<?php
defined('ABSPATH') || exit;

/** A set stays one customer-facing line while its exact components remain machine-readable. */
final class Aster_Bundle_Contract {
    public static function is_bundle(WC_Product $product): bool {
        return $product->get_meta('_aster_bundle_contract') === 'v1';
    }

    public static function components(WC_Product $product): array {
        if (!self::is_bundle($product)) return [];
        $components = $product->get_meta('_aster_bundle_components');
        if (!is_array($components) || !$components) return [];
        foreach ($components as $component) {
            if (!is_array($component) || !is_string($component['catalog_key'] ?? null) || !is_int($component['quantity'] ?? null) || $component['quantity'] < 1 || !is_string($component['name'] ?? null)) return [];
        }
        return $components;
    }

    public static function validate(WC_Product $bundle, int $bundle_quantity = 1): bool {
        $components = self::components($bundle);
        if (!$components || $bundle_quantity < 1) return false;
        return self::validate_selection([['product_id' => $bundle->get_id(), 'quantity' => $bundle_quantity]]);
    }

    public static function validate_selection(array $lines): bool {
        $component_keys = [];
        $contains_bundle = false;
        foreach ($lines as $line) {
            $product = wc_get_product((int) ($line['product_id'] ?? 0));
            $quantity = $line['quantity'] ?? null;
            if (!$product || !is_int($quantity) || $quantity < 1) return false;
            if (self::is_bundle($product)) {
                $contains_bundle = true;
                $components = self::components($product);
                if (!$components || $product->get_meta('_aster_commerce_approved') !== 'yes' || $product->get_status() !== 'publish' || !$product->is_in_stock() || $product->backorders_allowed()) return false;
                foreach ($components as $component) $component_keys[$component['catalog_key']] = true;
            }
        }
        if (!$contains_bundle) return true;
        foreach (array_keys($component_keys) as $key) {
            $id = wc_get_product_id_by_sku(Aster_Catalog::sku($key));
            $product = $id ? wc_get_product($id) : null;
            if (!$product || $product->get_meta('_aster_catalog_key') !== $key || $product->get_meta('_aster_commerce_approved') !== 'yes' || $product->get_status() !== 'publish' || !$product->is_purchasable() || !$product->is_in_stock() || $product->backorders_allowed()) return false;
        }
        return true;
    }

    public static function cart_data(WC_Product $product): array {
        $components = self::components($product);
        return $components ? ['aster_bundle_contract' => 'v1', 'aster_bundle_components' => $components] : [];
    }

    public static function purchasable(bool $purchasable, WC_Product $product): bool {
        return $purchasable && (!self::is_bundle($product) || self::validate($product, 1));
    }

    public static function add_to_cart(bool $passed, int $product_id, int $quantity): bool {
        if (!$passed) return false;
        $product = wc_get_product($product_id);
        if (!$product instanceof WC_Product) return false;
        $lines = [['product_id' => $product_id, 'quantity' => $quantity]];
        if (function_exists('WC') && WC()->cart) {
            foreach (WC()->cart->get_cart() as $line) {
                $existing = $line['data'] ?? null;
                if ($existing instanceof WC_Product) $lines[] = ['product_id' => $existing->get_id(), 'quantity' => (int) ($line['quantity'] ?? 0)];
            }
        }
        if (self::validate_selection($lines)) return true;
        wc_add_notice('A selected full set is out of stock.', 'error');
        return false;
    }

    public static function validate_cart(): void {
        if (!function_exists('WC') || !WC()->cart) return;
        $lines = [];
        foreach (WC()->cart->get_cart() as $line) {
            $product = $line['data'] ?? null;
            if ($product instanceof WC_Product) $lines[] = ['product_id' => $product->get_id(), 'quantity' => (int) ($line['quantity'] ?? 0)];
        }
        if ($lines && !self::validate_selection($lines)) wc_add_notice('A full set is now out of stock. Please return to your bag.', 'error');
    }

    public static function order_meta(WC_Order_Item_Product $item, string $cart_item_key, array $values): void {
        if (($values['aster_bundle_contract'] ?? '') !== 'v1' || !is_array($values['aster_bundle_components'] ?? null)) return;
        $components = $values['aster_bundle_components'];
        if (!$components || $item->get_quantity() < 1) return;
        $fulfilled_components = [];
        foreach ($components as $component) {
            if (!is_string($component['catalog_key'] ?? null) || !is_int($component['quantity'] ?? null) || $component['quantity'] < 1 || !is_string($component['name'] ?? null)) return;
            $fulfilled_components[] = [
                'catalog_key' => $component['catalog_key'],
                'quantity_per_set' => $component['quantity'],
                'total_quantity' => $component['quantity'] * $item->get_quantity(),
                'name' => $component['name'],
            ];
        }
        $item->add_meta_data('_aster_bundle_contract', 'v1', true);
        $item->add_meta_data('_aster_bundle_components', wp_json_encode($fulfilled_components), true);
        $summary = implode(', ', array_map(static fn($component) => $component['total_quantity'] . ' × ' . $component['name'], $fulfilled_components));
        $item->add_meta_data('Set contents', $summary, true);
    }
}

add_action('woocommerce_check_cart_items', [Aster_Bundle_Contract::class, 'validate_cart']);
add_filter('woocommerce_is_purchasable', [Aster_Bundle_Contract::class, 'purchasable'], 30, 2);
add_filter('woocommerce_add_to_cart_validation', [Aster_Bundle_Contract::class, 'add_to_cart'], 20, 3);
add_action('woocommerce_checkout_create_order_line_item', [Aster_Bundle_Contract::class, 'order_meta'], 10, 3);
