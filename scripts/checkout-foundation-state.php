<?php
/** Read-only fingerprint; never outputs credentials, customers or order ids. */
$_SERVER['HTTP_HOST']='commerce.example.test'; $_SERVER['REQUEST_URI']='/'; $_SERVER['REQUEST_METHOD']='GET'; $_SERVER['HTTPS']='on';
require $argv[1];
global $wpdb;
$raw=static function($key)use($wpdb){$v=$wpdb->get_var($wpdb->prepare("SELECT option_value FROM {$wpdb->options} WHERE option_name=%s",$key));return $v===null?null:$v;};
$protected=[];
foreach(['woocommerce-ppcp-data-common','woocommerce-ppcp-data-payment','woocommerce-ppcp-data-settings','woocommerce-ppcp-data-styling','woocommerce_ppcp-gateway_settings','woocommerce_ppcp-credit-card-gateway_settings','woocommerce_currency','woocommerce_calc_taxes','woocommerce_enable_guest_checkout','woocommerce_enable_signup_and_login_from_checkout','active_plugins','wp_statistics']as$key)$protected[$key]=$raw($key);
$protected['shipping']=$wpdb->get_results("SELECT * FROM {$wpdb->prefix}woocommerce_shipping_zone_methods ORDER BY zone_id,instance_id",ARRAY_A);
$protected['products']=$wpdb->get_results("SELECT post_id,meta_key,meta_value FROM {$wpdb->postmeta} WHERE meta_key IN ('_price','_regular_price','_sku','_stock_status','_aster_catalog_key','_aster_commerce_approved') ORDER BY post_id,meta_key,meta_id",ARRAY_A);
$protected['checkout_open']=aster_checkout_open(); $protected['mail_ready']=aster_customer_mail_ready();
echo wp_json_encode(['protected_sha256'=>hash('sha256',serialize($protected)),
    'orders'=>(int)wc_get_orders(['limit'=>1,'paginate'=>true])->total,
    'checkout_open'=>aster_checkout_open(),'mail_ready'=>aster_customer_mail_ready(),
    'foundation_enabled'=>get_option('aster_checkout_foundation_enabled'),
    'ledger_schema'=>get_option('aster_checkout_ledger_schema'),
    'checkout_content'=>get_post_field('post_content',get_option('woocommerce_checkout_page_id')),
],JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES),"\n";
