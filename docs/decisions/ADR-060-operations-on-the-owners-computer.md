# ADR-060: The operations stack runs on the owner's computer, published by Cloudflare Tunnel

**Status:** Accepted, 28 September 2026, under the owner's delegation. The owner rejected Oracle Cloud ("Fuck
Oracle. Find something else.") and left the choice of a free alternative to the assistant.
**Supersedes:** [ADR-059](ADR-059-operations-on-oracle-always-free.md), the same day, and with it
[ADR-058](ADR-058-ci-on-woodpecker.md)'s server location. ADR-058's other decisions stand.
**Departs from:** [ADR-015](ADR-015-infrastructure-ownership.md) for these services, as ADR-059 did.

## Context

QOR ID, its Postgres and Redis, and the Woodpecker server need to be reachable at `id.qorsync.dev` and
`ci.qorsync.dev`, for nothing. Paid hosts (Fly.io, Railway) were ruled out on cost, and Oracle's free tier by the
owner. Free web platforms (Render, Koyeb) sleep, which loses GitHub's webhooks, and cannot run a chain node. The
owner's computer already runs Docker, the development stack and the CI agent.

## Decision

1. **The stack runs in Docker on the owner's computer** (`infra/ops/compose.yaml`): `cloudflared`, QOR ID in
   production mode, Postgres, Redis, the Woodpecker server and its agent, on the stack's own network with no port
   published to the host.
2. **A Cloudflare Tunnel publishes `id.qorsync.dev` and `ci.qorsync.dev`.** `cloudflared` connects out; nothing is
   opened on the computer or the router. The agent reaches the server on the stack's network, so Woodpecker's
   gRPC is never public.
3. **`qorsync.dev`'s DNS moves to Cloudflare**, on the free plan. Vercel remains the registrar. Cloudflare serves
   the names with its own edge certificate. ADR-042's decision 6 asked for per-hostname certificates *so that no DNS
   API token has to exist*; none exists here either, which is the reason that rule was written.
4. **Secrets live in `%LOCALAPPDATA%\qor-ops\.env`**, outside the repository and readable only by the owner's
   Windows account. `start-ops.ps1` generates the internal ones and asks the owner, on their own screen, for the
   tunnel token and the GitHub OAuth app's ID and secret.
5. **No public RPC node until the test chain has a private sudo key**, for ADR-059's reason: `--dev`'s sudo is
   `//Alice`.

## Consequences

- **$0 and no card**: Cloudflare's free plan, and hardware the owner already has.
- **Up only while the computer is.** QOR ID and CI are unreachable when it is off; GitHub's missed webhooks can be
  redelivered, and the next push runs CI anyway. Acceptable for development; mainnet hosting is a later decision,
  as it always was.
- **One computer holds the only copy of QOR ID's database.** Backups remain ADR-015's open question.
- Tauri reaches QOR ID from the launcher's host process, so moving it behind Cloudflare changes no CORS rule.
