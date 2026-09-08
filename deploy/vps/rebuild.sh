#!/bin/bash
set -euo pipefail
root=/opt/orderly-shop
exec 9>/run/lock/orderly-deploy.lock
flock -n 9 || { echo 'Another deployment is running'; exit 1; }
cd "$root/app"
# This builds the checked-out code; fetching/merging GitHub changes is explicit.
docker run --rm --env-file "$root/app.env" -v "$root/app:/app" -w /app node:22-bookworm-slim sh -c 'npm ci --include=dev && npm run build'
docker build -f Dockerfile.vps -t orderly-shop:candidate .
"$root/backup.sh"
python3 "$root/migrate-vps.py"
docker image tag orderly-shop:current orderly-shop:previous
docker image tag orderly-shop:candidate orderly-shop:current
cd "$root"
if ! docker compose -f app-compose.yml up -d --wait --wait-timeout 90; then
    docker image tag orderly-shop:previous orderly-shop:current
    docker compose -f app-compose.yml up -d --wait --wait-timeout 90
    echo 'New app failed health check; previous application image restored. Database changes were retained.' >&2
    exit 1
fi
echo 'Application deployed and healthy.'
