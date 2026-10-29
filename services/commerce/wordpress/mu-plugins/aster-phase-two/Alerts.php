<?php
defined('ABSPATH') || exit;
/** Adapted from JWK unpaid-order alerts: delayed, rechecked, status-scoped, deduplicated. */
final class Aster_Merchant_Alerts {
    const HOOK='aster_unpaid_merchant_alert';
    const GROUP='aster-merchant-alerts';
    public static function register(): void {
        add_action('woocommerce_new_order',[self::class,'schedule'],30);
        add_action('woocommerce_order_status_changed',static function ($id,$from,$to) {
            if (function_exists('as_unschedule_all_actions')) as_unschedule_all_actions(self::HOOK,[$id,$from],self::GROUP);
            self::schedule($id);
        },30,3);
        add_action(self::HOOK,[self::class,'send'],10,2);
    }
    public static function schedule($id): void {
        $order=wc_get_order($id);
        if ($order && $order->get_meta('_aster_fixture')==='phase-three-20261016' && !(class_exists('Aster_Journey') && Aster_Journey::fixture($order))) return;
        if (!$order || $order->is_paid() || $order->get_date_paid() || !$order->has_status(['pending','failed'])) return;
        $status=$order->get_status();
        if (!$order->get_meta('_aster_alert_due_'.$status)) {
            $order->update_meta_data('_aster_alert_due_'.$status,time()+300); $order->save_meta_data();
        }
        if (function_exists('as_schedule_single_action')) as_schedule_single_action(max(time()+1,(int)$order->get_meta('_aster_alert_due_'.$status)),self::HOOK,[(int)$id,$status],self::GROUP,true);
    }
    public static function send($id,string $status): void {
        if (!in_array($status,['pending','failed'],true)) return;
        $order=wc_get_order($id);
        if ($order && $order->get_meta('_aster_fixture')==='phase-three-20261016' && !(class_exists('Aster_Journey') && Aster_Journey::fixture($order))) return;
        if (!$order || !$order->has_status($status) || $order->is_paid() || $order->get_date_paid() || $order->get_meta('_aster_alert_sent_'.$status)) return;
        $due=(int)$order->get_meta('_aster_alert_due_'.$status);
        if (!$due || $due>time() || (int)$order->get_meta('_aster_alert_attempts_'.$status)>=3) return;
        $key='aster_alert_lock_'.$id.'_'.$status;
        if (!add_option($key,time(),'','no')) return;
        $attempts=(int)$order->get_meta('_aster_alert_attempts_'.$status)+1;
        $order->update_meta_data('_aster_alert_attempts_'.$status,$attempts); $order->save_meta_data();
        $email=WC()->mailer()->get_emails()['WC_Email_New_Order'] ?? null;
        $to=$email ? $email->get_recipient() : '';
        $label=$status==='pending' ? 'Payment pending' : 'Payment not completed';
        $subject='[Aster Edit] '.$label.' · Order #'.$order->get_order_number();
        ob_start();
        if (Aster_Phase_One::fixture($order)) echo '<p><strong>TEST ONLY · Synthetic local order · No payment was made.</strong></p>';
        echo '<p>'.esc_html($label).'. No payment has been confirmed for this order. Check the provider and Woo record before preparing or requesting another payment.</p>';
        do_action('woocommerce_email_order_details',$order,true,false,$email);
        echo '<p><a href="'.esc_url($order->get_edit_order_url()).'">Review this order in Woo</a></p>';
        $body=WC()->mailer()->wrap_message($subject,ob_get_clean());
        $sent=$to && wc_mail($to,$subject,$body,['Content-Type: text/html; charset=UTF-8']);
        if ($sent) {
            $order->update_meta_data('_aster_alert_sent_'.$status,gmdate(DATE_ATOM));
            $order->save_meta_data(); // Keep the atomic lock after SMTP acceptance.
        } else {
            delete_option($key);
            // The current action is still running here: unique=true would reject its retry.
            if ($attempts<3 && function_exists('as_schedule_single_action')) as_schedule_single_action(time()+HOUR_IN_SECONDS,self::HOOK,[(int)$id,$status],self::GROUP,false);
        }
    }
}
