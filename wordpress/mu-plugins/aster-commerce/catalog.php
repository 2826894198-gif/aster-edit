<?php
defined('ABSPATH') || exit;

final class Aster_Catalog {
    public static function sku(string $key): string {
        return 'ASTER-' . strtoupper(substr(hash('sha256', $key), 0, 24));
    }

    public static function validate(array $manifest): array {
        if (($manifest['schema_version'] ?? null) !== 1 || empty($manifest['products']) || !is_array($manifest['products'])) throw new InvalidArgumentException('Invalid catalog schema.');
        $seen = [];
        foreach ($manifest['products'] as $row) {
            $key = $row['catalog_key'] ?? '';
            if (!is_string($key) || !preg_match('/^[a-z0-9-]+:[a-z0-9-]+$/D', $key) || isset($seen[$key])) throw new InvalidArgumentException('Invalid or duplicate catalog key.');
            $seen[$key] = true;
            foreach (['name', 'series', 'source_specification', 'purchase_url', 'source_archive', 'source_archive_sha256', 'evidence'] as $field) {
                if (empty($row[$field]) || !is_string($row[$field])) throw new InvalidArgumentException('Missing source field: ' . $field);
            }
            if (wp_parse_url($row['purchase_url'], PHP_URL_SCHEME) !== 'https' || !in_array(wp_parse_url($row['purchase_url'], PHP_URL_HOST), ['item.taobao.com', 'detail.tmall.com', 'e.tb.cn'], true)) throw new InvalidArgumentException('Unsupported purchase source.');
            if (empty($row['source_images']) || !is_array($row['source_images'])) throw new InvalidArgumentException('Source images required.');
            $commercial = $row['commercial'] ?? [];
            if ($commercial !== ['price' => null, 'currency' => null, 'stock_quantity' => null, 'approved' => false]) throw new InvalidArgumentException('This importer accepts unpriced drafts only.');
        }
        return $manifest['products'];
    }

    public static function import(array $manifest, bool $apply = false): array {
        global $wpdb;
        $rows = self::validate($manifest);
        $lock = 'aster_catalog_' . substr(hash('sha256', $wpdb->prefix), 0, 24);
        if ((int) $wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 5)', $lock)) !== 1) throw new RuntimeException('Another catalog import is running.');
        try {
            $plan = [];
            // Validate every existing target before making any change.
            foreach ($rows as $row) {
                $sku = self::sku($row['catalog_key']);
                $id = wc_get_product_id_by_sku($sku);
                $matches = wc_get_products(['limit' => -1, 'status' => ['draft', 'publish', 'private', 'pending', 'trash'], 'meta_key' => '_aster_catalog_key', 'meta_value' => $row['catalog_key']]);
                if (count($matches) > 1 || ($matches && $matches[0]->get_id() !== $id)) throw new RuntimeException('Catalog key/SKU mapping conflict.');
                $product = $id ? wc_get_product($id) : null;
                $commercial_reviewed = $product && $product->get_meta('_aster_catalog_state') === 'commercial-policy-review-pending';
                if ($product && ($product->get_meta('_aster_catalog_key') !== $row['catalog_key'] || $product->get_status() !== 'draft' || $product->get_meta('_aster_commerce_approved') === 'yes' || (!$commercial_reviewed && $product->get_price() !== ''))) throw new RuntimeException('Refusing to overwrite existing commercial state.');
                $plan[] = [$row, $product, $sku, $commercial_reviewed];
            }
            $result = [];
            foreach ($plan as [$row, $product, $sku, $commercial_reviewed]) {
                $created = !$product;
                if ($apply) {
                    $product = $product ?: new WC_Product_Simple();
                    // Source refresh must retain the separately reviewed storefront label.
                    $product->set_name($product->get_meta('_aster_customer_name') ?: $row['name']);
                    $product->set_sku($sku);
                    $product->set_status('draft');
                    $product->set_catalog_visibility('hidden');
                    if (!$commercial_reviewed) {
                        $product->set_regular_price('');
                        $product->set_sale_price('');
                        $product->set_price('');
                        $product->set_manage_stock(false);
                        $product->set_stock_quantity(null);
                        $product->set_stock_status('outofstock');
                        $product->update_meta_data('_aster_catalog_state', 'pricing-and-commercial-review-pending');
                    }
                    $product->set_backorders('no');
                    $product->update_meta_data('_aster_catalog_key', $row['catalog_key']);
                    $product->update_meta_data('_aster_commerce_approved', 'no');
                    $product->update_meta_data('_aster_source_record', $row);
                    $product->save();
                }
                $result[] = ['catalog_key' => $row['catalog_key'], 'sku' => $sku, 'product_id' => $product ? $product->get_id() : null, 'action' => $created ? 'create-draft' : 'refresh-draft'];
            }
            return $result;
        } finally {
            $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $lock));
        }
    }
}
