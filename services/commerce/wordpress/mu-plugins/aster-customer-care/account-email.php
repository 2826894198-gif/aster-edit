<?php
defined('ABSPATH') || exit;
$is_reset=($email->id ?? '')==='customer_reset_password';
do_action('woocommerce_email_header',$is_reset ? 'Reset your password.' : 'Welcome to Aster Edit.',$email);
echo '<p>Hi '.esc_html($user_display_name ?? $user_login).',</p>';
if ($is_reset) {
    $reset_url=add_query_arg(['key'=>$reset_key,'id'=>$user_id,'login'=>rawurlencode($user_login)],wc_get_endpoint_url('lost-password','',wc_get_page_permalink('myaccount')));
    echo '<p>A password reset was requested for your Aster Edit account.</p><p><a href="'.esc_url($reset_url).'">Reset your password</a></p><p>This private link lets you choose a new password. If it expires or has already been used, request a fresh link from the sign-in page.</p><p>If you did not request this, ignore this email. Your password stays as it is.</p>';
} else {
    echo '<p>Your Aster Edit account is ready. Use it to follow your orders and manage your addresses and account details.</p><p>Username: '.esc_html($user_login).'</p>';
    if (!empty($password_generated) && !empty($set_password_url)) echo '<p><a href="'.esc_url($set_password_url).'">Set your password</a></p>';
    echo '<p><a href="'.esc_url(wc_get_page_permalink('myaccount')).'">My account</a></p>';
}
echo '<p>Need help? <a href="mailto:support@example.test">support@example.test</a></p>';
do_action('woocommerce_email_footer',$email);
