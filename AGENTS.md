## General

- Be concise. No filler, no preamble, no summaries at the end. Be direct and precise, don't explain basics unless asked.
- Don’t take action based on assumptions. Do not act on ambiguous scope, missing context, or unclear intent. Stop and ask instead of filling gaps with guesses. 
- When a task involves architectural choices, trade-offs, or irreversible actions, present options with brief rationale rather than picking unilaterally.

## Code

- Defensive coding: use guards, return early, no defaults, raise exceptions and let them bubble, never catch-and-re-raise.
- Prefer pure functions; prefer functions over classes where possible.
- Explicit is better than implicit; Use intermediate variables to clarify intent,

## Environment

- **App container:** Ubuntu 24.04, Node 22, `pi` coding agent, git, curl. Other tools install on demand.
- **Postgres:** reachable at `db:5432` from inside the app container only. PostGIS 3.6. Creds from env (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`). No host port forward.
- **Networking:** three compose networks — `public` (sshd 2222, Vite 5173 forwarded to host), `private` (app↔db), `egress` (stub). Dev servers must bind to `0.0.0.0` to be reachable from the host.
- **Workspace:** `/workspace` is the real working copy; the host clone exists only to bootstrap and to hold devcontainer config.
- **Secrets:** `.devcontainer.env` (gitignored) is mounted at `/run/devcontainer.env` and sourced into login shells via `/etc/profile.d/devcontainer-env.sh`.
- **Reserved ports:** 5173 (SPA, live), 3000 (backend, commented), 8000 (other, commented). Uncomment in `.devcontainer/docker-compose.yml` then `./scripts/up.sh`.
