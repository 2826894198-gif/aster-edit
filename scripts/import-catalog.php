<?php
if (!defined('WP_CLI') || !WP_CLI || !defined('ASTER_COMMERCE_ENV') || ASTER_COMMERCE_ENV !== 'local') throw new RuntimeException('Local CLI only.');
$manifest = json_decode(file_get_contents('/workspace/catalog/launch-drafts.v1.json'), true, 512, JSON_THROW_ON_ERROR);
$apply = in_array('apply', $args ?? [], true);
try {
    $result = Aster_Catalog::import($manifest, $apply);
    WP_CLI::log(wp_json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    WP_CLI::success(($apply ? 'Applied' : 'Dry run') . ': ' . count($result) . ' unpriced drafts. No product published.');
} catch (Throwable $e) {
    WP_CLI::error($e->getMessage());
}
