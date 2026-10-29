<?php
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type()!=='local' || !in_array(wp_parse_url(home_url(),PHP_URL_HOST),['localhost','127.0.0.1'],true)) throw new RuntimeException('Loopback local preview only.');
update_option('aster_phase_one_preview','yes');
update_option('aster_checkout_interface_enabled','yes');
update_option('aster_checkout_foundation_enabled','yes');
$product_id=(int)get_option('aster_phase_one_product');
$product=$product_id ? wc_get_product($product_id) : null;
if (!$product) {
    $product=new WC_Product_Simple();
    $product->set_name('TEST ONLY · Rolling-bead ceramic cup · Olive');
    $product->set_sku('ASTER-TEST-PREVIEW-CUP-20261016');
    $product->set_regular_price('68');
    $product->set_status('publish');$product->set_catalog_visibility('hidden');
    $product->set_manage_stock(false);$product->set_stock_status('instock');
    $product->set_shipping_class_id(0);
    $product->update_meta_data('_aster_fixture','phase-one-20261016');
    $product->save();update_option('aster_phase_one_product',$product->get_id());
}
$fixtures=get_option('aster_phase_one_fixtures',[]);
foreach (['pending','failed','checking','paid','shipped','refunded'] as $key) {
    if (!empty($fixtures[$key]) && wc_get_order((int)$fixtures[$key])) continue;
    $order=wc_create_order(['status'=>'pending','customer_id'=>0]);
    $order->set_billing_email('phase-one@aster.test');$order->set_billing_first_name('TEST ONLY');
    $order->set_currency('USD');$order->set_customer_note('Please let me know if this can arrive before November 8.');
    $order->update_meta_data('_aster_fixture','phase-one-20261016');
    $order->update_meta_data('_aster_preview_state',$key==='shipped' ? 'paid' : $key);
    $item=new WC_Order_Item_Product();$item->set_product($product);$item->set_quantity(1);$item->set_subtotal(68);$item->set_total(68);$item->add_meta_data('Colour','Olive');$order->add_item($item);
    $order->set_status(['checking'=>'on-hold','paid'=>'processing','shipped'=>'completed','refunded'=>'completed'][$key] ?? $key);
    // Synthetic order-state evidence only, no gateway, authorization or capture.
    if (in_array($key,['paid','shipped','refunded'],true)) $order->set_date_paid(time());
    if ($key==='shipped') $order->update_meta_data(Aster_Phase_One::SHIPMENT,[
        'carrier'=>'DHL · TEST ONLY','tracking_number'=>'TEST-ORDER-001','tracking_url'=>'',
        'estimated_arrival'=>'','last_scan'=>'Dispatched · simulated preview',
        'events'=>[['label'=>'Dispatched','detail'=>'Test parcel handed to the carrier.','occurred_at'=>'16 October 2026'],['label'=>'Packed for dispatch','detail'=>'Preview update only.','occurred_at'=>'15 October 2026']]]);
    $order->calculate_totals();$order->save();
    if ($key==='refunded') wc_create_refund(['order_id'=>$order->get_id(),'amount'=>68,'reason'=>'LOCAL PREVIEW refund record','refund_payment'=>false,'restock_items'=>false]);
    $fixtures[$key]=$order->get_id();
}
update_option('aster_phase_one_fixtures',$fixtures);
// Only the hidden preview SKU receives the cup's existing free-shipping rule.
$product->set_shipping_class_id(0);$product->save();
$product->set_sku('ASTER-TEST-PREVIEW-CUP-20261016');$product->save();
WP_CLI::log(wp_json_encode(['preview'=>'http://127.0.0.1:8088/aster-preview/','fixtures'=>$fixtures,'email'=>'phase-one@aster.test','payments'=>'closed']));
