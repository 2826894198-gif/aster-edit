<?php
/** Plugin Name: Aster anonymous GEO analytics */
defined('ABSPATH') || exit;

/** Anonymous, daily aggregate storefront counts; no visitor or session identifier. */
final class Aster_Geo_Analytics {
    private const SOURCES = ['direct', 'organic_search', 'paid_search', 'social', 'email', 'referral', 'campaign', 'unknown'];
    private const CLIENT_EVENTS = ['view_item_list', 'view_item', 'select_item', 'add_to_cart', 'view_cart'];
    private const EVENTS = ['view_item_list', 'view_item', 'select_item', 'add_to_cart', 'view_cart', 'checkout_handoff', 'checkout_confirmed', 'begin_checkout'];

    public static function source($value): string {
        return is_string($value) && in_array($value, self::SOURCES, true) ? $value : 'unknown';
    }

    public static function table(): string { return Aster_Order_Access::table('geo_daily'); }

    public static function install(): void {
        if (get_option('aster_geo_schema') === '1') return;
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::table();
        $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE $table (
            day date NOT NULL,
            source varchar(24) NOT NULL,
            event varchar(32) NOT NULL,
            catalog_key varchar(128) NOT NULL,
            hits bigint(20) unsigned NOT NULL DEFAULT 0,
            quantity bigint(20) unsigned NOT NULL DEFAULT 0,
            PRIMARY KEY  (day,source,event,catalog_key)
        ) $charset;");
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) !== $table)
            throw new RuntimeException('Aster aggregate analytics storage unavailable.');
        update_option('aster_geo_schema', '1', false);
    }

    public static function count(string $event, string $source, string $key = '', int $quantity = 1): bool {
        if (!in_array($event, self::EVENTS, true) || !in_array($source, self::SOURCES, true)) return false;
        if ($key !== '' && !preg_match('/^[a-z0-9-]{1,80}:[a-z0-9-]{1,40}$/D', $key)) return false;
        if ($quantity < 1 || $quantity > 20) return false;
        global $wpdb;
        $table = self::table();
        return $wpdb->query($wpdb->prepare(
            "INSERT INTO $table (day,source,event,catalog_key,hits,quantity) VALUES (%s,%s,%s,%s,1,%d) ON DUPLICATE KEY UPDATE hits=hits+1, quantity=quantity+VALUES(quantity)",
            gmdate('Y-m-d'), $source, $event, $key, $quantity
        )) !== false;
    }

    public static function guard(WP_REST_Request $request) {
        if (!in_array($request->get_header('origin'), Aster_Checkout_Handoff::origins(), true))
            return new WP_Error('aster_origin', 'This origin cannot submit events.', ['status' => 403]);
        if (strtolower(trim(explode(';', $request->get_header('content-type'))[0])) !== 'application/json' || strlen($request->get_body()) > 512)
            return new WP_Error('aster_request', 'A small JSON event is required.', ['status' => 400]);
        return true;
    }

    public static function routes(): void {
        register_rest_route('aster/v1', '/geo-events', ['methods' => 'POST', 'permission_callback' => [self::class, 'guard'], 'callback' => function ($request) {
            if (!Aster_Order_Access::limit('geo-event:' . ($_SERVER['REMOTE_ADDR'] ?? ''), 180, 300))
                return new WP_Error('aster_rate', 'Please try again later.', ['status' => 429]);
            $body = $request->get_json_params();
            if (!is_array($body) || array_keys($body) !== ['event', 'source', 'catalog_key', 'quantity']
                || !is_string($body['event']) || !is_string($body['source'])
                || !is_string($body['catalog_key']) || !is_int($body['quantity'])
                || !in_array($body['event'], self::CLIENT_EVENTS, true)
                || !self::count($body['event'], $body['source'], $body['catalog_key'], $body['quantity']))
                return new WP_Error('aster_event', 'Invalid event.', ['status' => 400]);
            return new WP_REST_Response(null, 204);
        }]);
    }

    public static function order_source($order): void {
        if (!$order instanceof WC_Order || !WC()->session) return;
        $source = WC()->session->get('aster_acquisition_source');
        if (is_string($source) && in_array($source, self::SOURCES, true))
            $order->update_meta_data('_aster_acquisition_source', $source);
    }

    public static function checkout_view(): void {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET' || !function_exists('is_checkout') || !is_checkout() || is_order_received_page()) return;
        if (!WC()->cart || WC()->cart->is_empty() || !WC()->session) return;
        self::count('begin_checkout', self::source(WC()->session->get('aster_acquisition_source')));
    }
}

add_action('init', [Aster_Geo_Analytics::class, 'install']);
add_action('rest_api_init', [Aster_Geo_Analytics::class, 'routes']);
add_action('template_redirect', [Aster_Geo_Analytics::class, 'checkout_view'], 20);
add_action('woocommerce_checkout_create_order', [Aster_Geo_Analytics::class, 'order_source'], 10, 1);
add_action('woocommerce_store_api_checkout_update_order_from_request', [Aster_Geo_Analytics::class, 'order_source'], 10, 1);
add_filter('rest_post_dispatch', function ($response, $server, $request) {
    if ($request->get_route() === '/aster/v1/geo-events') $response->header('Cache-Control', 'no-store, private');
    return $response;
}, 10, 3);
add_filter('rest_pre_serve_request', function ($served, $result, $request) {
    if ($request->get_route() !== '/aster/v1/geo-events') return $served;
    header_remove('Access-Control-Allow-Origin'); header_remove('Access-Control-Allow-Credentials');
    $origin = $request->get_header('origin');
    if (in_array($origin, Aster_Checkout_Handoff::origins(), true)) {
        header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin', false);
        header('Access-Control-Allow-Methods: POST, OPTIONS'); header('Access-Control-Allow-Headers: Content-Type');
    }
    return $served;
}, 30, 3);
