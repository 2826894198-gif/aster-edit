<?php
defined('ABSPATH') || exit;
/** Adapted from JWK ShipmentAdmin/ShipmentData, OrderInquiryDialog and native Woo. */
final class Aster_Phase_One {
    const SHIPMENT = '_aster_customer_shipment_v1';
    const TOPICS = ['payment'=>'Payment', 'shipping'=>'Shipping or address', 'damaged'=>'Damaged or incorrect item', 'other'=>'Other question'];
    public static function asset(string $file): string {
        return plugins_url($file, __FILE__) . '?v=' . filemtime(__DIR__ . '/' . $file);
    }
    public static function register(): void {
        add_filter('show_admin_bar', static fn($show) => is_admin() ? $show : false);
        add_filter('body_class', static fn($classes) => array_merge($classes, ['aster-phase-one']));
        add_action('wp_enqueue_scripts', static function () {
            if (!wp_style_is('aster-commerce-presentation','enqueued')) wp_enqueue_style('aster-commerce-presentation', aster_commerce_asset('commerce.css'));
            wp_enqueue_style('aster-phase-one', self::asset('preview.css'), ['aster-commerce-presentation']);
            wp_enqueue_script('aster-phase-one', self::asset('preview.js'), [], false, true);
        }, 120);
        add_filter('woocommerce_locate_template', static function ($template, $name) {
            return in_array($name, ['checkout/thankyou.php','myaccount/view-order.php'], true) ? __DIR__.'/order-template.php' : $template;
        }, 60, 2);
        add_filter('template_include', static fn($template) => is_order_received_page() ? __DIR__.'/result-shell.php' : $template, 120);
        add_filter('woocommerce_shipping_free_shipping_is_available', static fn($available,$package) => self::preview_package($package) ? true : $available, 30, 2);
        add_filter('woocommerce_shipping_flat_rate_is_available', static fn($available,$package) => self::preview_package($package) ? false : $available, 30, 2);
        add_filter('woocommerce_package_rates', static function ($rates,$package) {
            if (!self::preview_package($package)) return $rates;
            $free=array_filter($rates,static fn($rate) => $rate->method_id==='free_shipping');
            foreach ($free as $rate) { $rate->set_cost(0); $rate->set_taxes([]); }
            return $free;
        }, 30, 2);
        add_filter('woocommerce_cart_item_thumbnail', static function ($html,$item) {
            return isset($item['data']) && $item['data']->get_meta('_aster_fixture')==='phase-one-20261016' ? '<img src="'.esc_url(self::asset('olive-cup.png')).'" alt="Olive rolling-bead ceramic cup local test item" width="88" height="88">' : $html;
        }, 60, 2);
        add_filter('woocommerce_product_get_image', static function ($html,$product) {
            return $product->get_meta('_aster_fixture')==='phase-one-20261016' ? '<img src="'.esc_url(self::asset('olive-cup.png')).'" alt="Olive rolling-bead ceramic cup local test item" width="88" height="88">' : $html;
        }, 60, 2);
        add_filter('woocommerce_order_button_html', static fn() => '<button type="button" class="button alt" id="place_order" disabled aria-disabled="true">Payments disabled in local preview</button>', 999);
        add_filter('woocommerce_no_available_payment_methods_message', static fn() => 'Payment submission is disabled in this local preview. Your details can be reviewed without placing an order.');
        remove_action('woocommerce_thankyou', 'woocommerce_order_details_table', 10);
        remove_action('woocommerce_view_order', 'woocommerce_order_details_table', 10);
        add_filter('aster_order_access_summary', static function ($summary, $order) {
            if (($_SERVER['HTTP_X_ASTER_ORDER_VIEW'] ?? '')==='detail') $summary['detail_html'] = self::html($order, false, true);
            return $summary;
        }, 10, 2);
        add_filter('woocommerce_checkout_fields', static function ($fields) {
            $fields['order']['order_comments'] = ['type'=>'textarea', 'label'=>'Order note', 'required'=>false,
                'placeholder'=>'Delivery instructions or a date you have in mind', 'class'=>['form-row-wide'],
                'custom_attributes'=>['maxlength'=>'500','aria-describedby'=>'ae-note-help ae-note-count']];
            return $fields;
        }, 250);
        add_action('woocommerce_before_order_notes', static function ($checkout) {
            echo '<details class="ae-note"'.($checkout->get_value('order_comments') ? ' open' : '').'><summary>Add a note for your order <span>Optional</span></summary><p id="ae-note-help">Delivery instructions or a date you have in mind. Requested dates and changes need confirmation by email.</p>';
        });
        add_action('woocommerce_before_checkout_form', static function () {
            if (isset($_GET['aster_preview_existing_bag'])) echo '<p class="aster-local-note">Your existing checkout bag has been kept. You can try the optional order note below.</p>';
        }, 5);
        add_action('woocommerce_after_order_notes', static function () { echo '<span id="ae-note-count" class="ae-note-count">0 / 500</span></details>'; });
        add_action('woocommerce_after_checkout_validation', static function ($data, $errors) {
            if (mb_strlen((string)($data['order_comments'] ?? '')) > 500) $errors->add('aster_note_length','Keep your order note within 500 characters.');
        }, 20, 2);
        add_action('woocommerce_admin_order_data_after_shipping_address', [self::class,'admin']);
        add_action('woocommerce_process_shop_order_meta', [self::class,'save'], 30, 2);
        add_action('template_redirect', [self::class,'preview'], 0);
    }
    public static function fixture($order): bool {
        return aster_phase_one_enabled() && $order instanceof WC_Order && (bool)apply_filters('aster_local_order_fixture',$order->get_meta('_aster_fixture') === 'phase-one-20261016',$order);
    }
    private static function preview_package(array $package): bool {
        if (empty($package['contents'])) return false;
        foreach ($package['contents'] as $line) if (!isset($line['data']) || $line['data']->get_meta('_aster_fixture')!=='phase-one-20261016') return false;
        return true;
    }
    public static function state(WC_Order $order): array {
        $key = '';
        $safe = false;
        // Only clearly labelled local fixtures can simulate a provider result.
        if (self::fixture($order)) {
            $key = (string)$order->get_meta('_aster_preview_state');
            $safe = in_array($key,['pending','failed'],true);
        } else {
            $record = class_exists('Aster\\Checkout\\PaymentAttemptRepository') ? (new \Aster\Checkout\PaymentAttemptRepository())->findByOrderId($order->get_id()) : null;
            $safe = $order->needs_payment() && in_array($record['safe_action'] ?? '', ['resume_same_order','retry_same_order'],true);
            if ($order->has_status('refunded')) $key='refunded';
            elseif ($order->has_status('cancelled')) $key='cancelled';
            elseif (($record['customer_state'] ?? '') === 'completed' && $order->is_paid()) $key='paid';
            elseif ($safe) $key=$order->has_status('failed') ? 'failed' : 'pending';
            elseif ($order->has_status('failed')) $key='failed';
            elseif ($order->has_status('pending') && !$order->get_meta('_aster_provider_create_started_at') && !$order->get_transaction_id()) $key='pending';
            else $key='checking';
        }
        $states = [
            'pending'=>['Awaiting payment','Your order is saved.','Payment has not been confirmed. Your order details are kept together here.'],
            'failed'=>['Payment not completed','Your order is still here.','Check the latest status before trying again. Contact us if you have already seen a charge.'],
            'checking'=>['Checking payment','We are checking your payment.','Please do not pay again while the result is being confirmed. You can refresh this page or ask us to check.'],
            'paid'=>['Paid','Thank you for your order.','Payment is recorded. Your order will move to preparation and shipping updates here.'],
            'refunded'=>['Refunded','Your refund is recorded.','The recorded refund appears in your order totals. Your payment provider determines when it reaches your account.'],
            'cancelled'=>['Cancelled','This order is cancelled.','No further payment is available for this order. Contact us if you need help with its payment status.'],
        ];
        if (!isset($states[$key])) $key='checking';
        if ($key==='paid') {
            $shipment=self::shipment($order);
            if (!empty($shipment['tracking_number']) || !empty($shipment['events']) || !empty($shipment['last_scan'])) $states[$key][2]='Payment is recorded. See the latest shipping information and updates below.';
        }
        return ['key'=>$key,'label'=>$states[$key][0],'heading'=>$states[$key][1],'message'=>$states[$key][2],
            'can_resume'=>$safe && in_array($key,['pending','failed'],true)];
    }
    public static function normalize(array $data) {
        $result=[];
        foreach (['carrier','tracking_number','estimated_arrival','last_scan'] as $field) {
            if (!is_string($data[$field] ?? '')) return new WP_Error('shipment_field','Shipment fields must be text.');
            $value=trim(sanitize_text_field($data[$field] ?? ''));
            if (mb_strlen($value)>160) return new WP_Error('shipment_length','Keep shipment fields within 160 characters.');
            $result[$field]=$value;
        }
        $url=$data['tracking_url'] ?? '';
        if (!is_string($url) || strlen($url)>1000 || ($url!=='' && (!filter_var($url,FILTER_VALIDATE_URL) || !in_array(strtolower(wp_parse_url($url,PHP_URL_SCHEME) ?: ''),['https','http'],true) || wp_parse_url($url,PHP_URL_USER) || wp_parse_url($url,PHP_URL_PASS)))) return new WP_Error('shipment_url','Enter a valid HTTP or HTTPS tracking link without credentials.');
        $result['tracking_url']=esc_url_raw($url);
        $events=$data['events'] ?? [];
        if (is_string($events)) $events=trim($events)==='' ? [] : json_decode($events,true);
        if (!is_array($events) || !array_is_list($events) || count($events)>25) return new WP_Error('shipment_events','Use a JSON list of up to 25 shipment updates.');
        $result['events']=[];
        foreach ($events as $e) {
            if (!is_array($e) || !is_string($e['label'] ?? null) || trim($e['label'])==='' || !is_string($e['detail'] ?? '') || !is_string($e['occurred_at'] ?? '')) return new WP_Error('shipment_event','Each update needs a label and text fields.');
            if (mb_strlen($e['label'])>160 || mb_strlen($e['detail'] ?? '')>300 || strlen($e['occurred_at'] ?? '')>50) return new WP_Error('shipment_event_length','Shipment update text is too long.');
            $result['events'][]=['label'=>sanitize_text_field($e['label']),'detail'=>sanitize_text_field($e['detail'] ?? ''),'occurred_at'=>sanitize_text_field($e['occurred_at'] ?? '')];
        }
        return $result;
    }
    public static function shipment(WC_Order $order): array {
        $stored=$order->get_meta(self::SHIPMENT);
        $data=self::normalize(is_array($stored) ? $stored : []);
        return is_wp_error($data) ? [] : $data;
    }
    public static function admin($order): void {
        if (!$order instanceof WC_Order || !current_user_can('edit_shop_order',$order->get_id())) return;
        $data=self::shipment($order);
        echo '<div class="ae-shipment-editor"><h3>Customer shipment updates</h3><p>Saved here, shown on the customer order page. This does not change payment or confirm carrier collection.</p>';
        wp_nonce_field('aster_shipment_'.$order->get_id(),'aster_shipment_nonce');
        foreach (['carrier'=>'Carrier','tracking_number'=>'Tracking number','tracking_url'=>'Tracking URL','estimated_arrival'=>'Estimated arrival if confirmed','last_scan'=>'Latest update'] as $key=>$label) {
            echo '<p class="form-field form-field-wide"><label for="ae-ship-'.esc_attr($key).'">'.esc_html($label).'</label><input style="width:100%" id="ae-ship-'.esc_attr($key).'" name="aster_shipment['.esc_attr($key).']" type="'.($key==='tracking_url' ? 'url' : 'text').'" maxlength="'.($key==='tracking_url' ? 1000 : 160).'" value="'.esc_attr($data[$key] ?? '').'"></p>';
        }
        echo '<p class="form-field form-field-wide"><label for="ae-ship-events">Shipment updates JSON</label><textarea style="width:100%" rows="4" id="ae-ship-events" name="aster_shipment[events]">'.esc_textarea(wp_json_encode($data['events'] ?? [],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)).'</textarea><small>Up to 25 updates with label, detail and occurred_at. Enter confirmed facts only.</small></p></div>';
    }
    public static function save($id,$unused=null): void {
        if (!isset($_POST['aster_shipment'])) return;
        if (!current_user_can('edit_shop_order',$id) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['aster_shipment_nonce'] ?? '')),'aster_shipment_'.$id)) return;
        $data=is_array($_POST['aster_shipment']) ? self::normalize(wp_unslash($_POST['aster_shipment'])) : new WP_Error('shipment_invalid','Shipment fields are invalid.');
        if (is_wp_error($data)) { if (class_exists('WC_Admin_Meta_Boxes')) WC_Admin_Meta_Boxes::add_error($data->get_error_message().' Previous shipment details have been kept.'); return; }
        $order=wc_get_order($id);
        if (!$order) return;
        $order->update_meta_data(self::SHIPMENT,$data);
        $order->save_meta_data();
    }
    public static function html(WC_Order $order,bool $allow_payment,bool $embedded=false): string {
        ob_start(); require __DIR__.'/detail.php'; return ob_get_clean();
    }
    public static function preview(): void {
        if (untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '',PHP_URL_PATH) ?: '') !== '/aster-preview') return;
        nocache_headers(); header('X-Robots-Tag: noindex, nofollow');
        $fixtures=get_option('aster_phase_one_fixtures',[]);
        $scenario=sanitize_key($_GET['order'] ?? '');
        if ($scenario!=='' && isset($fixtures[$scenario])) {
            $preview_order=wc_get_order((int)$fixtures[$scenario]);
            if (self::fixture($preview_order)) { status_header(200);require __DIR__.'/preview-order.php';exit; }
        }
        if ($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['open_checkout'])) {
            if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['_wpnonce'] ?? '')),'aster_preview_checkout')) wp_die('Reload the local preview and try again.',403);
            $product_id=(int)get_option('aster_phase_one_product');
            $cart=WC()->cart;
            if (!$cart || !$product_id) wp_die('Local preview fixtures are not ready.');
            foreach ($cart->get_cart() as $line) if ((int)$line['product_id']!==$product_id) {
                wp_safe_redirect(add_query_arg(['aster_interface_review'=>'1','aster_preview_existing_bag'=>'1'],wc_get_checkout_url()));exit;
            }
            if ($cart->is_empty()) $cart->add_to_cart($product_id,1);
            WC()->session->set_customer_session_cookie(true);
            wp_safe_redirect(add_query_arg('aster_interface_review','1',wc_get_checkout_url())); exit;
        }
        status_header(200); require __DIR__.'/index.php';exit;
    }
}
