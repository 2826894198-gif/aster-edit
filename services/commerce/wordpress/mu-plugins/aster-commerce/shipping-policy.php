<?php
defined('ABSPATH') || exit;

/** USD merchandise subtotal after discounts; taxes and shipping are excluded. */
final class Aster_Shipping_Policy {
    public const FREE_THRESHOLD = 150.0;
    public const STANDARD_FEE = 30.0;

    public static function subtotal(): float {
        $cart = WC()->cart ?? null;
        return $cart ? max(0.0, (float) $cart->get_cart_contents_total()) : 0.0;
    }

    public static function cups_only(array $package): bool {
        $contents = $package['contents'] ?? [];
        if (!$contents) return false;
        $keys = ['rolling-bead-cup:purple-grey', 'rolling-bead-cup:olive', 'rolling-bead-cup:deep-green'];
        foreach ($contents as $line) {
            $product = $line['data'] ?? null;
            if (!$product instanceof WC_Product
                || !in_array($product->get_meta('_aster_catalog_key'), $keys, true)
                || $product->get_meta('_aster_free_shipping') !== 'yes') return false;
        }
        return true;
    }

    public static function is_free(array $package): bool {
        return self::cups_only($package) || self::subtotal() >= self::FREE_THRESHOLD;
    }

    public static function free_available(bool $available, array $package, $method): bool {
        if (!self::enabled()) return $available;
        return self::is_free($package);
    }

    public static function one_rate(array $rates, array $package): array {
        if (!self::enabled()) return $rates;
        if (self::is_free($package)) {
            $selected = array_filter($rates, static fn($rate) => $rate->method_id === 'free_shipping');
            foreach ($selected as $rate) { $rate->set_cost(0); $rate->set_taxes([]); }
            return $selected;
        }
        $selected = array_filter($rates, static fn($rate) => $rate->method_id === 'flat_rate');
        foreach ($selected as $rate) { $rate->set_cost(self::STANDARD_FEE); $rate->set_taxes([]); }
        return $selected;
    }

    public static function enabled(): bool {
        return get_option('aster_shipping_policy_enabled') === 'yes'
            && get_woocommerce_currency() === 'USD';
    }
}

add_filter('woocommerce_shipping_free_shipping_is_available', [Aster_Shipping_Policy::class, 'free_available'], 20, 3);
add_filter('woocommerce_shipping_flat_rate_is_available', static function ($available, $package, $method) {
    if (!Aster_Shipping_Policy::enabled()) return $available;
    return !Aster_Shipping_Policy::is_free($package);
}, 20, 3);
add_filter('woocommerce_package_rates', [Aster_Shipping_Policy::class, 'one_rate'], 20, 2);
