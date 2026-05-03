#!/usr/bin/env bash
# Build/start the devcontainer stack and SSH into `app`.
# Idempotent: re-running this rebuilds the image but preserves all named volumes.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .devcontainer.env ]; then
    echo "error: .devcontainer.env missing." >&2
    echo "       cp .devcontainer.env.example .devcontainer.env  # then fill in keys" >&2
    exit 1
fi

if [ ! -f "${HOME}/.ssh/id_ed25519.pub" ]; then
    echo "error: ${HOME}/.ssh/id_ed25519.pub not found." >&2
    echo "       This key is injected as authorized_keys for dev@container." >&2
    exit 1
fi

# Discovered from the host repo's origin remote and passed into the container
# so bootstrap.sh can clone into the /workspace volume on first run.
export REPO_ORIGIN_URL="$(git remote get-url origin)"

echo ">> building & starting compose stack…"
docker compose -f .devcontainer/docker-compose.yml up -d --build --wait

# -t allocates a TTY so bootstrap's GitHub-key prompt is interactive.
# REPO_ORIGIN_URL is passed inline because sshd does not propagate the
# daemon's environment to login shells. printf %q makes it safe against
# any shell metacharacters in the URL.
exec ssh -p 2222 -o StrictHostKeyChecking=accept-new -t dev@localhost \
    "REPO_ORIGIN_URL=$(printf '%q' "$REPO_ORIGIN_URL") bash -lc '/usr/local/bin/bootstrap.sh && cd /workspace && exec bash -l'"
