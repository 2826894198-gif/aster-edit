<?php
defined('ABSPATH') || exit;

// Independent, versioned presentation adapter. No runtime imports from the storefront.
function aster_account_register_view(): bool {
    return get_option('woocommerce_enable_myaccount_registration') === 'yes'
        && ((isset($_GET['view']) && is_string($_GET['view']) && $_GET['view'] === 'register') || isset($_POST['register']));
}

function aster_account_heading(): string {
    if (is_wc_endpoint_url('lost-password')) return 'Reset your password.';
    if (!is_user_logged_in()) return aster_account_register_view() ? 'Create your account.' : 'Welcome back.';
    if (is_wc_endpoint_url('orders')) return 'Orders';
    if (is_wc_endpoint_url('view-order')) return 'Order details';
    if (is_wc_endpoint_url('edit-address')) return 'Addresses';
    if (is_wc_endpoint_url('edit-account')) return 'Profile & security';
    if (is_wc_endpoint_url('aster-help')) return 'Help';
    if (is_wc_endpoint_url('payment-methods') || is_wc_endpoint_url('add-payment-method')) return 'Payment methods';
    return 'My account';
}

function aster_account_intro(): string {
    if (is_wc_endpoint_url('orders')) return 'Find your orders and follow their current status.';
    if (is_wc_endpoint_url('view-order')) return 'The details and current status of this order.';
    if (is_wc_endpoint_url('edit-address')) return 'Keep your delivery and billing details ready for future orders.';
    if (is_wc_endpoint_url('edit-account')) return 'Manage your name, email and password.';
    if (is_wc_endpoint_url('payment-methods') || is_wc_endpoint_url('add-payment-method')) return 'Payment settings for your account.';
    return 'Your orders, addresses and personal details, all in one place.';
}

add_filter('woocommerce_account_menu_items', function ($items) {
    unset($items['downloads']);
    // Only show payment management after saved methods have been verified.
    unset($items['payment-methods']);
    $menu = [];
    foreach (['dashboard' => 'Overview', 'orders' => 'Orders', 'edit-address' => 'Addresses', 'edit-account' => 'Profile & security'] as $key => $label) {
        if (isset($items[$key])) $menu[$key] = $label;
    }
    $menu['aster-help'] = 'Help';
    if (isset($items['customer-logout'])) $menu['customer-logout'] = 'Sign out';
    return $menu;
});

add_filter('woocommerce_get_query_vars', function ($query_vars) {
    $query_vars['aster-help'] = 'aster-help';
    return $query_vars;
});

add_action('woocommerce_account_aster-help_endpoint', function () {
    include __DIR__ . '/account-help.php';
});

add_filter('document_title_parts', function ($parts) {
    if (is_account_page() && is_wc_endpoint_url('aster-help')) $parts['title'] = 'Help';
    return $parts;
});

// Guest orders retain their separate secure lookup path. Do not offer Woo's
// optional email-confirmation claim prompt inside this account experience.
add_filter('woocommerce_customer_email_verification_should_show_prompt', function ($show) {
    return false;
});

add_filter('woocommerce_return_to_shop_redirect', function ($url) {
    return aster_storefront_url('/shop');
});

// Woo checkout uses the same reviewed SKU images as the storefront. The
// catalog records remain the authority for matching each image to a SKU.
add_filter('woocommerce_store_api_cart_item_images', function ($images, $cart_item) {
    $product = $cart_item['data'] ?? null;
    if (!$product instanceof WC_Product) return $images;
    $key = $product->get_meta('_aster_catalog_key');
    if (!is_string($key) || $key === '') return $images;
    $url = aster_storefront_product_image($key);
    if (!$url) return $images;
    return [(object) ['id' => 0, 'src' => $url, 'thumbnail' => $url, 'srcset' => '', 'sizes' => '', 'thumbnail_srcset' => '', 'thumbnail_sizes' => '', 'name' => $product->get_name(), 'alt' => $product->get_name()]];
}, 10, 2);

function aster_storefront_product_image(string $key): ?string {
    static $mapped = null;
    if ($mapped === null) {
        $manifest = json_decode((string) @file_get_contents(__DIR__ . '/storefront-images.v1.json'), true);
        $mapped = is_array($manifest['items'] ?? null) ? $manifest['items'] : [];
    }
    $path = $mapped[$key] ?? null;
    if (!is_string($path) || !str_starts_with($path, '/images/aster/') || str_contains($path, '..')) return null;
    return aster_storefront_url($path);
}

add_filter('woocommerce_thankyou_order_received_text', function ($text, $order) {
    if (!$order instanceof WC_Order) {
        return 'Check your order number and payment status below. This page alone does not confirm payment.';
    }
    if ($order->has_status('failed')) {
        return 'Payment was not completed for this order. Check its current status before trying again or contact support for help.';
    }
    if ($order->has_status('cancelled')) {
        return 'This order was cancelled. No payment is confirmed on this page.';
    }
    if ($order->has_status('refunded')) {
        return 'This order has been refunded. Review the order details for the recorded amount.';
    }
    if ($order->has_status('pending')) {
        return 'Your order was received, but payment is still pending. We will not prepare it for shipment until payment is confirmed.';
    }
    if ($order->has_status('on-hold')) {
        return 'Your order is awaiting payment review. We will update its status when the payment outcome is confirmed.';
    }
    if ($order->has_status(['processing', 'completed']) && $order->is_paid()) {
        return 'Payment is recorded for this order. We are preparing the next steps.';
    }
    return 'Your order was received. Check the current payment status in the order details before expecting shipment.';
}, 50, 2);

add_action('woocommerce_before_thankyou', function ($order_id) {
    $order = wc_get_order($order_id);
    if ($order && $order->has_status('failed')) {
        echo '<p class="aster-payment-status" role="status">Payment was not completed for this order. Check its current status before trying again or contact support for help.</p>';
    }
}, 20);

add_action('template_redirect', function () {
    if (function_exists('is_checkout') && (is_checkout() || is_account_page())) {
        header('Cache-Control: private, no-store, max-age=0, must-revalidate', true);
        header('Pragma: no-cache', true);
    }
}, PHP_INT_MAX);

add_filter('woocommerce_locate_template', function ($template, $name) {
    if ($name === 'myaccount/form-login.php') return __DIR__ . '/account-form.php';
    if ($name === 'myaccount/dashboard.php') return __DIR__ . '/account-dashboard.php';
    if ($name === 'myaccount/orders.php') return __DIR__ . '/account-orders.php';
    if ($name === 'myaccount/payment-methods.php' && !aster_checkout_open()) return __DIR__ . '/account-payment-closed.php';
    return $template;
}, 20, 2);

function aster_local_storefront_origin(): string {
    $origin=(string)get_option('aster_local_storefront_origin','http://localhost:5173');
    return preg_match('~^http://(?:localhost|127\.0\.0\.1):[1-9][0-9]{0,4}$~D',$origin) && (int)wp_parse_url($origin,PHP_URL_PORT)<=65535 ? $origin : 'http://localhost:5173';
}
function aster_local_storefront_origins(): array {
    $port=(int)wp_parse_url(aster_local_storefront_origin(),PHP_URL_PORT);
    return ['http://localhost:'.$port,'http://127.0.0.1:'.$port];
}
function aster_storefront_url(string $path = '/'): string {
    $base = wp_get_environment_type() === 'local' ? aster_local_storefront_origin() : 'https://asteredit.com';
    return (string)apply_filters('aster_storefront_url',$base . '/' . ltrim($path, '/'));
}

function aster_commerce_asset(string $name): string {
    return plugins_url($name, __FILE__) . '?v=' . filemtime(__DIR__ . '/' . $name);
}

function aster_commerce_header(): void {
    $count = function_exists('WC') && WC()->cart ? WC()->cart->get_cart_contents_count() : 0;
    $bag_url = $count > 0 ? wc_get_cart_url() : aster_storefront_url('/shop#bag');
    $journey = wp_get_environment_type()==='local' && ($_COOKIE['aster_journey_preview'] ?? '')==='1' && function_exists('aster_phase_three_enabled') && aster_phase_three_enabled();
    if ($journey) { $count=0;$bag_url=aster_storefront_url('/shop#bag'); }
    $bag_label = $count > 0 ? 'Checkout bag, ' . $count . ' ' . ($count === 1 ? 'item' : 'items') : 'Review your selection';
    ?>
    <a class="aster-skip" href="#commerce-main">Skip to content</a>
    <header class="aster-header"><div class="aster-header-inner">
      <a class="aster-wordmark" href="<?php echo esc_url(aster_storefront_url()); ?>" aria-label="Aster Edit home">Aster Edit</a>
      <nav class="aster-nav" aria-label="Primary navigation">
        <a href="<?php echo esc_url(aster_storefront_url()); ?>">Home</a>
        <a href="<?php echo esc_url(aster_storefront_url('/shop')); ?>">Shop</a>
        <a href="<?php echo esc_url(aster_storefront_url('/collections')); ?>">Collections</a>
        <a href="<?php echo esc_url(aster_storefront_url('/about')); ?>">About</a>
      </nav>
      <div class="aster-tools">
        <a href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>" aria-label="My account" title="My account"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M3.5 21c.8-5 4-7 8.5-7s7.7 2 8.5 7"/></svg></a>
        <a href="<?php echo esc_url($bag_url); ?>" aria-label="<?php echo esc_attr($bag_label); ?>" title="<?php echo esc_attr($bag_label); ?>"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 7h16l1 14H3L4 7Z"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg><?php if ($count): ?><span class="aster-bag-count"><?php echo (int) $count; ?></span><?php endif; ?></a>
        <details class="aster-menu"><summary aria-label="Navigation menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></summary><nav aria-label="Mobile navigation">
          <a href="<?php echo esc_url(aster_storefront_url()); ?>">Home</a><a href="<?php echo esc_url(aster_storefront_url('/shop')); ?>">Shop</a><a href="<?php echo esc_url(aster_storefront_url('/collections')); ?>">Collections</a><a href="<?php echo esc_url(aster_storefront_url('/about')); ?>">About</a><a href="<?php echo esc_url(home_url('/order-status/')); ?>">Order status</a>
        </nav></details>
      </div>
    </div></header>
    <?php
}

function aster_commerce_footer(): void {
    $has_checkout_bag = !(wp_get_environment_type()==='local' && ($_COOKIE['aster_journey_preview'] ?? '')==='1' && function_exists('aster_phase_three_enabled') && aster_phase_three_enabled()) && function_exists('WC') && WC()->cart && !WC()->cart->is_empty();
    $bag_url = $has_checkout_bag ? wc_get_cart_url() : aster_storefront_url('/shop#bag');
    $bag_label = $has_checkout_bag ? 'Checkout bag' : 'Review your selection';
    ?>
    <footer class="aster-commerce-footer"><div>
      <section><a class="aster-wordmark" href="<?php echo esc_url(aster_storefront_url()); ?>">Aster Edit</a><p>Objects for a more considered table.</p></section>
      <nav aria-label="Shop navigation"><h2>Explore</h2><a href="<?php echo esc_url(aster_storefront_url('/shop')); ?>">All products</a><a href="<?php echo esc_url(aster_storefront_url('/collections')); ?>">Collections</a><a href="<?php echo esc_url(aster_storefront_url('/about')); ?>">Our story</a></nav>
      <nav aria-label="Order navigation"><h2>Your order</h2><a href="<?php echo esc_url(home_url('/order-status/')); ?>">Order status</a><a href="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>">My account</a><a href="<?php echo esc_url($bag_url); ?>"><?php echo esc_html($bag_label); ?></a><a href="<?php echo esc_url(home_url('/terms-and-conditions/')); ?>">Store terms</a><a href="<?php echo esc_url(home_url('/privacy-policy/')); ?>">Privacy</a><a href="mailto:support@example.test">Contact</a></nav>
    </div><p class="aster-footer-note"><?php echo esc_html(is_account_page() && is_user_logged_in() ? '© ' . wp_date('Y') . ' Aster Edit. All rights reserved.' : (wp_get_environment_type() === 'local' ? 'Local preview · Checkout is not open for live payments.' : 'Aster Edit')); ?></p></footer>
    <?php
}

// Woo's store-only Coming Soon template can print a second complete page before
// the Aster commerce shell. Keep cart, account and checkout on one coherent
// page; the separate server-side checkout gate still controls order submission.
add_filter('woocommerce_coming_soon_exclude', function ($excluded) {
    if (is_cart() || is_account_page() || is_checkout()) return true;
    return $excluded;
});

add_filter('template_include', function ($template) {
    if (function_exists('is_woocommerce') && (is_cart() || is_checkout() || is_account_page())) return __DIR__ . '/woo-shell.php';
    if (is_page('terms-and-conditions') || is_page('privacy-policy')) return __DIR__ . '/legal-shell.php';
    return $template;
}, 99);

add_action('wp_enqueue_scripts', function () {
    if (function_exists('is_woocommerce') && (is_cart() || is_checkout() || is_account_page() || is_page('terms-and-conditions') || is_page('privacy-policy'))) {
        wp_enqueue_style('aster-commerce-presentation', plugins_url('commerce.css', __FILE__), [], (string) filemtime(__DIR__ . '/commerce.css'));
    }
    if (function_exists('is_cart') && is_cart()) {
        wp_enqueue_script('aster-cart-empty-refresh', plugins_url('cart-empty-refresh.js', __FILE__), [], (string) filemtime(__DIR__ . '/cart-empty-refresh.js'), true);
    }
    if (function_exists('is_checkout') && is_checkout() && !is_order_received_page() && !aster_checkout_open()) {
        wp_enqueue_script('aster-checkout-gate', plugins_url('checkout-gate.js', __FILE__), [], (string) filemtime(__DIR__ . '/checkout-gate.js'), true);
    }
}, 100);
