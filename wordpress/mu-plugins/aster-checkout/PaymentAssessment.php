<?php
namespace Aster\Checkout;

/**
 * Converts WooCommerce and PayPal facts into a deliberately small set of
 * customer-facing payment states. It never treats a missing capture lookup as
 * proof that a customer was not charged.
 */
final class PaymentAssessment
{
    const PAID = 'paid';
    const CANCELLED = 'cancelled';
    const DECLINED = 'declined';
    const PENDING = 'pending';
    const UNCONFIRMED = 'unconfirmed';

    /**
     * @return array{state:string, customer_code:string, reason:string}
     */
    public static function assess($wooStatus, $paypalStatus, $captureCount, $captureVerified, $gatewayReason, $customerReturnedWithoutApproval = false)
    {
        $wooStatus = self::key($wooStatus);
        $paypalStatus = strtoupper(trim((string) $paypalStatus));
        $captureCount = max(0, (int) $captureCount);
        $captureVerified = (bool) $captureVerified;
        $gatewayReason = self::reason($gatewayReason);

        // A WooCommerce paid status is already set only by the official
        // gateway's completed-payment lifecycle. It is the authoritative
        // success signal even if a later diagnostic lookup is unavailable.
        if (in_array($wooStatus, array('processing', 'completed'), true)) {
            return array('state' => self::PAID, 'customer_code' => 'AE-PAY-05', 'reason' => 'woocommerce_paid');
        }

        // A customer return with a readable CREATED/VOIDED provider order and
        // no capture is a cancellation observation, not a success claim.
        if ($customerReturnedWithoutApproval && $captureVerified && $captureCount === 0
            && in_array($wooStatus, array('pending', 'on-hold', 'failed'), true)
            && in_array($paypalStatus, array('CREATED', 'VOIDED'), true)) {
            return array('state' => self::CANCELLED, 'customer_code' => 'AE-PAY-02', 'reason' => 'customer_cancelled_before_capture');
        }

        // This is the only branch that promises "no charge was captured" to
        // a customer: Woo failed, PayPal was read successfully, no capture is
        // present, and the gateway supplied a recognised decline reason.
        if ($wooStatus === 'failed' && $captureVerified && $captureCount === 0
            && $paypalStatus !== 'COMPLETED' && self::isKnownDecline($gatewayReason)) {
            return array('state' => self::DECLINED, 'customer_code' => 'AE-PAY-03', 'reason' => 'verified_instrument_decline');
        }

        // A failed WooCommerce order is never merely "pending" from the
        // shopper's perspective. If we cannot prove the capture state, keep
        // it in the manual-review branch even when PayPal still reports the
        // earlier APPROVED state.
        if ($wooStatus === 'failed') {
            return array('state' => self::UNCONFIRMED, 'customer_code' => 'AE-PAY-04', 'reason' => 'failed_order_requires_capture_review');
        }

        if ($wooStatus === 'pending' || $wooStatus === 'on-hold'
            || in_array($paypalStatus, array('CREATED', 'SAVED', 'APPROVED', 'PAYER_ACTION_REQUIRED'), true)) {
            return array('state' => self::PENDING, 'customer_code' => 'AE-PAY-04', 'reason' => 'payment_still_pending');
        }

        // Failed orders with an unknown reason, a captured PayPal order that
        // has not reached WooCommerce, or an unavailable lookup all require
        // human review instead of a potentially dangerous retry prompt.
        return array('state' => self::UNCONFIRMED, 'customer_code' => 'AE-PAY-04', 'reason' => 'payment_result_unconfirmed');
    }

    public static function isKnownDecline($reason)
    {
        return (bool) preg_match('/(?:instrument|payment(?:[_\s-]*method)?|funding[_\s-]*source).{0,80}declin|declined by (?:paypal|the processor|your bank)|(?:bank|issuer).{0,80}(?:unable to approve|did not approve|refus|reject)|cannot be used|processor or bank/i', self::reason($reason));
    }

    /** Keep an inconclusive provider result in the bounded confirmation window. */
    public static function requiresFurtherConfirmation(array $assessment)
    {
        return in_array((string) ($assessment['state'] ?? ''), array(self::PENDING, self::UNCONFIRMED), true);
    }

    public static function reason($reason)
    {
        $reason = preg_replace('/\s+/', ' ', wp_strip_all_tags((string) $reason));
        return trim(substr((string) $reason, 0, 500));
    }

    private static function key($value)
    {
        return strtolower(preg_replace('/[^a-z0-9_-]/', '', (string) $value));
    }
}
