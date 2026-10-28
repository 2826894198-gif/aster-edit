<?php
namespace Aster\Checkout;

/** Prevents unresolved payment evidence from disappearing with a Woo order. */
final class PaymentDeletionGuard
{
    private $attempts;

    public function __construct(PaymentAttemptRepository $attempts)
    {
        $this->attempts = $attempts;
    }

    public function register()
    {
        add_filter('pre_trash_post', array($this, 'guardPostDeletion'), 10, 3);
        add_filter('pre_delete_post', array($this, 'guardPostDeletion'), 10, 3);
        // HPOS reaches the non-cancellable Woo hooks below before it touches a
        // WordPress post. Remove protected IDs from the admin request first so
        // the UI can redirect normally with an actionable notice.
        add_filter('woocommerce_bulk_action_ids', array($this, 'filterBulkActionIds'), 10, 3);
        add_action('woocommerce_before_trash_order', array($this, 'guardWooOrder'), 10, 2);
        add_action('woocommerce_before_delete_order', array($this, 'guardWooOrder'), 10, 2);
        add_action('trashed_post', array($this, 'recordPostRemoval'), 10, 1);
        add_action('deleted_post', array($this, 'recordPostRemoval'), 10, 1);
        add_action('woocommerce_after_delete_order', array($this, 'recordOrderRemoval'), 10, 1);
        add_action('admin_notices', array($this, 'adminNotice'));
    }

    public function guardPostDeletion($shortCircuit, $post, $previousStatus = null)
    {
        $postType = is_object($post) ? (string) ($post->post_type ?? '') : '';
        $orderId = is_object($post) ? (int) ($post->ID ?? 0) : 0;
        if ($orderId < 1 || !in_array($postType, array('shop_order', 'shop_order_placehold'), true)) return $shortCircuit;
        if (!$this->shouldBlock($orderId)) return $shortCircuit;
        $this->rememberNotice($orderId);
        return true;
    }

    /**
     * Prevent protected orders from reaching WooCommerce's non-cancellable
     * before-delete actions when they are removed from the Orders admin table.
     *
     * WooCommerce applies this filter before iterating over orders, so an
     * unprotected order in the same batch can still move to the trash while a
     * protected one remains visible with a normal admin notice.
     */
    public function filterBulkActionIds($orderIds, $action, $objectType)
    {
        if ($objectType !== 'order' || !in_array($action, array('trash', 'delete'), true)) return $orderIds;

        $allowed = array();
        $blocked = array();
        foreach ((array) $orderIds as $orderId) {
            $orderId = (int) $orderId;
            if ($orderId < 1) continue;
            if ($this->shouldBlock($orderId)) {
                $blocked[] = $orderId;
                continue;
            }
            $allowed[] = $orderId;
        }

        if ($blocked) $this->rememberNotice($blocked);
        return $blocked ? $allowed : $orderIds;
    }

    public function guardWooOrder($orderId, $order = null)
    {
        $orderId = is_object($orderId) && method_exists($orderId, 'get_id') ? (int) $orderId->get_id() : (int) $orderId;
        if (!$this->shouldBlock($orderId)) return;
        $this->rememberNotice($orderId);
        $message = __('This order has unresolved payment evidence and cannot be deleted. Reconcile or cancel the payment safely first.', 'aster-checkout');
        if (class_exists('WC_Data_Exception')) throw new \WC_Data_Exception('aster_payment_order_protected', $message);
        throw new \RuntimeException($message);
    }

    public function recordPostRemoval($orderId)
    {
        $this->recordOrderRemoval($orderId);
    }

    public function recordOrderRemoval($orderId)
    {
        $orderId = (int) $orderId;
        if ($orderId > 0) $this->attempts->markOrderMissing($orderId, 'woo_order_removed');
    }

    public function adminNotice()
    {
        if (!function_exists('get_transient') || !current_user_can('manage_woocommerce')) return;
        $key = 'aster_payment_delete_blocked_' . get_current_user_id();
        $orderIds = $this->normalizeOrderIds(get_transient($key));
        if (!$orderIds) return;
        delete_transient($key);
        if (count($orderIds) === 1) {
            $message = sprintf(
                __('Order #%d was not deleted because its payment is unresolved. Open the payment diagnosis and complete reconciliation first.', 'aster-checkout'),
                $orderIds[0]
            );
        } else {
            $message = sprintf(
                __('Orders #%s were not deleted because their payments are unresolved. Open the payment diagnosis and complete reconciliation first.', 'aster-checkout'),
                implode(', #', $orderIds)
            );
        }
        echo '<div class="notice notice-error"><p>' . esc_html($message) . '</p></div>';
    }

    private function shouldBlock($orderId)
    {
        if ($orderId < 1 || !$this->attempts->isDeletionProtected($orderId)) return false;
        return !apply_filters('aster_allow_unsafe_payment_order_deletion', false, $orderId);
    }

    private function rememberNotice($orderIds)
    {
        if (!function_exists('set_transient') || !function_exists('get_current_user_id')) return;
        $orderIds = $this->normalizeOrderIds($orderIds);
        if (!$orderIds) return;
        $key = 'aster_payment_delete_blocked_' . get_current_user_id();
        $existing = function_exists('get_transient') ? $this->normalizeOrderIds(get_transient($key)) : array();
        set_transient($key, array_values(array_unique(array_merge($existing, $orderIds))), 60);
    }

    private function normalizeOrderIds($orderIds)
    {
        $normalized = array();
        foreach ((array) $orderIds as $orderId) {
            $orderId = (int) $orderId;
            if ($orderId > 0) $normalized[$orderId] = $orderId;
        }
        return array_values($normalized);
    }
}
