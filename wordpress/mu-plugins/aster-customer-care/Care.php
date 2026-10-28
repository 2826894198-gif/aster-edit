<?php
defined('ABSPATH') || exit;
final class Aster_Customer_Care {
    const ROOT = '/customer-care/';
    public static function url(string $view = ''): string { return add_query_arg('view', $view, home_url(self::ROOT)); }
    public static function asset(string $file): string { return plugins_url($file,__FILE__).'?v='.filemtime(__DIR__.'/'.$file); }
    public static function register(): void {
        add_filter('wp_mail_from_name',static fn()=> 'Aster Edit');
        add_filter('woocommerce_email_headers',static function ($headers,$id) {
            return str_starts_with($id,'customer_') ? preg_replace('/^Reply-To:.*\r?\n/im','',$headers)."Reply-To: Aster Edit <support@example.test>\r\n" : $headers;
        },30,2);
        add_filter('aster_order_access_link_url',static fn($url,$raw) => self::url('recovery').'#access='.$raw,10,2);
        add_action('template_redirect',[self::class,'page'],-1);
        add_action('wp_enqueue_scripts',static function () {
            wp_enqueue_style('aster-customer-care',self::asset('care.css'),['aster-commerce-presentation']);
            wp_enqueue_script('aster-customer-care',self::asset('care.js'),[],false,true);
        },130);
        add_filter('woocommerce_locate_template',static function ($template,$name) {
            if ($name==='myaccount/form-lost-password.php') return __DIR__.'/lost-password.php';
            if ($name==='myaccount/lost-password-confirmation.php') return __DIR__.'/reset-confirmation.php';
            if ($name==='emails/email-header.php') return __DIR__.'/email-header.php';
            if (in_array($name,['emails/customer-reset-password.php','emails/customer-new-account.php'],true)) return __DIR__.'/account-email.php';
            if (preg_match('~^emails/(plain/)?customer-(processing-order|completed-order|on-hold-order|failed-order|refunded-order|invoice)\.php$~',$name)) return str_contains($name,'/plain/') ? __DIR__.'/status-email-plain.php' : __DIR__.'/status-email.php';
            return $template;
        },80,2);
        foreach (['customer_processing_order','customer_completed_order','customer_on_hold_order','customer_failed_order','customer_refunded_order','customer_invoice'] as $id) {
            add_filter('woocommerce_email_subject_'.$id,static fn($subject,$order) => $order instanceof WC_Order ? 'Aster Edit · Order #'.$order->get_order_number().' · '.self::email_state($order,$id)['label'] : $subject,50,2);
            add_filter('woocommerce_email_heading_'.$id,static fn($heading,$order) => $order instanceof WC_Order ? self::email_state($order,$id)['heading'] : $heading,50,2);
        }
        add_filter('woocommerce_email_footer_text',static fn() => 'Aster Edit · Objects for a more considered table.');
        add_filter('woocommerce_email_subject_customer_reset_password',static fn() => 'Aster Edit · Reset your password');
        add_filter('woocommerce_email_subject_customer_new_account',static fn() => 'Aster Edit · Your account is ready');
        add_filter('woocommerce_email_heading_customer_new_account',static fn() => 'Welcome to Aster Edit.');
        add_filter('woocommerce_email_subject_new_order',static fn($subject,$order) => $order instanceof WC_Order ? '[Aster Edit] New order #'.$order->get_order_number().' · '.Aster_Customer_Orders::state($order)['label'] : $subject,50,2);
        add_filter('woocommerce_email_styles',static fn($css) => $css.' .email-logo-text{font-size:18px!important;letter-spacing:3px!important;text-transform:uppercase!important;font-family:Arial,sans-serif!important} @media only screen and (max-width:600px){#outer_wrapper>tbody>tr>td{width:auto!important} #wrapper{padding:16px 0!important} #body_content>tbody>tr>td{padding:16px!important} #template_header>tbody>tr>td{padding:24px 16px!important} #template_header h1{font-size:28px!important} .email-order-item-thumbnail{width:48px!important} .email-order-item-thumbnail img{width:48px!important;margin-right:8px!important} .order-item-data td{font-size:12px!important} .td{padding:8px 4px!important}}');
        add_filter('woocommerce_email_styles',static fn($css) => $css.' #wrapper,#template_container,#template_header,#template_body,#body_content,#template_footer{background-color:#ffffff!important} #template_header h1{color:#282621!important;font-family:Georgia,serif!important;font-size:32px!important;font-weight:400!important} #body_content_inner{color:#282621!important;font-family:Arial,sans-serif!important} a{color:#282621!important} #template_container{border:1px solid #deddd8!important;border-radius:0!important}');
        add_filter('woocommerce_email_order_items_args',static function ($args) { $args['show_image']=true; $args['image_size']=[64,64]; return $args; });
        // The native handler still owns password generation, reset keys and password saving.
        add_action('wp_loaded',[self::class,'recover'],19);
        add_action('woocommerce_after_account_orders',[self::class,'account_claim']);
        add_action('rest_api_init',static function () {
            register_rest_route('aster/v1','/account/recover-orders',['methods'=>'POST','permission_callback'=>[Aster_Order_Access::class,'guard'],'callback'=>static function ($r) {
                if (!aster_customer_care_mail_ready()) return new WP_Error('aster_mail_unavailable','Order emails are currently unavailable. Use your order number and checkout email on the order status page, or contact customer care.',['status'=>503]);
                $email=$r->get_param('email');
                if (!is_string($email) || strlen($email)>254 || !is_email($email)) return new WP_Error('aster_email','Enter your checkout email.',['status'=>400]);
                $digest=Aster_Order_Access::email_hash($email);
                $ip_ok=Aster_Order_Access::limit('recover-orders-ip:'.($_SERVER['REMOTE_ADDR'] ?? ''),20,900);
                $email_ok=Aster_Order_Access::limit('recover-orders-email:'.$digest,3,900);
                if ($ip_ok && $email_ok) {
                    $ids=wc_get_orders(['billing_email'=>$email,'limit'=>10,'status'=>array_keys(wc_get_order_statuses()),'orderby'=>'date','order'=>'DESC','return'=>'ids']);
                    if ($ids) as_enqueue_async_action('aster_recover_order_links',[$ids,$digest],'aster-order-access');
                }
                return new WP_REST_Response(['message'=>'If this email matches an order, private access links will be sent to its checkout email. Please allow a few minutes.'],202);
            }]);
            register_rest_route('aster/v1','/account/claim-order',['methods'=>'POST','permission_callback'=>static function ($r) {
                $guard=Aster_Order_Access::guard($r);
                if (is_wp_error($guard)) return $guard;
                return is_user_logged_in() && wp_verify_nonce($r->get_header('X-WP-Nonce'),'wp_rest') ? true : new WP_Error('aster_sign_in','Sign in before saving an order to your account.',['status'=>401]);
            },'callback'=>[self::class,'claim']]);
        });
        add_action('aster_recover_order_links',[self::class,'recover_order_links'],10,2);
    }
    public static function email_state(WC_Order $order,string $id): array {
        $state=Aster_Customer_Orders::state($order);
        if ($id==='customer_completed_order' && $state['key']==='paid') {
            $shipment=Aster_Customer_Orders::shipment($order);
            $recorded=!empty($shipment['carrier']) && !empty($shipment['tracking_number']);
            $state['label']=$recorded ? 'Shipment update' : 'Order update';
            $state['heading']=$recorded ? 'Your shipment update.' : 'An update to your order.';
        }
        return $state;
    }
    public static function recover_order_links(array $ids,string $digest): void {
        if (!aster_customer_care_mail_ready()) return;
        $links=[];$tokens=[];$to='';
        foreach (array_slice($ids,0,10) as $id) {
            $order=wc_get_order((int)$id);
            if (!Aster_Order_Access::eligible($order,$digest)) continue;
            $raw=Aster_Order_Access::issue($order->get_id(),$digest);$tokens[]=$raw;$to=$order->get_billing_email();
            $links[]='<li><a href="'.esc_url(self::url('recovery').'#access='.$raw).'">Order #'.esc_html($order->get_order_number()).'</a></li>';
        }
        if (!$links) return;
        $html='<p>You requested access to your Aster Edit orders. Open a link, then choose Open private order link.</p><ul>'.implode('',$links).'</ul><p>Each private link expires in 15 minutes and can only be used once. Do not forward this email. If you did not request this, ignore it. No account or payment changes have been made.</p>';
        $sent=wc_mail($to,'Aster Edit · Your private order links',WC()->mailer()->wrap_message('Your orders, together.', $html),['Content-Type: text/html; charset=UTF-8','Reply-To: Aster Edit <support@example.test>']);
        if (!$sent) { global $wpdb; foreach ($tokens as $raw) $wpdb->delete(Aster_Order_Access::table('access_tokens'),['token_hash'=>hash('sha256',$raw)]); }
    }
    public static function recover(): void {
        if (!aster_customer_care_mail_ready()) { unset($_POST['wc_reset_password']);return; }
        if (!isset($_POST['wc_reset_password'],$_POST['user_login']) || !is_string($_POST['user_login'])) return;
        if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['woocommerce-lost-password-nonce'] ?? '')),'lost_password')) return;
        $site=wp_parse_url(home_url());$expected=$site['scheme'].'://'.$site['host'].(isset($site['port']) ? ':'.$site['port'] : '');
        if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN']!==$expected) { unset($_POST['wc_reset_password']);wc_add_notice('Request a password reset from this site.','error');return; }
        $login=trim(wp_unslash($_POST['user_login']));
        if ($login==='' || strlen($login)>254) return;
        $ip=$_SERVER['REMOTE_ADDR'] ?? 'local';
        if (Aster_Order_Access::limit('reset-ip:'.$ip,20,900) && Aster_Order_Access::limit('reset-account:'.Aster_Order_Access::email_hash($login),3,900)) WC_Shortcode_My_Account::retrieve_password();
        wc_clear_notices();
        wp_safe_redirect(add_query_arg('reset-link-sent','true',wc_lostpassword_url())); exit;
    }
    public static function account_claim(): void {
        echo '<section class="ae-account-claim"><h2>Missing a guest order?</h2><p>Open its private email link, then save that one order to this account. Signing up with the same email alone does not add past orders.</p><a href="'.esc_url(self::url('recovery')).'">Recover a guest order →</a></section>';
    }
    public static function claim(WP_REST_Request $r) {
        $session=is_string($_COOKIE[Aster_Order_Access::COOKIE] ?? null) ? $_COOKIE[Aster_Order_Access::COOKIE] : '';
        $row=Aster_Order_Access::record($session,'session');
        if (!$row) return new WP_Error('aster_proof','Open a fresh private order link first.',['status'=>403]);
        $user=wp_get_current_user(); $order=wc_get_order((int)$row->order_id);
        if (!hash_equals($row->email_hash,Aster_Order_Access::email_hash($user->user_email))) return new WP_Error('aster_mismatch','Sign in with the account that uses this order’s checkout email.',['status'=>403]);
        $lock='aster_claim_'.$order->get_id();
        if (!add_option($lock,time(),'','no')) return new WP_Error('aster_busy','Please try again shortly.',['status'=>409]);
        try {
            $order=wc_get_order((int)$row->order_id);
            if (!Aster_Order_Access::eligible($order,$row->email_hash) || ($order->get_customer_id() && $order->get_customer_id()!==$user->ID)) return new WP_Error('aster_claim','This order cannot be added to this account.',['status'=>409]);
            $order->set_customer_id($user->ID); $order->save();
            Aster_Order_Access::revoke_cookie();
            $response=new WP_REST_Response(['message'=>'This order has been added to your account.','url'=>$order->get_view_order_url()]);
            $response->header('Set-Cookie',Aster_Order_Access::cookie('',0)); return $response;
        } finally { delete_option($lock); }
    }
    public static function page(): void {
        if(untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '',PHP_URL_PATH) ?: '')!==untrailingslashit(self::ROOT))return;
        status_header(200);nocache_headers();header('X-Robots-Tag: noindex, nofollow');header('Referrer-Policy: no-referrer');
        header("Content-Security-Policy: frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'");
        $view=sanitize_key($_GET['view'] ?? 'recovery');if(!in_array($view,['recovery','reviews'],true))$view='recovery';
        $product=absint($_GET['product'] ?? 0);$display_product=$product ? wc_get_product($product) : null;
        if($display_product && ($display_product->get_status()!=='publish' || $display_product->get_meta('_aster_fixture'))) { $display_product=null;$product=0; }
        require __DIR__.'/page.php';exit;
    }
}
