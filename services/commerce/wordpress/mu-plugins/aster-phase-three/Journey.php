<?php
defined('ABSPATH') || exit;
/** One local-only order through the three accepted batches. Never a payment writer. */
final class Aster_Journey {
    const ROOT='/aster-preview/journey/';
    public static function url(string $token=''): string { return $token ? add_query_arg('quote',$token,home_url(self::ROOT)) : home_url(self::ROOT); }
    public static function fixture($order): bool {
        return aster_phase_three_enabled() && $order instanceof WC_Order
            && $order->get_meta('_aster_fixture')===Aster_Discovery::FIXTURE
            && $order->get_meta('_aster_integrated_preview')==='yes'
            && $order->get_created_via()==='aster-local-currency-preview'
            && str_ends_with($order->get_billing_email(),'.test')
            && $order->get_meta('_aster_fx_snapshot')===Aster_Discovery::SNAPSHOT;
    }
    public static function register(): void {
        add_filter('aster_local_order_fixture',static fn($fixture,$order) => $fixture || self::fixture($order),10,2);
        add_filter('aster_storefront_url',static fn($url) => ($_COOKIE['aster_journey_preview'] ?? '')==='1' ? add_query_arg('journey-preview','1',$url) : $url);
        add_action('template_redirect',[self::class,'page'],-1);
        add_action('wp_enqueue_scripts',static function () {
            if (!str_starts_with($_SERVER['REQUEST_URI'] ?? '',self::ROOT)) return;
            wp_enqueue_style('aster-discovery',plugins_url('discovery.css',__FILE__),['aster-commerce-presentation'],filemtime(__DIR__.'/discovery.css'));
            wp_enqueue_style('aster-journey',plugins_url('journey.css',__FILE__),['aster-discovery'],filemtime(__DIR__.'/journey.css'));
        },150);
        add_action('aster_preview_batches',static function () { echo '<section class="ae-batch-link"><div><p class="aster-eyebrow">COMPLETE LOCAL PREVIEW</p><h2>From selection to follow-through.</h2><p>Try all three batches with the same labelled test order.</p></div><a class="ae-button" href="'.esc_url(self::url()).'">Start the complete journey →</a></section>'; });
    }
    public static function customer(array $data): array {
        $out=[];
        foreach (['first_name','last_name','address_1','city','postcode','email','note'] as $key) {
            if (!is_string($data[$key] ?? '')) throw new InvalidArgumentException('Use text for the checkout fields.');
            $out[$key]=$key==='note' ? sanitize_textarea_field($data[$key] ?? '') : sanitize_text_field($data[$key] ?? '');
            if ($key!=='note' && mb_strlen($out[$key])>254) throw new InvalidArgumentException('Keep checkout fields within 254 characters.');
        }
        $out['email']=strtolower(trim($out['email']));
        if (!is_email($out['email']) || !str_ends_with($out['email'],'.test')) throw new InvalidArgumentException('Use a reserved .test email address for this local preview.');
        foreach (['first_name','last_name','address_1','city','postcode'] as $key) if (trim($out[$key])==='') throw new InvalidArgumentException('Complete the test contact and delivery fields.');
        if (mb_strlen($out['note'])>500) throw new InvalidArgumentException('Keep your order note within 500 characters.');
        return $out;
    }
    public static function initial_mail(WC_Order $order): void {
        if (!self::fixture($order) || $order->get_meta('_aster_journey_initial_mail')) return;
        $key='aster_journey_initial_'.$order->get_id();if (!add_option($key,time(),'','no')) return;
        try {
            $emails=WC()->mailer()->get_emails();
            $emails['WC_Email_New_Order']->trigger($order->get_id(),$order);
            $emails['WC_Email_Customer_Invoice']->trigger($order->get_id(),$order);
            $order->update_meta_data('_aster_journey_initial_mail',gmdate(DATE_ATOM));$order->save_meta_data();
        } finally { delete_option($key); }
    }
    public static function event(WC_Order $order,string $event,array $data=[]): void {
        if (!self::fixture($order)) throw new InvalidArgumentException('Only this complete-preview test order can be changed.');
        $lock='aster_journey_event_'.$order->get_id();if (!add_option($lock,time(),'','no')) throw new RuntimeException('This test event is being saved. Try again shortly.');
        try {
            $order=wc_get_order($order->get_id());$state=Aster_Phase_One::state($order)['key'];
            if (in_array($event,['order-link','review-link','reminder'],true)) {
                if ($event==='order-link') Aster_Order_Access::deliver($order->get_id(),Aster_Order_Access::email_hash($order->get_billing_email()));
                elseif ($event==='review-link') { if (!Aster_Purchase_Reviews::invite($order)) throw new RuntimeException('A purchase review link is available after confirmed test payment.'); }
                else {
                    if (!in_array($state,['pending','failed'],true)) throw new RuntimeException('No unpaid reminder is due for this state.');
                    // Explicitly advance only this synthetic order’s reminder clock.
                    $order->update_meta_data('_aster_alert_due_'.$order->get_status(),time()-1);$order->save_meta_data();
                    Aster_Merchant_Alerts::send($order->get_id(),$order->get_status());
                }
                return;
            }
            if ($state==='refunded' || $order->get_refunds()) throw new RuntimeException('This test order is already refunded. Start a new selection to test another path.');
            if ($event==='refund') {
                if (!in_array($state,['paid'],true)) throw new RuntimeException('Simulate confirmed payment before recording a test refund.');
                $order->update_meta_data('_aster_preview_state','refunded');$order->save_meta_data();
                try { Aster_Discovery::refund($order); } catch (Throwable $e) { $order->update_meta_data('_aster_preview_state',$state);$order->save_meta_data();throw $e; }
                return;
            }
            if ($event==='shipment') {
                if ($state!=='paid') throw new RuntimeException('Shipment follows confirmed test payment.');
                $shipment=Aster_Phase_One::normalize($data);
                if (is_wp_error($shipment)) throw new InvalidArgumentException($shipment->get_error_message());
                if (!$shipment['carrier'] || !$shipment['tracking_number']) throw new InvalidArgumentException('Add the test carrier and tracking number.');
                $order->update_meta_data(Aster_Phase_One::SHIPMENT,$shipment);$order->save_meta_data();
                $order->update_status('completed','TEST ONLY · Simulated dispatch. No actual shipment.');return;
            }
            if (!in_array($event,['pending','checking','failed','paid'],true) || !in_array($state,['pending','checking','failed'],true)) throw new InvalidArgumentException('Choose an available test event.');
            if ($state===$event) return;
            $order->update_meta_data('_aster_preview_state',$event);
            $order->set_date_paid($event==='paid' ? time() : null);$order->save_meta_data();
            $status=['pending'=>'pending','checking'=>'on-hold','failed'=>'failed','paid'=>'processing'][$event];
            $order->update_status($status,'TEST ONLY · Simulated '.$event.' event. No provider request.');
            $emails=WC()->mailer()->get_emails();
            if ($event==='pending' || ($event==='failed' && !isset($emails['WC_Email_Customer_Failed_Order']))) $emails['WC_Email_Customer_Invoice']->trigger($order->get_id(),$order);
        } finally { delete_option($lock); }
    }
    public static function page(): void {
        if (untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '',PHP_URL_PATH) ?: '')!==untrailingslashit(self::ROOT)) return;
        setcookie('aster_journey_preview','1',['path'=>'/','httponly'=>true,'samesite'=>'Strict']);$_COOKIE['aster_journey_preview']='1';
        status_header(200);nocache_headers();header('X-Robots-Tag: noindex, nofollow');header('Referrer-Policy: same-origin');
        header("Content-Security-Policy: frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'");
        $token=Aster_Discovery::token();$quote=$token ? get_transient('aster_fx_quote_'.$token) : false;$notice='';$order=null;
        if ($token && (!$quote || empty($quote['journey']))) { status_header(410);$notice='This complete-preview quote is unavailable. Return to your bag to prepare a fresh selection.';$quote=false; }
        if ($quote) { $id=(int)get_option(Aster_Discovery::order_key($token));$order=$id ? wc_get_order($id) : null;if ($order && !self::fixture($order)) { status_header(403);wp_die('This preview order is unavailable.','',['response'=>403]); } }
        $values=['email'=>'test-only-journey-'.substr($token,0,8).'@aster.test','first_name'=>'TEST ONLY','last_name'=>'Buyer','address_1'=>'Preview Street','city'=>'Test city','postcode'=>'00000','note'=>''];
        if (($_SERVER['REQUEST_METHOD'] ?? '')==='POST') {
            if (get_http_origin()!==untrailingslashit(home_url()) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['_wpnonce'] ?? '')),'aster_journey_'.$token) || !$quote) wp_die('This test form expired. Refresh and try again.','',['response'=>403]);
            try {
                $action=sanitize_key($_POST['journey_action'] ?? '');
                if ($action==='create') {
                    $values=self::customer(wp_unslash($_POST));$order=Aster_Discovery::save_order($token,$quote,$values);self::initial_mail($order);
                } elseif ($order) self::event($order,$action,is_array($_POST['shipment'] ?? null) ? wp_unslash($_POST['shipment']) : []);
                else throw new InvalidArgumentException('Create this test order first.');
                wp_safe_redirect(self::url($token),303);exit;
            } catch (Throwable $e) { $notice=$e->getMessage();foreach($values as $k=>$v) if(is_string($_POST[$k] ?? null)) $values[$k]=sanitize_textarea_field(wp_unslash($_POST[$k])); }
        }
        if ($quote && !$order && $quote['expires']<time()) { status_header(410);$notice='This 15-minute quote expired. Your storefront bag is kept; return to it for a new quote.'; }
        require __DIR__.'/journey-page.php';exit;
    }
}
