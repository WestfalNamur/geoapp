#!/usr/bin/env bash
# In-container first-run setup. Idempotent: gated by /workspace/.bootstrapped.
# Does only the minimum: clone the repo into /workspace on first run, generate
# a dedicated GitHub key, write ~/.ssh/config, pause for the key to be added.
# Toolchain installs are explicitly NOT done here.
set -euo pipefail

FLAG=/workspace/.bootstrapped
if [ -f "$FLAG" ]; then
    exit 0
fi

# Dedicated GitHub key. Lives on the `home` named volume; survives image
# rebuilds. Revoke: delete on GitHub, `rm /home/dev/.ssh/id_ed25519_github*`,
# re-run bootstrap.
KEY=/home/dev/.ssh/id_ed25519_github

CONFIG=/home/dev/.ssh/config
touch "$CONFIG"
chmod 600 "$CONFIG"
if ! grep -q '^Host github.com$' "$CONFIG"; then
    cat >> "$CONFIG" <<'EOF'

Host github.com
    IdentityFile ~/.ssh/id_ed25519_github
    IdentitiesOnly yes
EOF
fi

if [ ! -f "$KEY" ]; then
    ssh-keygen -t ed25519 -N "" -C "geoapp-devcontainer" -f "$KEY"
    cat <<EOF

============================================================
Add this public key to GitHub (Settings → SSH and GPG keys):
============================================================
$(cat "$KEY.pub")
============================================================

EOF
    # Order matters: private repo over SSH, the new key must be registered
    # with GitHub before `git clone` runs below.
    read -r -p "Press Enter once the key is added to GitHub..." _
fi

if ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes -T git@github.com 2>&1 | grep -q 'successfully authenticated'; then
    echo ">> github authentication OK"
else
    # Not fatal — user may have a transient network issue; clone may still work.
    echo ">> warning: could not verify github authentication. Continuing."
fi

if [ -z "$(ls -A /workspace 2>/dev/null)" ]; then
    : "${REPO_ORIGIN_URL:?REPO_ORIGIN_URL not set — up.sh should have provided it}"
    echo ">> cloning ${REPO_ORIGIN_URL} into /workspace…"
    git clone "$REPO_ORIGIN_URL" /workspace
fi

touch "$FLAG"
echo ">> bootstrap complete"
