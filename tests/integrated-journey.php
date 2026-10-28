<?php
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type()!=='local') throw new RuntimeException('Local tests only.');
$order=wc_get_order((int)($args[1] ?? 0));$mode=$args[0] ?? '';
if ($mode==='inspect') {
 if (!Aster_Journey::fixture($order)) throw new RuntimeException('Integrated fixture required.');
 $comments=get_comments(['type'=>'review','status'=>'all','meta_key'=>'_aster_review_order','meta_value'=>$order->get_id()]);
 $record=(new \Aster\Checkout\PaymentAttemptRepository())->findByOrderId($order->get_id());
 echo wp_json_encode(['id'=>$order->get_id(),'status'=>$order->get_status(),'state'=>Aster_Phase_One::state($order)['key'],'currency'=>$order->get_currency(),'total'=>$order->get_total(),'refund'=>$order->get_total_refunded(),'note'=>$order->get_customer_note(),'owner'=>$order->get_customer_id(),'provider_record'=>(bool)$record,'pending_alert'=>(int)$order->get_meta('_aster_alert_attempts_pending'),'queued_pending'=>(bool)as_has_scheduled_action(Aster_Merchant_Alerts::HOOK,[$order->get_id(),'pending'],Aster_Merchant_Alerts::GROUP),'queued_failed'=>(bool)as_has_scheduled_action(Aster_Merchant_Alerts::HOOK,[$order->get_id(),'failed'],Aster_Merchant_Alerts::GROUP),'reviews'=>array_map(static fn($c)=>['id'=>(int)$c->comment_ID,'approved'=>$c->comment_approved,'product'=>(int)$c->comment_post_ID,'test'=>get_comment_meta($c->comment_ID,'_aster_review_test',true),'variant'=>get_comment_meta($c->comment_ID,'_aster_review_variant',true)],$comments)]);return;
}
if ($mode==='moderate') {
 $comment=get_comment((int)($args[1] ?? 0));if (!$comment || get_comment_meta($comment->comment_ID,'_aster_review_test',true)!=='yes') throw new RuntimeException('Test review only.');
 if (!wp_set_comment_status($comment->comment_ID,($args[2] ?? '') ?: 'approve')) throw new RuntimeException('Test moderation failed.');echo 'OK';return;
}
if ($mode==='user') {
 if (!Aster_Journey::fixture($order)) throw new RuntimeException('Integrated fixture required.');
 $email=$order->get_billing_email();$user=get_user_by('email',$email);
 if (!$user) { $id=wp_insert_user(['user_login'=>'journey-'.$order->get_id(),'user_email'=>$email,'user_pass'=>wp_generate_password(36,true,true),'role'=>'customer']);if(is_wp_error($id)) throw new RuntimeException('Test account unavailable.');$user=get_user_by('id',$id); }
 wp_set_current_user($user->ID);$token=WP_Session_Tokens::get_instance($user->ID)->create(time()+3600);
 $cookie=wp_generate_auth_cookie($user->ID,time()+3600,'logged_in',$token);$_COOKIE[LOGGED_IN_COOKIE]=$cookie;
 // Returned only to a child-process pipe consumed by the integration test, never chat output.
 echo wp_json_encode(['id'=>$user->ID,'cookie'=>LOGGED_IN_COOKIE.'='.$cookie,'nonce'=>wp_create_nonce('wp_rest')]);return;
}
if ($mode==='guards') {
 $ordinary=new WC_Order();$ordinary->set_status('processing');$ordinary->set_date_paid(time());$ordinary->set_billing_email('real-customer@aster.test');
 if (Aster_Journey::fixture($ordinary) || Aster_Purchase_Reviews::eligible($ordinary)) throw new RuntimeException('Non-fixture order accepted without provider proof.');
 require_once ABSPATH.WPINC.'/PHPMailer/PHPMailer.php';
 $mail=new PHPMailer\PHPMailer\PHPMailer();do_action('phpmailer_init',$mail);
 if ($mail->Host!=='mailpit' || $mail->Port!==1025 || $mail->SMTPAuth || aster_checkout_open()) throw new RuntimeException('Local isolation changed.');
 echo 'Fixture boundary, Mailpit-only delivery and closed payment guard passed.';return;
}
throw new RuntimeException('Unknown local test mode.');
