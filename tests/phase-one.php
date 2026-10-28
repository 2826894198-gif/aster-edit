<?php
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type()!=='local') throw new RuntimeException('Local tests only.');
function phase_check($ok,$message) { if (!$ok) throw new RuntimeException($message); }
$fixtures=get_option('aster_phase_one_fixtures',[]);
$admin=get_users(['role'=>'administrator','number'=>1])[0];
$customer_id=(int)get_option('aster_phase_one_customer');
if (!$customer_id) {
    $customer_id=wp_insert_user(['user_login'=>'test-only-phase-one','user_email'=>'phase-one-account@aster.test','user_pass'=>wp_generate_password(36,true,true),'role'=>'customer']);
    if (is_wp_error($customer_id)) throw new RuntimeException('Cannot initialize test-only customer.');
    update_option('aster_phase_one_customer',$customer_id);
}
$paid=wc_get_order((int)$fixtures['paid']);$paid->set_customer_id(0);$paid->save();
$account_id=(int)get_option('aster_phase_one_account_order');
$account=$account_id ? wc_get_order($account_id) : null;
if (!$account) {
    $account=wc_create_order(['status'=>'processing','customer_id'=>$customer_id]);
    $account->set_billing_email('phase-one-account@aster.test');$account->set_currency('USD');
    $account->set_customer_note('TEST ONLY account order note.');
    $account->update_meta_data('_aster_fixture','phase-one-20261016');$account->update_meta_data('_aster_preview_state','paid');
    $account->add_product(wc_get_product((int)get_option('aster_phase_one_product')),1);
    $account->calculate_totals();$account->save();update_option('aster_phase_one_account_order',$account->get_id());
}
if (($args[0] ?? '')==='auth') {
    // This is the isolated synthetic DB; reset local test rate buckets between acceptance runs.
    global $wpdb;$wpdb->query('DELETE FROM '.Aster_Order_Access::table('access_rates'));
    $auth=[];
    foreach (['admin'=>$admin->ID,'customer'=>$customer_id] as $role=>$id) {
        wp_set_current_user($id);$expires=time()+900;$token=WP_Session_Tokens::get_instance($id)->create($expires);
        $auth[$role]=['cookie'=>LOGGED_IN_COOKIE.'='.wp_generate_auth_cookie($id,$expires,'logged_in',$token).'; '.AUTH_COOKIE.'='.wp_generate_auth_cookie($id,$expires,'auth',$token)];
    }
    // Private child-process pipe only; never print this mode in the chat.
    echo wp_json_encode(['fixtures'=>$fixtures,'account_order'=>$account->get_id(),'account_result_url'=>$account->get_checkout_order_received_url(),'auth'=>$auth]);return;
}
$_SERVER['HTTP_X_ASTER_ORDER_VIEW']='detail';
foreach ($fixtures as $key=>$id) {
    $order=wc_get_order((int)$id);$state=Aster_Phase_One::state($order);
    phase_check($state['key']===($key==='shipped' ? 'paid' : $key),'Fixture state mismatch');
    phase_check($state['can_resume']===in_array($key,['pending','failed'],true),'Unexpected payment recovery');
    $html=Aster_Phase_One::html($order,true);
    phase_check(str_contains($html,'simulated payment status'),'Missing test label');
    phase_check(!preg_match('/jointly operated|Cherrycom|Wintopay|Stripe/i',$html),'Unrelated operator/gateway content');
    if ($state['can_resume']) phase_check(str_contains($html,'/order-pay/'.$id.'/'),'Recovery must retain the order ID');
    else phase_check(!str_contains($html,'Continue this order'),'Uncertain or paid orders cannot expose a retry');
    $summary=Aster_Order_Access::summary($order);
    phase_check(!str_contains($summary['detail_html'],$order->get_order_key()),'Read-only summary must not expose payment keys');
    phase_check(!str_contains($summary['detail_html'],'phase-one@aster.test'),'Summary must not expose checkout email');
}
$unverified=new WC_Order();$unverified->set_status('processing');
phase_check(Aster_Phase_One::state($unverified)['key']==='checking','Woo paid-looking status alone must not prove capture');
phase_check(is_wp_error(Aster_Phase_One::normalize(['tracking_url'=>'javascript:alert(1)'])),'Unsafe URL accepted');
phase_check(is_wp_error(Aster_Phase_One::normalize(['tracking_url'=>'https://u:p@example.test/'])),'URL credentials accepted');
phase_check(is_wp_error(Aster_Phase_One::normalize(['events'=>array_fill(0,26,['label'=>'x'])])),'Unbounded events');
phase_check(is_wp_error(Aster_Phase_One::normalize(['events'=>'{broken'])),'Malformed events accepted');
$order=wc_get_order((int)$fixtures['shipped']);$before=$order->get_meta(Aster_Phase_One::SHIPMENT);
$status=$order->get_status();$total=$order->get_total();
$updated=['carrier'=>'Preview carrier','tracking_number'=>'TEST-UPDATED-123','tracking_url'=>'https://example.test/tracking/TEST-UPDATED-123','estimated_arrival'=>'','last_scan'=>'Manual test update','events'=>'[]'];
try {
    wp_set_current_user($admin->ID);$_POST=['aster_shipment'=>$updated,'aster_shipment_nonce'=>'invalid'];Aster_Phase_One::save($order->get_id());
    phase_check(wc_get_order($order->get_id())->get_meta(Aster_Phase_One::SHIPMENT)===$before,'Invalid nonce modified shipment');
    $_POST['aster_shipment_nonce']=wp_create_nonce('aster_shipment_'.$order->get_id());
    wp_set_current_user($customer_id);Aster_Phase_One::save($order->get_id());
    phase_check(wc_get_order($order->get_id())->get_meta(Aster_Phase_One::SHIPMENT)===$before,'Customer changed shipment');
    wp_set_current_user($admin->ID);$_POST['aster_shipment_nonce']=wp_create_nonce('aster_shipment_'.$order->get_id());Aster_Phase_One::save($order->get_id());
    $saved=wc_get_order($order->get_id());
    phase_check($saved->get_meta(Aster_Phase_One::SHIPMENT)['tracking_number']==='TEST-UPDATED-123','Native admin save failed');
    phase_check(str_contains(Aster_Order_Access::summary($saved)['detail_html'],'TEST-UPDATED-123'),'Guest snapshot did not reflect admin save');
    phase_check(str_contains(Aster_Phase_One::html($saved,false),'TEST-UPDATED-123'),'Account and guest render differ');
    phase_check($saved->get_status()===$status && $saved->get_total()===$total,'Shipment save changed order/payment');
    $_POST['aster_shipment']['events']='invalid JSON';Aster_Phase_One::save($order->get_id());
    phase_check(wc_get_order($order->get_id())->get_meta(Aster_Phase_One::SHIPMENT)['tracking_number']==='TEST-UPDATED-123','Invalid save did not preserve previous shipment');
} finally { $restore=wc_get_order($order->get_id());$restore->update_meta_data(Aster_Phase_One::SHIPMENT,$before);$restore->save_meta_data();$_POST=[];wp_set_current_user(0); }
$errors=new WP_Error();do_action('woocommerce_after_checkout_validation',['order_comments'=>str_repeat('x',501)],$errors);
phase_check(in_array('aster_note_length',$errors->get_error_codes(),true),'Note length was not enforced on server');
WP_CLI::log('Phase one: fixture states, safe same-order recovery, access data, shipment permissions/nonce/validation, shared display and note validation passed.');
