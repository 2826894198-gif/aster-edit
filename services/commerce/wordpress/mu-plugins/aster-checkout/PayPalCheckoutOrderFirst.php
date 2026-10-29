<?php
namespace Aster\Checkout;

/**
 * Persists the native checkout order before PPCP creates its remote order.
 *
 * PPCP's checkout Smart Button normally creates a PayPal order from the cart,
 * opens the provider window, and creates the Woo order only after approval.
 * This adapter keeps PPCP's UI and provider ownership intact while moving only
 * the Woo persistence boundary forward:
 *
 *   validated checkout form -> Woo pending order -> PayPal order -> popup
 *
 * Apple Pay and Google Pay are intentionally not intercepted here. Their PPCP
 * gateway process_payment() paths already receive a Woo order id before they
 * ask PayPal to create the provider order.
 */
final class PayPalCheckoutOrderFirst
{
    const GATEWAY_ID = 'ppcp-gateway';
    const ORDER_STATE_KEY = '_aster_paypal_order_first_state';
    const STATE_PROVIDER_STARTING = 'provider_starting';
    const STATE_PROVIDER_LINKED = 'provider_linked';
    const STATE_LINK_FAILED = 'provider_link_failed';

    private $config;
    private $preparedOrderId = 0;
    private static $requestPreparedOrderId = 0;

    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    public function register()
    {
        add_action('woocommerce_paypal_payments_create_order_request_started', array($this, 'prepareWooOrder'), 1);
        add_action('woocommerce_paypal_payments_create_order_endpoint_order_created', array($this, 'linkProviderOrder'), 1, 2);
    }

    /** Runs after PPCP nonce verification and before its provider API call. */
    public function prepareWooOrder($data)
    {
        $this->preparedOrderId = 0;
        self::$requestPreparedOrderId = 0;
        if (!self::supportsRequest($data, $this->config->singlePageCheckoutEnabled())) {
            return;
        }

        $session = $this->session();
        if (!$session || !$this->nativeSessionActive($session)) {
            // Other Woo checkout surfaces retain PPCP's unmodified behavior.
            return;
        }

        $token = strtolower(trim((string) $session->get(SinglePageCheckoutExperience::SESSION_ATTEMPT_TOKEN)));
        if (!preg_match('/^[a-f0-9]{48}$/D', $token)) {
            throw new \RuntimeException('AE-PAY-ORDER: Your secure checkout session expired. Reload checkout before trying again.');
        }

        $lock = $this->acquireAttemptLock($token);
        if (is_wp_error($lock)) {
            throw new \RuntimeException('AE-PAY-ORDER: This checkout is already being prepared. Wait a moment before trying again.');
        }

        try {
            $order = $this->boundOrder($session);
            if ($order) {
                if (!$this->canReuseUnstartedOrder($order)) {
                    if ($this->shouldReleaseBoundOrder($order)) {
                        $this->releaseBoundOrder($session, $order);
                        $order = null;
                    } else {
                        throw new \RuntimeException('AE-PAY-ORDER: This checkout already has an active payment attempt. Check its status before trying again.');
                    }
                }
            }
            if (!$order) {
                $order = $this->createValidatedOrder($data['form']);
            }

            if (!$order || !method_exists($order, 'get_id') || !method_exists($order, 'needs_payment') || !$order->needs_payment()) {
                throw new \RuntimeException('AE-PAY-ORDER: WooCommerce did not return a payable order.');
            }

            $order->update_meta_data('_aster_payment_surface', 'native_single_page');
            $order->update_meta_data('_aster_payment_provider', 'paypal');
            $order->update_meta_data('_aster_payment_entry', self::GATEWAY_ID);
            $order->update_meta_data(self::ORDER_STATE_KEY, self::STATE_PROVIDER_STARTING);
            $order->update_meta_data('_aster_provider_create_started_at', gmdate('c'));
            $order->save();

            $this->preparedOrderId = (int) $order->get_id();
            self::$requestPreparedOrderId = $this->preparedOrderId;
            $session->set(SinglePageCheckoutExperience::SESSION_BOUND_ORDER_ID, $this->preparedOrderId);
            $session->set('order_awaiting_payment', $this->preparedOrderId);

            do_action('aster_payment_diagnostic_event', $order, 'provider_create_started', array(
                'provider' => 'paypal',
                'method' => self::GATEWAY_ID,
                'surface' => 'native_single_page',
                'order_first' => true,
            ));
        } finally {
            $this->releaseAttemptLock($lock);
        }
    }

    /**
     * Links PPCP's newly created remote order before the create-order response
     * reaches the browser. PPCP then opens its normal popup and later resumes
     * this same Woo order through its existing ppcp-resume-order mechanism.
     */
    public function linkProviderOrder($paypalOrder, $data)
    {
        if ($this->preparedOrderId < 1 || !self::supportsRequest($data, $this->config->singlePageCheckoutEnabled())) {
            return;
        }

        $order = function_exists('wc_get_order') ? wc_get_order($this->preparedOrderId) : null;
        if (!$order || !method_exists($order, 'get_meta')
            || (string) $order->get_meta(self::ORDER_STATE_KEY) !== self::STATE_PROVIDER_STARTING) {
            throw new \RuntimeException('AE-PAY-LINK: The saved WooCommerce order could not be verified.');
        }

        $providerId = is_object($paypalOrder) && method_exists($paypalOrder, 'id')
            ? trim((string) $paypalOrder->id())
            : '';
        if ($providerId === '') {
            $this->markLinkFailure($order, 'provider-reference-missing');
            throw new \RuntimeException('AE-PAY-LINK: PayPal did not return a usable order reference.');
        }

        $operationLock = PaymentOperationLock::acquireForOrder($this->preparedOrderId);
        if (is_wp_error($operationLock)) {
            $this->markLinkFailure($order, 'order-lock-unavailable', $providerId);
            throw new \RuntimeException('AE-PAY-LINK: The saved order is already being updated.');
        }

        try {
            $order = wc_get_order($this->preparedOrderId);
            if (!$order || (string) $order->get_meta(self::ORDER_STATE_KEY) !== self::STATE_PROVIDER_STARTING) {
                throw new \RuntimeException('The saved WooCommerce order changed before PayPal could be linked.');
            }

            // Persist the provider reference before the remote patch. If that
            // request times out, operations can still reconcile the exact pair.
            $order->update_meta_data($this->paypalOrderIdMetaKey(), $providerId);
            if (method_exists($paypalOrder, 'intent')) {
                $order->update_meta_data($this->paypalIntentMetaKey(), (string) $paypalOrder->intent());
            }
            $order->save();

            $processor = $this->paypalContainerService('wcgateway.order-processor');
            if (!is_object($processor) || !method_exists($processor, 'patch_order')) {
                throw new \RuntimeException('The PayPal order processor is unavailable.');
            }
            $linked = $processor->patch_order($order, $paypalOrder);
            if (!$this->providerReferencesWooOrder($linked, $this->preparedOrderId)) {
                throw new \RuntimeException('PayPal did not confirm the WooCommerce order reference.');
            }

            // CreateOrderEndpoint builds its JSON response from the original
            // entity. Keep that response aligned with the successfully patched
            // remote order so PPCP resumes this exact Woo order on approval.
            $units = method_exists($paypalOrder, 'purchase_units') ? $paypalOrder->purchase_units() : array();
            if (!isset($units[0]) || !is_object($units[0]) || !method_exists($units[0], 'set_custom_id')) {
                throw new \RuntimeException('The PayPal response cannot carry the WooCommerce order reference.');
            }
            $units[0]->set_custom_id((string) $this->preparedOrderId);

            $order->update_meta_data(self::ORDER_STATE_KEY, self::STATE_PROVIDER_LINKED);
            $order->update_meta_data('_aster_provider_order_created_at', gmdate('c'));
            $order->save();
            do_action('aster_payment_diagnostic_event', $order, 'provider_order_linked', array(
                'provider' => 'paypal',
                'method' => self::GATEWAY_ID,
                'provider_order_id' => $providerId,
                'order_first' => true,
            ));
        } catch (\Throwable $error) {
            $this->markLinkFailure($order, 'provider-link-failed', $providerId);
            if (function_exists('wc_get_logger')) {
                wc_get_logger()->error('paypal_order_first_link_failed: ' . $error->getMessage(), array(
                    'source' => 'agco-paypal-order-first',
                    'order_id' => $this->preparedOrderId,
                ));
            }
            throw new \RuntimeException('AE-PAY-LINK: The WooCommerce order was saved, but PayPal could not be linked safely. Check the order before trying again.');
        } finally {
            PaymentOperationLock::release($operationLock);
        }
    }

    /** Public deterministic boundary for unit and release-contract tests. */
    public static function supportsRequest($data, $singlePageEnabled)
    {
        return (bool) $singlePageEnabled
            && is_array($data)
            && ($data['context'] ?? '') === 'checkout'
            && sanitize_key((string) ($data['payment_method'] ?? '')) === self::GATEWAY_ID
            && isset($data['form'])
            && is_array($data['form'])
            && !empty($data['form']);
    }

    /** Allow only PPCP's exact hidden resume id to finish its linked order. */
    public static function isLinkedOrderResume($order, $resumeOrderId)
    {
        if (!is_object($order) || !method_exists($order, 'get_id') || !method_exists($order, 'get_meta')
            || !method_exists($order, 'get_payment_method') || !method_exists($order, 'needs_payment')) {
            return false;
        }
        if ((int) $resumeOrderId < 1 || (int) $order->get_id() !== (int) $resumeOrderId
            || sanitize_key((string) $order->get_payment_method()) !== self::GATEWAY_ID
            || !$order->needs_payment()
            || (string) $order->get_meta(self::ORDER_STATE_KEY) !== self::STATE_PROVIDER_LINKED
            || trim((string) $order->get_meta('_aster_provider_create_started_at')) === ''
            || (int) $order->get_meta('_aster_payment_capture_count') !== 0) {
            return false;
        }
        foreach (apply_filters('aster_paypal_order_id_meta_keys', array('_ppcp_paypal_order_id', '_ppcp_order_id', '_paypal_order_id')) as $key) {
            if (trim((string) $order->get_meta($key)) !== '') {
                return true;
            }
        }
        return false;
    }

    /**
     * PPCP repeats checkout validation after the pre-order hook. Permit only
     * that same-request validation pass; this flag cannot survive a retry,
     * another AJAX request, or another PHP worker.
     */
    public static function isProviderCreationInProgress($order)
    {
        return self::$requestPreparedOrderId > 0
            && is_object($order)
            && method_exists($order, 'get_id')
            && method_exists($order, 'get_meta')
            && (int) $order->get_id() === self::$requestPreparedOrderId
            && (string) $order->get_meta(self::ORDER_STATE_KEY) === self::STATE_PROVIDER_STARTING;
    }

    private function createValidatedOrder($form)
    {
        try {
            $validator = $this->paypalContainerService('button.validation.wc-checkout-validator');
            if (!is_object($validator) || !method_exists($validator, 'validate')) {
                throw new \RuntimeException('The PayPal checkout validator is unavailable.');
            }
            $validator->validate($form);

            if (!class_exists('WC_Checkout') || !method_exists('WC_Checkout', 'instance')) {
                throw new \RuntimeException('WooCommerce checkout is unavailable.');
            }
            $checkout = \WC_Checkout::instance();
            $posted = $checkout->get_posted_data();
            $posted['payment_method'] = self::GATEWAY_ID;
            $orderId = $checkout->create_order($posted);
            if (is_wp_error($orderId)) {
                $message = method_exists($orderId, 'get_error_message') ? $orderId->get_error_message() : '';
                throw new \RuntimeException($message !== '' ? $message : 'WooCommerce could not create the order.');
            }
            $order = function_exists('wc_get_order') ? wc_get_order((int) $orderId) : null;
            if (!$order) {
                throw new \RuntimeException('WooCommerce did not return the saved order.');
            }
            return $order;
        } catch (\WooCommerce\PayPalCommerce\Button\Exception\ValidationException $error) {
            // Preserve PPCP's existing field-error response and checkout UI.
            throw $error;
        } catch (\Throwable $error) {
            if (function_exists('wc_get_logger')) {
                wc_get_logger()->error('paypal_order_first_prepare_failed: ' . $error->getMessage(), array(
                    'source' => 'agco-paypal-order-first',
                ));
            }
            throw new \RuntimeException('AE-PAY-ORDER: WooCommerce could not save this order before PayPal opened.');
        }
    }

    private function boundOrder($session)
    {
        $id = (int) $session->get(SinglePageCheckoutExperience::SESSION_BOUND_ORDER_ID);
        return $id > 0 && function_exists('wc_get_order') ? wc_get_order($id) : null;
    }

    private function canReuseUnstartedOrder($order)
    {
        if (!is_object($order) || !method_exists($order, 'get_payment_method') || !method_exists($order, 'get_meta')
            || !method_exists($order, 'needs_payment') || !$order->needs_payment()
            || sanitize_key((string) $order->get_payment_method()) !== self::GATEWAY_ID
            || (string) $order->get_meta('_aster_payment_surface') !== 'native_single_page'
            || trim((string) $order->get_meta('_aster_provider_create_started_at')) !== '') {
            return false;
        }
        foreach (apply_filters('aster_paypal_order_id_meta_keys', array('_ppcp_paypal_order_id', '_ppcp_order_id', '_paypal_order_id')) as $key) {
            if (trim((string) $order->get_meta($key)) !== '') {
                return false;
            }
        }
        return function_exists('WC') && WC() && isset(WC()->cart) && WC()->cart
            && method_exists(WC()->cart, 'get_cart_hash')
            && method_exists($order, 'has_cart_hash')
            && $order->has_cart_hash(WC()->cart->get_cart_hash());
    }

    /**
     * A bound order may outlive the cart that created it. Release only bindings
     * that cannot represent an active payment for the current cart. The short
     * database lock still prevents concurrent clicks from creating duplicates.
     */
    private function shouldReleaseBoundOrder($order)
    {
        if (!is_object($order) || !method_exists($order, 'needs_payment')) {
            return false;
        }
        if (!$order->needs_payment()) {
            return true;
        }
        if (!function_exists('WC') || !WC() || !isset(WC()->cart) || !WC()->cart
            || !method_exists(WC()->cart, 'get_cart_hash') || !method_exists($order, 'has_cart_hash')) {
            return false;
        }
        $cartHash = trim((string) WC()->cart->get_cart_hash());
        return $cartHash !== '' && !$order->has_cart_hash($cartHash);
    }

    private function releaseBoundOrder($session, $order)
    {
        if (!$session || !is_object($order) || !method_exists($order, 'get_id')) {
            return;
        }
        $orderId = (int) $order->get_id();
        if ((int) $session->get(SinglePageCheckoutExperience::SESSION_BOUND_ORDER_ID) === $orderId) {
            $this->unsetSessionValue($session, SinglePageCheckoutExperience::SESSION_BOUND_ORDER_ID);
        }
        if ((int) $session->get('order_awaiting_payment') === $orderId) {
            $this->unsetSessionValue($session, 'order_awaiting_payment');
        }
    }

    private function unsetSessionValue($session, $key)
    {
        if (method_exists($session, '__unset')) {
            $session->__unset($key);
            return;
        }
        if (method_exists($session, 'set')) {
            $session->set($key, 0);
        }
    }

    private function providerReferencesWooOrder($paypalOrder, $orderId)
    {
        if (!is_object($paypalOrder) || !method_exists($paypalOrder, 'purchase_units')) {
            return false;
        }
        $units = $paypalOrder->purchase_units();
        return isset($units[0]) && is_object($units[0]) && method_exists($units[0], 'custom_id')
            && hash_equals((string) $orderId, (string) $units[0]->custom_id());
    }

    private function markLinkFailure($order, $reason, $providerId = '')
    {
        if (!is_object($order) || !method_exists($order, 'update_meta_data')) {
            return;
        }
        $order->update_meta_data(self::ORDER_STATE_KEY, self::STATE_LINK_FAILED);
        $order->update_meta_data('_aster_paypal_order_first_failure', sanitize_key((string) $reason));
        if ($providerId !== '') {
            $order->update_meta_data($this->paypalOrderIdMetaKey(), $providerId);
        }
        if (method_exists($order, 'save')) {
            $order->save();
        }
    }

    private function nativeSessionActive($session)
    {
        $started = (int) $session->get(SinglePageCheckoutExperience::SESSION_MARKER);
        return $started >= time() - SinglePageCheckoutExperience::ATTEMPT_TTL_SECONDS
            && $started <= time() + 60;
    }

    private function session()
    {
        return function_exists('WC') && WC() && isset(WC()->session) && is_object(WC()->session)
            ? WC()->session
            : null;
    }

    private function paypalContainerService($id)
    {
        $class = '\\WooCommerce\\PayPalCommerce\\PPCP';
        if (!class_exists($class) || !method_exists($class, 'container')) {
            return null;
        }
        $container = $class::container();
        return is_object($container) && method_exists($container, 'get') ? $container->get($id) : null;
    }

    private function paypalOrderIdMetaKey()
    {
        $class = '\\WooCommerce\\PayPalCommerce\\WcGateway\\Gateway\\PayPalGateway';
        return class_exists($class) && defined($class . '::ORDER_ID_META_KEY')
            ? constant($class . '::ORDER_ID_META_KEY')
            : '_ppcp_paypal_order_id';
    }

    private function paypalIntentMetaKey()
    {
        $class = '\\WooCommerce\\PayPalCommerce\\WcGateway\\Gateway\\PayPalGateway';
        return class_exists($class) && defined($class . '::INTENT_META_KEY')
            ? constant($class . '::INTENT_META_KEY')
            : '_ppcp_paypal_order_intent';
    }

    private function acquireAttemptLock($token)
    {
        global $wpdb;
        if (!is_object($wpdb) || !method_exists($wpdb, 'get_var') || !method_exists($wpdb, 'prepare')) {
            return new \WP_Error('checkout_lock_unavailable', 'Secure checkout locking is unavailable.');
        }
        $name = 'aster_ppcp_' . substr(hash('sha256', (string) ($wpdb->prefix ?? '') . ':' . $token), 0, 48);
        $acquired = $wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 0)', $name));
        return (string) $acquired === '1'
            ? $name
            : new \WP_Error('checkout_attempt_in_progress', 'This checkout is already being prepared.');
    }

    private function releaseAttemptLock($name)
    {
        global $wpdb;
        if (is_string($name) && $name !== '' && is_object($wpdb)
            && method_exists($wpdb, 'get_var') && method_exists($wpdb, 'prepare')) {
            $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $name));
        }
    }
}
