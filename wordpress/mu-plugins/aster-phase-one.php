<?php
/** Plugin Name: Aster phase one local preview
 * Local opt-in only. No payment writer, outbound mail or production activation.
 */
defined('ABSPATH') || exit;
function aster_phase_one_enabled(): bool {
    return wp_get_environment_type() === 'local' && get_option('aster_phase_one_preview') === 'yes' && get_option('aster_customer_care_enabled')!=='yes';
}
require_once __DIR__ . '/aster-phase-one/Orders.php';
add_action('plugins_loaded', static function () {
    if (aster_phase_one_enabled() && class_exists('WooCommerce')) Aster_Phase_One::register();
}, 60);
