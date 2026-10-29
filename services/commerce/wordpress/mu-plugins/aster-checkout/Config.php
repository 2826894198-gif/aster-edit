<?php
namespace Aster\Checkout;

/** Reads only Aster's official PPCP connection. No independent credentials. */
final class Config {
    public function singlePageCheckoutEnabled() { return \aster_checkout_foundation_active(); }
    public function paypalGatewayIds() { return ['ppcp-credit-card-gateway', 'ppcp-gateway', 'ppcp-applepay', 'ppcp-googlepay']; }
    public function paypalMode() { return !empty(get_option('woocommerce-ppcp-data-common', [])['use_sandbox']) ? 'sandbox' : 'live'; }
    private function credentials() {
        $common = get_option('woocommerce-ppcp-data-common', []);
        if (!is_array($common) || !array_key_exists('use_sandbox', $common)
            || filter_var($common['use_sandbox'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) !== ($this->paypalMode() === 'sandbox')) return [];
        return !empty($common['client_id']) && !empty($common['client_secret']) ? $common : [];
    }
    public function paypalClientId() { return (string)($this->credentials()['client_id'] ?? ''); }
    public function paypalClientSecret() { return (string)($this->credentials()['client_secret'] ?? ''); }
    public static function trustedStorefrontRequest($request = null) {
        $origin = $request ? $request->get_header('origin') : ($_SERVER['HTTP_ORIGIN'] ?? '');
        $referer = $request ? $request->get_header('referer') : ($_SERVER['HTTP_REFERER'] ?? '');
        $source = trim($origin ?: $referer);
        if (!$source || preg_match('/[\x00-\x20\x7f]/', $source)) return false;
        $parts = wp_parse_url($source); $site = wp_parse_url(home_url('/'));
        if (!is_array($parts) || isset($parts['user']) || isset($parts['pass'])
            || ($origin && (isset($parts['path']) || isset($parts['query']) || isset($parts['fragment'])))) return false;
        return ($parts['scheme'] ?? '') === ($site['scheme'] ?? '')
            && ($parts['host'] ?? '') === ($site['host'] ?? '')
            && ($parts['port'] ?? (($parts['scheme'] ?? '') === 'https' ? 443 : 80)) === ($site['port'] ?? (($site['scheme'] ?? '') === 'https' ? 443 : 80));
    }
}
