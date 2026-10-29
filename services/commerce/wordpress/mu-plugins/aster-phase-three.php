<?php
/** Plugin Name: Aster local SEO and currency preview */
defined('ABSPATH') || exit;
function aster_phase_three_enabled(): bool {
    return wp_get_environment_type()==='local' && get_option('aster_phase_three_preview')==='yes'
        && function_exists('aster_phase_two_enabled') && aster_phase_two_enabled();
}
require_once __DIR__.'/aster-phase-three/Discovery.php';
require_once __DIR__.'/aster-phase-three/Journey.php';
add_action('plugins_loaded',static function () {
    if (aster_phase_three_enabled() && class_exists('WooCommerce')) { Aster_Discovery::register();Aster_Journey::register(); }
},80);
