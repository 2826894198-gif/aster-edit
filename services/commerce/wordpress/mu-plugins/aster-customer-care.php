<?php
/** Plugin Name: Aster customer orders and care
 * Version: 1.0.0
 * Native Woo account, order display, shipment fields, moderated purchase reviews and email presentation.
 */
defined('ABSPATH') || exit;
function aster_customer_care_mail_ready(): bool { return (bool)apply_filters('aster_customer_care_mail_ready',aster_customer_mail_ready()); }
function aster_customer_care_enabled(): bool { return get_option('aster_customer_care_enabled')==='yes'; }
foreach(['Orders','Care','Alerts','Reviews','Photos'] as $class) require_once __DIR__.'/aster-customer-care/'.$class.'.php';
add_action('plugins_loaded',static function(){
    if(!aster_customer_care_enabled() || !class_exists('WooCommerce'))return;
    Aster_Customer_Orders::register();Aster_Customer_Care::register();Aster_Customer_Alerts::register();Aster_Customer_Reviews::register();Aster_Customer_Review_Photos::register_hooks();
    add_action('wp_enqueue_scripts',static function(){
        $path=untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '',PHP_URL_PATH) ?: '');
        if(in_array($path,['/customer-care','/order-status'],true))wp_enqueue_style('aster-commerce-presentation',plugins_url('aster-commerce/commerce.css',__FILE__),[],(string)filemtime(__DIR__.'/aster-commerce/commerce.css'));
    },110);
    // Keep the authenticated-sender gate for every mail transport and recipient.
    add_filter('pre_wp_mail',static fn($result)=>aster_customer_care_mail_ready() ? $result : false,PHP_INT_MAX);
    add_filter('woocommerce_locate_template',static fn($template,$name)=>$name==='myaccount/dashboard.php' ? __DIR__.'/aster-customer-care/account-dashboard.php' : $template,70,2);
    // Review markup is deliberately absent from search data in this release.
    add_filter('woocommerce_structured_data_product',static fn($data)=>[],PHP_INT_MAX);
},85);
