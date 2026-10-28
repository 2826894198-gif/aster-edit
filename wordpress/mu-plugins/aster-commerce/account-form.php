<?php
/** Presentation-only override of Woo form-login.php 9.9.0 (installed Woo 11.1.1).
 * Native form handlers, nonces, hooks, email and password lifecycle remain Woo-owned.
 */
defined('ABSPATH') || exit;
$register = aster_account_register_view();
$posted = static fn(string $key): string => isset($_POST[$key]) && is_string($_POST[$key]) ? esc_attr(wp_unslash($_POST[$key])) : '';
do_action('woocommerce_before_customer_login_form');
?>
<?php if ($register): ?>
<p class="aster-auth-intro">Keep your orders and details in one place.</p>
<?php if (!aster_customer_mail_ready()): ?><p class="aster-mail-unavailable" role="status">Account emails and password reset are currently off. Save the password you choose below. For password help, contact <a href="mailto:support@example.test">support@example.test</a>.</p><?php endif; ?>
<form method="post" class="woocommerce-form woocommerce-form-register register" <?php do_action('woocommerce_register_form_tag'); ?>>
  <?php do_action('woocommerce_register_form_start'); ?>
  <?php if ('no' === get_option('woocommerce_registration_generate_username')): ?>
  <p class="woocommerce-form-row form-row form-row-wide"><label for="reg_username">Username <span class="required" aria-hidden="true">*</span></label><input type="text" class="input-text" name="username" id="reg_username" autocomplete="username" value="<?php echo $posted('username'); ?>" required aria-required="true"></p>
  <?php endif; ?>
  <p class="woocommerce-form-row form-row form-row-wide"><label for="reg_email">Email address <span class="required" aria-hidden="true">*</span></label><input type="email" class="input-text" name="email" id="reg_email" autocomplete="email" value="<?php echo $posted('email'); ?>" required aria-required="true"></p>
  <?php if ('no' === get_option('woocommerce_registration_generate_password')): ?>
  <p class="woocommerce-form-row form-row form-row-wide"><label for="reg_password">Password <span class="required" aria-hidden="true">*</span></label><input type="password" class="input-text" name="password" id="reg_password" autocomplete="new-password" required aria-required="true"></p>
  <?php else: ?>
  <p class="aster-auth-hint">We’ll email you a link to set your password.</p>
  <?php endif; ?>
  <?php do_action('woocommerce_register_form'); ?>
  <p class="form-row aster-auth-action"><?php wp_nonce_field('woocommerce-register', 'woocommerce-register-nonce'); ?><button type="submit" class="woocommerce-Button woocommerce-button button woocommerce-form-register__submit" name="register" value="Register">Create account</button></p>
  <?php do_action('woocommerce_register_form_end'); ?>
</form>
<p class="aster-auth-switch">Already have an account? <a href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">Sign in</a></p>
<?php else: ?>
<p class="aster-auth-intro">Sign in to view your orders and saved details.</p>
<form class="woocommerce-form woocommerce-form-login login" method="post" novalidate>
  <?php do_action('woocommerce_login_form_start'); ?>
  <p class="woocommerce-form-row form-row form-row-wide"><label for="username">Email or username <span class="required" aria-hidden="true">*</span></label><input type="text" class="input-text" name="username" id="username" autocomplete="username" value="<?php echo $posted('username'); ?>" required aria-required="true"></p>
  <p class="woocommerce-form-row form-row form-row-wide"><label for="password">Password <span class="required" aria-hidden="true">*</span></label><input class="input-text" type="password" name="password" id="password" autocomplete="current-password" required aria-required="true"></p>
  <?php do_action('woocommerce_login_form'); ?>
  <div class="aster-auth-options"><label class="woocommerce-form__label woocommerce-form__label-for-checkbox woocommerce-form-login__rememberme"><input class="woocommerce-form__input woocommerce-form__input-checkbox" name="rememberme" type="checkbox" id="rememberme" value="forever"> <span>Remember me</span></label><?php if (aster_customer_mail_ready()): ?><a href="<?php echo esc_url(wp_lostpassword_url()); ?>">Forgot password?</a><?php else: ?><a href="mailto:support@example.test">Need password help?</a><?php endif; ?></div>
  <p class="form-row aster-auth-action"><?php wp_nonce_field('woocommerce-login', 'woocommerce-login-nonce'); ?><button type="submit" class="woocommerce-button button woocommerce-form-login__submit" name="login" value="Log in">Sign in</button></p>
  <?php do_action('woocommerce_login_form_end'); ?>
</form>
<?php if ('yes' === get_option('woocommerce_enable_myaccount_registration')): ?><p class="aster-auth-switch">New to Aster Edit? <a href="<?php echo esc_url(add_query_arg('view', 'register', wc_get_page_permalink('myaccount'))); ?>">Create an account</a></p><?php endif; ?>
<?php endif; ?>
<p class="aster-auth-guest"><?php if ('no' === get_option('woocommerce_enable_myaccount_registration')): ?>New accounts are not open yet. <a href="mailto:support@example.test">Contact support</a> for help.<br><?php endif; ?>Checking a guest order? <a href="<?php echo esc_url(home_url('/order-status/')); ?>">View order status</a></p>
<?php do_action('woocommerce_after_customer_login_form'); ?>
