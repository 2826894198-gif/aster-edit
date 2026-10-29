<?php defined('ABSPATH') || exit; ?>
<?php if (function_exists('aster_phase_one_enabled') && aster_phase_one_enabled()) { require dirname(__DIR__) . '/aster-phase-one/guest.php'; return; } ?>
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Order status · Aster Edit</title>
<link rel="stylesheet" href="<?php echo esc_url(aster_commerce_asset('commerce.css')); ?>">
<script defer src="<?php echo esc_url(aster_commerce_asset('order-status.js')); ?>"></script></head>
<body class="aster-commerce-site"><?php aster_commerce_header(); ?><main id="commerce-main" class="aster-service-content" data-api="<?php echo esc_url(rest_url('aster/v1/')); ?>">
<div class="aster-page-heading"><a class="aster-back-link" href="<?php echo esc_url(aster_storefront_url('/shop')); ?>">← Back to shop</a></div>
<div class="aster-service-grid"><section class="aster-service-intro"><p class="aster-eyebrow">Your order · Aster Edit</p><h1>A little closer<br>to your table.</h1><p><?php echo aster_customer_mail_ready() ? 'Find the latest details of your order. Enter your order number and checkout email, and we’ll send you a private access link.' : 'Enter the order number shown after checkout and the email address you used to place the order. You can check the current status here.'; ?></p>
<div class="aster-service-notes">
<?php if (aster_customer_mail_ready()): ?><p><strong>A private link</strong>Single-use access, valid for 15 minutes. No account required.</p><?php endif; ?>
<p><strong>Already have an account?</strong><a href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">Sign in to view your orders →</a></p>
</div></section>
<div class="aster-service-panel"><h2>Find your order</h2>
<?php if (wp_get_environment_type() === 'local'): ?><p class="aster-local-note">Local preview · No live payments. Test emails stay in the local inbox.</p><?php endif; ?>
<?php if (!aster_customer_mail_ready()): ?><p class="aster-mail-unavailable" role="status">Order emails are currently off. Save your order number from the confirmation page. For help, contact <a href="mailto:support@example.test">support@example.test</a>.</p><?php endif; ?>
<form id="request-form" data-mail-ready="<?php echo aster_customer_mail_ready() ? 'true' : 'false'; ?>"><label for="order-number">Order number</label><input id="order-number" name="order_number" inputmode="numeric" pattern="[1-9][0-9]{0,14}" maxlength="15" autocomplete="off" required>
<label for="order-email">Email address</label><input id="order-email" name="email" type="email" maxlength="254" autocomplete="email" required>
<button type="submit"><?php echo aster_customer_mail_ready() ? 'Email me an access link' : 'View order status'; ?></button><small><?php echo aster_customer_mail_ready() ? 'The link is single-use and expires after 15 minutes. This does not create an account.' : 'This read-only lookup does not make a payment or change your order.'; ?></small></form>
<section id="verify" hidden><h2>Open your order</h2><p>Continue to view this order on this device. Access expires after 15 minutes. Do not share your email link.</p><button id="exchange" type="button">View order</button></section>
<p id="message" role="status" aria-live="polite"></p>
<section id="order" hidden><h2 id="order-title"></h2><p id="order-summary"></p><ul id="items"></ul><dl id="totals"></dl><p class="notice">This page is read-only. Payment status comes from WooCommerce; opening this page does not confirm or change payment.</p><button id="logout" type="button">Close order details</button></section>
</div></div></main><?php aster_commerce_footer(); ?></body></html>
