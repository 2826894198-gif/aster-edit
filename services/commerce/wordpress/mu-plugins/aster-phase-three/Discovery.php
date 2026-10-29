<?php
defined('ABSPATH') || exit;
/** Independent local fixtures; no provider SDK, remote rates, capture or mail transport. */
final class Aster_Discovery {
    const ROOT='/aster-preview/discovery/';
    const FIXTURE='phase-three-20261016';
    const SNAPSHOT='aster-synthetic-fx-v1';
    const RATES=['USD'=>1.0,'GBP'=>0.78,'EUR'=>0.92,'CAD'=>1.37,'AUD'=>1.51,'HKD'=>7.80];
    private static bool $silent=false;
    public static function register(): void {
        add_action('template_redirect',[self::class,'page'],0);
        add_action('wp_enqueue_scripts',static function () {
            if (str_starts_with($_SERVER['REQUEST_URI'] ?? '',self::ROOT)) wp_enqueue_style('aster-discovery',plugins_url('discovery.css',__FILE__),['aster-commerce-presentation'],filemtime(__DIR__.'/discovery.css'));
        },140);
        add_action('aster_preview_batches',static function () {
            echo '<section class="ae-batch-link"><div><p class="aster-eyebrow">THIRD FEATURE BATCH</p><h2>Discovery & currency.</h2><p>Review search appearance and try a consistent local currency flow.</p></div><a class="ae-button" href="'.esc_url(home_url(self::ROOT)).'">Explore the third batch →</a></section>';
        });
        add_filter('pre_wp_mail',static fn($value)=>self::$silent ? true : $value,PHP_INT_MAX);
        add_action('woocommerce_email_header',static function ($heading,$email) {
            $order=$email->object ?? null;
            if ($order instanceof WC_Order && $order->get_meta('_aster_fixture')===self::FIXTURE) echo '<p style="border:1px solid #aaa;padding:12px;font-size:12px;line-height:1.7"><strong>TEST ONLY · LOCAL CURRENCY PREVIEW</strong><br>No payment was taken. No provider refund was requested. '.(class_exists('Aster_Journey') && Aster_Journey::fixture($order) ? 'Local inbox only.' : 'This email was not sent.').'</p>';
        },60,2);
        add_filter('woocommerce_order_item_thumbnail',static function ($image,$item) {
            $order=$item->get_order();
            if (!$order || $order->get_meta('_aster_fixture')!==self::FIXTURE) return $image;
            $url=aster_storefront_product_image((string)$item->get_meta('_aster_catalog_key'));
            return $url ? '<img src="'.esc_url($url).'" alt="'.esc_attr($item->get_name()).'" width="64" height="64" style="object-fit:contain;vertical-align:middle;margin-right:8px">' : $image;
        },99,2);
        foreach (['new_order','cancelled_order','failed_order','customer_failed_order','customer_on_hold_order','customer_processing_order','customer_completed_order','customer_refunded_order','customer_invoice'] as $id) {
            add_filter('woocommerce_email_enabled_'.$id,static function ($enabled,$order) { return $order instanceof WC_Order && $order->get_meta('_aster_fixture')===self::FIXTURE && !(class_exists('Aster_Journey') && Aster_Journey::fixture($order)) ? false : $enabled; },PHP_INT_MAX,2);
        }
        add_action('rest_api_init',static function () {
            register_rest_route('aster/v1','/currency-preview',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>static function () {
                return self::response(['id'=>self::SNAPSHOT,'base'=>'USD','rates'=>self::RATES,'preview'=>true,'eligible'=>['USD'],'source'=>'Synthetic local test rates — not market rates','as_of'=>'2026-10-16']);
            }]);
            register_rest_route('aster/v1','/currency-preview/quotes',['methods'=>'POST','permission_callback'=>[self::class,'guard'],'callback'=>[self::class,'quote_request']]);
        });
        // Only these non-private preview APIs accept the configured loopback storefront.
        add_filter('rest_pre_serve_request',static function ($served,$result,$request) {
            if (!str_starts_with($request->get_route(),'/aster/v1/currency-preview')) return $served;
            header_remove('Access-Control-Allow-Origin');header_remove('Access-Control-Allow-Credentials');
            $origin=get_http_origin();
            if (in_array($origin,aster_local_storefront_origins(),true)) {
                header('Access-Control-Allow-Origin: '.$origin);header('Vary: Origin',false);
                header('Access-Control-Allow-Methods: GET, POST, OPTIONS');header('Access-Control-Allow-Headers: Content-Type');
            }
            return $served;
        },PHP_INT_MAX,3);
    }
    public static function response($payload): WP_REST_Response {
        $r=new WP_REST_Response($payload);$r->header('Cache-Control','no-store');$r->header('X-Robots-Tag','noindex, nofollow');return $r;
    }
    public static function guard(WP_REST_Request $r) {
        if (!in_array($r->get_header('origin'),aster_local_storefront_origins(),true)) return new WP_Error('aster_origin','Open the currency preview from the local Aster storefront.',['status'=>403]);
        if (strlen($r->get_body())>16384) return new WP_Error('aster_size','This preview selection is too large.',['status'=>413]);
        if (!Aster_Order_Access::limit('currency-preview:'.($_SERVER['REMOTE_ADDR'] ?? 'local'),60,900)) return new WP_Error('aster_limit','Please wait before preparing another test checkout.',['status'=>429]);
        return true;
    }
    public static function convert(int $minor,string $code): int {
        if ($minor<0 || !isset(self::RATES[$code])) throw new InvalidArgumentException('Invalid currency or amount.');
        return (int)round($minor*self::RATES[$code],0,PHP_ROUND_HALF_UP);
    }
    public static function quote(array $rows,string $code,string $snapshot): array {
        if ($snapshot!==self::SNAPSHOT) throw new InvalidArgumentException('The test exchange rates changed. Refresh the storefront and try again.');
        if (!isset(self::RATES[$code]) || !$rows || count($rows)>20) throw new InvalidArgumentException('Choose a supported currency and up to 20 different pieces.');
        $lines=[];$seen=[];$usd_subtotal=0;$subtotal=0;$quantity=0;$cups=true;
        foreach ($rows as $row) {
            $key=$row['catalog_key'] ?? null;$qty=$row['quantity'] ?? null;
            if (!is_string($key) || strlen($key)>100 || !is_int($qty) || $qty<1 || $qty>20 || isset($seen[$key])) throw new InvalidArgumentException('Invalid or duplicated product selection.');
            $seen[$key]=true;$quantity+=$qty;if ($quantity>100) throw new InvalidArgumentException('Choose up to 100 pieces.');
            $products=wc_get_products(['limit'=>2,'status'=>['draft','publish','private'],'meta_key'=>'_aster_catalog_key','meta_value'=>$key]);
            if (count($products)!==1) throw new InvalidArgumentException('That piece is unavailable in this local preview.');
            $p=$products[0];$raw=$p->get_price('edit');
            if ($raw==='' || !is_numeric($raw) || (float)$raw<=0 || !$p->is_in_stock() || $p->get_meta('_aster_fixture')) throw new InvalidArgumentException('That piece has no approved local price or is unavailable.');
            $usd=(int)round((float)$raw*100);$unit=self::convert($usd,$code);
            $usd_subtotal+=$usd*$qty;$subtotal+=$unit*$qty;
            $cups=$cups && str_starts_with($key,'rolling-bead-cup:') && $p->get_meta('_aster_free_shipping')==='yes';
            $image=function_exists('aster_storefront_product_image') ? aster_storefront_product_image($key) : '';
            $lines[]=['product_id'=>$p->get_id(),'catalog_key'=>$key,'name'=>$p->get_name(),'sku'=>$p->get_sku(),'quantity'=>$qty,'usd_unit'=>$usd,'unit'=>$unit,'line_total'=>$unit*$qty,'image'=>$image];
        }
        // Shipping eligibility uses the unchanged USD catalogue subtotal; all amounts use one snapshot.
        $usd_shipping=($cups || $usd_subtotal>=15000) ? 0 : 3000;$shipping=self::convert($usd_shipping,$code);
        return ['currency'=>$code,'snapshot'=>$snapshot,'rate'=>self::RATES[$code],'lines'=>$lines,'usd_subtotal'=>$usd_subtotal,'usd_shipping'=>$usd_shipping,'subtotal'=>$subtotal,'shipping'=>$shipping,'total'=>$subtotal+$shipping,'expires'=>time()+900,'created'=>time()];
    }
    public static function quote_request(WP_REST_Request $r) {
        $json=$r->get_json_params();
        try {
            if (!is_array($json) || !is_array($json['items'] ?? null) || !is_string($json['currency'] ?? null) || !is_string($json['snapshot'] ?? null)) throw new InvalidArgumentException('Invalid preview request.');
            $quote=self::quote($json['items'],$json['currency'],$json['snapshot']);
            $quote['journey']=($json['journey'] ?? false)===true;
            $token=bin2hex(random_bytes(24));set_transient('aster_fx_quote_'.$token,$quote,DAY_IN_SECONDS);
            return self::response(['url'=>add_query_arg('quote',$token,home_url($quote['journey'] ? Aster_Journey::ROOT : self::ROOT)),'quote'=>$quote]);
        } catch (InvalidArgumentException $e) { return new WP_Error('aster_quote',$e->getMessage(),['status'=>422]); }
    }
    public static function order_key(string $token): string { return 'aster_fx_order_'.hash('sha256',$token); }
    public static function save_order(string $token,array $quote,array $customer=[]): WC_Order {
        $existing=(int)get_option(self::order_key($token));
        if ($existing) { $order=wc_get_order($existing);if ($order && $order->get_meta('_aster_fixture')===self::FIXTURE) return $order; throw new RuntimeException('Test order unavailable.'); }
        if ($quote['expires']<time()) throw new RuntimeException('This quote expired. Return to your bag for a new test checkout.');
        $lock=self::order_key($token).'_lock';if (!add_option($lock,time(),'','no')) throw new RuntimeException('Saving this test order. Refresh shortly.');
        self::$silent=true;
        try {
            $existing=(int)get_option(self::order_key($token));
            if ($existing) { $saved=wc_get_order($existing);if ($saved && $saved->get_meta('_aster_fixture')===self::FIXTURE) return $saved;throw new RuntimeException('Test order unavailable.'); }
            $order=new WC_Order();$order->set_currency($quote['currency']);$order->set_created_via('aster-local-currency-preview');$order->set_status('pending');
            $order->set_billing_email('currency-preview@aster.test');$order->set_billing_first_name('TEST ONLY');$order->set_billing_last_name('Local preview');
            if (!empty($quote['journey'])) {
                $customer=Aster_Journey::customer($customer);
                $address=array_intersect_key($customer,array_flip(['email','first_name','last_name','address_1','city','postcode']));$address['country']='US';
                $order->set_address($address,'billing');unset($address['email']);$order->set_address($address,'shipping');$order->set_customer_note($customer['note']);
                $order->update_meta_data('_aster_integrated_preview','yes');$order->update_meta_data('_aster_preview_state','pending');
            }
            $order->update_meta_data('_aster_fixture',self::FIXTURE);$order->update_meta_data('_aster_fx_quote',$quote);$order->update_meta_data('_aster_fx_snapshot',self::SNAPSHOT);$order->update_meta_data('_aster_fx_rate',(string)$quote['rate']);
            foreach ($quote['lines'] as $line) {
                $item=new WC_Order_Item_Product();$item->set_product_id($line['product_id']);$item->set_name('TEST ONLY · '.$line['name']);$item->set_quantity($line['quantity']);$item->set_subtotal($line['line_total']/100);$item->set_total($line['line_total']/100);
                $item->add_meta_data('_aster_usd_unit',$line['usd_unit']);$item->add_meta_data('_aster_catalog_key',$line['catalog_key']);$order->add_item($item);
            }
            $shipping=new WC_Order_Item_Shipping();$shipping->set_method_title($quote['shipping']===0 ? 'Free shipping' : 'International shipping');$shipping->set_method_id('aster_currency_preview');$shipping->set_total($quote['shipping']/100);$order->add_item($shipping);
            $order->calculate_totals(false);$order->save();
            if ((int)round((float)$order->get_total()*100)!==$quote['total']) throw new RuntimeException('Preview total mismatch.');
            update_option(self::order_key($token),$order->get_id(),false);return $order;
        } finally { self::$silent=false;delete_option($lock); }
    }
    public static function refund(WC_Order $order) {
        if ($order->get_meta('_aster_fixture')!==self::FIXTURE) throw new RuntimeException('Only this batch’s test orders can be used.');
        if ($order->get_refunds()) return $order->get_refunds()[0];
        $lock='aster_fx_refund_'.$order->get_id();if (!add_option($lock,time(),'','no')) throw new RuntimeException('Saving the test refund. Refresh shortly.');
        self::$silent=!(class_exists('Aster_Journey') && Aster_Journey::fixture($order));
        try {
            $order=wc_get_order($order->get_id());
            if ($order->get_refunds()) return $order->get_refunds()[0];
            $result=wc_create_refund(['amount'=>$order->get_total(),'reason'=>'TEST ONLY — local refund record, no provider request','order_id'=>$order->get_id(),'refund_payment'=>false,'restock_items'=>false]);
            if (is_wp_error($result)) throw new RuntimeException($result->get_error_message());
            return $result;
        } finally { self::$silent=false;delete_option($lock); }
    }
    public static function token(): string { $token=is_string($_GET['quote'] ?? null) ? $_GET['quote'] : '';return preg_match('/^[a-f0-9]{48}$/D',$token) ? $token : ''; }
    public static function page(): void {
        if (untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '',PHP_URL_PATH) ?: '')!==untrailingslashit(self::ROOT)) return;
        status_header(200);nocache_headers();header('X-Robots-Tag: noindex, nofollow');header('Referrer-Policy: same-origin');
        header("Content-Security-Policy: frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'");
        $token=self::token();$quote=$token ? get_transient('aster_fx_quote_'.$token) : false;$order=null;$notice='';
        if ($token && !$quote) { status_header(410);$notice='This test quote expired. Return to the storefront to prepare another.'; }
        if ($quote) { $id=(int)get_option(self::order_key($token));$order=$id ? wc_get_order($id) : null;if ($order && $order->get_meta('_aster_fixture')!==self::FIXTURE) { $order=null;$quote=false; } }
        if ($_SERVER['REQUEST_METHOD']==='POST') {
            $origin=get_http_origin();$expected=untrailingslashit(home_url());
            if (($origin && $origin!==$expected) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['_wpnonce'] ?? '')),'aster_fx_'.$token) || (!$quote && ($_POST['action'] ?? '')!=='quote')) { status_header(403);wp_die('This local preview action expired. Refresh and try again.','',['response'=>403]); }
            try {
                if (($_POST['action'] ?? '')==='quote') {
                    $scenario=sanitize_key($_POST['scenario'] ?? '');
                    if (!in_array($scenario,['cup','mixed','threshold'],true)) throw new InvalidArgumentException('Choose a test scenario.');
                    $rows=[['catalog_key'=>'rolling-bead-cup:olive','quantity'=>$scenario==='threshold' ? 2 : 1]];
                    if ($scenario!=='cup') $rows[]=['catalog_key'=>'orange-peel-oval-plate:01','quantity'=>1];
                    $quote=self::quote($rows,sanitize_text_field($_POST['currency'] ?? ''),self::SNAPSHOT);
                    $token=bin2hex(random_bytes(24));set_transient('aster_fx_quote_'.$token,$quote,DAY_IN_SECONDS);
                } elseif (($_POST['action'] ?? '')==='save') $order=self::save_order($token,$quote);elseif (($_POST['action'] ?? '')==='refund' && $order) self::refund($order); }
            catch (Throwable $e) { $notice=$e->getMessage(); }
            if (!$notice) { wp_safe_redirect(add_query_arg('quote',$token,home_url(self::ROOT)),303);exit; }
        }
        if ($quote && $order && isset($_GET['email'])) {
            header("Content-Security-Policy: frame-ancestors 'self'; base-uri 'none'; form-action 'none'; object-src 'none'");
            $email=WC()->mailer()->get_emails()['WC_Email_Customer_Invoice'];$email->object=$order;
            $html=wc_get_template_html('emails/customer-invoice.php',['order'=>$order,'email'=>$email,'email_heading'=>'TEST ONLY · Your '.$order->get_currency().' order','sent_to_admin'=>false,'plain_text'=>false,'additional_content'=>'Local preview only. No payment was taken. This message was not sent.']);
            echo $email->style_inline($html);exit;
        }
        $view=sanitize_key($_GET['view'] ?? '');if (!in_array($view,['','seo','currency'],true)) $view='';
        $seo=json_decode(file_get_contents(__DIR__.'/seo.json'),true);
        require __DIR__.'/page.php';exit;
    }
    public static function money(int $minor,string $code): string { return $code.' '.number_format($minor/100,2,'.',','); }
}
