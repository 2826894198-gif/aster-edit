<?php
/** Official provider GET only. No remote order, authorization or capture. */
$_SERVER['HTTP_HOST']='commerce.example.test';$_SERVER['HTTPS']='on';$_SERVER['REQUEST_URI']='/';
require $argv[1];
$common=get_option('woocommerce-ppcp-data-common',[]);
$out=['mode'=>empty($common['use_sandbox'])?'live':'sandbox', 'credential_pair_present'=>!empty($common['client_id'])&&!empty($common['client_secret'])];
try {
    $container=\WooCommerce\PayPalCommerce\PPCP::container();
    $out['plugin_connected']=(bool)$container->get('settings.flag.is-connected');
    $hooks=$container->get('api.endpoint.webhook')->list();
    $out['webhook_lookup_succeeded']=true;$out['aster_webhooks']=[];
    foreach ($hooks as $hook) {
        if (wp_parse_url($hook->url(),PHP_URL_HOST)!=='commerce.example.test') continue;
        $names=[];
        foreach ($hook->event_types() as $event) $names[]=is_object($event)?(method_exists($event,'name')?$event->name():($event->name??'')):(is_array($event)?($event['name']??''):'');
        $out['aster_webhooks'][]=['url'=>$hook->url(),'capture_completed_subscribed'=>in_array('PAYMENT.CAPTURE.COMPLETED',$names,true)||in_array('*',$names,true),'event_types'=>count($names)];
    }
} catch (Throwable $e) { $out['webhook_lookup_succeeded']=false; $out['error_type']=get_class($e); }
echo wp_json_encode($out,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES),"\n";
