<?php
defined('ABSPATH') || exit;
/** Purchase/item-bound review intake, adapted from JWK's access/moderation model. */
final class Aster_Customer_Reviews {
    const COOKIE='aster_review_access';
    const SOURCE='aster-purchase-review-v1';
    public static function register(): void {
        add_action('rest_api_init',[self::class,'routes']);
        add_filter('rest_post_dispatch',static function ($response,$server,$r) {
            if (str_starts_with($r->get_route(),'/aster/v1/reviews') || str_starts_with($r->get_route(),'/aster/v1/account/')) {
                $response->header('Cache-Control','private, no-store');$response->header('Referrer-Policy','no-referrer');
            }
            return $response;
        },10,3);
        add_filter('rest_pre_serve_request',static function ($served,$result,$r) {
            if (str_starts_with($r->get_route(),'/aster/v1/reviews') || str_starts_with($r->get_route(),'/aster/v1/account/')) {
                header_remove('Access-Control-Allow-Origin');header_remove('Access-Control-Allow-Credentials');
                if ($r->get_route()==='/aster/v1/reviews' && $r->get_method()==='GET' && get_http_origin()==='https://asteredit.com') { header('Access-Control-Allow-Origin: '.get_http_origin());header('Vary: Origin',false); }
            }
            return $served;
        },30,3);
        add_action('woocommerce_view_order',static function ($id) {
            $order=wc_get_order($id);
            if (self::eligible($order) && $order->get_customer_id()===get_current_user_id()) { $items=self::items($order);echo '<section class="ae-account-claim"><h2>Share your experience.</h2><p>Review the pieces in this order. Every review is checked before publication.</p><a href="'.esc_url(add_query_arg(['order'=>$id,'product'=>$items[0]['product'] ?? 0],Aster_Customer_Care::url('reviews'))).'">Write a purchase review →</a></section>'; }
        },30);
        add_action('add_meta_boxes_comment',static function ($comment) {
            if (get_comment_meta($comment->comment_ID,'_aster_review_source',true)!==self::SOURCE) return;
            add_meta_box('aster-review-proof','Aster purchase review',[self::class,'moderation'],'comment','normal','high');
        });
    }
    public static function eligible($order): bool {
        if (!$order instanceof WC_Order || !$order->get_date_paid() || !$order->has_status(['processing','completed','refunded'])) return false;
        // Refunds do not remove a purchaser's right to describe their experience.
        if ($order->get_meta('_aster_fixture')) return false;
        $record=class_exists('Aster\\Checkout\\PaymentAttemptRepository') ? (new \Aster\Checkout\PaymentAttemptRepository())->findByOrderId($order->get_id()) : null;
        return ($record['customer_state'] ?? '')==='completed';
    }
    public static function issue(WC_Order $order,string $kind,int $ttl): string {
        if (!self::eligible($order)) throw new InvalidArgumentException('Purchase unavailable.');
        global $wpdb; $raw=bin2hex(random_bytes(32));
        $ok=$wpdb->insert(Aster_Order_Access::table('access_tokens'),['token_hash'=>hash('sha256',$raw),'kind'=>$kind,'order_id'=>$order->get_id(),'email_hash'=>Aster_Order_Access::email_hash($order->get_billing_email()),'created_at'=>time(),'expires_at'=>time()+$ttl]);
        if (!$ok) throw new RuntimeException('Review access unavailable.');return $raw;
    }
    public static function record(string $raw,string $kind) {
        $row=Aster_Order_Access::record($raw,$kind);
        return $row && self::eligible(wc_get_order((int)$row->order_id)) ? $row : null;
    }
    public static function invite(WC_Order $order): bool {
        if (!aster_customer_care_mail_ready() || !self::eligible($order)) return false;
        $raw=self::issue($order,'review-link',30*DAY_IN_SECONDS);
        $items=self::items($order);$params=['product'=>$items[0]['product'] ?? 0];
        $url=add_query_arg($params,Aster_Customer_Care::url('reviews')).'#review='.$raw;
        $message='<p>Share your experience with the pieces you purchased from Aster Edit.</p><p><a href="'.esc_url($url).'">Write a purchase review</a></p><p>This private, single-use link expires in 30 days. It does not sign you in. Reviews and optional photos are moderated before publication. No reward or positive rating is required.</p>';
        $sent=wc_mail($order->get_billing_email(),'Aster Edit · Review your purchase',WC()->mailer()->wrap_message('How are your pieces?', $message),['Content-Type: text/html; charset=UTF-8','Reply-To: Aster Edit <support@example.test>']);
        if (!$sent) { global $wpdb; $wpdb->delete(Aster_Order_Access::table('access_tokens'),['token_hash'=>hash('sha256',$raw)]); }
        return (bool)$sent;
    }
    public static function guard(WP_REST_Request $r) {
        if ($r->get_method()==='GET') return true;
        $origin=wp_parse_url(home_url());$expected=$origin['scheme'].'://'.$origin['host'].(isset($origin['port']) ? ':'.$origin['port'] : '');
        if ($r->get_header('origin')!==$expected) return new WP_Error('aster_origin','Same-origin request required.',['status'=>403]);
        if (strtolower(trim(explode(';',$r->get_header('content-type'))[0]))!=='application/json' || strlen($r->get_body())>17500000 || !is_array($r->get_json_params())) return new WP_Error('aster_payload','Use a small JSON request with up to six photos.',['status'=>400]);
        return true;
    }
    public static function access(WP_REST_Request $r): ?WC_Order {
        $row=self::record(is_string($_COOKIE[self::COOKIE] ?? null) ? $_COOKIE[self::COOKIE] : '', 'review');
        if ($row) return wc_get_order((int)$row->order_id);
        $row=Aster_Order_Access::record(is_string($_COOKIE[Aster_Order_Access::COOKIE] ?? null) ? $_COOKIE[Aster_Order_Access::COOKIE] : '', 'session');
        if ($row && self::eligible($order=wc_get_order((int)$row->order_id))) return $order;
        if (is_user_logged_in() && wp_verify_nonce($r->get_header('X-WP-Nonce'),'wp_rest')) {
            $order=wc_get_order(absint($r->get_param('order')));
            if (self::eligible($order) && $order->get_customer_id()===get_current_user_id()) return $order;
        }
        return null;
    }
    public static function variant(WC_Order_Item_Product $item): string {
        $label=wp_strip_all_tags(wc_display_item_meta($item,['echo'=>false]));if (trim($label)!=='') return $label;
        $product=$item->get_product();$key=(string)($item->get_meta('_aster_catalog_key') ?: ($product ? $product->get_meta('_aster_catalog_key') : ''));
        return ['rolling-bead-cup:purple-grey'=>'Purple-grey','rolling-bead-cup:olive'=>'Olive','rolling-bead-cup:deep-green'=>'Deep green'][$key] ?? '';
    }
    public static function items(WC_Order $order): array {
        $items=[];
        foreach ($order->get_items() as $id=>$item) {
            $key=hash('sha256',$order->get_id().':'.$id);
            $items[]=['id'=>$id,'name'=>$item->get_name(),'variant'=>self::variant($item),'product'=>$item->get_product_id(),'image'=>self::image($item->get_product()),'reviewed'=>(bool)get_option('aster_review_'.$key)];
        }
        return $items;
    }
    public static function image($product): string {
        if (!$product instanceof WC_Product) return '';
        return (string)(aster_storefront_product_image((string)$product->get_meta('_aster_catalog_key')) ?: wp_get_attachment_image_url($product->get_image_id(),'woocommerce_thumbnail') ?: '');
    }
    public static function routes(): void {
        $guard=[self::class,'guard'];
        register_rest_route('aster/v1','/reviews/access',['methods'=>'POST','permission_callback'=>$guard,'callback'=>static function ($r) {
            $raw=$r->get_param('token');
            if (!is_string($raw) || !Aster_Order_Access::limit('review-exchange:'.($_SERVER['REMOTE_ADDR'] ?? ''),60,900)) return new WP_Error('aster_access','Request a fresh review link.',['status'=>401]);
            $row=self::record($raw,'review-link');if (!$row) return new WP_Error('aster_access','This review link has expired or was already used. Request a new link.',['status'=>401]);
            global $wpdb;$table=Aster_Order_Access::table('access_tokens');
            if ($wpdb->query($wpdb->prepare("UPDATE $table SET consumed_at=%d WHERE token_hash=%s AND consumed_at IS NULL AND expires_at>%d",time(),$row->token_hash,time()))!==1) return new WP_Error('aster_access','Request a fresh review link.',['status'=>401]);
            $session=self::issue(wc_get_order((int)$row->order_id),'review',1800);
            $old=$_COOKIE[self::COOKIE] ?? '';
            if (is_string($old)) $wpdb->delete($table,['token_hash'=>hash('sha256',$old),'kind'=>'review']);
            $response=new WP_REST_Response(['message'=>'Your purchase is verified.']);
            $response->header('Set-Cookie',self::COOKIE.'='.$session.'; Path=/; Max-Age=1800; HttpOnly; SameSite=Strict'.(is_ssl()?'; Secure':''));return $response;
        }]);
        register_rest_route('aster/v1','/reviews/purchase',['methods'=>'GET','permission_callback'=>$guard,'callback'=>static function ($r) {
            $order=self::access($r);if (!$order) return new WP_Error('aster_purchase','Open a private review link or sign in to the purchasing account.',['status'=>401]);
            return ['order'=>$order->get_order_number(),'items'=>self::items($order),'test_only'=>false];
        }]);
        register_rest_route('aster/v1','/reviews/request-link',['methods'=>'POST','permission_callback'=>$guard,'callback'=>static function ($r) {
            if (!aster_customer_care_mail_ready()) return new WP_Error('aster_mail_unavailable','Review-link emails are currently unavailable. Sign in to the purchasing account or contact customer care.',['status'=>503]);
            $email=$r->get_param('email');$number=$r->get_param('order_number');
            if (!is_string($email) || strlen($email)>254 || !is_email($email) || !is_string($number) || !preg_match('/^[1-9][0-9]{0,14}$/D',$number)) return new WP_Error('aster_fields','Enter your order number and checkout email.',['status'=>400]);
            $digest=Aster_Order_Access::email_hash($email);
            $ip_ok=Aster_Order_Access::limit('review-request:'.($_SERVER['REMOTE_ADDR'] ?? ''),20,900);
            $pair_ok=Aster_Order_Access::limit('review-request-pair:'.$number.':'.$digest,3,900);
            $order=wc_get_order((int)$number);
            if ($ip_ok && $pair_ok && Aster_Order_Access::eligible($order,$digest) && self::eligible($order)) self::invite($order);
            return new WP_REST_Response(['message'=>'If these details match an eligible purchase, a private review link will be sent to its checkout email.'],202);
        }]);
        register_rest_route('aster/v1','/reviews',['methods'=>'POST','permission_callback'=>$guard,'callback'=>[self::class,'submit']]);
        register_rest_route('aster/v1','/reviews',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>[self::class,'listing']]);
    }
    public static function submit(WP_REST_Request $r) {
        $order=self::access($r);if (!$order) return new WP_Error('aster_purchase','Verify your purchase before sending a review.',['status'=>403]);
        $item=$order->get_item(absint($r->get_param('item')));
        if (!$item instanceof WC_Order_Item_Product || $item->get_order_id()!==$order->get_id()) return new WP_Error('aster_item','Choose a piece from this purchase.',['status'=>400]);
        $body=$r->get_json_params();$name=$body['name'] ?? '';$text=$body['text'] ?? '';$rating=$body['rating'] ?? null;
        if (!is_string($name) || !is_string($text) || mb_strlen(trim($name))<2 || mb_strlen($name)>60 || mb_strlen(trim($text))<10 || mb_strlen($text)>2000 || !is_int($rating) || $rating<1 || $rating>5 || ($body['consent'] ?? false)!==true) return new WP_Error('aster_fields','Add a name (2–60 characters), rating, review (10–2000 characters) and permission to publish.',['status'=>400]);
        $photos=Aster_Customer_Review_Photos::validate($body['photos'] ?? [],($body['photo_consent'] ?? false)===true);
        if (is_wp_error($photos)) return $photos;
        $fingerprint=hash('sha256',wp_json_encode([$name,$text,$rating,array_map(static fn($p)=>hash('sha256',$p['bytes']),$photos)]));
        $key='aster_review_'.hash('sha256',$order->get_id().':'.$item->get_id());
        $existing=get_option($key);
        if ($existing) return $existing['fingerprint']===$fingerprint ? new WP_REST_Response(['message'=>'Your review is received and awaiting moderation.'],200) : new WP_Error('aster_duplicate','A review has already been received for this piece and order.',['status'=>409]);
        if (!add_option($key,['fingerprint'=>$fingerprint,'comment'=>0],'','no')) return new WP_Error('aster_busy','This review is being received. Please wait, then try again.',['status'=>409]);
        $id=0;
        try {
            $id=wp_insert_comment(['comment_post_ID'=>$item->get_product_id(),'comment_author'=>sanitize_text_field($name),'comment_author_email'=>$order->get_billing_email(),'comment_content'=>sanitize_textarea_field($text),'comment_type'=>'review','comment_approved'=>0,'user_id'=>$order->get_customer_id(),'comment_author_IP'=>'','comment_agent'=>'']);
            if (!$id) throw new RuntimeException('Review could not be saved.');
            foreach (['rating'=>$rating,'verified'=>1,'_aster_review_source'=>self::SOURCE,'_aster_review_order'=>$order->get_id(),'_aster_review_item'=>$item->get_id(),'_aster_review_variant'=>self::variant($item),'_aster_review_consent'=>'public-v1','_aster_review_photo_consent'=>$photos ? 'photos-v1' : 'none','_aster_review_consented_at'=>gmdate(DATE_ATOM),'_aster_review_original'=>['name'=>$name,'text'=>$text,'rating'=>$rating],'_aster_review_photo_pending'=>1,'_aster_review_test'=>'no'] as $k=>$v) update_comment_meta($id,$k,$v);
            Aster_Customer_Review_Photos::save($photos,$id,$item->get_product_id());
            update_comment_meta($id,'_aster_review_photo_pending',0);
            update_option($key,['fingerprint'=>$fingerprint,'comment'=>$id],false);
            return new WP_REST_Response(['message'=>'Thank you. Your purchase review is received and awaiting moderation. It is not public yet.'],201);
        } catch (Throwable $e) {
            if ($id) { foreach ((array)get_comment_meta($id,'_aster_review_photos',true) as $photo) wp_delete_attachment((int)$photo,true);wp_delete_comment($id,true); }
            delete_option($key);return new WP_Error('aster_save','Your review could not be saved. Please try again.',['status'=>503]);
        }
    }
    public static function listing(WP_REST_Request $r) {
        $product=absint($r->get_param('product'));$page=max(1,min(100,absint($r->get_param('page') ?: 1)));
        $group=[];
        if ($r->get_param('group')==='rolling-bead-cup') foreach(['purple-grey','olive','deep-green'] as $colour) foreach(wc_get_products(['limit'=>1,'status'=>['publish'],'meta_key'=>'_aster_catalog_key','meta_value'=>'rolling-bead-cup:'.$colour]) as $p) $group[]=$p->get_id();
        $p=$product ? wc_get_product($product) : null;
        if ((!$p || $p->get_status()!=='publish' || $p->get_meta('_aster_fixture')) && !$group) return ['count'=>0,'reviews'=>[],'average'=>null];
        $args=['post_id'=>$product,'type'=>'review','status'=>'approve','meta_query'=>[['key'=>'_aster_review_source','value'=>self::SOURCE],['key'=>'_aster_review_photo_pending','value'=>'0'],['key'=>'_aster_review_test','value'=>'no']]];
        if($group){unset($args['post_id']);$args['post__in']=$group;}
        $count=(int)get_comments(array_merge($args,['count'=>true]));
        $all=$count ? get_comments(array_merge($args,['fields'=>'ids'])) : [];$sum=0;
        foreach ($all as $id) $sum+=(int)get_comment_meta($id,'rating',true);
        $reviews=[];
        foreach (get_comments(array_merge($args,['number'=>6,'offset'=>($page-1)*6,'orderby'=>'comment_date_gmt','order'=>'DESC'])) as $c) $reviews[]=['id'=>(int)$c->comment_ID,'name'=>$c->comment_author,'text'=>$c->comment_content,'rating'=>(int)get_comment_meta($c->comment_ID,'rating',true),'date'=>get_comment_date('F j, Y',$c),'variant'=>get_comment_meta($c->comment_ID,'_aster_review_variant',true),'verified'=>true,'test_only'=>get_comment_meta($c->comment_ID,'_aster_review_test',true)==='yes','photos'=>Aster_Customer_Review_Photos::listing($c->comment_ID)];
        return ['count'=>$count,'average'=>$count ? round($sum/$count,1) : null,'reviews'=>$reviews,'page'=>$page,'has_more'=>$count>$page*6];
    }
    public static function moderation($comment): void {
        $id=$comment->comment_ID;$order=wc_get_order((int)get_comment_meta($id,'_aster_review_order',true));
        echo '<p>Purchase verified · '.esc_html(get_comment_meta($id,'_aster_review_variant',true)).' · Rating '.(int)get_comment_meta($id,'rating',true).'/5</p>';
        if ($order) echo '<p><a href="'.esc_url($order->get_edit_order_url()).'">Order #'.esc_html($order->get_order_number()).'</a></p>';
        if (get_comment_meta($id,'_aster_review_test',true)==='yes') echo '<p><strong>TEST ONLY · Synthetic local preview review</strong></p>';
        echo '<p>Publication and photo consent recorded. Use native Approve / Spam / Trash controls. Approval publishes the review and its attached photos together.</p>';
        foreach (Aster_Customer_Review_Photos::listing($id,true) as $photo) echo '<a href="'.esc_url($photo['full_url']).'"><img src="'.esc_url($photo['url']).'" width="120" alt="Review photo awaiting moderation"></a> ';
    }
}
