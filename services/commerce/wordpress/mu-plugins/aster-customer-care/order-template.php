<?php defined('ABSPATH') || exit;
$account=is_account_page();
$valid=$order instanceof WC_Order && ($account ? current_user_can('view_order',$order->get_id()) : hash_equals($order->get_order_key(),sanitize_text_field(wp_unslash($_GET['key'] ?? ''))));
if (!$valid) { echo '<p>Open your private order link or sign in to view this order.</p>'; return; }
echo Aster_Customer_Orders::html($order,true); // Escaped by the shared renderer.
if ($account) {
    $notes=$order->get_customer_order_notes();
    if ($notes) { echo '<section class="ae-public-notes"><h2>Order updates</h2>'; foreach ($notes as $note) echo '<p>'.wp_kses_post(wpautop($note->comment_content)).'</p>'; echo '</section>'; }
    do_action('woocommerce_view_order',$order->get_id());
} else {
    do_action('woocommerce_before_thankyou',$order->get_id());
    do_action('woocommerce_thankyou_'.$order->get_payment_method(),$order->get_id());
    do_action('woocommerce_thankyou',$order->get_id());
}
