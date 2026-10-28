#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
docker compose config --quiet
docker compose run --rm cli eval-file /workspace/tests/environment.php
docker compose run --rm cli eval-file /workspace/tests/commerce.php
docker compose run --rm cli eval-file /workspace/tests/commercial-review.php
docker compose run --rm cli eval-file /workspace/tests/bundle-contract.php
docker compose run --rm cli eval-file /workspace/tests/shipping-policy.php
node --test tests/isolation.test.mjs
node --test tests/order-access.test.mjs
node --test tests/presentation.test.mjs
node --test tests/account.test.mjs
node --test tests/handoff.test.mjs
node --test tests/single-checkout.test.mjs
docker compose run --rm cli eval-file /workspace/tests/handoff-rollback.php
docker compose run --rm cli eval-file /workspace/tests/operations-fixture.php
node --test tests/operations.test.mjs
