<?php
if (!defined('WP_CLI') || !WP_CLI || !defined('ASTER_COMMERCE_ENV') || ASTER_COMMERCE_ENV !== 'local') throw new RuntimeException('Local tests only.');
$checks = 0;
$check = static function ($ok, $label) use (&$checks) {
    if (!$ok) WP_CLI::error($label);
    $checks++;
    WP_CLI::log('PASS ' . $label);
};
$check(Aster_Shipping_Policy::enabled(), 'USD local shipping policy enabled');
$check(get_option('woocommerce_allowed_countries') === 'all' && get_option('woocommerce_ship_to_countries') === 'all', 'Local destination restriction removed');
$zone = null;
foreach (WC_Shipping_Zones::get_zones() as $row) {
    if ($row['zone_name'] === 'TEST ONLY — US fixture') $zone = new WC_Shipping_Zone($row['zone_id']);
}
$check($zone instanceof WC_Shipping_Zone, 'Existing US test zone retained');
WC()->cart = new WC_Cart();
foreach (['US' => $zone, 'DE' => new WC_Shipping_Zone(0)] as $country => $destination_zone) {
    $methods = $destination_zone->get_shipping_methods(true);
    $flat = $free = null;
    foreach ($methods as $method) {
        if ($method->id === 'flat_rate') $flat = $method;
        if ($method->id === 'free_shipping') $free = $method;
    }
    $check($flat && $free, $country . ' fixture has flat and free methods');
    foreach ([[149.99, 'flat_rate', 30.0], [150.0, 'free_shipping', 0.0], [229.0, 'free_shipping', 0.0]] as [$subtotal, $expected_method, $expected_cost]) {
        WC()->cart->set_cart_contents_total((float) $subtotal);
        $package = ['destination' => ['country' => $country]];
        $available = array_filter([$flat, $free], static fn($method) => $method->is_available($package));
        $rates = [];
        foreach ($available as $method) {
            $rates[$method->id] = new WC_Shipping_Rate($method->id, $method->title, $method->id === 'flat_rate' ? 2 : 0, [], $method->id, $method->get_instance_id());
        }
        $selected = Aster_Shipping_Policy::one_rate($rates, $package);
        $rate = reset($selected);
        $check(count($selected) === 1 && $rate->method_id === $expected_method && (float) $rate->get_cost() === $expected_cost, $country . ' $' . $subtotal . ' selects only ' . $expected_method . ' at $' . $expected_cost);
    }
}
WP_CLI::success($checks . ' shipping policy checks passed. No order or payment created.');
