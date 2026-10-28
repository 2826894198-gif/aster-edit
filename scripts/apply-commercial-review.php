<?php
if (!defined('WP_CLI') || !WP_CLI || !defined('ASTER_COMMERCE_ENV') || ASTER_COMMERCE_ENV !== 'local') throw new RuntimeException('Local CLI only.');
$source = json_decode(file_get_contents('/workspace/catalog/launch-drafts.v1.json'), true, 512, JSON_THROW_ON_ERROR);
$review = json_decode(file_get_contents('/workspace/catalog/commercial-review.v1.json'), true, 512, JSON_THROW_ON_ERROR);
$apply = in_array('apply', $args ?? [], true);
try {
    $result = Aster_Commercial_Review::apply($source, $review, $apply);
    WP_CLI::log(wp_json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    WP_CLI::success(($apply ? 'Applied' : 'Dry run') . ': display prices and availability synced; sale gate remains closed.');
} catch (Throwable $e) {
    WP_CLI::error($e->getMessage());
}
