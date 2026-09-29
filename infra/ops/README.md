# The operations stack: this computer, published by Cloudflare Tunnel

> **Superseded on 29 September 2026 by ADR-063.** QOR ID, Postgres and Redis move to Railway
> (`services/qor-auth/DEPLOY-RAILWAY.md`) and CI to GitHub Actions. This stack stays only until `id.qorsync.dev`
> points at Railway; then this directory is deleted.

QOR ID (`id.qorsync.dev`), its Postgres and Redis, and Woodpecker CI (`ci.qorsync.dev`, with its build agent)
run in Docker on the owner's computer (ADR-060). A Cloudflare Tunnel publishes the two names over HTTPS:
`cloudflared` connects out to Cloudflare, so no port is opened and no router is touched. **$0, and no card.**
While this computer is off, both names are down, and CI pipelines wait.

**Not here yet: the public chain RPC node.** A `--dev` chain's sudo key is the well-known `//Alice`, so a public
RPC endpoint would let anyone take the chain over. It is added once `chain/` has a test specification with a
private sudo key (owed, ADR-060).

## What the owner does once

**1. A Cloudflare account**, free, email only: https://dash.cloudflare.com/sign-up (skip if you have one).

**2. Add `qorsync.dev` to it**, on the **Free** plan: dashboard → *Add a domain* → `qorsync.dev` → Free. Cloudflare
shows two nameservers, such as `ada.ns.cloudflare.com`. Claude switches them in Vercel through Vercel's API (or:
Vercel → Domains → `qorsync.dev` → Nameservers). Vercel stays the registrar; only DNS moves.

**3. Authorise the tunnel program**, once: `cloudflared tunnel login` opens a browser page; choose `qorsync.dev`.
From then on `start-ops.ps1` creates the tunnel `qor-ops`, its two DNS records and its configuration by itself.

**4. A GitHub OAuth app**: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App, with Homepage
`https://ci.qorsync.dev` and callback `https://ci.qorsync.dev/authorize`, then *Generate a new client secret*.

**5. Start it:**

```
powershell -File infra/ops/start-ops.ps1
```

It asks, on your own screen, for the GitHub app's ID and secret, once; makes the tunnel and every other secret
itself; keeps them all in `%LOCALAPPDATA%\qor-ops\.env`, readable only by your Windows account; and
starts the stack. After a restart of the computer, Docker Desktop brings it back by itself.

**6. In Woodpecker** (https://ci.qorsync.dev, sign in with GitHub): activate `ALaustrup/demiurge-cloud`; turn
on *Trusted* → **Volumes** in its settings; and add a cron named **`nightly`**, `0 3 * * *`, branch `main`.

Stop everything with `start-ops.ps1 -Stop`.
