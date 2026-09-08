#!/bin/bash
set -euo pipefail
umask 077
exec 9>/run/lock/orderly-backup.lock
flock -n 9 || exit 0
root=/opt/orderly-shop
destination=/var/backups/orderly
mkdir -p "$destination"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
stage=$(mktemp -d "$destination/.partial-XXXXXX")
trap 'rm -rf -- "$stage"' EXIT
docker exec supabase-db pg_dump -U postgres -d postgres -Fc > "$stage/database.dump"
docker exec supabase-db pg_dumpall -U postgres --globals-only > "$stage/roles.sql"
tar -czf "$stage/storage.tar.gz" -C "$root/supabase/volumes" storage
# Preserve both env files distinctly.
cp "$root/supabase/.env" "$stage/supabase.env"
cp "$root/app.env" "$stage/app.env"
cp "$root/app-compose.yml" "$stage/"
tar -czf "$destination/$stamp.tar.gz" -C "$stage" .
tar -tzf "$destination/$stamp.tar.gz" >/dev/null
find "$destination" -maxdepth 1 -type f -name '*.tar.gz' -mtime +7 -delete
echo "Backup verified: $destination/$stamp.tar.gz"
