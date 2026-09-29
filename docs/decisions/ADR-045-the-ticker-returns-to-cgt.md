# ADR-045: The ticker returns to CGT

**Status:** **Accepted, 21 September 2026, by the project owner's instruction.** The name was always
Creator-God Token; the three-letter symbol returns to `CGT`.

**Supersedes:** [ADR-034](ADR-034-ticker-dmrg.md), which changed the ticker to `DMRG` on 17 September
2026. ADR-034 is not edited. It remains the record of why the change was made and what the research
found, and every risk it identified is carried forward here as an accepted risk.

**Also supersedes:** requirement **R-4** in
[`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md), which says in terms that the
Substrate implementation writes `DMRG` into names from the start and that "there is no second rename
pass". This record is that second pass, taken deliberately.

## Context

ADR-034 moved the ticker from `CGT` to `DMRG` four days ago, for three stated reasons: a collision with
Curio's CGT, a March 2024 exploit attached to that symbol, and aggregator symbol resolution favouring a
higher-ranked asset. Nothing was listed, nothing was published, and no holder existed — which is
precisely why it was the right moment to change it, and is equally why it is still a cheap moment to
change it back.

The owner has decided to return to `CGT`. This record exists because a decision is reversed by a new
record that says so, never by editing the old one (AGENTS.md §3).

## What favours CGT now

Two things that were not weighed in ADR-034, both of which point the other way:

1. **`DMRG` inherits a trademark exposure that `CGT` does not.** ADR-034's own clearance research found
   `DEMIURGE` live in Nice classes 9, 41 and 42 — a US application by Demiurge Studios, Inc. past its
   notice of allowance, and a composite mark of Demiurge Technologies AG — and recorded that exposure as
   consciously carried, adding `public-release.name-clearance` as a gate criterion. `DMRG` is Demiurge
   compressed, which was its stated virtue: it points at the ecosystem. It therefore points at the
   trademark too. `CGT` is the initialism of Creator-God Token and carries none of that.
2. **The identifiers never left `cgt`.** ADR-034 decision 5 deliberately kept `SPARKS_PER_CGT`,
   `format_cgt`, `parse_cgt`, `amount_cgt` and the launcher's `cgt_*` commands, on the reasoning that
   they lived in code the Substrate implementation would replace wholesale. That reasoning has since
   expired for the launcher, which is active scope and is not being replaced. So the codebase has been
   carrying `cgt` identifiers under a `DMRG` symbol for four days, and returning the symbol to `CGT`
   ends the divergence rather than creating one.

## The research pass, 21 September 2026

A bounded pass was run: the status of Curio's CGT and any other token on the symbol; whether the
aggregators still resolve `CGT` to another asset; trademark screening for `CGT` and `Creator God Token`
in classes 9, 36 and 42; and the SS58 registry, Talisman and SubWallet.

**Findings, every one either already recorded by ADR-034 or more favourable than it recorded:**

- **Curio's CGT has decayed sharply.** Curio Governance migrated to a new contract address on 22 August
  2026; CoinCarp shows it listed on no exchange, centralised or decentralised; it is marked *Untracked*
  for inactivity, with a market capitalisation around $56,000 at the end of August 2026. The collision
  ADR-034 weighed is materially smaller than it was.
- **`CGT` is shared by several assets** — Coin Gabbar Token, Curio, CAGE Governance, CGTcoin, Crypto
  Gaming Token, Cardano Gamers. CoinMarketCap states plainly that a ticker may be shared. This is the
  same aggregator-resolution risk ADR-034 recorded, with more instances behind it.
- **The SS58 registry carries `CGT`.** One entry: network `curio`, prefix 777, symbols `["CGT"]`. `DMRG`
  has no entry. Talisman's chain data carries Curio and Curio Testnet; `DMRG` is absent there too.
- **No trademark blocks it.** One live US registration on the string (Reg. 6166854, serial 88414055) is
  a **stylized design mark** — a red C, a grey G within it, a smaller red T — owned by a gaming and ATM
  business, covering the operation and leasing of gaming equipment and cash-handling machines. It is not
  a standard-character word mark and it is not in class 9, 36 or 42. No EUIPO registration for `CGT` was
  found in those classes. **No mark on "Creator God Token" was found anywhere.**

## The accepted risks, in the owner's name

These are ADR-034's findings. Returning to `CGT` accepts every one of them.

1. **A Substrate chain already uses `CGT`.** Curio is in the Parity SS58 registry at prefix 777 and in
   Talisman's and SubWallet's shipped chain data. A wallet showing both chains will show two assets
   called CGT. **This is the sharpest risk and it is knowingly taken** — it satisfies the literal wording
   of a blocker condition, and it is accepted here because ADR-034 recorded it four days ago and the
   owner has weighed it since.
2. **Aggregator symbol resolution.** A search for "CGT" on CoinGecko or CoinMarketCap resolves to
   whichever asset ranks higher, not to Demiurge.
3. **The March 2024 exploit attached to the symbol.** Recorded by ADR-034; nothing in this pass changes
   it.
4. **Symbol ambiguity generally.** At least six assets use `CGT` today.

None of these is a legal obstacle. All of them are discoverability and confusion costs, and they are
accepted in exchange for shedding the `DEMIURGE` trademark adjacency and ending the identifier
divergence.

## Decision

1. **The ticker is `CGT`.** The name remains Creator-God Token, unchanged by both records.
2. **The swap covers what a person sees**, as ADR-034's did: the chain's declared symbol and anything
   pinning it, the launcher's `SYMBOL` constant, its hard-coded fallbacks, its user-facing copy and its
   pinning test, `GATES.toml`'s prose, `.cursorrules`, and every current document that names the ticker.
3. **The chain and the launcher change in one commit.** The launcher's `matches_the_chain_denomination`
   test hand-mirrors the chain's `TOKEN_SYMBOL`; changing either alone turns the host suite red. That
   coupling is deliberate and is the reason for the single commit.
4. **`docs/economics/DMRG.md` returns to `docs/economics/CGT.md`** by `git mv`, with every reference
   repointed.
5. **The `cgt_*` rename is cancelled.** ADR-034 decision 6 required the Substrate implementation to use
   `DMRG` in identifiers, commands, RPC names and constants, with no second rename pass. Since the
   symbol returns to `CGT`, the identifiers that already read `cgt` are now correct, and there is nothing
   to rename. Requirement R-4 is met by leaving them alone.
6. **`registration-mints-nothing.mjs` keeps both markers.** That test asserts a registration response
   mentions no currency name at all. It checks every name the currency has answered to, and it keeps
   checking both, so that a future rename in either direction cannot make it pass while testing nothing.
7. **`public-release.name-clearance` is unchanged.** It concerns the project name `DEMIURGE`, not the
   ticker, and the exposure it was created for is untouched by this record — it is, if anything, the
   reason this record exists.

## Consequences

- **The documents that record the move to `DMRG` keep their text.** ADR-034, the change-log entries in
  `GATES.toml`, and dated records such as `RECONCILIATION.md` all continue to say `DMRG`, because they
  are records of what was true when they were written.
- **ADR-034's link to `docs/economics/DMRG.md` now points at a moved file.** It is deliberately not
  fixed: an ADR is not edited. The file is at `docs/economics/CGT.md`.
- **The chain's `denomination.rs` prose changes meaning.** It currently explains that the ticker was
  changed *from* `CGT` because that symbol is Curio's. That sentence is replaced by one pointing at this
  record, since the reason no longer governs.
- **Nothing on any wire breaks.** No chain is deployed, no SDK is published, nothing is listed, and no
  account holds anything. The QOR ID profile payload's `cgt_balance` key is unaffected — it already read
  `cgt` and continues to.
- **This is the second ticker change in five days.** That is worth stating plainly rather than leaving
  for someone to notice. Both were free because nothing exists to migrate; neither would be free after
  M5.1 freezes the wire format or after anything is listed. **A third change should not happen**, and if
  one is ever proposed, the cost to weigh is not the rename — it is the credibility of a symbol that has
  moved twice.
