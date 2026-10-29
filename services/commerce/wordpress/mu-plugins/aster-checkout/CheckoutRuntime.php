<?php
namespace Aster\Checkout;

/** Integrates the vendored JWK core with Aster's existing native checkout. */
final class CheckoutRuntime {
    const ORDER_TOKEN_HASH_KEY = '_aster_checkout_attempt_hash';
    const ORDER_CREATED_AT_KEY = '_aster_checkout_attempt_created_at';
    private $attempts;
    private $verifier;
    private $lock = '';

    public function __construct() {
        $this->attempts = new PaymentAttemptRepository();
        $this->verifier = new PayPalVerifier(new Config());
    }
    public function register(): void {
        (new SinglePageCheckoutExperience(new Config(), $this->attempts))->register();
        (new PayPalCheckoutOrderFirst(new Config()))->register();
        (new PaymentDeletionGuard($this->attempts))->register();
        add_action('init', static function () {
            if (wp_get_environment_type() === 'local' && get_option('aster_checkout_ledger_schema') !== '1') {
                require_once __DIR__ . '/install-ledger.php'; install_ledger();
            }
        });
        add_action('woocommerce_checkout_process', [$this, 'lockSubmission'], 0);
        add_action('woocommerce_paypal_payments_create_order_request_started', [$this, 'lockProviderStart'], 0);
        add_action('shutdown', [$this, 'releaseLock'], 999);
        add_action('woocommerce_checkout_order_processed', [$this, 'markProviderStart'], 1, 3);
        add_filter('woocommerce_available_payment_gateways', [$this, 'gateways'], 900);
        add_filter('woocommerce_gateway_title', [$this, 'gatewayTitle'], 40, 2);
        add_filter('woocommerce_order_button_text', [$this, 'buttonText'], 40);
        add_action('wp_enqueue_scripts', [$this, 'assets'], 110);
        add_action('wc_ajax_aster_checkout_status', [$this, 'status']);
        add_action('woocommerce_payment_complete', [$this, 'queueReconcile'], 90);
        add_action('woocommerce_order_status_changed', [$this, 'queueReconcile'], 90);
        add_action('aster_checkout_reconcile', [$this, 'reconcile'], 10, 2);
        add_action('woocommerce_admin_order_data_after_order_details', [$this, 'adminEvidence']);
        add_action('aster_checkout_handoff_committed', [$this, 'resetSession']);
    }
    private function nativeSession(): bool {
        return WC()->session && (int)WC()->session->get(SinglePageCheckoutExperience::SESSION_MARKER) >= time() - DAY_IN_SECONDS;
    }
    public function lockSubmission(): void {
        if (!$this->nativeSession() || $this->lock !== '') return;
        $session = WC()->session;
        // Session identity, rather than a browser-supplied order/amount, also
        // serializes a native card request against a PayPal button request.
        $key = (string)$session->get_customer_id();
        if ($key === '') throw new \RuntimeException('Your checkout session expired. Reload checkout before continuing.');
        global $wpdb;
        $name = 'aster_checkout_' . substr(hash('sha256', $wpdb->prefix . ':' . $key), 0, 48);
        if ((string)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 0)', $name)) !== '1') {
            throw new \RuntimeException('This checkout is already processing. Wait for its payment status before trying again.');
        }
        $this->lock = $name;
    }
    public function lockProviderStart($data): void {
        if (($data['context'] ?? '') === 'checkout') $this->lockSubmission();
    }
    public function releaseLock(): void {
        if ($this->lock !== '') PaymentOperationLock::release($this->lock);
        $this->lock = '';
    }
    public function markProviderStart($id, $data, $order): void {
        if (!$order || $order->get_meta('_aster_payment_surface') !== 'native_single_page') return;
        $order->update_meta_data('_aster_provider_create_started_at', gmdate('c'));
        $order->save();
    }
    public function resetSession(): void {
        if (!WC()->session) return;
        foreach ([SinglePageCheckoutExperience::SESSION_MARKER, SinglePageCheckoutExperience::SESSION_ATTEMPT_TOKEN,
            SinglePageCheckoutExperience::SESSION_ATTEMPT_CREATED_AT, SinglePageCheckoutExperience::SESSION_BOUND_ORDER_ID,
            'order_awaiting_payment', 'aster_checkout_status_checked'] as $key) WC()->session->__unset($key);
    }
    public function gateways($gateways) {
        if (is_admin() || !(is_checkout() || $this->nativeSession())) return $gateways;
        $config = new Config();
        if ($config->paypalClientId() === '' || $config->paypalClientSecret() === '') return [];
        $ordered = [];
        $payment = get_option('woocommerce-ppcp-data-payment', []);
        foreach ($config->paypalGatewayIds() as $id) {
            if ($id === 'ppcp-applepay' && empty($payment['applepay_validated'])) continue;
            if (isset($gateways[$id])) $ordered[$id] = $gateways[$id];
        }
        return $ordered;
    }
    public function gatewayTitle($title, $id) {
        return $id === 'ppcp-credit-card-gateway' && (is_checkout() || $this->nativeSession()) ? 'Credit or debit card' : $title;
    }
    public function buttonText($text) {
        if (!is_checkout() || is_order_received_page() || is_checkout_pay_page()) return $text;
        $method = sanitize_key(wp_unslash($_POST['payment_method'] ?? (WC()->session ? WC()->session->get('chosen_payment_method') : '')));
        return $method === 'ppcp-credit-card-gateway' ? 'Pay securely' : ($method === 'ppcp-gateway' ? 'Continue with PayPal' : $text);
    }
    public function assets(): void {
        if (!is_checkout() || is_order_received_page() || is_checkout_pay_page()) return;
        $base = plugins_url('', __FILE__);
        wp_enqueue_script('aster-checkout-foundation', $base . '/checkout-runtime.js', ['jquery','wc-checkout'], filemtime(__DIR__ . '/checkout-runtime.js'), true);
        wp_enqueue_style('aster-checkout-foundation', $base . '/checkout-runtime.css', ['aster-refined-checkout'], filemtime(__DIR__ . '/checkout-runtime.css'));
        wp_localize_script('aster-checkout-foundation', 'AsterNativeCheckout', [
            'statusUrl' => \WC_AJAX::get_endpoint('aster_checkout_status'), 'nonce' => wp_create_nonce('aster_checkout_status'),
            'orderStatusUrl' => home_url('/order-status/'), 'review' => \aster_checkout_foundation_review(),
        ]);
    }
    /** Session + same-origin + nonce. No order id/key/amount is accepted. */
    public function status(): void {
        nocache_headers();
        if (!Config::trustedStorefrontRequest() || !check_ajax_referer('aster_checkout_status', 'nonce', false) || !$this->nativeSession()) {
            wp_send_json(['message' => 'Your checkout session expired. Reload checkout before continuing.'], 403);
        }
        $id = (int)WC()->session->get(SinglePageCheckoutExperience::SESSION_BOUND_ORDER_ID);
        global $wpdb;
        $name = 'aster_checkout_' . substr(hash('sha256', $wpdb->prefix . ':' . WC()->session->get_customer_id()), 0, 48);
        if ((string)$wpdb->get_var($wpdb->prepare('SELECT IS_FREE_LOCK(%s)', $name)) === '0')
            wp_send_json(['customer_state' => 'processing', 'safe_action' => 'check_status', 'payment_locked' => true]);
        $order = $id > 0 ? wc_get_order($id) : null;
        if (!$order) wp_send_json(['customer_state' => $id > 0 ? 'manual_review' : 'ready', 'safe_action' => $id > 0 ? 'manual_review' : 'reload_checkout', 'payment_locked' => $id > 0]);
        $last = (int)WC()->session->get('aster_checkout_status_checked');
        if ($last < time() - 10) {
            WC()->session->set('aster_checkout_status_checked', time());
            $this->reconcile($id, 0);
        }
        $record = $this->attempts->findByOrderId($id);
        $state = $record['customer_state'] ?? 'manual_review';
        $action = $record['safe_action'] ?? 'manual_review';
        $result = ['customer_state' => $state, 'safe_action' => $action,
            'payment_locked' => !in_array($action, ['resume_same_order','retry_same_order'], true),
            'order_number' => $order->get_order_number()];
        if (in_array($action, ['resume_same_order','retry_same_order'], true) && $order->needs_payment()) $result['recovery_url'] = $order->get_checkout_payment_url();
        if ($action === 'view_order') $result['recovery_url'] = $order->get_checkout_order_received_url();
        wp_send_json($result);
    }
    public function queueReconcile($id): void {
        $order = wc_get_order($id);
        if (!$order || !in_array($order->get_payment_method(), (new Config())->paypalGatewayIds(), true)) return;
        if (function_exists('as_has_scheduled_action') && !as_has_scheduled_action('aster_checkout_reconcile', [(int)$id, 0], 'aster-checkout'))
            as_schedule_single_action(time() + 5, 'aster_checkout_reconcile', [(int)$id, 0], 'aster-checkout');
    }
    /** Read-only provider lookup: official PPCP retains all payment writes. */
    public function reconcile($id, $retry = 0): void {
        $order = wc_get_order($id);
        if (!$order || !in_array($order->get_payment_method(), (new Config())->paypalGatewayIds(), true)) return;
        $lock = PaymentOperationLock::acquireForOrder($id);
        if (is_wp_error($lock)) return;
        try {
            $record = $this->attempts->ensureForOrder($order);
            $facts = $this->verifier->paymentFacts($order);
            $verified = !empty($facts['lookup_available']) && !empty($facts['remote_order_id_matches'])
                && !empty($facts['amount_matches']) && !empty($facts['order_reference_matches'])
                && ($facts['capture_count'] ?? 0) === 1 && ($facts['authorization_count'] ?? 0) === 0
                && ($facts['capture_status'] ?? '') === 'COMPLETED' && $facts['provider_status'] === 'COMPLETED';
            $started = trim((string)$order->get_meta('_aster_provider_create_started_at')) !== '';
            $facts['woo_status'] = $order->get_status();
            $facts['pre_provider'] = !$started && ($facts['reason'] ?? '') === 'paypal_order_id_missing';
            $facts['can_resume'] = $order->needs_payment() && $order->has_status(['pending','failed'])
                && (($facts['pre_provider']) || (!empty($facts['lookup_available']) && !empty($facts['remote_order_id_matches'])
                    && !empty($facts['amount_matches']) && !empty($facts['order_reference_matches']) && $facts['capture_count'] === 0
                    && $facts['authorization_count'] === 0 && in_array($facts['provider_status'], ['CREATED','SAVED','VOIDED'], true)));
            $facts['reconciliation'] = $verified ? 'verified' : (!empty($facts['lookup_available']) && (!$facts['remote_order_id_matches'] || !$facts['amount_matches'] || !$facts['order_reference_matches']) ? 'mismatch' : 'unverified');
            // Manual status checks must not reset a failed lookup's durable
            // budget. A later successful lookup can still resolve the order.
            $facts['retry_count'] = empty($facts['lookup_available']) && !$facts['pre_provider']
                ? min(3, max((int)($record['retry_count'] ?? 0), (int)$retry) + 1) : 0;
            $decision = PaymentStateMachine::decide($facts);
            $this->attempts->recordDecision($order, $decision, $facts);
            $order->update_meta_data('_aster_paypal_reconciliation', $facts['reconciliation']);
            $order->save();
            if ($decision['safe_action'] === 'check_status' && $retry < 2 && function_exists('as_schedule_single_action')) {
                $args = [(int)$id, (int)$retry + 1];
                if (!as_has_scheduled_action('aster_checkout_reconcile', $args, 'aster-checkout'))
                    as_schedule_single_action(time() + [30,120][$retry], 'aster_checkout_reconcile', $args, 'aster-checkout');
            }
        } finally { PaymentOperationLock::release($lock); }
    }
    public function adminEvidence($order): void {
        $record = $this->attempts->findByOrderId($order->get_id());
        if (!$record) return;
        echo '<p><strong>Payment recovery:</strong> ' . esc_html($record['customer_state']) . '<br><strong>Reconciliation:</strong> ' . esc_html($record['reconciliation_state']) . '</p>';
    }
}
