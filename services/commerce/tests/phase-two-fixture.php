<?php
if (!defined('WP_CLI') || !WP_CLI || !aster_phase_two_enabled()) throw new RuntimeException('Local phase two only.');
$mode=$args[0] ?? 'setup';
function p2_assert($ok,$message) { if (!$ok) throw new RuntimeException($message); }
if ($mode==='setup') {
    // Retire earlier synthetic API test examples without deleting their audit trail.
    foreach (get_comments(['type'=>'review','status'=>'approve','meta_key'=>'_aster_review_test','meta_value'=>'yes']) as $old) {
        $old_order=wc_get_order((int)get_comment_meta($old->comment_ID,'_aster_review_order',true));
        if ($old_order && $old_order->get_meta('_aster_phase_two_fixture')==='yes') wp_set_comment_status($old->comment_ID,'hold');
    }
    $email='test-only-phase-two-'.bin2hex(random_bytes(5)).'@aster.test';
    $user=wp_insert_user(['user_login'=>$email,'user_email'=>$email,'user_pass'=>wp_generate_password(32),'role'=>'customer']);
    $make=static function ($kind) use ($email) {
        $o=wc_create_order();$o->set_billing_email($email);$o->set_billing_first_name('TEST ONLY');
        $o->set_currency('USD');$o->add_product(wc_get_product((int)get_option('aster_phase_one_product')),1);
        foreach ($o->get_items() as $item) { $item->add_meta_data('Colour','Olive');$item->save(); }
        $o->calculate_totals(false);$o->update_meta_data('_aster_fixture','phase-one-20261016');$o->update_meta_data('_aster_phase_two_fixture','yes');$o->update_meta_data('_aster_preview_state',$kind);
        if ($kind==='paid') { $o->set_status('processing');$o->set_date_paid(time()-600); } else $o->set_status('pending');
        $o->save();return $o;
    };
    $order=$make('paid');$other=$make('paid');$pending=$make('pending');
    $admin=get_user_by('login','asteredit');
    global $wpdb;$wpdb->query('DELETE FROM '.Aster_Order_Access::table('access_rates'));
    $out=['user'=>$user,'email'=>$email,'order'=>$order->get_id(),'other'=>$other->get_id(),'pending'=>$pending->get_id(),'product'=>(int)get_option('aster_phase_one_product'),'item'=>(int)array_key_first($order->get_items()),'other_item'=>(int)array_key_first($other->get_items()),'review_link'=>Aster_Purchase_Reviews::issue($order,'review-link',3600),'order_link'=>Aster_Order_Access::issue($order->get_id(),Aster_Order_Access::email_hash($email)), 'cookie'=>wp_generate_auth_cookie($user,time()+3600,'logged_in'),'admin_cookie'=>wp_generate_auth_cookie($admin->ID,time()+3600,'logged_in'),'cookie_name'=>LOGGED_IN_COOKIE];
    $_COOKIE[LOGGED_IN_COOKIE]=$out['cookie'];wp_set_current_user($user);$out['nonce']=wp_create_nonce('wp_rest');
    ob_start();$pixel=imagecreatetruecolor(32,32);imagefill($pixel,0,0,imagecolorallocate($pixel,224,228,232));imagepng($pixel);$out['photo']='data:image/png;base64,'.base64_encode(ob_get_clean());imagedestroy($pixel);
    update_option('aster_phase_two_latest_test',['order'=>$order->get_id(),'other'=>$other->get_id(),'pending'=>$pending->get_id(),'user'=>$user],false);
    echo wp_json_encode($out);return;
}
if ($mode==='moderate') {
    $id=(int)($args[1] ?? 0);$comment=get_comment($id);
    p2_assert($comment && get_comment_meta($id,'_aster_review_test',true)==='yes','Only synthetic reviews may be moderated by tests.');
    wp_set_comment_status($id,($args[2] ?? 'approve'));echo 'OK';return;
}
if ($mode==='inspect') {
    $latest=get_option('aster_phase_two_latest_test');$o=wc_get_order($latest['order']);
    $comments=get_comments(['post_id'=>(int)get_option('aster_phase_one_product'),'status'=>'all','type'=>'review','meta_key'=>'_aster_review_order','meta_value'=>$o->get_id()]);
    $c=$comments ? $comments[0] : null;
    echo wp_json_encode(['owner'=>$o->get_customer_id(),'comment'=>$c ? (int)$c->comment_ID : null,'status'=>$c ? $c->comment_approved : null,'photos'=>$c ? Aster_Review_Photos::listing($c->comment_ID) : [],'photo_ids'=>$c ? get_comment_meta($c->comment_ID,'_aster_review_photos',true) : []]);return;
}
if ($mode==='checks') {
    $fixtures=get_option('aster_phase_one_fixtures');$pending=wc_get_order($fixtures['pending']);
    p2_assert(!Aster_Purchase_Reviews::eligible($pending),'Pending is not a verified purchase.');
    p2_assert(Aster_Purchase_Reviews::eligible(wc_get_order($fixtures['paid'])),'Labelled paid fixture eligible.');
    $fake=new WC_Order();$fake->set_status('processing');$fake->set_date_paid(time());p2_assert(!Aster_Purchase_Reviews::eligible($fake),'Woo paid timestamp alone is insufficient.');
    p2_assert(is_wp_error(Aster_Review_Photos::validate(['data:image/svg+xml;base64,PHN2Zz4='],true)),'SVG rejected.');
    p2_assert(is_wp_error(Aster_Review_Photos::validate(['data:image/png;base64,AAAA'],true)),'Corrupt image rejected.');
    $latest=get_option('aster_phase_two_latest_test');$o=wc_get_order($latest['pending']);$status=$o->get_status();$total=$o->get_total();
    $o->update_meta_data('_aster_alert_due_pending',time()+300);$o->save_meta_data();Aster_Merchant_Alerts::send($o->get_id(),'pending');
    p2_assert(!wc_get_order($o->get_id())->get_meta('_aster_alert_sent_pending'),'No alert before delay.');
    $o->update_meta_data('_aster_alert_due_pending',time()-1);$o->save_meta_data();Aster_Merchant_Alerts::send($o->get_id(),'pending');
    $o=wc_get_order($o->get_id());p2_assert((bool)$o->get_meta('_aster_alert_sent_pending'),'Due alert accepted by local mail.');
    Aster_Merchant_Alerts::send($o->get_id(),'pending');$o=wc_get_order($o->get_id());p2_assert((int)$o->get_meta('_aster_alert_attempts_pending')===1,'Duplicate suppressed.');
    p2_assert($o->get_status()===$status && $o->get_total()===$total,'Alert leaves order untouched.');
    $o->set_status('cancelled');$o->save();$o->delete_meta_data('_aster_alert_sent_pending');$o->save_meta_data();Aster_Merchant_Alerts::send($o->get_id(),'pending');
    p2_assert(!wc_get_order($o->get_id())->get_meta('_aster_alert_sent_pending'),'Cancellation prevents late pending alert.');
    $retry=wc_create_order();$retry->set_billing_email('test-only-alert-retry@aster.test');$retry->update_meta_data('_aster_fixture','phase-one-20261016');$retry->update_meta_data('_aster_phase_two_fixture','yes');$retry->update_meta_data('_aster_alert_due_pending',time()-1);$retry->save();
    as_unschedule_all_actions(Aster_Merchant_Alerts::HOOK,[$retry->get_id(),'pending'],Aster_Merchant_Alerts::GROUP);
    $fail=static fn()=>false;add_filter('pre_wp_mail',$fail,999);
    Aster_Merchant_Alerts::send($retry->get_id(),'pending');
    remove_filter('pre_wp_mail',$fail,999);
    $retry=wc_get_order($retry->get_id());
    p2_assert(!$retry->get_meta('_aster_alert_sent_pending') && !get_option('aster_alert_lock_'.$retry->get_id().'_pending'),'Failed handoff releases lock without marking sent.');
    p2_assert((bool)as_next_scheduled_action(Aster_Merchant_Alerts::HOOK,[$retry->get_id(),'pending'],Aster_Merchant_Alerts::GROUP),'Failed handoff queues a retry.');
    $retry->set_status('cancelled');$retry->save();
    p2_assert(!as_next_scheduled_action(Aster_Merchant_Alerts::HOOK,[$retry->get_id(),'pending'],Aster_Merchant_Alerts::GROUP),'Cancellation removes queued retry.');
    $mailer=new PHPMailer\PHPMailer\PHPMailer();do_action('phpmailer_init',$mailer);
    p2_assert($mailer->Mailer==='smtp' && $mailer->Host==='mailpit' && $mailer->Port===1025 && !$mailer->SMTPAuth,'SMTP is locked to local sink.');
    p2_assert(!aster_checkout_open(),'No payment release.');
    WP_CLI::success('Purchase guards, photo validation, alert delay/dedup/cancellation and local-only SMTP passed.');return;
}
