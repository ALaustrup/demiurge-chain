# QOR ID on Railway — staging

**Nothing here has been run.** The `railway` CLI is not installed on this machine and `RAILWAY_TOKEN`
is not set, so Phase 6 of the realignment stopped at writing the configuration. These are the exact
commands, in order, for whoever runs them.

**Staging only.** Nothing in this document creates anything called production.

## What was fixed first, because the deploy could not have worked without it

Two defects would each have produced a service that fails to start, with a message that does not point
at the cause.

1. **Flat environment names did not work**, though `config.rs` said they did. `try_deserialize` ran
   before the flat overrides, so `DATABASE_URL` alone failed with ``missing field `access_secret` ``.
   Railway's Postgres and Redis plugins inject exactly those flat names. Fixed by defaulting the four
   fields to empty so deserialisation succeeds, then letting the overrides apply, with `validate()`
   refusing an empty value and naming **both** spellings in the error.
2. **The service ignored `PORT`.** Railway assigns the port. It now reads `PORT`, with
   `QOR_AUTH__SERVER__PORT` still winning if set explicitly.

## 1. Install and sign in

```bash
npm i -g @railway/cli
railway login
```

## 2. Create the project and the environment

```bash
railway init --name qor
railway environment new staging
railway environment staging
```

## 3. Add Postgres and Redis

```bash
railway add --database postgres
railway add --database redis
```

Both come with a volume. They inject `DATABASE_URL` and `REDIS_URL` into services in the same project,
which is why step 4's variable list does not set them.

## 4. Create the service and set every non-secret variable

From `services/qor-auth`:

```bash
railway add --service qor-auth
railway variables --service qor-auth \
  --set "RUN_ENV=production" \
  --set "QOR_AUTH__SERVER__HOST=0.0.0.0" \
  --set "QOR_AUTH__JWT__ISSUER=qor-auth-demiurge" \
  --set "QOR_AUTH__JWT__ACCESS_EXPIRY_SECS=900" \
  --set "QOR_AUTH__JWT__REFRESH_EXPIRY_SECS=2592000" \
  --set "QOR_AUTH__SECURITY__MAX_LOGIN_ATTEMPTS=5" \
  --set "QOR_AUTH__SECURITY__LOCKOUT_DURATION_SECS=900" \
  --set "QOR_AUTH__SECURITY__PASSWORD_MIN_LENGTH=12" \
  --set "QOR_AUTH__CHAIN__SS58_PREFIX=42" \
  --set "QOR_AUTH__DATABASE__MAX_CONNECTIONS=10" \
  --set "RUST_LOG=qor_auth=info,tower_http=info"
```

**`PASSWORD_MIN_LENGTH` is set to 12 here deliberately.** `config/production.toml` carries `8`, which is
weaker than the code default, and changing that file is a policy decision for the owner rather than a
deployment step. Setting it in the environment means staging does not inherit the weaker value while
that decision is open.

**`QOR_AUTH__SERVER__PORT` is deliberately not set**, so Railway's `PORT` is used.

## 5. Create every secret variable empty, for the owner to fill in the dashboard

**Never paste a secret into a shell.** These are created empty and filled in the Railway dashboard,
under the service's Variables tab.

```bash
railway variables --service qor-auth \
  --set "QOR_AUTH__JWT__ACCESS_SECRET=" \
  --set "QOR_AUTH__JWT__REFRESH_SECRET=" \
  --set "RESEND_API_KEY=" \
  --set "EMAIL_FROM=" \
  --set "BASE_URL=" \
  --set "RESEND_WEBHOOK_SECRET="
```

| Variable | What it is | If left empty |
| --- | --- | --- |
| `QOR_AUTH__JWT__ACCESS_SECRET` | ≥32 chars, not a placeholder | **The service will not start** |
| `QOR_AUTH__JWT__REFRESH_SECRET` | ≥32 chars, **must differ from the access secret** | **The service will not start** |
| `RESEND_API_KEY` | The Resend sending key | Email is refused with 503 |
| `EMAIL_FROM` | `Demiurge-Cloud <noreply@demiurge.cloud>` | Email is refused with 503 |
| `BASE_URL` | The origin QOR ID's email links open. HTTPS, no path | Email is refused with 503 |
| `RESEND_WEBHOOK_SECRET` | Resend's endpoint signing secret | Bounce reports refused with 503 |

`RESEND_API_URL` must stay **unset** in any live environment.

## 6. Deploy

```bash
railway up --service qor-auth --environment staging
```

**This build is the first time `qor-auth` has been compiled on Linux.** Record whether it passes; every
local verification to date has been on Windows.

## 7. The domain

```bash
railway domain --service qor-auth
```

That prints the Railway hostname. The staging API name is a `CNAME` pointing at it:

```
CNAME   api-staging.qorsync.dev   →   <the hostname Railway printed>
```

Nothing about DNS is done here. `.dev` is HSTS-preloaded, so that name needs a real certificate before a
browser will open it at all — Railway issues one for a custom domain once the CNAME resolves.

## 8. After the first deploy

- `railway logs --service qor-auth` — migrations run at startup, from inside the binary. Eighteen of
  them should apply on a fresh database.
- Check `/ready`, not `/health`. `/ready` tests Postgres and Redis; `/health` returns 200 even with a
  dead database.
- **Add the staging frontend origin to `server.allowed_origins`** when a frontend exists. Until then the
  loopback default is correct and no browser origin is allowed.
