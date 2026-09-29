# QOR ID, for a container platform. Staging only — nothing here is production.
#
# Build context is `services/qor-auth`, NOT the repository root. The root has no
# Cargo workspace, and the root Dockerfile builds the chain node from a
# directory that was deleted at M3.5.
#
#   docker build -t qor-auth services/qor-auth
#
# Two things that are easy to get wrong here, both verified rather than assumed:
#
#   1. DATABASE_URL is NOT needed at build time. sqlx's compile-time `query!`
#      macros appear only in src/handlers/music.rs, which is commented out of
#      the module tree and does not compile. Checked: `cargo build` succeeds
#      with DATABASE_URL unset. So there is no offline-mode dance and no
#      .sqlx directory to keep in sync.
#   2. `sqlx::migrate!("./migrations")` DOES read the migrations at build time
#      and embeds them in the binary. The directory must exist in the build
#      context — it is not needed in the runtime image, because by then the
#      migrations are inside the executable.

# --- build -------------------------------------------------------------------
FROM rust:1-bookworm AS build
WORKDIR /src

# TLS is rustls, not OpenSSL (reqwest is built with default-features = false),
# so there is no libssl-dev here and that is deliberate.
RUN apt-get update \
 && apt-get install -y --no-install-recommends pkg-config \
 && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations

RUN cargo build --release --locked

# --- run ---------------------------------------------------------------------
FROM debian:bookworm-slim AS run

# ca-certificates so the service can reach api.resend.com over TLS. Without it
# every email fails at the TLS handshake, which looks like a Resend problem.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --create-home --uid 10001 qor

WORKDIR /app
COPY --from=build /src/target/release/qor-auth /usr/local/bin/qor-auth

# Read only when RUN_ENV=production, and read RELATIVE to the working
# directory, so it has to sit at /app/config and /app has to be the workdir.
COPY config ./config

USER qor

# The platform assigns the port and passes PORT; the service reads it.
# QOR_AUTH__SERVER__PORT still wins if it is set explicitly.
ENV RUN_ENV=production
EXPOSE 8080

# /ready checks Postgres and Redis. /health answers 200 unconditionally and
# would report a service with a dead database as healthy — do not point a
# health check at it.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-8080}/ready" || exit 1

# Migrations run at startup, from inside the binary.
CMD ["qor-auth"]
