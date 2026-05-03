#!/usr/bin/env bash
# Destroy the entire devcontainer stack INCLUDING all named volumes.
# This is the only documented destroy path. Anything not committed and pushed
# is gone afterwards.
set -euo pipefail

cd "$(dirname "$0")/.."

cat <<'EOF'
This will run `docker compose down -v`, removing these volumes:

  - workspace      (/workspace — your code)
  - home           (/home/dev — dotfiles, GitHub key)
  - ssh_host_keys  (sshd identity)
  - pgdata         (Postgres data)

Anything not committed and pushed will be lost.

EOF

read -r -p 'Type "nuke" to confirm: ' confirm
if [ "$confirm" != "nuke" ]; then
    echo "aborted."
    exit 1
fi

docker compose -f .devcontainer/docker-compose.yml down -v
echo ">> stack and volumes removed."
