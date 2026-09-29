# Woodpecker CI

CI moved off GitHub Actions on 28 September 2026 (ADR-058). The code stays on GitHub; Woodpecker reads it.

- **The server and its agent** run in Docker on the owner's computer, in the operations stack
  (`infra/ops/`, ADR-060), and a Cloudflare Tunnel publishes the server at **https://ci.qorsync.dev** for the UI
  and GitHub's webhooks. The agent reaches the server on the stack's own network. Builds are free; while the
  computer is off, pipelines wait.
- **The pipelines** are `.woodpecker/*.yaml` at the repository root, one per former Actions job:
  `chain`, `two-validators` (nightly and by hand), `qor-auth`, `launcher`, `coverage` and `security`.

Codeberg is the fallback: Woodpecker speaks Codeberg natively, and the pipelines do not change.

## Setting it up, once

In `infra/ops/README.md`: the GitHub OAuth app, the tunnel, `start-ops.ps1`, and the three settings in
Woodpecker (activate the repository, trust it for volumes, add the `nightly` cron).
