<?php defined('ABSPATH') || exit;if(!aster_customer_care_mail_ready()){echo '<section class="ae-reset-confirmation"><h2>Account access.</h2><p>Email password recovery is currently unavailable. Contact <a href="mailto:support@example.test">customer care</a> for help.</p></section>';return;} do_action('woocommerce_before_lost_password_form'); ?>
<div class="ae-reset-layout"><section><p class="aster-eyebrow">ACCOUNT RECOVERY</p><h2>A fresh start.</h2><p>We’ll send a private link to the email saved on your account. Choose a new password there, then return to your orders.</p><p>Looking for a guest purchase instead?<br><a href="<?php echo esc_url(Aster_Customer_Care::url('recovery')); ?>">Recover an order link →</a></p></section>
<form method="post" class="woocommerce-ResetPassword lost_reset_password">
<label for="user_login">Email or username <span aria-hidden="true">*</span></label><input class="input-text" type="text" name="user_login" id="user_login" autocomplete="username" maxlength="254" required>
<?php do_action('woocommerce_lostpassword_form'); ?><input type="hidden" name="wc_reset_password" value="true"><?php wp_nonce_field('lost_password','woocommerce-lost-password-nonce'); ?>
<button class="woocommerce-Button button" type="submit">Reset password</button><p class="ae-small">If an account matches, a reset link will be emailed. Check your spam folder or request a new link if it expires.</p><a href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">← Back to sign in</a>
</form></div>
<?php do_action('woocommerce_after_lost_password_form'); ?>
