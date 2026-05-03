# geoapp devcontainer

The devcontainer **is** the dev environment. The host (your Mac) runs only
Docker; you SSH into the `app` container and work entirely there. The
committed Dockerfile is intentionally bare — sshd, git, sudo, zsh, and
nothing else. Toolchains (Bun, Node, Python+uv, postgresql-client, Neovim,
etc.) get installed by hand after SSHing in, so the image stays honest about
what it actually depends on.

## Quickstart

```sh
git clone git@github.com:WestfalNamur/geoapp.git
cd geoapp
cp .devcontainer.env.example .devcontainer.env   # fill in keys
./scripts/up.sh
```

First run pauses to print a freshly-generated SSH public key. Add it to your
GitHub account (Settings → SSH and GPG keys), then press Enter. You land in a
zsh shell at `/workspace` inside `app`.

Subsequent runs of `./scripts/up.sh` rebuild the image but preserve all
state (code, home directory, postgres data, ssh host keys).

## Mental model: a local VPC

The compose networks form a small VPC:

```
host (Mac)
  │   :2222 ──► app:2222 (sshd)
  │   :5173 ──► app:5173 (Vite dev server)
  ▼
┌─────────────────────────── public ───────────────────────────┐
│  app  (bastion + workload, only service on public)           │
└──────────────────────────────────────────────────────────────┘
┌─────────────────────────── private ──────────────────────────┐
│  app  ────────────────  db (postgis/postgis:18-3.6)          │
│                          no host port forward                │
└──────────────────────────────────────────────────────────────┘
┌─────────────────────────── egress ───────────────────────────┐
│  app  (stub today; forward proxy slots in here later)        │
└──────────────────────────────────────────────────────────────┘
```

- `public` = public subnet. Only `app` sits here; host port forwards land here.
- `private` = private subnet (`internal: true`). `app` ↔ `db` only. `db` has
  no host port — it's only reachable from `app` at `db:5432`.
- `egress` = NAT path. Only `app`. Stub for now; an HTTP forward proxy will
  later live here so agent egress can be allowlisted (HTTP_PROXY/HTTPS_PROXY).
- `app` is the only multi-homed service — bastion *and* workload.

## The two-copies oddity

There are two copies of the repo:

1. The **host clone** — only purpose: bootstrap. Don't edit here.
2. The **container clone** at `/workspace` (named volume `workspace`) — this
   is where you actually work. Survives image rebuilds.

`bootstrap.sh` reads `git remote get-url origin` from the host clone (passed
in by `up.sh` as `REPO_ORIGIN_URL`) and clones it into `/workspace` on first
run.

## Editor over SSH

Anything that speaks SSH works against `localhost:2222` as user `dev`:

- VS Code / Cursor: Remote-SSH extension → `ssh dev@localhost -p 2222`
- Zed: SSH remoting
- JetBrains Gateway
- Plain Neovim / vim / emacs over SSH

## React SPA / Vite — the bind-address gotcha

The dev server inside `app` **must** bind to `0.0.0.0`, not `localhost`, or
the host port forward sees nothing. Two equivalent fixes:

```sh
# CLI form
bun run vite --host 0.0.0.0
```

```ts
// vite.config.ts
export default defineConfig({
  server: { host: true },  // equivalent to --host 0.0.0.0
});
```

Then open `http://localhost:5173` on the host.

HMR over the forwarded port works without extra config in most setups. If
WebSocket connections fail, the escape hatch is:

```ts
server: {
  host: true,
  hmr: { clientPort: 5173 },
}
```

## GitHub access — dedicated key, not agent forwarding

`bootstrap.sh` generates a dedicated `id_ed25519_github` inside the container
on first run and configures `~/.ssh/config` to use it for `github.com`. The
key persists on the `home` volume across image rebuilds.

**No SSH agent forwarding by default.** Forwarding your host agent would
hand every process inside the sandbox access to your *entire* GitHub
identity (and any other key in your agent), with revocation requiring you to
remove device keys server-side *and* kill forwarded sessions. A dedicated
container-scoped key has a smaller blast radius and is revoked with one click
on github.com.

**Add the key:** copy the block printed during first-run bootstrap into
GitHub → Settings → SSH and GPG keys.

**Revoke:** delete the key on github.com, then inside the container:

```sh
rm /home/dev/.ssh/id_ed25519_github*
/usr/local/bin/bootstrap.sh         # regenerates and prompts again
```

(Bootstrap is idempotent via `/workspace/.bootstrapped`; remove that flag
file if you want a full re-run.)

## API keys / threat model

`.devcontainer.env` (gitignored) is loaded into `app` via compose's
`env_file`. Variables are visible to every process running as `dev`. That's
fine for a single-user sandbox: you're the only one in the container.

The stronger control is on the roadmap as the forward proxy on the `egress`
network, which lets us allowlist destinations rather than trust every binary
that reads `$ANTHROPIC_API_KEY`.

## Verify PostGIS

After installing `postgresql-client` inside `app`:

```sh
sudo apt-get update && sudo apt-get install -y postgresql-client
psql -h db -U postgres -c 'SELECT PostGIS_Version();'
```

You should see something like `3.6 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`.

## Lifecycle

- **Rebuild without state loss:** `./scripts/up.sh` again. The image is
  rebuilt, but `workspace`, `home`, `ssh_host_keys`, and `pgdata` volumes are
  all preserved. Your SSH `known_hosts` won't complain because the host key
  is persisted on `ssh_host_keys`.
- **Full reset:** `./scripts/nuke.sh` — prints what's about to be destroyed,
  requires you to type `nuke`, then runs `docker compose down -v`. Only
  documented destroy path.

## Where things slot in later

- **Toolchains:** the Dockerfile has a TODO block listing Bun, Node,
  Python+uv, postgresql-client, Neovim. Install them by hand inside `app`
  for now; once a stable shortlist emerges, move them into the Dockerfile.
- **Backend / other services:** uncomment the `3000`/`8000` host port
  forwards in `.devcontainer/docker-compose.yml` as services come online.
- **Egress proxy:** add a service on the `egress` network (tinyproxy /
  squid / mitmproxy with an allowlist), set `HTTP_PROXY`/`HTTPS_PROXY` on
  `app`, and remove `app` from networks that don't need direct internet.
