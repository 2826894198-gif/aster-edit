<?php
namespace Aster\Checkout;

/**
 * Converts persisted WooCommerce and provider facts into one customer state
 * and one server-authorized next action. The browser must never infer whether
 * a second payment is safe.
 */
final class PaymentStateMachine
{
    const NO_PAYMENT_ACTION = 'none';
    const CHECK_STATUS = 'check_status';
    const RESUME_SAME_ORDER = 'resume_same_order';
    const RETRY_SAME_ORDER = 'retry_same_order';
    const VIEW_ORDER = 'view_order';
    const VIEW_REFUND = 'view_refund';
    const MANUAL_REVIEW = 'manual_review';

    public static function decide(array $facts)
    {
        $orderExists = !array_key_exists('order_exists', $facts) || (bool) $facts['order_exists'];
        $wooStatus = self::key($facts['woo_status'] ?? '');
        $providerStatus = strtoupper(trim((string) ($facts['provider_status'] ?? '')));
        $captureStatus = strtoupper(trim((string) ($facts['capture_status'] ?? '')));
        $captureCount = max(0, (int) ($facts['capture_count'] ?? 0));
        $lookupAvailable = !empty($facts['lookup_available']);
        $reconciliation = self::key($facts['reconciliation'] ?? '');
        $gatewayReason = PaymentAssessment::reason($facts['gateway_reason'] ?? '');
        $retryCount = max(0, (int) ($facts['retry_count'] ?? 0));
        $canResume = !empty($facts['can_resume']);
        $preProvider = !empty($facts['pre_provider']);
        $refunded = !empty($facts['refunded']) || in_array($wooStatus, array('refunded'), true);

        if (!$orderExists) {
            return self::result('order_missing', 'AE-PAY-09', self::MANUAL_REVIEW, true, 0, 'woo_order_missing');
        }

        if ($refunded) {
            return self::result('refunded', 'AE-PAY-08', self::VIEW_REFUND, false, 0, 'refund_recorded');
        }

        if (strpos($reconciliation, 'mismatch') !== false
            || strpos($reconciliation, 'manual_review') !== false
            || $captureStatus === 'COMPLETED' && !in_array($wooStatus, array('processing', 'completed'), true)) {
            return self::result('manual_review', 'AE-PAY-07', self::MANUAL_REVIEW, true, 0, 'payment_evidence_requires_review');
        }

        if (in_array($wooStatus, array('processing', 'completed'), true)) {
            if ($reconciliation === 'verified' && $providerStatus === 'COMPLETED'
                && $captureStatus === 'COMPLETED' && $captureCount === 1) {
                return self::result('completed', 'AE-PAY-05', self::VIEW_ORDER, false, 0, 'payment_matched');
            }
            return self::result('manual_review', 'AE-PAY-07', self::MANUAL_REVIEW, true, 0, 'paid_order_requires_reconciliation');
        }

        if ($preProvider && $captureCount === 0 && $canResume) {
            return self::result('saved', 'AE-PAY-01', self::RESUME_SAME_ORDER, false, 0, 'provider_not_started');
        }

        if (!$lookupAvailable) {
            if ($retryCount >= 3) {
                return self::result('manual_review', 'AE-PAY-07', self::MANUAL_REVIEW, true, 0, 'provider_lookup_exhausted');
            }
            return self::result('lookup_unavailable', 'AE-PAY-04', self::CHECK_STATUS, true, self::retryAfter($retryCount), 'provider_lookup_unavailable');
        }

        if ($providerStatus === 'APPROVED') {
            return self::result('approved', 'AE-PAY-04', self::CHECK_STATUS, true, self::retryAfter($retryCount), 'approval_waiting_for_capture');
        }

        if (in_array($captureStatus, array('PENDING', 'PARTIALLY_CAPTURED'), true)) {
            return self::result('capture_pending', 'AE-PAY-04', self::CHECK_STATUS, true, self::retryAfter($retryCount), 'capture_processing');
        }

        if ($providerStatus === 'PAYER_ACTION_REQUIRED' && $captureCount === 0) {
            return self::result('action_required', 'AE-PAY-06', $canResume ? self::RESUME_SAME_ORDER : self::CHECK_STATUS, !$canResume, $canResume ? 0 : self::retryAfter($retryCount), 'payer_action_required');
        }

        if ($captureCount === 0 && PaymentAssessment::isKnownDecline($gatewayReason)) {
            return self::result(
                'declined',
                'AE-PAY-03',
                $canResume ? self::RETRY_SAME_ORDER : self::CHECK_STATUS,
                !$canResume,
                $canResume ? 0 : self::retryAfter($retryCount),
                'verified_instrument_decline'
            );
        }

        if ($captureCount === 0 && in_array($providerStatus, array('CREATED', 'SAVED', 'VOIDED'), true)) {
            return self::result('saved', $providerStatus === 'VOIDED' ? 'AE-PAY-02' : 'AE-PAY-01', $canResume ? self::RESUME_SAME_ORDER : self::CHECK_STATUS, !$canResume, $canResume ? 0 : self::retryAfter($retryCount), 'verified_no_capture');
        }

        return self::result('manual_review', 'AE-PAY-07', self::MANUAL_REVIEW, true, 0, 'payment_result_unconfirmed');
    }

    public static function allowsPayment(array $decision)
    {
        return in_array((string) ($decision['safe_action'] ?? ''), array(self::RESUME_SAME_ORDER, self::RETRY_SAME_ORDER), true);
    }

    private static function retryAfter($retryCount)
    {
        $delays = array(5, 20, 50);
        return $delays[min(max(0, (int) $retryCount), count($delays) - 1)];
    }

    private static function result($state, $code, $safeAction, $paymentLocked, $retryAfter, $reason)
    {
        return array(
            'customer_state' => $state,
            'code' => $code,
            'safe_action' => $safeAction,
            'payment_locked' => (bool) $paymentLocked,
            'retry_after' => max(0, (int) $retryAfter),
            'reason' => $reason,
        );
    }

    private static function key($value)
    {
        return strtolower(preg_replace('/[^a-z0-9_-]/', '', (string) $value));
    }
}
