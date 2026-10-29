<?php
/** Plugin Name: Aster local account, email and review preview */
defined('ABSPATH') || exit;
function aster_phase_two_enabled(): bool {
    return wp_get_environment_type() === 'local' && get_option('aster_phase_two_preview') === 'yes'
        && function_exists('aster_phase_one_enabled') && aster_phase_one_enabled();
}
require_once __DIR__.'/aster-phase-two/Care.php';
require_once __DIR__.'/aster-phase-two/Alerts.php';
require_once __DIR__.'/aster-phase-two/Reviews.php';
require_once __DIR__.'/aster-phase-two/Photos.php';
add_action('plugins_loaded', static function () {
    if (!aster_phase_two_enabled() || !class_exists('WooCommerce')) return;
    Aster_Care::register();
    Aster_Merchant_Alerts::register();
    Aster_Purchase_Reviews::register();
    Aster_Review_Photos::register_hooks();
}, 70);
