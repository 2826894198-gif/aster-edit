<?php
namespace Aster\Checkout;

final class PayPalVerifier
{
    private $config;
    private $requester;

    public function __construct(Config $config, callable $requester = null)
    {
        $this->config = $config;
        $this->requester = $requester;
    }

    public function verify($order)
    {
        if (in_array($order->get_status(), array('processing', 'completed'), true)) return array('state' => 'completed', 'reason' => 'woocommerce_already_paid', 'transaction_id' => $order->get_transaction_id());

        $facts = $this->paymentFacts($order);
        if (empty($facts['lookup_available'])) {
            return array('state' => 'unverified', 'reason' => (string) ($facts['reason'] ?? 'paypal_lookup_failed'));
        }

        $status = strtoupper((string) ($facts['provider_status'] ?? ''));
        $paypalOrderId = (string) ($facts['provider_order_id'] ?? '');
        if ($status === 'COMPLETED' && empty($facts['amount_matches'])) {
            return array('state' => 'unverified', 'reason' => 'paypal_amount_or_currency_mismatch', 'paypal_order_id' => $paypalOrderId);
        }
        if ($status === 'COMPLETED') {
            return array(
                'state' => 'completed',
                'reason' => 'paypal_completed',
                'transaction_id' => (string) ($facts['capture_id'] ?? '') ?: $paypalOrderId,
                'paypal_order_id' => $paypalOrderId,
            );
        }
        return array('state' => 'not_completed', 'reason' => 'paypal_' . strtolower($status), 'paypal_order_id' => $paypalOrderId);
    }

    /**
     * Returns server-only PayPal facts for a payment-safety decision. The
     * remote payload never leaves this PHP request, and an unavailable lookup
     * is deliberately distinct from a verified zero-capture result.
     */
    public function paymentFacts($order, $timeoutSeconds = 8)
    {
        $facts = array(
            'lookup_available' => false,
            'reason' => 'paypal_lookup_failed',
            'provider_order_id' => '',
            'remote_order_id' => '',
            'remote_order_id_matches' => false,
            'provider_status' => '',
            'capture_count' => 0,
            'authorization_count' => 0,
            'capture_status' => '',
            'capture_id' => '',
            'amount_matches' => false,
            'order_reference_matches' => false,
            'remote_order' => null,
        );
        if (!is_object($order) || !method_exists($order, 'get_meta')) {
            $facts['reason'] = 'paypal_order_invalid';
            return $facts;
        }
        $paypalOrderId = $this->paypalOrderId($order);
        if (!$paypalOrderId) {
            $facts['reason'] = 'paypal_order_id_missing';
            return $facts;
        }
        $facts['provider_order_id'] = $paypalOrderId;
        if (!$this->config->paypalClientId() || !$this->config->paypalClientSecret()) {
            $facts['reason'] = 'paypal_credentials_missing';
            return $facts;
        }

        $timeout = max(3, min(15, (int) $timeoutSeconds));
        try {
            $access = $this->request('POST', $this->baseUrl() . '/v1/oauth2/token', array(
                'headers' => array('Accept' => 'application/json', 'Accept-Language' => 'en_US', 'Authorization' => 'Basic ' . base64_encode($this->config->paypalClientId() . ':' . $this->config->paypalClientSecret())),
                'body' => 'grant_type=client_credentials', 'timeout' => $timeout,
            ));
            if (($access['code'] ?? 0) !== 200 || empty($access['body']['access_token'])) {
                $facts['reason'] = 'paypal_oauth_failed';
                return $facts;
            }
            $response = $this->request('GET', $this->baseUrl() . '/v2/checkout/orders/' . rawurlencode($paypalOrderId), array(
                'headers' => array('Accept' => 'application/json', 'Authorization' => 'Bearer ' . $access['body']['access_token']), 'timeout' => $timeout,
            ));
            if (($response['code'] ?? 0) !== 200 || empty($response['body']['status']) || !is_array($response['body'])) {
                $facts['reason'] = 'paypal_lookup_failed';
                return $facts;
            }
            $remote = $response['body'];
            $facts['lookup_available'] = true;
            $facts['reason'] = '';
            $facts['remote_order_id'] = trim((string) ($remote['id'] ?? ''));
            $facts['remote_order_id_matches'] = $facts['remote_order_id'] !== ''
                && hash_equals($paypalOrderId, $facts['remote_order_id']);
            $facts['provider_status'] = strtoupper((string) $remote['status']);
            $facts['capture_count'] = $this->captureCount($remote);
            $facts['authorization_count'] = $this->authorizationCount($remote);
            $facts['capture_status'] = $this->captureStatus($remote);
            $facts['capture_id'] = $this->captureId($remote);
            $facts['amount_matches'] = $this->amountMatchesOrder($order, $remote);
            $facts['order_reference_matches'] = $this->orderReferenceMatches($order, $remote);
            $facts['remote_order'] = $remote;
            return $facts;
        } catch (\Throwable $error) {
            $facts['reason'] = 'paypal_request_error';
            return $facts;
        }
    }

    private function paypalOrderId($order)
    {
        foreach (apply_filters('aster_paypal_order_id_meta_keys', array('_ppcp_paypal_order_id', '_ppcp_order_id', '_paypal_order_id')) as $key) {
            $value = trim((string) $order->get_meta($key));
            if ($value) return $value;
        }
        return '';
    }

    private function captureId(array $body)
    {
        foreach (($body['purchase_units'] ?? array()) as $unit) {
            foreach (($unit['payments']['captures'] ?? array()) as $capture) {
                if (strtoupper((string) ($capture['status'] ?? '')) === 'DECLINED') continue;
                $id = trim((string) ($capture['id'] ?? ''));
                if ($id !== '') return $id;
            }
        }
        return '';
    }

    private function captureCount(array $body)
    {
        $count = 0;
        foreach (($body['purchase_units'] ?? array()) as $unit) {
            foreach (($unit['payments']['captures'] ?? array()) as $capture) {
                if (strtoupper((string) ($capture['status'] ?? '')) !== 'DECLINED') $count++;
            }
        }
        return $count;
    }

    private function captureStatus(array $body)
    {
        foreach (($body['purchase_units'] ?? array()) as $unit) {
            foreach (($unit['payments']['captures'] ?? array()) as $capture) {
                $status = strtoupper((string) ($capture['status'] ?? ''));
                if ($status !== '' && $status !== 'DECLINED') return $status;
            }
        }
        return '';
    }

    /** An open authorization can reserve funds even when no capture exists. */
    private function authorizationCount(array $body)
    {
        $count = 0;
        foreach (($body['purchase_units'] ?? array()) as $unit) {
            foreach (($unit['payments']['authorizations'] ?? array()) as $authorization) {
                if (strtoupper((string) ($authorization['status'] ?? '')) !== 'VOIDED') $count++;
            }
        }
        return $count;
    }

    private function amountMatchesOrder($order, array $body)
    {
        if (!method_exists($order, 'get_total') || !method_exists($order, 'get_currency')) return false;
        if (count($body['purchase_units'] ?? []) !== 1) return false;
        $amount = $body['purchase_units'][0]['amount'] ?? array();
        $currency = strtoupper((string) ($amount['currency_code'] ?? ''));
        $value = isset($amount['value']) ? (string) $amount['value'] : '';
        $expectedCurrency = strtoupper((string) $order->get_currency());
        $expectedValue = number_format((float) $order->get_total(), 2, '.', '');
        if ($currency !== $expectedCurrency || $value !== $expectedValue) return false;
        // A quoted order total is insufficient evidence of captured funds.
        // Aster currently charges USD; require the actual single completed
        // capture to match the complete expected amount as well.
        foreach (($body['purchase_units'][0]['payments']['captures'] ?? []) as $capture) {
            if (($capture['status'] ?? '') === 'COMPLETED'
                && (($capture['amount']['currency_code'] ?? '') !== $expectedCurrency
                    || ($capture['amount']['value'] ?? '') !== $expectedValue)) return false;
        }
        return true;
    }

    /** Require a provider-side reference as well as the local order id. */
    private function orderReferenceMatches($order, array $body)
    {
        if (!method_exists($order, 'get_id') || !isset($body['purchase_units'])
            || !is_array($body['purchase_units']) || count($body['purchase_units']) !== 1
            || !is_array($body['purchase_units'][0] ?? null)) {
            return false;
        }
        $unit = $body['purchase_units'][0];
        $id = (string) $order->get_id();
        $custom = (string) ($unit['custom_id'] ?? '');
        $invoice = (string) ($unit['invoice_id'] ?? '');
        if ($custom !== '' && hash_equals($id, $custom)) return true;
        return $invoice !== '' && (bool) preg_match('/(?:^|[-_#])' . preg_quote($id, '/') . '$/D', $invoice);
    }

    private function baseUrl()
    {
        return $this->config->paypalMode() === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    }

    private function request($method, $url, array $args)
    {
        if ($this->requester) return call_user_func($this->requester, $method, $url, $args);
        $response = $method === 'POST' ? wp_remote_post($url, $args) : wp_remote_get($url, $args);
        if (is_wp_error($response)) throw new \RuntimeException('PayPal HTTP request failed');
        $body = json_decode((string) wp_remote_retrieve_body($response), true);
        return array('code' => (int) wp_remote_retrieve_response_code($response), 'body' => is_array($body) ? $body : array());
    }
}
