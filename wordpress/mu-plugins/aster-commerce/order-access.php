<?php
defined('ABSPATH') || exit;

/** Read-only, email-bound order access. Never creates a login or changes payment state. */
final class Aster_Order_Access {
    const COOKIE = 'aster_order_access';
    const LINK_TTL = 900;
    const SESSION_TTL = 900;

    public static function table(string $suffix): string {
        global $wpdb;
        return $wpdb->prefix . 'aster_' . $suffix;
    }

    public static function install(): void {
        if (get_option('aster_access_schema') === '1') return;
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $charset = $wpdb->get_charset_collate();
        $tokens = self::table('access_tokens');
        $rates = self::table('access_rates');
        dbDelta("CREATE TABLE $tokens (
            token_hash char(64) NOT NULL,
            kind varchar(12) NOT NULL,
            order_id bigint(20) unsigned NOT NULL,
            email_hash char(64) NOT NULL,
            created_at bigint(20) NOT NULL,
            expires_at bigint(20) NOT NULL,
            consumed_at bigint(20) DEFAULT NULL,
            PRIMARY KEY  (token_hash),
            KEY expiry (expires_at),
            KEY email (email_hash)
        ) $charset;");
        dbDelta("CREATE TABLE $rates (
            bucket_hash char(64) NOT NULL,
            hits int unsigned NOT NULL,
            expires_at bigint(20) NOT NULL,
            PRIMARY KEY  (bucket_hash),
            KEY expiry (expires_at)
        ) $charset;");
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($tokens))) !== $tokens || $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($rates))) !== $rates) throw new RuntimeException('Order access schema unavailable.');
        update_option('aster_access_schema', '1', false);
    }

    public static function email_hash(string $email): string {
        return hash_hmac('sha256', strtolower(trim($email)), wp_salt('auth'));
    }

    public static function limit(string $scope, int $maximum, int $seconds): bool {
        global $wpdb;
        $now = time();
        $key = hash_hmac('sha256', $scope, wp_salt('nonce'));
        $table = self::table('access_rates');
        // Window starts at the first attempt, not a wall-clock boundary (avoids double bursts).
        $ok = $wpdb->query($wpdb->prepare("INSERT INTO $table (bucket_hash,hits,expires_at) VALUES (%s,1,%d) ON DUPLICATE KEY UPDATE hits=IF(expires_at<=%d,1,hits+1), expires_at=IF(expires_at<=%d,%d,expires_at)", $key, $now + $seconds, $now, $now, $now + $seconds));
        if ($ok === false) return false;
        return (int) $wpdb->get_var($wpdb->prepare("SELECT hits FROM $table WHERE bucket_hash=%s", $key)) <= $maximum;
    }

    public static function eligible($order, string $email_hash): bool {
        return $order instanceof WC_Order && $order->get_type() === 'shop_order'
            && !in_array($order->get_status(), ['checkout-draft', 'auto-draft', 'trash'], true)
            && is_email($order->get_billing_email())
            && hash_equals(self::email_hash($order->get_billing_email()), $email_hash);
    }

    public static function summary(WC_Order $order): array {
        $items = [];
        foreach ($order->get_items() as $item) $items[] = ['name' => $item->get_name(), 'quantity' => $item->get_quantity(), 'line_total' => (string) $item->get_total()];
        return apply_filters('aster_order_access_summary', [
            'order_number' => (string) $order->get_order_number(),
            'created_at' => $order->get_date_created() ? $order->get_date_created()->date(DATE_ATOM) : null,
            'status' => $order->get_status(), 'status_label' => wc_get_order_status_name($order->get_status()),
            'currency' => $order->get_currency(), 'total' => (string) $order->get_total(),
            'shipping_total' => (string) $order->get_shipping_total(), 'tax_total' => (string) $order->get_total_tax(),
            'refunded_total' => (string) $order->get_total_refunded(), 'items' => $items,
        ], $order);
    }

    public static function issue(int $order_id, string $email_hash, string $kind = 'link'): string {
        global $wpdb;
        if (!in_array($kind, ['link', 'session'], true) || !self::eligible(wc_get_order($order_id), $email_hash)) throw new InvalidArgumentException('Order access unavailable.');
        $raw = bin2hex(random_bytes(32));
        $ok = $wpdb->insert(self::table('access_tokens'), [
            'token_hash' => hash('sha256', $raw), 'kind' => $kind,
            'order_id' => $order_id, 'email_hash' => $email_hash,
            'created_at' => time(), 'expires_at' => time() + ($kind === 'link' ? self::LINK_TTL : self::SESSION_TTL),
        ]);
        if (!$ok) throw new RuntimeException('Order access storage unavailable.');
        return $raw;
    }

    public static function record(string $raw, string $kind): ?object {
        global $wpdb;
        if (!preg_match('/^[a-f0-9]{64}$/D', $raw)) return null;
        $table = self::table('access_tokens');
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE token_hash=%s AND kind=%s AND expires_at>%d AND consumed_at IS NULL", hash('sha256', $raw), $kind, time()));
        return $row && self::eligible(wc_get_order((int) $row->order_id), $row->email_hash) ? $row : null;
    }

    public static function exchange(string $raw): ?string {
        global $wpdb;
        $row = self::record($raw, 'link');
        if (!$row) return null;
        $table = self::table('access_tokens');
        // Only one concurrent request may consume a link. Fail closed if session insert fails.
        $changed = $wpdb->query($wpdb->prepare("UPDATE $table SET consumed_at=%d WHERE token_hash=%s AND consumed_at IS NULL AND expires_at>%d", time(), $row->token_hash, time()));
        if ($changed !== 1) return null;
        return self::issue((int) $row->order_id, $row->email_hash, 'session');
    }

    public static function deliver(int $order_id, string $email_hash): void {
        // Worker receives a keyed digest, never the entered address or a bearer token.
        $order = wc_get_order($order_id);
        if (!self::eligible($order, $email_hash)) return;
        $raw = self::issue($order_id, $email_hash);
        $url = apply_filters('aster_order_access_link_url', home_url('/order-status/') . '#access=' . $raw, $raw);
        $sent = wp_mail($order->get_billing_email(), 'Aster Edit — your order access link',
            "You requested read-only access to an Aster Edit order.\nOpen the link, then choose View order.\nThis single-use link expires in 15 minutes. Do not forward it.\n\n" . $url . "\n\nIf you did not request this, ignore this email. No payment or account changes were made.");
        if (!$sent) {
            global $wpdb;
            $wpdb->delete(self::table('access_tokens'), ['token_hash' => hash('sha256', $raw)]);
            error_log('Aster: order access mail handoff failed; link revoked.');
        }
    }

    public static function cleanup(): void {
        global $wpdb;
        foreach (['access_tokens', 'access_rates'] as $suffix) {
            $table = self::table($suffix);
            $wpdb->query($wpdb->prepare("DELETE FROM $table WHERE expires_at<=%d", time()));
        }
    }

    public static function guard(WP_REST_Request $request) {
        if (wp_get_environment_type() !== 'local' && !is_ssl()) return new WP_Error('aster_tls_required', 'Secure connection required.', ['status' => 503]);
        if ($request->get_method() === 'GET') return true;
        $origin = $request->get_header('origin');
        $site = wp_parse_url(home_url());
        $expected = $site['scheme'] . '://' . $site['host'] . (isset($site['port']) ? ':' . $site['port'] : '');
        if ($origin !== $expected) return new WP_Error('aster_origin', 'Same-origin request required.', ['status' => 403]);
        if (strtolower(trim(explode(';', $request->get_header('content-type'))[0])) !== 'application/json' || strlen($request->get_body()) > 2048) return new WP_Error('aster_request', 'Small JSON request required.', ['status' => 400]);
        $body = $request->get_json_params();
        if (!is_array($body)) return new WP_Error('aster_request', 'JSON object required.', ['status' => 400]);
        return true;
    }

    public static function cookie(string $token, int $age): string {
        return self::COOKIE . '=' . $token . '; Path=/; Max-Age=' . $age . '; HttpOnly; SameSite=Strict' . (is_ssl() ? '; Secure' : '');
    }

    public static function routes(): void {
        $guard = [self::class, 'guard'];
        register_rest_route('aster/v1', '/order-access/lookup', ['methods' => 'POST', 'permission_callback' => $guard, 'callback' => function ($request) {
            if (aster_customer_mail_ready() && wp_get_environment_type() !== 'local') return new WP_Error('aster_lookup_unavailable', 'Use the private email access link.', ['status' => 503]);
            $body = $request->get_json_params();
            $number = $body['order_number'] ?? '';
            $email = $body['email'] ?? '';
            if (array_diff(array_keys($body), ['order_number', 'email']) || !is_string($number) || !preg_match('/^[1-9][0-9]{0,14}$/D', $number) || !is_string($email) || strlen($email) > 254 || !is_email($email)) return new WP_Error('aster_fields', 'Enter your order number and checkout email address.', ['status' => 400]);
            $digest = self::email_hash($email);
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $ip_ok = self::limit('lookup-ip:' . $ip, 20, 900);
            $pair_ok = self::limit('lookup-pair:' . $number . ':' . $digest, 3, 900);
            $order_ok = self::limit('lookup-order:' . $number, 5, 900);
            if (!$ip_ok || !$pair_ok || !$order_ok) return new WP_Error('aster_lookup', 'Order details could not be found. Check your information or contact support.', ['status' => 404]);
            $order = wc_get_order((int) $number);
            if (!self::eligible($order, $digest) || (string) $order->get_order_number() !== $number) return new WP_Error('aster_lookup', 'Order details could not be found. Check your information or contact support.', ['status' => 404]);
            return new WP_REST_Response(self::summary($order));
        }]);
        register_rest_route('aster/v1', '/order-access-requests', ['methods' => 'POST', 'permission_callback' => $guard, 'callback' => function ($request) {
            if (!aster_customer_mail_ready()) return new WP_Error('aster_mail_unavailable', 'Email order access is temporarily unavailable. Please contact support.', ['status' => 503]);
            $body = $request->get_json_params();
            $number = $body['order_number'] ?? '';
            $email = $body['email'] ?? '';
            if (array_diff(array_keys($body), ['order_number', 'email']) || !is_string($number) || !preg_match('/^[1-9][0-9]{0,14}$/D', $number) || !is_string($email) || strlen($email) > 254 || !is_email($email)) return new WP_Error('aster_fields', 'Enter your order number and email address.', ['status' => 400]);
            $digest = self::email_hash($email);
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown'; // Never trust an arbitrary forwarded header.
            $ip_ok = self::limit('request-ip:' . $ip, 20, 900);
            $pair_ok = self::limit('request-pair:' . $number . ':' . $digest, 3, 900);
            $order_ok = self::limit('request-order:' . $number, 5, 900);
            // Suppress over-limit messages using the SAME response, without revealing order existence.
            if ($ip_ok && $pair_ok && $order_ok) {
                if (!function_exists('as_enqueue_async_action')) return new WP_Error('aster_queue', 'Please try again later.', ['status' => 503]);
                if (!as_enqueue_async_action('aster_deliver_order_access', [(int) $number, $digest], 'aster-order-access')) return new WP_Error('aster_queue', 'Please try again later.', ['status' => 503]);
            }
            return new WP_REST_Response(['message' => 'If these details match an order, an access link will be sent to its email address. Please allow a few minutes.'], 202);
        }]);
        register_rest_route('aster/v1', '/order-access/exchange', ['methods' => 'POST', 'permission_callback' => $guard, 'callback' => function ($request) {
            $body = $request->get_json_params();
            if (array_diff(array_keys($body), ['token']) || !is_string($body['token'] ?? null)) return new WP_Error('aster_fields', 'Invalid access link.', ['status' => 400]);
            if (!self::limit('exchange-ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 60, 900)) return new WP_Error('aster_rate', 'Please try again later.', ['status' => 429]);
            $session = self::exchange($body['token']);
            if (!$session) return new WP_Error('aster_access', 'This link is invalid or expired. Request a new link.', ['status' => 401]);
            // Replacing a cookie also revokes its old server-side session.
            self::revoke_cookie();
            $response = new WP_REST_Response(['expires_in' => self::SESSION_TTL]);
            $response->header('Set-Cookie', self::cookie($session, self::SESSION_TTL));
            return $response;
        }]);
        register_rest_route('aster/v1', '/order-access/order', ['methods' => 'GET', 'permission_callback' => $guard, 'callback' => function ($request) {
            if ($request->get_query_params()) return new WP_Error('aster_scope', 'Order access is scoped by the verified session.', ['status' => 400]);
            $row = self::record(is_string($_COOKIE[self::COOKIE] ?? null) ? $_COOKIE[self::COOKIE] : '', 'session');
            if (!$row) return new WP_Error('aster_access', 'Request a new access link.', ['status' => 401]);
            $order = wc_get_order((int) $row->order_id);
            return new WP_REST_Response(self::summary($order));
        }]);
        register_rest_route('aster/v1', '/order-access/logout', ['methods' => 'POST', 'permission_callback' => $guard, 'callback' => function () {
            self::revoke_cookie();
            $response = new WP_REST_Response(['signed_out' => true]);
            $response->header('Set-Cookie', self::cookie('', 0));
            return $response;
        }]);
    }

    public static function revoke_cookie(): void {
        global $wpdb;
        $raw = $_COOKIE[self::COOKIE] ?? '';
        if (is_string($raw) && preg_match('/^[a-f0-9]{64}$/D', $raw)) $wpdb->delete(self::table('access_tokens'), ['token_hash' => hash('sha256', $raw), 'kind' => 'session']);
    }
}

add_action('init', [Aster_Order_Access::class, 'install']);
add_action('init', function () {
    if (!wp_next_scheduled('aster_access_cleanup')) wp_schedule_event(time() + HOUR_IN_SECONDS, 'hourly', 'aster_access_cleanup');
});
add_action('aster_access_cleanup', [Aster_Order_Access::class, 'cleanup']);
add_action('aster_deliver_order_access', [Aster_Order_Access::class, 'deliver'], 10, 2);
add_action('woocommerce_after_order_object_save', function ($order) {
    if (!$order instanceof WC_Order || $order->get_type() !== 'shop_order') return;
    global $wpdb;
    $table = Aster_Order_Access::table('access_tokens');
    $wpdb->query($wpdb->prepare("DELETE FROM $table WHERE order_id=%d AND email_hash<>%s", $order->get_id(), Aster_Order_Access::email_hash($order->get_billing_email())));
});
add_action('rest_api_init', [Aster_Order_Access::class, 'routes']);
add_filter('rest_post_dispatch', function ($response, $server, $request) {
    if (str_starts_with($request->get_route(), '/aster/v1/order-access')) {
        $response->header('Cache-Control', 'no-store, private');
        $response->header('Referrer-Policy', 'no-referrer');
        $response->header('X-Content-Type-Options', 'nosniff');
    }
    return $response;
}, 10, 3);
add_filter('rest_pre_serve_request', function ($served, $result, $request) {
    if (str_starts_with($request->get_route(), '/aster/v1/order-access')) {
        // These endpoints are intentionally not a cross-origin storefront API.
        header_remove('Access-Control-Allow-Origin');
        header_remove('Access-Control-Allow-Credentials');
    }
    return $served;
}, 20, 3);
add_filter('wp_privacy_personal_data_erasers', function ($erasers) {
    $erasers['aster-order-access'] = ['eraser_friendly_name' => 'Aster temporary order access', 'callback' => function ($email, $page = 1) {
        global $wpdb;
        $deleted = $wpdb->delete(Aster_Order_Access::table('access_tokens'), ['email_hash' => Aster_Order_Access::email_hash($email)]);
        return ['items_removed' => $deleted > 0, 'items_retained' => $deleted === false, 'messages' => $deleted === false ? ['Temporary access records could not be erased. Retry required.'] : [], 'done' => true];
    }];
    return $erasers;
});

add_action('template_redirect', function () {
    if (untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH)) !== untrailingslashit(wp_parse_url(home_url('/order-status/'), PHP_URL_PATH))) return;
    status_header(200);
    nocache_headers();
    header('X-Robots-Tag: noindex, nofollow');
    header('Referrer-Policy: no-referrer');
    $preview_images = function_exists('aster_phase_one_enabled') && aster_phase_one_enabled() ? "; img-src 'self' ".implode(' ',aster_local_storefront_origins()) : '';
    header("Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" . $preview_images);
    header('X-Content-Type-Options: nosniff');
    require __DIR__ . '/order-status.php';
    exit;
}, 0);
