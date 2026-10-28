#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
node scripts/init-secrets.mjs
node scripts/fetch-packages.mjs
docker compose config --quiet
docker compose up -d --wait db mailpit wordpress
# The CLI's entrypoint is wp; read the generated password inside the container,
# never as a shell argument or in host terminal output.
if ! docker compose run --rm cli core is-installed >/dev/null 2>&1; then
  docker compose run --rm --entrypoint php cli /workspace/scripts/core-install.php
fi
docker compose run --rm cli eval-file /workspace/scripts/install-local.php
