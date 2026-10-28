<?php
if(!defined('WP_CLI') || !WP_CLI || wp_get_environment_type()!=='local')throw new RuntimeException('Local verification only.');
// Process-local switches make this repeatable without changing the accepted preview or database options.
add_filter('pre_option_aster_customer_care_enabled',static fn()=> 'yes');
add_filter('aster_customer_care_mail_ready','__return_false');
function care_check($yes,$label){if(!$yes)throw new RuntimeException($label);echo $label.PHP_EOL;}
care_check(aster_customer_care_enabled() && !aster_phase_one_enabled(),'Production adapter enabled independently of local preview');
care_check(!aster_customer_care_mail_ready(),'Authenticated-sender gate remains closed');
$ordinary=new WC_Order();$ordinary->set_status('processing');$ordinary->set_date_paid(time());$ordinary->set_billing_email('guard@aster.test');
care_check(Aster_Customer_Orders::state($ordinary)['key']==='checking','Woo paid flag alone cannot confirm payment');
care_check(!Aster_Customer_Reviews::eligible($ordinary),'Reviews require actual provider completion evidence');
$ordinary->update_meta_data('_aster_fixture','phase-one-20261016');$ordinary->update_meta_data('_aster_preview_state','paid');
care_check(Aster_Customer_Orders::state($ordinary)['key']==='checking' && !Aster_Customer_Reviews::eligible($ordinary),'Preview payment markers cannot grant production purchase proof');
$r=new WP_REST_Request('GET','/aster/v1/reviews');$r->set_param('group','rolling-bead-cup');
$listing=Aster_Customer_Reviews::listing($r);care_check($listing['count']===0,'Approved local synthetic reviews excluded from real listing');
$before=wc_orders_count('processing');care_check(Aster_Customer_Reviews::invite($ordinary)===false,'Mail gate rejects review invitations');
care_check(wc_orders_count('processing')===$before,'Verification never persists a paid order');
care_check(is_wp_error(Aster_Customer_Orders::normalize(['tracking_url'=>'javascript:alert(1)'])),'Unsafe tracking links rejected');
$valid=Aster_Customer_Orders::normalize(['carrier'=>'Local test','tracking_number'=>'T123','last_scan'=>'Only a local test']);care_check(is_array($valid),'Reviewed shipment fields retained');
care_check(is_wp_error(Aster_Customer_Review_Photos::validate(['data:image/svg+xml;base64,PHN2Zz4='],true)),'Executable review images rejected');
care_check(Aster_Customer_Care::url('reviews')===home_url('/customer-care/?view=reviews'),'Customer links use a normal production route');
echo 'Customer care release guards passed.'.PHP_EOL;
