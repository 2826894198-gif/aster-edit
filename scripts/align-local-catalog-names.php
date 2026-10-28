<?php
// Local acceptance only; customer names are the only product field changed.
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type()!=='local' || !aster_phase_three_enabled()) throw new RuntimeException('Local preview only.');
$map=json_decode(file_get_contents('/workspace/catalog/customer-names.current-20261016.json'),true,512,JSON_THROW_ON_ERROR);
$plan=[];
foreach ($map as $key=>$name) {
    $matches=wc_get_products(['limit'=>2,'status'=>['publish','draft','private','pending'],'meta_key'=>'_aster_catalog_key','meta_value'=>$key]);
    if (count($matches)!==1) throw new RuntimeException('Catalog key is not unique: '.$key);
    $p=$matches[0];
    $plan[]=['id'=>$p->get_id(),'key'=>$key,'name'=>$p->get_name(),'target'=>$name,'sku'=>$p->get_sku(),'price'=>$p->get_price(),'status'=>$p->get_status(),'stock'=>$p->get_stock_status()];
}
if (($args[0] ?? '')!=='apply') { echo wp_json_encode($plan,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);return; }
foreach($plan as $row) {
    $p=wc_get_product($row['id']);
    if ($p->get_name()===$row['target'] && $p->get_meta('_aster_customer_name')===$row['target']) continue;
    if (!$p->get_meta('_aster_original_source_name')) $p->update_meta_data('_aster_original_source_name',$row['name']);
    $p->update_meta_data('_aster_customer_name',$row['target']);$p->set_name($row['target']);$p->save();
    if ($p->get_sku()!==$row['sku'] || $p->get_price()!==$row['price'] || $p->get_status()!==$row['status'] || $p->get_stock_status()!==$row['stock']) throw new RuntimeException('Commercial fields changed.');
}
echo 'Aligned '.count($plan).' local names. IDs, SKUs, prices and commercial fields preserved.';
