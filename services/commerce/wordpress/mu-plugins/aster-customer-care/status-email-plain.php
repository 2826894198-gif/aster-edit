<?php
defined('ABSPATH') || exit;
$state=Aster_Customer_Care::email_state($order,(string)($email->id ?? ''));
echo "Aster Edit\n".$state['heading']."\n\n";
echo $state['message']."\n\n";
if ($state['key']==='refunded') echo 'Recorded refund: '.$order->get_currency().' '.$order->get_total_refunded()."\n\n";
do_action('woocommerce_email_order_details',$order,$sent_to_admin,true,$email);
do_action('woocommerce_email_order_meta',$order,$sent_to_admin,true,$email);
$shipment=Aster_Customer_Orders::shipment($order);
if ($order->has_status('completed') && !empty($shipment['carrier']) && !empty($shipment['tracking_number'])) echo "\nRecorded shipment update: ".$shipment['carrier'].' · '.$shipment['tracking_number']."\n".($shipment['last_scan'] ?? '')."\n".($shipment['tracking_url'] ?? '')."\n";
echo "\nView current order status: ".home_url('/order-status/')."\nNeed help? support@example.test\n\nAster Edit\n";
