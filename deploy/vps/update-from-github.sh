#!/bin/bash
set -euo pipefail
cd /opt/orderly-shop/app
if [ -n "$(git status --porcelain)" ]; then
  echo 'Working tree has changes. Commit or review them before updating.' >&2
  exit 1
fi
git fetch origin main
if ! git -c user.name='Orderly deployment' -c user.email='deploy@localhost' merge --no-edit origin/main; then
  git merge --abort
  echo 'GitHub changes conflict with the VPS deployment fixes; merge them after review.' >&2
  exit 1
fi
/opt/orderly-shop/rebuild.sh
