<?php
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type()!=='local' || !in_array(wp_parse_url(home_url(),PHP_URL_HOST),['localhost','127.0.0.1'],true)) throw new RuntimeException('Loopback local fixtures only.');
if (!get_option('aster_phase_one_fixtures')) throw new RuntimeException('Set up the first-batch local fixtures first.');
update_option('aster_phase_two_preview','yes',false);
update_option('woocommerce_email_from_name','Aster Edit');
update_option('woocommerce_email_from_address','no-reply@aster.test');
$settings=get_option('woocommerce_new_order_settings',[]);$settings['recipient']='store-owner@aster.test';$settings['enabled']='yes';$settings['email_type']='html';update_option('woocommerce_new_order_settings',$settings);
foreach (get_option('aster_phase_one_fixtures',[]) as $kind=>$id) {
    if (!in_array($kind,['pending','failed'],true)) continue;
    $order=wc_get_order($id);
    if (!$order || $order->get_meta('_aster_fixture')!=='phase-one-20261016' || !str_ends_with($order->get_billing_email(),'.test')) throw new RuntimeException('Unexpected fixture.');
    // Existing synthetic orders are older than five minutes; preserve real delay for new ones.
    if (!$order->get_meta('_aster_alert_due_'.$kind)) { $order->update_meta_data('_aster_alert_due_'.$kind,$order->get_date_created()->getTimestamp()+300);$order->save_meta_data(); }
}
WP_CLI::success('Second-batch local preview enabled. Mailpit only; checkout remains closed.');
