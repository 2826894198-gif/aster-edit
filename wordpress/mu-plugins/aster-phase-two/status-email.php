<?php
defined('ABSPATH') || exit;
$state=Aster_Care::email_state($order,(string)($email->id ?? ''));
do_action('woocommerce_email_header',$state['heading'],$email);
if (Aster_Phase_One::fixture($order) && !(class_exists('Aster_Journey') && Aster_Journey::fixture($order))) echo '<p style="font-size:12px;border-bottom:1px solid #deddd8;padding-bottom:12px">LOCAL PREVIEW · TEST ONLY · No real payment or shipment</p>';
echo '<p>'.esc_html($state['message']).'</p>';
if ($state['key']==='refunded') echo '<p>Recorded refund: '.wp_kses_post(wc_price($order->get_total_refunded(),['currency'=>$order->get_currency()])).'. Your payment provider determines when it appears in your account.</p>';
do_action('woocommerce_email_order_details',$order,$sent_to_admin,$plain_text,$email);
do_action('woocommerce_email_order_meta',$order,$sent_to_admin,$plain_text,$email);
$shipment=Aster_Phase_One::shipment($order);
if ($order->has_status('completed')) {
    if (!empty($shipment['carrier']) && !empty($shipment['tracking_number'])) {
        echo '<h2>Recorded shipment update</h2><p>'.esc_html($shipment['carrier'].' · '.$shipment['tracking_number']).'</p><p>'.esc_html($shipment['last_scan'] ?? '').'</p>';
        if (!empty($shipment['tracking_url'])) echo '<p><a href="'.esc_url($shipment['tracking_url']).'">Track this shipment</a></p>';
    } else echo '<p>No carrier tracking update has been recorded yet. Completed order status alone is not a delivery confirmation.</p>';
}
echo '<p><a href="'.esc_url(home_url('/order-status/')).'">View your current order status</a></p><p>Need help? Reply with your order number or contact <a href="mailto:support@example.test">support@example.test</a>.</p>';
do_action('woocommerce_email_footer',$email);
