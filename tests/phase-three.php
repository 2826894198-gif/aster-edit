<?php
function fx_check($ok,$message) { if (!$ok) throw new RuntimeException($message); }
fx_check(aster_phase_three_enabled(),'Local preview enabled');
$cup=[['catalog_key'=>'rolling-bead-cup:olive','quantity'=>1]];
$mixed=[...$cup,['catalog_key'=>'orange-peel-oval-plate:01','quantity'=>1]];
foreach(Aster_Discovery::RATES as $code=>$rate) {
 $quote=Aster_Discovery::quote($cup,$code,Aster_Discovery::SNAPSHOT);fx_check($quote['total']===(int)round(6800*$rate),'Cup total '.$code);fx_check($quote['shipping']===0,'Cup shipping '.$code);
 $mix=Aster_Discovery::quote($mixed,$code,Aster_Discovery::SNAPSHOT);fx_check($mix['usd_subtotal']===12800 && $mix['shipping']===(int)round(3000*$rate),'Mixed shipping '.$code);
 $large=$mixed;$large[0]['quantity']=2;$large=Aster_Discovery::quote($large,$code,Aster_Discovery::SNAPSHOT);fx_check($large['usd_subtotal']===19600 && $large['shipping']===0,'Threshold '.$code);
 $token=bin2hex(random_bytes(24));$order=Aster_Discovery::save_order($token,$mix);$id=$order->get_id();
 fx_check($order->get_currency()===$code && (int)round($order->get_total()*100)===$mix['total'],'Native Woo amount '.$code);
 fx_check(Aster_Discovery::save_order($token,$mix)->get_id()===$id,'Idempotent order '.$code);
 fx_check(!as_has_scheduled_action(Aster_Merchant_Alerts::HOOK,[$id,'pending'],Aster_Merchant_Alerts::GROUP),'No fixture alert '.$code);
 $refund=Aster_Discovery::refund($order);fx_check($refund->get_currency()===$code && (int)round($refund->get_amount()*100)===$mix['total'],'Original currency refund '.$code);
 fx_check(Aster_Discovery::refund(wc_get_order($id))->get_id()===$refund->get_id(),'Idempotent refund '.$code);
 $again=wc_get_order($id);fx_check($again->get_currency()===$code && $again->get_meta('_aster_fx_quote')['total']===$mix['total'],'Frozen order '.$code);
 echo $code.' native Woo amount, shipping, snapshot, refund and duplicate guards passed'.PHP_EOL;
}
foreach([
 fn()=>Aster_Discovery::quote($cup,'JPY',Aster_Discovery::SNAPSHOT),
 fn()=>Aster_Discovery::quote($cup,'EUR','outdated'),
 fn()=>Aster_Discovery::quote([['catalog_key'=>'not-a-product','quantity'=>1]],'USD',Aster_Discovery::SNAPSHOT),
 fn()=>Aster_Discovery::quote([['catalog_key'=>'rolling-bead-cup:olive','quantity'=>0]],'USD',Aster_Discovery::SNAPSHOT),
 fn()=>Aster_Discovery::quote([...$cup,...$cup],'USD',Aster_Discovery::SNAPSHOT),
 fn()=>Aster_Discovery::save_order(bin2hex(random_bytes(24)),array_merge(Aster_Discovery::quote($cup,'USD',Aster_Discovery::SNAPSHOT),['expires'=>time()-1]))
] as $reject) { $rejected=false;try {$reject();} catch(InvalidArgumentException|RuntimeException $e) {$rejected=true;}fx_check($rejected,'Invalid request must be rejected'); }
fx_check(Aster_Discovery::convert(5,'EUR')*3===15 && Aster_Discovery::convert(15,'EUR')===14,'Unit rounding is authoritative');
fx_check(get_option('woocommerce_currency')==='USD' && !aster_checkout_open(),'Original commerce currency and payment gate retained');
echo 'Malformed selections, expired snapshots/quotes, unit rounding and live gate passed'.PHP_EOL;
