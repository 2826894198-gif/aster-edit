<?php
use Aster\Checkout\{Config, PaymentStateMachine, PaymentAttemptRepository, PayPalVerifier, SinglePageCheckoutExperience, CheckoutRuntime, PaymentOperationLock};
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local') throw new RuntimeException('Local fixtures only.');
$checks = 0;
$check = static function ($ok, $label) use (&$checks) { if (!$ok) throw new RuntimeException($label); $checks++; };
$original = get_option('woocommerce-ppcp-data-common');
$counts = (int)wc_get_orders(['paginate'=>true, 'limit'=>1])->total;
$order = null;
$repository = new PaymentAttemptRepository();
try {
    update_option('woocommerce-ppcp-data-common', ['use_sandbox'=>true, 'client_id'=>'TEST-ONLY-client', 'client_secret'=>'TEST-ONLY-secret']);
    $decision = PaymentStateMachine::decide(['woo_status'=>'pending','lookup_available'=>false,'capture_count'=>0]);
    $check($decision['payment_locked'] && $decision['safe_action'] === 'check_status', 'Unavailable lookup cannot authorize another payment');
    foreach (['APPROVED','COMPLETED','PAYER_ACTION_REQUIRED'] as $state) {
        $d = PaymentStateMachine::decide(['woo_status'=>'pending','provider_status'=>$state,'capture_count'=>0,'lookup_available'=>true]);
        $check($d['payment_locked'], "$state cannot be treated as a captured payment");
    }
    $check(PaymentStateMachine::decide(['woo_status'=>'processing','provider_status'=>'COMPLETED','capture_status'=>'COMPLETED','capture_count'=>1,'reconciliation'=>'verified'])['safe_action'] === 'view_order', 'One matched capture and Woo paid agree');
    foreach ([['capture_count'=>2], ['reconciliation'=>'amount_mismatch'], ['woo_status'=>'failed']] as $different) {
        $d = PaymentStateMachine::decide(array_merge(['woo_status'=>'processing','provider_status'=>'COMPLETED','capture_status'=>'COMPLETED','capture_count'=>1,'reconciliation'=>'verified'], $different));
        $check($d['safe_action'] === 'manual_review', 'Duplicate, mismatched, or failed local evidence needs review');
    }
    $check(PaymentStateMachine::decide(['pre_provider'=>true,'can_resume'=>true])['safe_action'] === 'resume_same_order', 'Only an unstarted attempt resumes without provider facts');
    $check(PaymentStateMachine::decide(['lookup_available'=>false,'retry_count'=>3])['safe_action'] === 'manual_review', 'Unknown lookup has bounded recovery');

    $order = wc_create_order(['billing_email'=>'checkout-foundation-test@example.test']);
    $order->set_total('68.00'); $order->set_currency('USD'); $order->set_payment_method('ppcp-gateway');
    $order->update_meta_data('_aster_payment_surface','native_single_page');
    $order->update_meta_data('_aster_payment_provider','paypal');
    $order->update_meta_data('_ppcp_paypal_order_id','TESTONLYPAYPALORDER'); $order->save();
    $remote = ['id'=>'TESTONLYPAYPALORDER','status'=>'COMPLETED','purchase_units'=>[[
        'custom_id'=>(string)$order->get_id(), 'amount'=>['value'=>'68.00','currency_code'=>'USD'],
        'payments'=>['captures'=>[['id'=>'TESTONLYCAPTURE','status'=>'COMPLETED','amount'=>['value'=>'68.00','currency_code'=>'USD']]]]
    ]]];
    $calls = [];
    $verify = static function ($payload) use ($order, &$calls) {
        return (new PayPalVerifier(new Config(), static function ($method, $url) use ($payload, &$calls) {
            $calls[] = [$method, parse_url($url, PHP_URL_PATH)];
            return str_ends_with($url, '/v1/oauth2/token') ? ['code'=>200,'body'=>['access_token'=>'TEST-ONLY-token']] : ['code'=>200,'body'=>$payload];
        }))->paymentFacts($order);
    };
    $facts = $verify($remote);
    $check($facts['amount_matches'] && $facts['order_reference_matches'] && $facts['remote_order_id_matches'], 'Matched provider id, local reference and actual capture amount');
    $bad = $remote; $bad['purchase_units'][0]['payments']['captures'][0]['amount']['value']='1.00';
    $check(!$verify($bad)['amount_matches'], 'A partial capture is not a full payment');
    $bad = $remote; $bad['purchase_units'][0]['custom_id']='not-this-order';
    $check(!$verify($bad)['order_reference_matches'], 'Unrelated provider order rejected');
    $bad = $remote; $bad['id']='OTHERORDER';
    $check(!$verify($bad)['remote_order_id_matches'], 'Remote order identity must match');
    $check(count(array_filter($calls, static fn($call) => $call[0] !== 'GET' && $call[1] !== '/v1/oauth2/token')) === 0, 'Verifier has no payment write');

    $token = bin2hex(random_bytes(24)); $one = $repository->ensureForToken($token); $two = $repository->ensureForToken($token);
    $check($one['attempt_id'] === $two['attempt_id'], 'Repeated attempt preparation reuses one durable row');
    $record = $repository->bindOrder($token,$order);
    $check($record['woo_order_id'] == $order->get_id() && $record['amount_minor'] == 6800, 'Attempt binds to server-calculated amount and one Woo order');
    $check(!in_array($token,$record,true) && !in_array($order->get_order_key(),$record,true) && !in_array('checkout-foundation-test@example.test',$record,true), 'Ledger stores no raw token, order key or customer email');
    $check($repository->isDeletionProtected($order->get_id()), 'Unresolved payment evidence prevents order deletion');

    $reconcileRuntime = new CheckoutRuntime();
    $lookup = new ReflectionProperty(CheckoutRuntime::class, 'verifier');
    $lookup->setValue($reconcileRuntime, new PayPalVerifier(new Config(), static function ($method, $url) {
        return str_ends_with($url, '/v1/oauth2/token') ? ['code'=>200,'body'=>['access_token'=>'TEST-ONLY-token']] : ['code'=>503,'body'=>[]];
    }));
    for ($attempt = 1; $attempt <= 3; $attempt++) {
        $reconcileRuntime->reconcile($order->get_id(), 0);
        $check((int)$repository->findByOrderId($order->get_id())['retry_count'] === $attempt, 'Repeated status checks retain the failed lookup count');
    }
    $check($repository->findByOrderId($order->get_id())['safe_action'] === 'manual_review', 'Three unavailable provider lookups lead to explicit review');
    $saved = $remote; $saved['status'] = 'CREATED'; unset($saved['purchase_units'][0]['payments']);
    $lookup->setValue($reconcileRuntime, new PayPalVerifier(new Config(), static function ($method, $url) use ($saved) {
        return str_ends_with($url, '/v1/oauth2/token') ? ['code'=>200,'body'=>['access_token'=>'TEST-ONLY-token']] : ['code'=>200,'body'=>$saved];
    }));
    $reconcileRuntime->reconcile($order->get_id());
    $recovered = $repository->findByOrderId($order->get_id());
    $check((int)$recovered['retry_count'] === 0 && $recovered['last_reason'] === 'verified_no_capture', 'Later matched no-capture evidence clears the failed lookup budget');
    $check($recovered['safe_action'] === (aster_checkout_open() ? 'resume_same_order' : 'check_status'), 'Recovery still respects the server-side checkout gate');
    $check(!wc_get_order($order->get_id())->is_paid(), 'Status reconciliation never performs capture or marks the order paid');

    if (!WC()->session) { WC()->session = new WC_Session_Handler(); WC()->session->init(); }
    if (!WC()->cart) wc_load_cart();
    WC()->session->set(SinglePageCheckoutExperience::SESSION_MARKER,time());
    $native = new SinglePageCheckoutExperience(new Config(),$repository);
    $native->bindNativeOrder($order); wc_clear_notices();
    $native->guardNativeSubmission();
    $check(wc_notice_count('error') > 0, 'Bound provider order blocks a second checkout submission');
    wc_clear_notices();
    $runtime = new CheckoutRuntime(); $runtime->lockSubmission();
    $db2 = new wpdb(DB_USER,DB_PASSWORD,DB_NAME,DB_HOST);
    $name='aster_checkout_' . substr(hash('sha256',$GLOBALS['wpdb']->prefix . ':' . WC()->session->get_customer_id()),0,48);
    $check((string)$db2->get_var($db2->prepare('SELECT GET_LOCK(%s,0)',$name)) === '0', 'Concurrent PHP connections cannot both submit this checkout');
    $runtime->releaseLock();
    $check((string)$db2->get_var($db2->prepare('SELECT GET_LOCK(%s,0)',$name)) === '1', 'Request completion releases the checkout lock');
    $db2->get_var($db2->prepare('SELECT RELEASE_LOCK(%s)',$name)); $db2->close();
    $runtime->resetSession();
    $check(!WC()->session->get(SinglePageCheckoutExperience::SESSION_BOUND_ORDER_ID), 'New confirmed handoff clears old native attempt binding');
    $_GET['aster_foundation_review']='1';
    $errors=new WP_Error(); do_action('woocommerce_after_checkout_validation',[],$errors);
    $check($errors->get_error_message('aster_foundation_review') !== '', 'Review cannot submit a Woo order');
    $blocked=apply_filters('pre_http_request',false,['method'=>'POST'],'https://api-m.paypal.com/v2/checkout/orders');
    $check(is_wp_error($blocked) && $blocked->get_error_code()==='aster_foundation_review', 'Review blocks actual provider writes');
    unset($_GET['aster_foundation_review']);
} finally {
    unset($_GET['aster_foundation_review']);
    if ($original === false) delete_option('woocommerce-ppcp-data-common'); else update_option('woocommerce-ppcp-data-common',$original);
    if ($order) {
        $fixtureId = $order->get_id();
        if (function_exists('as_unschedule_all_actions')) foreach ([0,1,2] as $retry) as_unschedule_all_actions('aster_checkout_reconcile', [$fixtureId,$retry], 'aster-checkout');
        $repository->recordDecision($order,PaymentStateMachine::decide(['woo_status'=>'refunded']));
        $order->delete(true);
        global $wpdb; $wpdb->delete($wpdb->prefix . 'aster_payment_attempts',['woo_order_id'=>$fixtureId]);
    }
    wc_clear_notices();
}
$check((int)wc_get_orders(['paginate'=>true,'limit'=>1])->total === $counts, 'Local test orders cleaned up; production never accessed');
WP_CLI::success("$checks checkout foundation checks passed; no provider payment request sent.");
