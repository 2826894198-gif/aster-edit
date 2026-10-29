<?php
namespace Aster\Checkout;

/**
 * Pseudonymous payment evidence that survives Woo order removal. Raw checkout
 * tokens, order keys, addresses, email addresses and card data are never stored.
 */
final class PaymentAttemptRepository
{
    private $database;
    private $table;

    public function __construct($database = null)
    {
        global $wpdb;
        $this->database = $database ?: $wpdb;
        $this->table = $this->database->prefix . 'aster_payment_attempts';
    }

    public function ensureForToken($token, $provider = 'paypal')
    {
        $tokenHash = self::tokenHash($token);
        if ($tokenHash === '') return null;
        $existing = $this->findByTokenHash($tokenHash);
        if ($existing) return $existing;

        $now = gmdate('Y-m-d H:i:s');
        $row = array(
            'attempt_id' => wp_generate_uuid4(),
            'token_hash' => $tokenHash,
            'provider' => sanitize_key($provider) ?: 'paypal',
            'woo_order_id' => null,
            'woo_order_key_hash' => '',
            'provider_order_id' => '',
            'capture_id' => '',
            'amount_minor' => 0,
            'currency' => '',
            'woo_status' => '',
            'provider_status' => '',
            'capture_status' => '',
            'capture_count' => 0,
            'lookup_available' => 0,
            'reconciliation_state' => '',
            'customer_state' => 'saved',
            'safe_action' => PaymentStateMachine::RESUME_SAME_ORDER,
            'retry_count' => 0,
            'next_check_at' => null,
            'expires_at' => null,
            'order_deleted_at' => null,
            'resolved_at' => null,
            'last_reason' => 'checkout_attempt_created',
            'version' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        );
        if ($this->database->insert($this->table, $row) === false) {
            return $this->findByTokenHash($tokenHash);
        }
        return $this->findByTokenHash($tokenHash) ?: $row;
    }

    public function bindOrder($token, $order)
    {
        if (!self::validOrder($order)) return null;
        $record = $this->ensureForToken($token, self::providerFromOrder($order));
        if (!$record) return null;
        $this->database->update($this->table, $this->orderSnapshot($order, array(
            // A native checkout attempt learns its provider only after the
            // shopper selects a WooCommerce gateway. Keep the pseudonymous
            // record aligned with that immutable order selection.
            'provider' => self::providerFromOrder($order),
            'last_reason' => 'woo_order_bound',
            'updated_at' => gmdate('Y-m-d H:i:s'),
            'version' => ((int) ($record['version'] ?? 0)) + 1,
        )), array('attempt_id' => $record['attempt_id']));
        return $this->findByAttemptId($record['attempt_id']);
    }

    public function ensureForOrder($order)
    {
        if (!self::validOrder($order)) return null;
        $existing = $this->findByOrderId((int) $order->get_id());
        if ($existing) return $existing;
        $storedHash = trim((string) $order->get_meta(CheckoutAttemptRegistry::ORDER_TOKEN_HASH_KEY));
        $tokenHash = preg_match('/^[a-f0-9]{64}$/D', $storedHash)
            ? $storedHash
            : hash('sha256', 'legacy-order|' . (int) $order->get_id() . '|' . (string) $order->get_order_key());
        $now = gmdate('Y-m-d H:i:s');
        $row = array_merge(array(
            'attempt_id' => wp_generate_uuid4(),
            'token_hash' => $tokenHash,
            'provider' => self::providerFromOrder($order),
            'provider_order_id' => self::providerOrderId($order),
            'capture_id' => sanitize_text_field((string) $order->get_meta('_aster_paypal_capture_id')),
            'provider_status' => sanitize_text_field((string) $order->get_meta('_aster_payment_provider_status')),
            'capture_status' => '',
            'capture_count' => max(0, (int) $order->get_meta('_aster_payment_capture_count')),
            'lookup_available' => (string) $order->get_meta('_aster_payment_capture_check') === 'verified' ? 1 : 0,
            'reconciliation_state' => sanitize_key((string) $order->get_meta('_aster_paypal_reconciliation')),
            'customer_state' => sanitize_key((string) $order->get_meta('_aster_payment_assessment')) ?: 'saved',
            'safe_action' => sanitize_key((string) $order->get_meta('_aster_payment_recommended_action')) ?: PaymentStateMachine::CHECK_STATUS,
            'retry_count' => 0,
            'next_check_at' => null,
            'expires_at' => self::mysqlDate($order->get_meta('_aster_payment_expires_at')),
            'order_deleted_at' => null,
            'resolved_at' => null,
            'last_reason' => 'legacy_order_adopted',
            'version' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ), $this->orderSnapshot($order));
        if ($this->database->insert($this->table, $row) === false) {
            return $this->findByOrderId((int) $order->get_id());
        }
        return $this->findByOrderId((int) $order->get_id()) ?: $row;
    }

    public function recordDecision($order, array $decision, array $facts = array())
    {
        $record = $this->ensureForOrder($order);
        if (!$record) return null;
        $retryAfter = max(0, (int) ($decision['retry_after'] ?? 0));
        $resolved = in_array((string) ($decision['customer_state'] ?? ''), array('completed', 'declined', 'cancelled', 'refunded'), true);
        $providerOrderId = array_key_exists('provider_order_id', $facts) ? $facts['provider_order_id'] : ($record['provider_order_id'] ?? self::providerOrderId($order));
        $captureId = array_key_exists('capture_id', $facts) ? $facts['capture_id'] : ($record['capture_id'] ?? $order->get_meta('_aster_paypal_capture_id'));
        $providerStatus = array_key_exists('provider_status', $facts) ? $facts['provider_status'] : ($record['provider_status'] ?? '');
        $captureStatus = array_key_exists('capture_status', $facts) ? $facts['capture_status'] : ($record['capture_status'] ?? '');
        $captureCount = array_key_exists('capture_count', $facts) ? $facts['capture_count'] : ($record['capture_count'] ?? 0);
        $lookupAvailable = array_key_exists('lookup_available', $facts) ? $facts['lookup_available'] : ($record['lookup_available'] ?? 0);
        $reconciliation = array_key_exists('reconciliation', $facts) ? $facts['reconciliation'] : ($facts['reconciliation_state'] ?? $record['reconciliation_state'] ?? '');
        $data = array_merge($this->orderSnapshot($order), array(
            'provider_order_id' => sanitize_text_field((string) $providerOrderId),
            'capture_id' => sanitize_text_field((string) $captureId),
            'provider_status' => sanitize_text_field((string) $providerStatus),
            'capture_status' => sanitize_text_field((string) $captureStatus),
            'capture_count' => max(0, (int) $captureCount),
            'lookup_available' => !empty($lookupAvailable) ? 1 : 0,
            'reconciliation_state' => sanitize_key((string) $reconciliation),
            'customer_state' => sanitize_key((string) ($decision['customer_state'] ?? 'manual_review')),
            'safe_action' => sanitize_key((string) ($decision['safe_action'] ?? PaymentStateMachine::MANUAL_REVIEW)),
            'retry_count' => max(0, (int) ($facts['retry_count'] ?? $record['retry_count'] ?? 0)),
            'next_check_at' => $retryAfter > 0 ? gmdate('Y-m-d H:i:s', time() + $retryAfter) : null,
            'resolved_at' => $resolved ? gmdate('Y-m-d H:i:s') : null,
            'last_reason' => sanitize_text_field((string) ($decision['reason'] ?? 'payment_state_updated')),
            'version' => ((int) ($record['version'] ?? 0)) + 1,
            'updated_at' => gmdate('Y-m-d H:i:s'),
        ));
        $this->database->update($this->table, $data, array('attempt_id' => $record['attempt_id']));
        return $this->findByAttemptId($record['attempt_id']);
    }

    public function markOrderMissing($orderId, $reason = 'woo_order_deleted')
    {
        $record = $this->findByOrderId($orderId);
        if (!$record) return false;
        return $this->database->update($this->table, array(
            'customer_state' => 'order_missing',
            'safe_action' => PaymentStateMachine::MANUAL_REVIEW,
            'order_deleted_at' => gmdate('Y-m-d H:i:s'),
            'last_reason' => sanitize_key($reason),
            'version' => ((int) ($record['version'] ?? 0)) + 1,
            'updated_at' => gmdate('Y-m-d H:i:s'),
        ), array('attempt_id' => $record['attempt_id'])) !== false;
    }

    public function findByOrderReference($orderId, $orderKey)
    {
        $record = $this->findByOrderId($orderId);
        if (!$record || $orderKey === '') return null;
        return hash_equals((string) ($record['woo_order_key_hash'] ?? ''), hash('sha256', (string) $orderKey)) ? $record : null;
    }

    public function isDeletionProtected($orderId)
    {
        $record = $this->findByOrderId($orderId);
        if (!$record) return false;
        return !in_array((string) ($record['customer_state'] ?? ''), array('completed', 'declined', 'cancelled', 'refunded'), true);
    }

    public function findByOrderId($orderId)
    {
        return $this->row('woo_order_id', (int) $orderId, '%d');
    }

    public function findByAttemptId($attemptId)
    {
        return $this->row('attempt_id', sanitize_text_field($attemptId), '%s');
    }

    private function findByTokenHash($tokenHash)
    {
        return $this->row('token_hash', $tokenHash, '%s');
    }

    private function row($column, $value, $placeholder)
    {
        $allowed = array('attempt_id', 'token_hash', 'woo_order_id');
        if (!in_array($column, $allowed, true)) return null;
        $query = $this->database->prepare("SELECT * FROM {$this->table} WHERE {$column} = {$placeholder} LIMIT 1", $value);
        $row = $this->database->get_row($query, ARRAY_A);
        return is_array($row) ? $row : null;
    }

    private function orderSnapshot($order, array $extra = array())
    {
        return array_merge(array(
            'woo_order_id' => (int) $order->get_id(),
            'woo_order_key_hash' => hash('sha256', (string) $order->get_order_key()),
            'amount_minor' => (int) round(((float) $order->get_total()) * 100),
            'currency' => strtoupper(sanitize_text_field((string) $order->get_currency())),
            'woo_status' => sanitize_key((string) $order->get_status()),
        ), $extra);
    }

    private static function providerFromOrder($order)
    {
        $stored = sanitize_key((string) $order->get_meta('_aster_payment_provider'));
        return $stored ?: 'paypal';
    }

    private static function providerOrderId($order)
    {
        foreach (array('_ppcp_paypal_order_id', '_ppcp_order_id', '_paypal_order_id') as $key) {
            $value = sanitize_text_field((string) $order->get_meta($key));
            if ($value !== '') return $value;
        }
        return '';
    }

    private static function tokenHash($token)
    {
        $token = strtolower(trim((string) $token));
        return preg_match('/^[a-f0-9]{48}$/D', $token) ? hash('sha256', $token) : '';
    }

    private static function validOrder($order)
    {
        return is_object($order) && method_exists($order, 'get_id') && method_exists($order, 'get_order_key')
            && method_exists($order, 'get_total') && method_exists($order, 'get_currency') && method_exists($order, 'get_status');
    }

    private static function mysqlDate($value)
    {
        $timestamp = strtotime((string) $value);
        return $timestamp ? gmdate('Y-m-d H:i:s', $timestamp) : null;
    }
}
