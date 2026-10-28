<?php
// Exercise the user's unrestricted-destination rule in local fixtures only.
if (!defined('WP_CLI') || !WP_CLI || !defined('ASTER_COMMERCE_ENV') || ASTER_COMMERCE_ENV !== 'local') {
    throw new RuntimeException('Local WP-CLI only.');
}
if (!class_exists('WooCommerce') || get_woocommerce_currency() !== 'USD') {
    throw new RuntimeException('WooCommerce USD fixture required.');
}

$zone = null;
foreach (WC_Shipping_Zones::get_zones() as $row) {
    if ($row['zone_name'] === 'TEST ONLY — US fixture') {
        $zone = new WC_Shipping_Zone($row['zone_id']);
        break;
    }
}
if (!$zone) throw new RuntimeException('Expected local US fixture zone was not found.');
update_option('woocommerce_allowed_countries', 'all');
update_option('woocommerce_ship_to_countries', 'all');
foreach ([$zone, new WC_Shipping_Zone(0)] as $destination_zone) {
    $flat = null;
    $free = null;
    foreach ($destination_zone->get_shipping_methods(true) as $method) {
        if ($method->id === 'flat_rate') $flat = $method;
        if ($method->id === 'free_shipping') $free = $method;
    }
    if (!$flat) $flat = $destination_zone->add_shipping_method('flat_rate');
    if (!$free) $free = $destination_zone->add_shipping_method('free_shipping');
    $flat_id = is_object($flat) ? $flat->get_instance_id() : (int) $flat;
    $free_id = is_object($free) ? $free->get_instance_id() : (int) $free;
    update_option('woocommerce_flat_rate_' . $flat_id . '_settings', [
        'title' => 'International shipping', 'tax_status' => 'none', 'cost' => '30.00',
    ]);
    update_option('woocommerce_free_shipping_' . $free_id . '_settings', [
        'title' => 'Free international shipping', 'requires' => 'min_amount',
        'min_amount' => '150.00', 'ignore_discounts' => 'no',
    ]);
}
update_option('aster_shipping_policy_enabled', 'yes');
WP_CLI::success('Local worldwide fixture: $30 below $150; free at $150. No public country or tax configuration changed.');
