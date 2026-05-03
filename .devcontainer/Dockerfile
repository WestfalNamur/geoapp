# Pinned by tag for now. To digest-pin later:
#   docker pull ubuntu:24.04
#   docker inspect --format='{{index .RepoDigests 0}}' ubuntu:24.04
# then replace with: FROM ubuntu@sha256:<digest>
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Bare bones only: enough to SSH in and bootstrap from there.
# Anything else (Bun, Node, Python+uv, postgresql-client, Neovim, ripgrep, ...)
# gets installed by hand after SSHing in. See TODO block below.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        openssh-server \
        git \
        curl \
        ca-certificates \
        sudo \
        netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

# TODO (install by hand after SSHing in; do NOT bake into the image):
#   - Bun (curl -fsSL https://bun.sh/install | bash)
#   - Node via fnm/nvm if needed
#   - Python + uv (curl -LsSf https://astral.sh/uv/install.sh | sh)
#   - postgresql-client (apt-get install postgresql-client) for psql against db:5432
#   - Neovim, ripgrep, fd-find, fzf, tmux, etc.

# Non-root user; uid 1000 matches typical macOS host user.
# Ubuntu 24.04's base image ships a default `ubuntu` user at uid 1000; remove
# it first so `dev` can claim the slot.
RUN userdel -r ubuntu 2>/dev/null || true \
 && useradd -m -u 1000 -s /bin/bash dev \
 && echo 'dev ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/dev \
 && chmod 0440 /etc/sudoers.d/dev

RUN mkdir -p /etc/ssh/keys /var/run/sshd

COPY sshd_config /etc/ssh/sshd_config

# `scripts` is the named build context wired in docker-compose.yml.
# Bootstrap is baked into the image so it runs even when /workspace is empty
# (first boot) or when `up.sh` SSHes in without a Dev Containers-aware editor.
COPY --from=scripts bootstrap.sh /usr/local/bin/bootstrap.sh
RUN chmod 0755 /usr/local/bin/bootstrap.sh

RUN cat > /usr/local/bin/start-sshd.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

KEY=/etc/ssh/keys/ssh_host_ed25519_key
if [ ! -f "$KEY" ]; then
    ssh-keygen -t ed25519 -N "" -C "geoapp-devcontainer-host-key" -f "$KEY"
fi
chmod 600 "$KEY"
chmod 644 "$KEY.pub"

install -d -m 0700 -o dev -g dev /home/dev/.ssh
AUTH=/home/dev/.ssh/authorized_keys
touch "$AUTH"
chown dev:dev "$AUTH"
chmod 600 "$AUTH"

# /workspace is a named volume; it comes up root-owned on first attach.
# Done in the entrypoint (not bootstrap) so it survives bootstrap being
# skipped or perms drifting on later boots.
mkdir -p /workspace
chown dev:dev /workspace

if [ -f /run/host_pubkey ]; then
    PUBKEY="$(cat /run/host_pubkey)"
    if ! grep -qxF "$PUBKEY" "$AUTH"; then
        printf '%s\n' "$PUBKEY" >> "$AUTH"
    fi
fi

exec /usr/sbin/sshd -D -e
EOF
RUN chmod 0755 /usr/local/bin/start-sshd.sh

EXPOSE 2222
HEALTHCHECK --interval=2s --timeout=2s --start-period=20s --retries=15 \
    CMD nc -z localhost 2222 || exit 1
CMD ["/usr/local/bin/start-sshd.sh"]
