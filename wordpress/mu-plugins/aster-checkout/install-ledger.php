<?php
namespace Aster\Checkout;
/** Payment ledger schema from the owner-authorized JWK installer. */
function install_ledger(): void {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $table = $wpdb->prefix . 'aster_payment_attempts';
    $charset = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE {$table} (
            id bigint unsigned NOT NULL AUTO_INCREMENT,
            attempt_id char(36) NOT NULL,
            token_hash char(64) NOT NULL,
            provider varchar(24) NOT NULL DEFAULT 'paypal',
            woo_order_id bigint unsigned NULL,
            woo_order_key_hash char(64) NOT NULL DEFAULT '',
            provider_order_id varchar(64) NOT NULL DEFAULT '',
            capture_id varchar(64) NOT NULL DEFAULT '',
            amount_minor bigint NOT NULL DEFAULT 0,
            currency char(3) NOT NULL DEFAULT '',
            woo_status varchar(32) NOT NULL DEFAULT '',
            provider_status varchar(40) NOT NULL DEFAULT '',
            capture_status varchar(32) NOT NULL DEFAULT '',
            capture_count int unsigned NOT NULL DEFAULT 0,
            lookup_available tinyint(1) NOT NULL DEFAULT 0,
            reconciliation_state varchar(48) NOT NULL DEFAULT '',
            customer_state varchar(40) NOT NULL DEFAULT 'saved',
            safe_action varchar(40) NOT NULL DEFAULT 'none',
            retry_count int unsigned NOT NULL DEFAULT 0,
            next_check_at datetime NULL,
            expires_at datetime NULL,
            order_deleted_at datetime NULL,
            resolved_at datetime NULL,
            last_reason varchar(190) NOT NULL DEFAULT '',
            version bigint unsigned NOT NULL DEFAULT 1,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY attempt_id (attempt_id),
            UNIQUE KEY token_hash (token_hash),
            UNIQUE KEY woo_order_id (woo_order_id),
            KEY provider_order (provider, provider_order_id),
            KEY capture_id (capture_id),
            KEY recovery_queue (customer_state, next_check_at),
            KEY updated_at (updated_at)
        ) {$charset};");

    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) !== $table) throw new \RuntimeException('Checkout recovery storage is unavailable.');
    update_option('aster_checkout_ledger_schema', '1', false);
}
