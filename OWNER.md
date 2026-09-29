# Where Demiurge stands

For Andrew. One page. Rewritten at the end of every session — if it is stale, the session is not done.

## What Demiurge is

A blockchain where people who make things get paid when their work is used, and a desktop application
that is how anyone touches it. The currency is **CGT**, and it exists to be spent, not held. Six products
are planned on top of it, all sharing one sign-in, one asset format and one currency.

## What exists and works today

All of it runs on your PC. Checked on 29 September unless it says otherwise.

- **The chain.** Produces blocks and finalises them — *finalise: agree a block can never be undone* —
  holds assets, sends them, and **since today sells them for CGT and pays royalties**. Two machines running it
  agree. **96 tests pass.**
- **Sign-in (QOR ID).** Accounts, email, backup codes, admin controls. **125 tests passed** when last run
  (21 September); unchanged since.
- **The launcher.** Your keys, sign-in, sending CGT, minting an asset from a project, an Inventory of cards,
  sending assets, a listing you can draft, and Projects, which does the everyday saving work. **162 tests
  pass**, and its three tests against a running chain passed today on the new chain.

**What it cannot do yet:** charge a fee, create new CGT, **show a listing to anyone who doesn't already know
the asset**, sell from the launcher, or let an asset nest or change state.

## What changed today (29 September)

- **Royalties** (ADR-061). A creator sets who gets a share of every sale of their work (up to eight
  people) and a **remix share** — what a sale of someone's remix of it owes them. An asset can be listed at a
  price in CGT and bought; one transaction pays the remix's original, then the royalties, then the seller.
  Tried live: a 1,000 CGT sale paid the royalty holder 100 and the seller 900; a remix's 200 CGT sale sent 10
  back to the original's side. **No platform cut is taken** — your 15% idea is still undecided.
- **Your ruling on the two royalty choices** (ADR-062): a creator can **correct their terms any time they
  still hold the work**, never once someone else does; once the work is remixed, its remix share can go down,
  never up. A remix pays its **direct** original only, which keeps every sale fast however long the chain.
- **CGT, not DMRG.** The code already said CGT; three documents still said DMRG in places, now fixed.
  DMRG stays only where a record says what happened on 17–21 September.

## Next, in order

1. **You try the onboarding**: claim a name from the bubble, click the glowing notification, read the story.
2. **Selling in the launcher**: Sell publishes to the chain instead of a draft, and Buy appears on a card.
3. **The indexer** — *a service that reads the chain so everyone sees the same listings*.
4. **Nesting and levels** for assets (the other half of this roadmap item).
5. **The card's holographic look**, then pictures and a 3D view.
6. **Get CI green.** *CI: the robot that checks every change.* Five of six parts pass; one more run is owed.

## What only you can do

1. **Tell me how CI's fifth run went**, or I'll read it at `https://ci.qorsync.dev` next session.
2. **Revoke the old SSH key**, if you have not: ED25519, `admin@pleroma`,
   `SHA256:+BzEaLt1Mjurz+jp8b+SIT7yCdz/pgqQuAQCjjwccEA`.
3. **Rotate the nine credentials** in `SECURITY.md`, and say whether the two files holding them are kept.
4. **Commit today's work** when you're happy; it is not committed (`HANDOFF.md` §7 says how it splits).
5. **The 15% for selling**: what it's a share of (before or after royalties), where it goes (no treasury
   yet), and who holds dollars (a legal question).
6. **Set the deposit amounts** (U-14) whenever ready; placeholders are fine until then.
7. **Q-19 and Q-20**, two format questions before the freeze; **ADR-043 and 044** are still Proposed.
8. **Say what four things are:** Demiurge Exchange, QOR Wallet, relays, agentic synchronisation; and
   confirm the selling categories.

## What it costs per month

**Nothing.** QOR ID and CI run on your PC through Cloudflare's free plan. `docs/architecture/HOSTING.md`
estimates a real deployment at about **$50–70 a month**. It is an estimate, not an invoice.
