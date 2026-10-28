<?php
namespace Aster\Checkout;

/** Serializes mutually exclusive provider-start and order-replacement actions. */
final class PaymentOperationLock
{
    public static function acquireForOrder($orderId)
    {
        global $wpdb;
        $orderId = absint($orderId);
        if ($orderId < 1 || !is_object($wpdb) || !method_exists($wpdb, 'get_var') || !method_exists($wpdb, 'prepare')) {
            return new \WP_Error('payment_operation_lock_unavailable', 'This payment action cannot be secured right now. Check the order status before trying again.', array('status' => 503));
        }
        $name = 'aster_pay_' . substr(hash('sha256', (string) ($wpdb->prefix ?? '') . ':order:' . $orderId), 0, 48);
        $acquired = $wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 0)', $name));
        if ((string) $acquired !== '1') {
            return new \WP_Error('payment_operation_in_progress', 'Another payment action is already in progress. Check the order status before trying again.', array('status' => 409));
        }
        return $name;
    }

    public static function release($name)
    {
        global $wpdb;
        if (!is_string($name) || $name === '' || !is_object($wpdb) || !method_exists($wpdb, 'get_var') || !method_exists($wpdb, 'prepare')) return;
        $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $name));
    }
}
