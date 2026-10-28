<?php
namespace Aster\Checkout;
/** Adapted JWK native session lifecycle; Aster owns presentation and handoff. */
final class SinglePageCheckoutExperience
{
    const SESSION_MARKER = 'aster_native_single_page_checkout';
    const SESSION_ATTEMPT_TOKEN = 'aster_native_checkout_attempt_token';
    const SESSION_ATTEMPT_CREATED_AT = 'aster_native_checkout_attempt_created_at';
    const SESSION_BOUND_ORDER_ID = 'aster_native_checkout_bound_order_id';
    const ATTEMPT_TTL_SECONDS = DAY_IN_SECONDS;
    private $config;
    private $attempts;
    public function __construct(Config $config, PaymentAttemptRepository $attempts) {
        $this->config = $config; $this->attempts = $attempts;
    }
    public function register() {
        add_action('woocommerce_before_checkout_form', [$this, 'prepareNativeSession'], 1);
        add_action('woocommerce_checkout_process', [$this, 'guardNativeSubmission'], 1);
        add_action('woocommerce_checkout_create_order', [$this, 'tagNativeOrder'], 5, 2);
        add_action('woocommerce_checkout_order_created', [$this, 'bindNativeOrder'], 5);
    }
    private function providerForMethod($method) {
        return in_array($method, $this->config->paypalGatewayIds(), true) ? 'paypal' : '';
    }
    private function canResumeBoundNativeOrder($id, $session) {
        if ((int)$session->get('order_awaiting_payment') !== (int)$id || !WC()->cart) return false;
        $order = wc_get_order($id);
        if ($order && $this->selectedPaymentMethod() !== $order->get_payment_method()
            && trim((string)$order->get_meta('_aster_provider_create_started_at')) !== '') return false;
        return $this->isNativeOrder($order) && $order->has_status(['pending', 'failed'])
            && $order->has_cart_hash(WC()->cart->get_cart_hash()) && $this->canResumePayPalOrder($order);
    }
public function prepareNativeSession()
    {
        if (!$this->isNativeCheckout()) {
            return;
        }
        $session = $this->wooSession();
        if (!$session) {
            return;
        }
        $session->set(self::SESSION_MARKER, time());
        $this->nativeAttemptToken($session, true);
    }

    /**
     * Keep duplicate protection while allowing WooCommerce to resume the one
     * failed/pending order it already bound to this unchanged cart. Core does
     * that reuse through `order_awaiting_payment`; never allow this native
     * form to fall through into creating a second order.
     */

public function guardNativeSubmission()
    {
        if (!$this->isNativeContext()) {
            return;
        }
        $session = $this->wooSession();
        if (!$session) {
            $this->checkoutNotice(__('Your secure checkout session expired. Return to your cart and try again.', 'aster-checkout'));
            return;
        }
        $boundOrderId = (int) $session->get(self::SESSION_BOUND_ORDER_ID);
        if ($boundOrderId > 0) {
            if (!$this->canResumeBoundNativeOrder($boundOrderId, $session)) {
                $this->checkoutNotice(__('This checkout already has an order. Check its payment status before submitting another payment.', 'aster-checkout'));
            }
            return;
        }

        $provider = $this->providerForMethod($this->selectedPaymentMethod());
        if ($provider === '' || !$this->attempts) {
            return;
        }
        $token = $this->nativeAttemptToken($session, true);
        if ($token === '' || !$this->attempts->ensureForToken($token, $provider)) {
            $this->checkoutNotice(__('Secure payment recovery is temporarily unavailable. No order was created.', 'aster-checkout'));
        }
    }

    /** Attach native-surface metadata before WooCommerce gives the order to a gateway. */

public function tagNativeOrder($order, $data = array())
    {
        if (!$this->isNativeContext() || !is_object($order) || !method_exists($order, 'update_meta_data')) {
            return;
        }
        $method = sanitize_key((string) ($data['payment_method'] ?? $this->selectedPaymentMethod()));
        $provider = $this->providerForMethod($method);
        if ($provider === '') {
            return;
        }
        $order->update_meta_data('_aster_payment_surface', 'native_single_page');
        $order->update_meta_data('_aster_payment_provider', $provider);
        $order->update_meta_data('_aster_payment_entry', $method);

        $session = $this->wooSession();
        $token = $this->nativeAttemptToken($session, false);
        if ($token !== '') {
            $order->update_meta_data(CheckoutAttemptRegistry::ORDER_TOKEN_HASH_KEY, hash('sha256', $token));
            $order->update_meta_data(CheckoutAttemptRegistry::ORDER_CREATED_AT_KEY, gmdate('c', (int) $session->get(self::SESSION_ATTEMPT_CREATED_AT)));
        }
    }

    /** Record a pseudonymous recovery row; card and buyer data never leave the gateway or Woo order. */

public function bindNativeOrder($order)
    {
        if (!$this->isNativeOrder($order)) {
            return;
        }
        $session = $this->wooSession();
        $token = $this->nativeAttemptToken($session, false);
        if ($this->attempts) {
            $bound = $token !== ''
                ? $this->attempts->bindOrder($token, $order)
                : $this->attempts->ensureForOrder($order);
            if (!$bound && method_exists($order, 'update_meta_data')) {
                $order->update_meta_data('_aster_payment_recovery_state', 'unavailable');
            }
        }
        if ($session) {
            $session->set(self::SESSION_BOUND_ORDER_ID, (int) $order->get_id());
            $this->clearNativeAttempt($session);
        }
        if (method_exists($order, 'save')) {
            $order->save();
        }
        do_action('aster_payment_diagnostic_event', $order, 'woo_order_created', array(
            'provider' => $this->providerForMethod((string) $order->get_payment_method()),
            'method' => sanitize_key((string) $order->get_payment_method()),
            'surface' => 'native_single_page',
        ));
    }

private function isNativeCheckout()
    {
        return $this->config->singlePageCheckoutEnabled()
            && function_exists('is_checkout')
            && is_checkout()
            && !(function_exists('is_wc_endpoint_url') && (is_wc_endpoint_url('order-pay') || is_wc_endpoint_url('order-received')));
    }

private function isNativeContext()
    {
        return $this->config->singlePageCheckoutEnabled() && ($this->isNativeCheckout() || $this->nativeSessionActive());
    }

private function nativeSessionActive()
    {
        $session = $this->wooSession();
        if (!$session) {
            return false;
        }
        $started = (int) $session->get(self::SESSION_MARKER);
        return $started >= time() - self::ATTEMPT_TTL_SECONDS && $started <= time() + 60;
    }

private function isNativeOrder($order)
    {
        return is_object($order)
            && method_exists($order, 'get_meta')
            && (string) $order->get_meta('_aster_payment_surface') === 'native_single_page';
    }

private function selectedPaymentMethod()
    {
        if (isset($_POST['payment_method']) && is_string($_POST['payment_method'])) {
            return sanitize_key(wp_unslash($_POST['payment_method']));
        }
        $session = $this->wooSession();
        return $session ? sanitize_key((string) $session->get('chosen_payment_method')) : '';
    }

private function nativeAttemptToken($session, $create)
    {
        if (!$session || !method_exists($session, 'get')) {
            return '';
        }
        $token = strtolower(trim((string) $session->get(self::SESSION_ATTEMPT_TOKEN)));
        $createdAt = (int) $session->get(self::SESSION_ATTEMPT_CREATED_AT);
        if (preg_match('/^[a-f0-9]{48}$/D', $token) && $createdAt >= time() - self::ATTEMPT_TTL_SECONDS) {
            return $token;
        }
        if (!$create || !method_exists($session, 'set')) {
            return '';
        }
        try {
            $token = bin2hex(random_bytes(24));
        } catch (\Throwable $error) {
            return '';
        }
        $session->set(self::SESSION_ATTEMPT_TOKEN, $token);
        $session->set(self::SESSION_ATTEMPT_CREATED_AT, time());
        return $token;
    }

private function clearNativeAttempt($session)
    {
        if (!$session) {
            return;
        }
        if (method_exists($session, '__unset')) {
            $session->__unset(self::SESSION_ATTEMPT_TOKEN);
            $session->__unset(self::SESSION_ATTEMPT_CREATED_AT);
            return;
        }
        if (method_exists($session, 'set')) {
            $session->set(self::SESSION_ATTEMPT_TOKEN, '');
            $session->set(self::SESSION_ATTEMPT_CREATED_AT, 0);
        }
    }

    /**
     * WooCommerce only resumes `order_awaiting_payment` when its cart hash
     * still matches. Repeat those checks here so a changed cart, a completed
     * payment, or provider evidence can never create a second charge/order.
     */

private function canResumePayPalOrder($order)
    {
        if (!method_exists($order, 'get_meta')) {
            return false;
        }
        if (PayPalCheckoutOrderFirst::isProviderCreationInProgress($order)) {
            return true;
        }
        $resumeOrderId = isset($_POST['ppcp-resume-order'])
            ? absint(wp_unslash($_POST['ppcp-resume-order']))
            : 0;
        if (PayPalCheckoutOrderFirst::isLinkedOrderResume($order, $resumeOrderId)) {
            return true;
        }
        if (trim((string) $order->get_meta('_aster_provider_create_started_at')) !== '') {
            return false;
        }
        foreach (apply_filters('aster_paypal_order_id_meta_keys', array('_ppcp_paypal_order_id', '_ppcp_order_id', '_paypal_order_id')) as $key) {
            if (trim((string) $order->get_meta($key)) !== '') {
                return false;
            }
        }
        return true;
    }

    /** Start a newly handed-off cart without inheriting an unrelated unpaid order. */

private function wooSession()
    {
        if (!function_exists('WC') || !WC()) {
            return null;
        }
        return isset(WC()->session) && is_object(WC()->session) ? WC()->session : null;
    }

    /** Once B is active, do not let the same form silently create a third order. */

private function checkoutNotice($message)
    {
        if (function_exists('wc_add_notice')) {
            wc_add_notice($message, 'error');
        }
    }
}
