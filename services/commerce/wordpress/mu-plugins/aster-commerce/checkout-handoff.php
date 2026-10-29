<?php
defined('ABSPATH') || exit;

/** Short-lived selection transfer. Woo still owns cart totals, checkout and all payment writes. */
final class Aster_Checkout_Handoff {
    const TTL = 300;
    public static function table(): string { return Aster_Order_Access::table('handoffs'); }
    public static function digest(string $value): string { return hash_hmac('sha256', $value, wp_salt('auth')); }
    public static function origin(): string {
        $site = wp_parse_url(home_url());
        return $site['scheme'] . '://' . $site['host'] . (isset($site['port']) ? ':' . $site['port'] : '');
    }
    public static function origins(): array {
        if (wp_get_environment_type() === 'local') return array_merge([self::origin()],aster_local_storefront_origins());
        return self::remote_enabled() ? [self::origin(), 'https://asteredit.com'] : [];
    }
    public static function remote_enabled(): bool {
        $environment = wp_get_environment_type();
        return in_array($environment, ['staging', 'production'], true)
            && defined('ASTER_COMMERCE_ENV') && ASTER_COMMERCE_ENV === $environment
            && defined('ASTER_CHECKOUT_HANDOFF_ENABLED') && ASTER_CHECKOUT_HANDOFF_ENABLED === true
            && self::origin() === 'https://commerce.example.test';
    }
    public static function enabled(): bool {
        return wp_get_environment_type() === 'local' || self::remote_enabled();
    }
    /** Local first; the reviewed production release must opt in explicitly. */
    public static function direct_entry_enabled(): bool {
        return self::enabled() && (wp_get_environment_type() === 'local'
            || (defined('ASTER_SINGLE_CHECKOUT_ENABLED') && ASTER_SINGLE_CHECKOUT_ENABLED === true));
    }
    public static function entry_url(string $token, bool $direct_requested = false): string {
        $url = self::direct_entry_enabled() && $direct_requested
            ? add_query_arg('aster_handoff', '1', wc_get_checkout_url())
            : home_url('/checkout-handoff/');
        return $url . '#handoff=' . $token;
    }
    public static function install(): void {
        if (get_option('aster_handoff_schema') === '2') return;
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::table(); $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE $table (
            token_hash char(64) NOT NULL,
            items longtext NOT NULL,
            source varchar(24) NOT NULL DEFAULT 'unknown',
            expires_at bigint(20) NOT NULL,
            consumed_at bigint(20) DEFAULT NULL,
            session_hash char(64) DEFAULT NULL,
            review_hash char(64) DEFAULT NULL,
            proof_hash char(64) DEFAULT NULL,
            PRIMARY KEY  (token_hash),
            KEY expiry (expires_at)
        ) $charset;");
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) !== $table) throw new RuntimeException('Handoff storage unavailable.');
        if (!$wpdb->get_var($wpdb->prepare("SHOW COLUMNS FROM $table LIKE %s", 'source'))) throw new RuntimeException('Handoff source storage unavailable.');
        update_option('aster_handoff_schema', '2', false);
    }
    public static function cleanup(): void {
        global $wpdb;
        $wpdb->query($wpdb->prepare('DELETE FROM ' . self::table() . ' WHERE expires_at<=%d', time()));
    }
    public static function error(string $code, string $message, int $status = 400): WP_Error { return new WP_Error($code, $message, ['status' => $status]); }
    public static function resolve($items) {
        if (!is_array($items) || !array_is_list($items) || count($items) < 1 || count($items) > 20) return self::error('aster_items', 'Choose between 1 and 20 different pieces.');
        $rows = []; $seen = []; $total = 0;
        foreach ($items as $item) {
            if (!is_array($item) || count($item) !== 2 || array_diff(array_keys($item), ['catalog_key', 'quantity'])) return self::error('aster_fields', 'Only product references and quantities are accepted.');
            $key = $item['catalog_key'] ?? null; $qty = $item['quantity'] ?? null;
            if (!is_string($key) || !preg_match('/^[a-z0-9-]{1,80}:[a-z0-9-]{1,40}$/D', $key) || !is_int($qty) || $qty < 1 || $qty > 20 || isset($seen[$key])) return self::error('aster_quantity', 'Check the selected pieces and quantities.');
            $seen[$key] = true; $total += $qty;
            if ($total > 100) return self::error('aster_quantity', 'Please select no more than 100 pieces.');
            $fixture = wp_get_environment_type() === 'local' && $key === 'test-only:ceramic';
            $id = wc_get_product_id_by_sku($fixture ? 'ASTER-TEST-ONLY-001' : Aster_Catalog::sku($key));
            $p = $id ? wc_get_product($id) : null;
            if (!$p || (!$fixture && ($p->get_meta('_aster_catalog_key') !== $key || $p->get_meta('_aster_commerce_approved') !== 'yes')) || !$p->is_type('simple') || $p->get_status() !== 'publish' || $p->get_price() === '' || !$p->is_purchasable() || !$p->is_in_stock() || $p->backorders_allowed() || !$p->has_enough_stock($qty) || ($p->is_sold_individually() && $qty > 1)) return self::error('aster_unavailable', 'A selected piece is not available for checkout. Return to your selection.', 409);
            if (Aster_Bundle_Contract::is_bundle($p) && !Aster_Bundle_Contract::validate($p, $qty)) return self::error('aster_unavailable', 'A selected set is not available for checkout. Return to your selection.', 409);
            $rows[] = ['catalog_key' => $key, 'product_id' => $id, 'quantity' => $qty, 'name' => $p->get_name(), 'unit_price' => (string) $p->get_price(), 'bundle' => Aster_Bundle_Contract::cart_data($p)];
        }
        if (!Aster_Bundle_Contract::validate_selection($rows)) return self::error('aster_unavailable', 'A selected set or included piece is out of stock.', 409);
        return $rows;
    }
    public static function record(string $token): ?object {
        if (!preg_match('/^[a-f0-9]{64}$/D', $token)) return null;
        global $wpdb;
        return $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . self::table() . ' WHERE token_hash=%s AND consumed_at IS NULL AND expires_at>%d', self::digest($token), time()));
    }
    public static function guard(WP_REST_Request $request) {
        if (!in_array($request->get_header('origin'), self::origins(), true)) return self::error('aster_origin', 'Selection transfer is not enabled for this origin.', 403);
        if (strtolower(trim(explode(';', $request->get_header('content-type'))[0])) !== 'application/json' || strlen($request->get_body()) > 4096) return self::error('aster_request', 'A small JSON selection is required.');
        return true;
    }
    public static function client_ip(): string {
        $remote = $_SERVER['REMOTE_ADDR'] ?? '';
        $forwarded = $_SERVER['HTTP_X_ASTER_CHECKOUT_CLIENT_IP'] ?? '';
        // Only the private loopback virtual host can assert this overwritten
        // proxy header. Direct public commerce requests cannot spoof a bucket.
        return in_array($remote, ['127.0.0.1', '::1'], true) && (int)($_SERVER['SERVER_PORT'] ?? 0) === 8089
            && filter_var($forwarded, FILTER_VALIDATE_IP) ? $forwarded : $remote;
    }
    public static function routes(): void {
        register_rest_route('aster/v1', '/checkout-handoffs', ['methods' => 'POST', 'permission_callback' => [self::class, 'guard'], 'callback' => function ($request) {
            // Permission callbacks may be evaluated more than once by WordPress.
            if (!Aster_Order_Access::limit('handoff-create:' . self::client_ip(), 60, 300)) return self::error('aster_rate', 'Please try again in a few minutes.', 429);
            $body = $request->get_json_params();
            if (!is_array($body) || !in_array(array_keys($body), [['items'], ['items', 'source'], ['items', 'entry'], ['items', 'source', 'entry']], true)
                || (array_key_exists('entry', $body) && $body['entry'] !== 'checkout')) return self::error('aster_fields', 'Only the selection, source category and supported checkout entry are accepted.');
            $source = $body['source'] ?? 'unknown';
            if (!is_string($source) || Aster_Geo_Analytics::source($source) !== $source) return self::error('aster_source', 'Invalid source category.');
            $rows = self::resolve($body['items']);
            if (is_wp_error($rows)) return $rows;
            global $wpdb;
            $token = bin2hex(random_bytes(32));
            if (!$wpdb->insert(self::table(), ['token_hash' => self::digest($token), 'items' => wp_json_encode($body['items']), 'source' => $source, 'expires_at' => time() + self::TTL])) return self::error('aster_storage', 'Please try again later.', 503);
            Aster_Geo_Analytics::count('checkout_handoff', $source);
            return new WP_REST_Response(['handoff_url' => self::entry_url($token, ($body['entry'] ?? null) === 'checkout'), 'expires_in' => self::TTL], 201);
        }]);
    }
    /** Serialize requests before Woo reads session data; release only after its shutdown save.
     * Covers signed cookies and Woo's validated Store API Cart-Token/query session identities.
     */
    public static function lock_session(): void {
        if (!self::enabled() || (defined('WP_CLI') && WP_CLI) || !class_exists('WC_Session_Handler')) return;
        $ids = [];
        if (get_current_user_id()) $ids[] = (string) get_current_user_id();
        $cookie = (new WC_Session_Handler())->get_session_cookie();
        if ($cookie && (int) $cookie[1] > time()) $ids[] = (string) $cookie[0];
        foreach ([$_SERVER['HTTP_CART_TOKEN'] ?? '', $_GET['session'] ?? ''] as $token) {
            if (!is_string($token) || strlen($token) > 4096 || !$token) continue;
            $payload = \Automattic\WooCommerce\StoreApi\Utilities\CartTokenUtils::get_cart_token_payload($token);
            if (is_string($payload['user_id'] ?? null) && $payload['user_id'] !== '') $ids[] = $payload['user_id'];
        }
        $ids = array_unique($ids); sort($ids);
        global $wpdb;
        foreach ($ids as $id) {
            $lock = 'aster_cart_' . substr(self::digest($id), 0, 48);
            if ((int) $wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 3)', $lock)) !== 1) {
                nocache_headers(); header('Retry-After: 3');
                wp_die('Your bag is being updated. Please retry.', 'Please retry', ['response' => 503]);
            }
            add_action('shutdown', static function () use ($lock) { global $wpdb; $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $lock)); }, PHP_INT_MAX);
        }
    }
    public static function send_error(WP_Error $error): void {
        wp_send_json(['code' => $error->get_error_code(), 'message' => $error->get_error_message()], $error->get_error_data()['status'] ?? 400);
    }
    public static function ajax(): void {
        nocache_headers(); header('Cache-Control: no-store, private'); header('Referrer-Policy: no-referrer');
        if (!self::enabled()) self::send_error(self::error('aster_disabled', 'Checkout transfer is not enabled.', 503));
        // Same-origin native Woo AJAX preserves logged-in identity, unlike a nonce-less REST request.
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || ($_SERVER['HTTP_ORIGIN'] ?? '') !== self::origin()) self::send_error(self::error('aster_origin', 'Same-origin POST required.', 403));
        if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') self::send_error(self::error('aster_request', 'JSON required.'));
        $raw = file_get_contents('php://input', false, null, 0, 4097);
        $body = strlen($raw) <= 4096 ? json_decode($raw, true) : null;
        if (!is_array($body) || array_diff(array_keys($body), ['token', 'proof']) || !is_string($body['token'] ?? null)) self::send_error(self::error('aster_fields', 'Invalid selection link.'));
        if (!Aster_Order_Access::limit('handoff-exchange:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 120, 300)) self::send_error(self::error('aster_rate', 'Please try again later.', 429));
        $row = self::record($body['token']);
        if (!$row) self::send_error(self::error('aster_expired', 'This selection link has expired or was already used. Return to your selection.', 410));
        $rows = self::resolve(json_decode($row->items, true));
        if (is_wp_error($rows)) self::send_error($rows);
        if (!WC()->cart || !WC()->session) self::send_error(self::error('aster_session', 'Your bag could not be opened. Please retry.', 503));
        $session = self::digest((string) WC()->session->get_customer_id());
        $cart = WC()->cart->get_cart(); // Forces native persistent-cart restore before the empty check.
        // Woo's cart hash can change while its new session cookie is saved even
        // though the shopper's empty bag has not changed. Bind the proof to the
        // actual cart lines, selected products/prices, currency and coupons.
        $cart_state = [];
        foreach ($cart as $cart_key => $line) {
            $cart_product = $line['data'] ?? null;
            $cart_state[] = [
                $cart_key,
                (int) ($line['product_id'] ?? 0),
                (int) ($line['variation_id'] ?? 0),
                (int) ($line['quantity'] ?? 0),
                $cart_product instanceof WC_Product ? (string) $cart_product->get_price() : null,
            ];
        }
        $snapshot = self::digest(wp_json_encode([$rows, get_woocommerce_currency(), $cart_state, WC()->cart->get_applied_coupons()]));
        global $wpdb;
        $table = self::table();
        if (($_GET['wc-ajax'] ?? '') === 'aster_handoff_review') {
            if ($row->session_hash && !hash_equals($row->session_hash, $session)) self::send_error(self::error('aster_device', 'Open a new selection link on this device.', 409));
            $proof = bin2hex(random_bytes(32));
            $updated = $wpdb->query($wpdb->prepare("UPDATE $table SET session_hash=%s,review_hash=%s,proof_hash=%s WHERE token_hash=%s AND consumed_at IS NULL AND expires_at>%d AND (session_hash IS NULL OR session_hash=%s)", $session, $snapshot, self::digest($proof), $row->token_hash, time(), $session));
            if ($updated !== 1) self::send_error(self::error('aster_conflict', 'Please open a new selection link.', 409));
            WC()->session->set_customer_session_cookie(true);
            WC()->session->set('aster_handoff_opened', time());
            WC()->session->save_data();
            $existing = [];
            foreach ($cart as $line) {
                $cart_product = $line['data'] ?? null;
                if (!$cart_product instanceof WC_Product) continue;
                $catalog_key = $cart_product->get_meta('_aster_catalog_key');
                $existing[] = [
                    'name' => $cart_product->get_name(),
                    'quantity' => $line['quantity'],
                    'unit_price' => (string) $cart_product->get_price(),
                    'image_url' => is_string($catalog_key) ? aster_storefront_product_image($catalog_key) : null,
                ];
            }
            $selected_ids = array_map(static fn($line) => [(int) $line['product_id'], (int) $line['quantity']], $rows);
            $cart_ids = array_map(static fn($line) => [(int) $line['product_id'], (int) $line['quantity']], $cart);
            sort($selected_ids); sort($cart_ids);
            $same_selection = count($cart_ids) > 0 && $cart_ids === $selected_ids;
            wp_send_json(['items' => array_map(static function ($r) {
                $item = array_diff_key($r, ['product_id' => 1, 'bundle' => 1]);
                $item['image_url'] = aster_storefront_product_image($r['catalog_key']);
                return $item;
            }, $rows), 'currency' => get_woocommerce_currency(), 'existing_items' => $existing, 'can_continue' => !$cart, 'same_selection' => $same_selection, 'proof' => $proof, 'cart_url' => wc_get_cart_url(), 'checkout_url' => wc_get_checkout_url()]);
        }
        if (!is_string($body['proof'] ?? null) || !$row->session_hash || !hash_equals($row->session_hash, $session) || !$row->proof_hash || !hash_equals($row->proof_hash, self::digest($body['proof'])) || !$row->review_hash || !hash_equals($row->review_hash, $snapshot)) self::send_error(self::error('aster_changed', 'Your selection or bag changed. Review it again before continuing.', 409));
        // V1 never silently replaces or merges a non-empty native bag.
        if ($cart) self::send_error(self::error('aster_existing', 'Your existing bag has been kept. Review it before adding another selection.', 409));
        $won = $wpdb->query($wpdb->prepare("UPDATE $table SET consumed_at=%d WHERE token_hash=%s AND consumed_at IS NULL AND expires_at>%d", time(), $row->token_hash, time()));
        if ($won !== 1) self::send_error(self::error('aster_expired', 'This selection link was already used.', 410));
        if (!self::add_selection($rows)) self::send_error(self::error('aster_add_failed', 'The selection could not be added. Return to the shop and try again.', 409));
        WC()->session->set('aster_acquisition_source', Aster_Geo_Analytics::source($row->source ?? 'unknown'));
        WC()->session->save_data();
        Aster_Geo_Analytics::count('checkout_confirmed', Aster_Geo_Analytics::source($row->source ?? 'unknown'));
        wp_send_json(['checkout_url' => wc_get_checkout_url()]);
    }
    public static function add_selection(array $rows): bool {
        if (!WC()->cart->is_empty()) return false;
        try {
            foreach ($rows as $line) {
                if (!apply_filters('woocommerce_add_to_cart_validation', true, $line['product_id'], $line['quantity'])) throw new RuntimeException('Rejected selection.');
                $key = WC()->cart->add_to_cart($line['product_id'], $line['quantity'], 0, [], $line['bundle'] ?? []);
                if (!$key) throw new RuntimeException('Could not add piece.');
            }
            WC()->cart->calculate_totals();
            do_action('aster_checkout_handoff_committed');
            WC()->session->save_data();
        } catch (Throwable $e) {
            // Started empty under the session lock. Also catches a hook throwing after
            // Woo inserted a line but before add_to_cart returned its key.
            foreach (array_keys(WC()->cart->get_cart()) as $key) WC()->cart->remove_cart_item($key);
            WC()->cart->set_removed_cart_contents([]);
            WC()->cart->calculate_totals(); WC()->session->save_data();
            return false;
        }
        return true;
    }
}

add_action('init', [Aster_Checkout_Handoff::class, 'lock_session'], -100);
add_action('init', [Aster_Checkout_Handoff::class, 'install']);
add_action('aster_access_cleanup', [Aster_Checkout_Handoff::class, 'cleanup']);
add_action('rest_api_init', [Aster_Checkout_Handoff::class, 'routes']);
foreach (['review', 'confirm'] as $action) add_action('wc_ajax_aster_handoff_' . $action, [Aster_Checkout_Handoff::class, 'ajax']);
add_filter('rest_post_dispatch', function ($response, $server, $request) {
    if ($request->get_route() === '/aster/v1/checkout-handoffs') $response->header('Cache-Control', 'no-store, private');
    return $response;
}, 10, 3);
add_filter('rest_pre_serve_request', function ($served, $result, $request) {
    if ($request->get_route() !== '/aster/v1/checkout-handoffs') return $served;
    header_remove('Access-Control-Allow-Origin'); header_remove('Access-Control-Allow-Credentials');
    $origin = $request->get_header('origin');
    if (in_array($origin, Aster_Checkout_Handoff::origins(), true)) {
        header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin', false);
        header('Access-Control-Allow-Methods: POST, OPTIONS'); header('Access-Control-Allow-Headers: Content-Type');
    }
    return $served;
}, 30, 3);
add_action('template_redirect', function () {
    $path = untrailingslashit(wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH));
    $legacy = $path === '/checkout-handoff';
    $direct_entry = Aster_Checkout_Handoff::direct_entry_enabled();
    $checkout_entry = $direct_entry && $path === untrailingslashit(wp_parse_url(wc_get_checkout_url(), PHP_URL_PATH))
        && ($_GET['aster_handoff'] ?? null) === '1' && !is_checkout_pay_page() && !is_order_received_page();
    if (!$legacy && !$checkout_entry) return;
    // Preparation runs before Woo's empty-cart redirect. The token stays in
    // the fragment and is exchanged through the existing session-bound API.
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'HEAD'], true)) {
        status_header(405); header('Allow: GET, HEAD'); exit;
    }
    status_header(200); nocache_headers(); header('X-Robots-Tag: noindex, nofollow'); header('Referrer-Policy: no-referrer');
    $image_origin = wp_get_environment_type() === 'local' ? aster_local_storefront_origin() : 'https://asteredit.com';
    header("Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' $image_origin; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    header('X-Content-Type-Options: nosniff');
    require __DIR__ . '/checkout-handoff-page.php'; exit;
}, 0);
