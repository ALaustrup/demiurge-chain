# Where Demiurge stands

For Andrew. One page. Rewritten at the end of every session — if it is stale, the session is not done.

## What Demiurge is

A blockchain where people who make things get paid when their work is used, and a desktop application
that is how anyone touches it. The currency is **CGT**, and it exists to be spent, not held. Six products
are planned on top of it, all sharing one sign-in, one asset format and one currency.

## What exists and works today

The code is public at `github.com/ALaustrup/demiurge-chain` since 29 September. Checked that day.

- **The chain.** Produces blocks and finalises them — *finalise: agree a block can never be undone* —
  holds assets, sends them, and **sells them for CGT and pays royalties**. Two machines running it agree.
  **96 tests pass.**
- **Sign-in (QOR ID).** Accounts, email, backup codes, admin controls. **125 tests passed** when last run
  (21 September). Still runs on your PC until the move below finishes.
- **The launcher.** Your keys, sign-in, sending CGT, minting from a project, an Inventory of cards, sending
  assets, a listing you can draft, and Projects. **162 tests pass**, plus three against a running chain.

**What it cannot do yet:** charge a fee, create new CGT, **show a listing to anyone who doesn't already know
the asset**, sell from the launcher, or let an asset nest or change state.

## What changed (29 September)

- **Royalties** (ADR-061, ADR-062): creators set who gets a share of every sale, plus a remix share; they
  can correct their terms while they still hold the work. A sale pays the remix's original, the royalties,
  then the seller. No platform cut yet — your 15% is still undecided.
- **The code is public** as `ALaustrup/demiurge-chain`, starting fresh with no history. The old repository,
  `demiurge-cloud`, stays private as the archive. Scanned for secrets first; two files holding old
  passwords were left out.
- **Moving off your PC, half done** (ADR-063): CI goes to GitHub Actions (free on a public repository) and
  QOR ID to Railway. Railway's database and cache are running; QOR ID waits on your steps below.
- **CGT, not DMRG**, everywhere current.

## Next, in order

1. **Finish the move** after your three steps: I deploy QOR ID on Railway, point `id.qorsync.dev` at it,
   and switch the PC stack off.
2. **You try the onboarding**: claim a name from the bubble, click the glowing notification, read the story.
3. **Selling in the launcher**: Sell publishes to the chain, and Buy appears on a card.
4. **The indexer** — *a service that reads the chain so everyone sees the same listings*.
5. **Nesting and levels** for assets; then the card's holographic look.

## What only you can do

1. **Unlock your GitHub account.** *CI: the robot that checks every change.* It can't run at all: GitHub
   says "your account is locked due to a billing issue", the real cause of every failed run since
   21 September. Settings → Billing and plans.
2. **Paste two secrets into Railway**: open `%LOCALAPPDATA%\qor-ops\railway-qor-auth-secrets.txt`, add
   both lines under Railway → demiurge → qor-auth → Variables, then delete the file.
3. **Copy your account over**: in PowerShell run `& "$env:LOCALAPPDATA\qor-ops\restore-to-railway.ps1"`.
   It asks for the Postgres password (Railway → Postgres → Variables).
4. **Revoke the old SSH key**, if you have not: ED25519, `admin@pleroma`,
   `SHA256:+BzEaLt1Mjurz+jp8b+SIT7yCdz/pgqQuAQCjjwccEA`.
5. **Rotate the nine credentials** in `SECURITY.md` (they're only in the private archive now).
6. **The 15% for selling**: what it's a share of, where it goes (no treasury yet), and who holds dollars.
7. **Deposit amounts** (U-14), **Q-19 and Q-20** before the freeze, and **ADR-043 and 044** (Proposed).
8. **Say what four things are:** Demiurge Exchange, QOR Wallet, relays, agentic synchronisation.

## What it costs per month

**Railway: expected about $5–15 a month** for sign-in, its database and cache (usage-based; an estimate,
not an invoice). GitHub Actions is free on a public repository.
