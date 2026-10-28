<?php
defined('ABSPATH') || exit;

/** Local operations foundation. No payment, order-status or customer-facing fulfillment writes. */
final class Aster_Operations {
    const META = '_aster_operations_v1';
    const CAPS = ['aster_orders_read', 'aster_notes_write', 'aster_shipping_prepare', 'aster_finance_read'];
    public static function enabled(): bool { return wp_get_environment_type() === 'local'; }
    public static function roles(): void {
        if (!self::enabled() || get_option('aster_operations_roles') === '1') return;
        $roles = [
            'aster_support' => ['Aster customer support', ['aster_orders_read', 'aster_notes_write']],
            'aster_fulfillment' => ['Aster fulfillment', ['aster_orders_read', 'aster_shipping_prepare']],
            'aster_finance' => ['Aster finance review', ['aster_orders_read', 'aster_finance_read']],
        ];
        foreach ($roles as $key => [$label, $caps]) {
            // Never overwrite an externally managed role or assign a role to an existing person.
            if (!get_role($key)) add_role($key, $label, array_fill_keys(array_merge(['read'], $caps), true));
        }
        update_option('aster_operations_roles', '1', false);
    }
    public static function allowed(string $cap): bool {
        return self::enabled() && is_user_logged_in() && (current_user_can('manage_options') || current_user_can($cap));
    }
    public static function permission(string $cap) {
        return self::allowed($cap) ? true : new WP_Error('aster_forbidden', 'This action is not available to your role.', ['status' => 403]);
    }
    public static function state(WC_Order $order): array {
        $value = $order->get_meta(self::META);
        return is_array($value) ? $value : ['revision' => 0, 'notes' => [], 'shipment_draft' => null, 'events' => []];
    }
    public static function summary(WC_Order $order): array {
        $flags = [];
        if (!$order->is_paid()) $flags[] = 'payment_not_confirmed';
        if ($order->is_paid() && (!$order->get_transaction_id() || !$order->get_date_paid())) $flags[] = 'payment_evidence_incomplete';
        if ((float) $order->get_total_refunded() > 0) $flags[] = 'refund_review';
        if (in_array($order->get_status(), ['cancelled', 'failed', 'refunded'], true)) $flags[] = 'do_not_fulfill';
        // An is_paid Woo status alone is not PayPal capture/reconciliation evidence.
        $flags[] = 'dispatch_integration_pending';
        return ['id' => $order->get_id(), 'number' => (string) $order->get_order_number(), 'status' => $order->get_status(), 'status_label' => wc_get_order_status_name($order->get_status()), 'created_at' => $order->get_date_created() ? $order->get_date_created()->date(DATE_ATOM) : null, 'currency' => $order->get_currency(), 'total' => (string) $order->get_total(), 'flags' => $flags, 'dispatch_allowed' => false];
    }
    public static function detail(WC_Order $order): array {
        $result = self::summary($order); $state = self::state($order);
        $result['revision'] = $state['revision'];
        $result['items'] = [];
        foreach ($order->get_items() as $item) $result['items'][] = ['item_id' => $item->get_id(), 'name' => $item->get_name(), 'quantity' => $item->get_quantity(), 'line_total' => (string) $item->get_total()];
        if (self::allowed('aster_notes_write')) $result['notes'] = $state['notes'];
        if (self::allowed('aster_shipping_prepare')) {
            $result['shipping_address'] = $order->get_address('shipping');
            $result['shipment_draft'] = $state['shipment_draft'];
        }
        if (self::allowed('aster_finance_read')) $result['payment_review'] = [
            'method' => $order->get_payment_method(), 'transaction_id' => $order->get_transaction_id(),
            'paid_at' => $order->get_date_paid() ? $order->get_date_paid()->date(DATE_ATOM) : null,
            'woo_paid_status' => $order->is_paid(), 'refunded_total' => (string) $order->get_total_refunded(),
            'provider_reconciled' => false,
        ];
        // Audit entries contain operation identifiers, never note/address/tracking contents.
        $result['events'] = array_map(static fn($event) => array_intersect_key($event, ['action' => 1, 'actor_id' => 1, 'created_at' => 1]), $state['events']);
        return $result;
    }
    public static function order(int $id) {
        $order = wc_get_order($id);
        return $order instanceof WC_Order && $order->get_type() === 'shop_order' && !in_array($order->get_status(), ['trash', 'auto-draft', 'checkout-draft'], true) ? $order : null;
    }
    public static function mutate(int $id, array $body, string $action) {
        $cap = $action === 'note' ? 'aster_notes_write' : 'aster_shipping_prepare';
        if (!self::allowed($cap)) return new WP_Error('aster_forbidden', 'This action is not available to your role.', ['status' => 403]);
        $fields = $action === 'note' ? ['request_id', 'revision', 'text'] : ['request_id', 'revision', 'carrier', 'tracking_number'];
        if (array_diff(array_keys($body), $fields) || !is_int($body['revision'] ?? null) || $body['revision'] < 0 || !is_string($body['request_id'] ?? null) || !preg_match('/^[a-f0-9-]{36}$/D', $body['request_id'])) return new WP_Error('aster_fields', 'A request ID and current revision are required.', ['status' => 400]);
        if ($action === 'note') {
            if (!is_string($body['text'] ?? null) || strlen(trim($body['text'])) < 1 || strlen($body['text']) > 2000) return new WP_Error('aster_note', 'Write a short internal note (up to 2000 bytes).', ['status' => 400]);
            $payload = ['text' => sanitize_textarea_field($body['text'])];
            if (!$payload['text']) return new WP_Error('aster_note', 'A note is required.', ['status' => 400]);
        } else {
            if (!is_string($body['carrier'] ?? null) || !in_array($body['carrier'], ['UPS', 'FedEx', 'DHL', 'USPS', 'Other'], true) || !is_string($body['tracking_number'] ?? null) || !preg_match('/^[A-Za-z0-9 -]{1,80}$/D', $body['tracking_number']) || !trim($body['tracking_number'])) return new WP_Error('aster_tracking', 'Choose a carrier and a valid tracking reference.', ['status' => 400]);
            $payload = ['carrier' => $body['carrier'], 'tracking_number' => trim($body['tracking_number']), 'state' => 'draft'];
        }
        $fingerprint = hash('sha256', wp_json_encode([$action, $payload]));
        global $wpdb; $lock = 'aster_ops_' . $id;
        if ((int) $wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 3)', $lock)) !== 1) return new WP_Error('aster_busy', 'Order is being updated. Retry after reloading.', ['status' => 409]);
        try {
            $order = self::order($id);
            if (!$order) return new WP_Error('aster_missing', 'Order not found.', ['status' => 404]);
            if ($action !== 'note' && in_array($order->get_status(), ['cancelled', 'failed', 'refunded'], true)) return new WP_Error('aster_closed', 'Do not prepare a shipment for a closed or failed order.', ['status' => 409]);
            $order->read_meta_data(true); $state = self::state($order);
            foreach ($state['events'] as $event) if ($event['request_id'] === $body['request_id']) {
                if ($event['actor_id'] !== get_current_user_id() || !hash_equals($event['fingerprint'], $fingerprint)) return new WP_Error('aster_reuse', 'Request ID already used for a different action.', ['status' => 409]);
                return ['revision' => $state['revision'], 'replayed' => true];
            }
            if ($state['revision'] !== $body['revision']) return new WP_Error('aster_revision', 'This order changed. Reload before saving.', ['status' => 409]);
            if (count($state['events']) >= 200) return new WP_Error('aster_capacity', 'Order history limit reached; administrator review required.', ['status' => 409]);
            $now = gmdate(DATE_ATOM); $actor = get_current_user_id();
            if ($action === 'note') $state['notes'][] = $payload + ['created_at' => $now, 'actor_id' => $actor];
            else $state['shipment_draft'] = $payload + ['updated_at' => $now, 'actor_id' => $actor];
            $state['revision']++;
            $state['events'][] = ['request_id' => $body['request_id'], 'action' => $action === 'note' ? 'internal_note_added' : 'shipment_draft_saved', 'actor_id' => $actor, 'created_at' => $now, 'fingerprint' => $fingerprint];
            $order->update_meta_data(self::META, $state); $order->save_meta_data();
            return ['revision' => $state['revision'], 'replayed' => false];
        } finally { $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $lock)); }
    }
    public static function routes(): void {
        register_rest_route('aster/v1', '/ops/orders', ['methods' => 'GET', 'permission_callback' => static fn() => self::permission('aster_orders_read'), 'callback' => function ($request) {
            $params = $request->get_query_params();
            if (array_diff(array_keys($params), ['page', 'status'])) return new WP_Error('aster_fields', 'Unsupported filter.', ['status' => 400]);
            $page = $params['page'] ?? '1'; $status = $params['status'] ?? '';
            if (!is_string($page) || !preg_match('/^[1-9][0-9]{0,3}$/D', $page) || !is_string($status) || ($status && !array_key_exists('wc-' . $status, wc_get_order_statuses()))) return new WP_Error('aster_filter', 'Invalid page or status.', ['status' => 400]);
            $args = ['type' => 'shop_order', 'limit' => 20, 'page' => (int) $page, 'paginate' => true, 'orderby' => 'date', 'order' => 'DESC', 'status' => $status ?: array_keys(wc_get_order_statuses())];
            $result = wc_get_orders($args);
            return ['orders' => array_map([self::class, 'summary'], $result->orders), 'page' => (int) $page, 'pages' => (int) $result->max_num_pages, 'total' => (int) $result->total];
        }]);
        register_rest_route('aster/v1', '/ops/orders/(?P<id>[1-9][0-9]{0,14})', ['methods' => 'GET', 'permission_callback' => static fn() => self::permission('aster_orders_read'), 'callback' => function ($request) {
            $order = self::order((int) $request['id']);
            return $order ? self::detail($order) : new WP_Error('aster_missing', 'Order not found.', ['status' => 404]);
        }]);
        foreach (['note' => 'aster_notes_write', 'shipment-draft' => 'aster_shipping_prepare'] as $route => $cap) register_rest_route('aster/v1', '/ops/orders/(?P<id>[1-9][0-9]{0,14})/' . $route, ['methods' => 'POST', 'permission_callback' => static fn() => self::permission($cap), 'callback' => function ($request) use ($route) {
            if ($request->get_header('origin') !== Aster_Checkout_Handoff::origin() || strtolower(trim(explode(';', $request->get_header('content-type'))[0])) !== 'application/json' || strlen($request->get_body()) > 4096) return new WP_Error('aster_request', 'Same-origin small JSON request required.', ['status' => 403]);
            $body = $request->get_json_params();
            return is_array($body) ? self::mutate((int) $request['id'], $body, $route === 'note' ? 'note' : 'shipment') : new WP_Error('aster_fields', 'JSON object required.', ['status' => 400]);
        }]);
    }
}
add_action('init', [Aster_Operations::class, 'roles']);
add_action('rest_api_init', [Aster_Operations::class, 'routes']);
add_filter('rest_post_dispatch', function ($response, $server, $request) {
    if (str_starts_with($request->get_route(), '/aster/v1/ops/')) $response->header('Cache-Control', 'no-store, private');
    return $response;
}, 10, 3);
add_filter('rest_pre_serve_request', function ($served, $result, $request) {
    if (str_starts_with($request->get_route(), '/aster/v1/ops/')) { header_remove('Access-Control-Allow-Origin'); header_remove('Access-Control-Allow-Credentials'); }
    return $served;
}, 30, 3);
// Dedicated restricted workbench; these roles do not get Woo's broad order/customer edit caps.
add_action('admin_menu', function () {
    if (!Aster_Operations::allowed('aster_orders_read')) return;
    add_menu_page('Aster orders', 'Aster orders', current_user_can('manage_options') ? 'manage_options' : 'aster_orders_read', 'aster-orders', function () {
        if (!Aster_Operations::allowed('aster_orders_read')) wp_die('Access denied.', '', ['response' => 403]);
        require __DIR__ . '/operations-page.php';
    }, 'dashicons-clipboard', 56);
});
add_filter('woocommerce_prevent_admin_access', function ($prevent) { return Aster_Operations::allowed('aster_orders_read') ? false : $prevent; });
add_action('admin_enqueue_scripts', function ($hook) {
    if ($hook !== 'toplevel_page_aster-orders' || !Aster_Operations::allowed('aster_orders_read')) return;
    wp_enqueue_style('aster-operations', plugins_url('operations.css', __FILE__), [], (string) filemtime(__DIR__ . '/operations.css'));
    wp_enqueue_script('aster-operations', plugins_url('operations.js', __FILE__), [], (string) filemtime(__DIR__ . '/operations.js'), true);
    wp_localize_script('aster-operations', 'asterOperations', ['api' => rest_url('aster/v1/ops/'), 'nonce' => wp_create_nonce('wp_rest')]);
});
