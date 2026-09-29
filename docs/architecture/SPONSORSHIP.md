# Sponsorship: a design proposal (U-4)

**Status:** A proposal for the owner's review, written 15 September 2026. **Nothing here is decided, and no code is
written until the owner decides.** It answers what ADR-029 left open when it chose a sponsor-paid existential deposit:
- how a sponsor is designated;
- what it pays;
- how caps are enforced;
- what stops sponsorship being drained;
- which fee classes exist.

**Decided already:**
- **ADR-029:** a sponsor pays a new account's existential deposit, on standard `pallet-balances` semantics, and the user
  then holds that CGT.
- **ADR-030:** the existential deposit is derived from a stated target, with 100 CGT proposed.
- **F-D7:** sponsored minting covers storage deposits as well as fees.

**Values:** no cap, budget or share is proposed. Those are economic values (OPEN-2, OPEN-4) or operating limits set at M4.
Development networks use placeholders, marked as such.

---

## 1. What the pinned release allows

Checked at `polkadot-stable2606-1` on 15 September 2026 (ADR-022).

| Fact | Where it bites |
| --- | --- |
| An account exists while its **free** balance is at least the existential deposit. Reserved, held and frozen amounts add consumer references and do not count toward it. | A sponsored deposit must stay in free balance. |
| A **freeze** keeps an amount in free balance but makes it immovable. A frozen account cannot be reaped. | The sponsored deposit can be the user's and still not be extractable. |
| `CheckNonce` refuses a sender with no providers. `SkipCheckIfFeeless` removes the fee but provides nothing. | Existence comes first (the deposit), then fees. |
| A proxied call's fee is paid by the delegate. Adding a proxy reserves a deposit from the real account. | Agents need fees; controllers need a reservable deposit (ADR-026). |
| `pallet-nfts` `mint` reserves the item deposit from the **caller**, even when minting to another account. `force_mint` charges the collection owner. `mint_pre_signed` charges the recipient. Only `force_create` makes a collection free of deposits. At the tag, `set_metadata` charges the collection **owner** (its documentation says the signer). | Who pays a deposit is decided by who calls. |

## 2. Rules any design must keep

- **R-3.** Sponsorship moves CGT that already exists. It never creates any. No service outside the chain can make a
  sponsor pay beyond caps the chain enforces.
- **ADR-017.** Only accounts with keys are sponsored. A QOR ID account with no proven key has no chain account.
- **ADR-001.** Account existence stays on standard semantics (ADR-029). What is custom is who pays, not whether an
  account exists.
- **ADR-002 and ADR-006.** Every mechanic names its demand sink. See §8.

---

## 3. Designation: who is a sponsor

**Proposal.**
- **Governance registers each sponsor** (collective origin, ADR-021) through `pallet-sponsorship`, with a policy: which
  classes it pays for (§6), and its caps (§4).
- **Each sponsor has its own pot,** an account derived from the pallet and the sponsor's id. The sponsor funds it by
  ordinary transfer. A sponsor can only ever spend what is in its own pot.
- **The first sponsor is the project's onboarding sponsor.** Its pot is funded by a treasury spend that governance
  approves. The amount is not proposed here.
- **Later sponsors are anyone governance registers.** For example, a game studio paying for its own players (ADR-009).
- **A sponsor names grant signers:** keys allowed to start sponsorship for an account. QOR ID may hold a grant signer for
  the onboarding sponsor. That is QOR ID's own operational key for one bounded role, not a key held for any user
  (ADR-014, ADR-017).
  - A compromised grant signer can spend at most that sponsor's per-period cap, from that sponsor's pot.
  - Governance or the sponsor can revoke it in one call.

**Alternative.** Anyone may register as a sponsor with a bond. It is more open, and it adds a bond and its forfeiture
rules before anyone needs them. Not proposed for the first release.

## 4. Caps, and where they are enforced

All caps live in `pallet-sponsorship` storage and are checked on chain.

| Cap | Proposed rule |
| --- | --- |
| Pot balance | Hard limit. Nothing is paid beyond it. |
| Per-sponsor spend per period | A rolling window in blocks. It bounds the damage from a leaked grant signer. |
| New accounts per period, per sponsor | Bounds farming (§5). |
| Per-account allowance | Deposit: once per account, ever. Fees: a number of sponsored transactions per period. Deposits for minting and proxies: a count per account. |
| Per-transaction fee ceiling | A sponsored transaction whose fee exceeds it is not sponsored. |

**Where the checks run.** For fees, the check runs **when a transaction is validated**, before it enters a block. A
transaction over any cap is not sponsored: the signer pays in the ordinary way if they can, and otherwise it is invalid
and never enters a block. So an exhausted sponsorship cannot be used to fill blocks for free.

## 5. What stops draining

1. **The sponsored deposit is frozen.** Sponsorship transfers the existential deposit from the pot into the new account,
   then places a freeze with a sponsorship reason on exactly that amount.
   - The user holds it: it is in their balance (ADR-029).
   - They cannot move it, so a throwaway account yields nothing to its creator.
   - The account cannot be reaped while frozen.
   - The sponsor cannot take it back either.
   - **Open for the owner:** whether the freeze is permanent, or lifts once the account has made a given number of
     paid transactions of its own.
2. **Deposits paid for minting and proxies return to the pot, not the user,** wherever the release allows the pot to be
   the depositor. See §7.
3. **Per-period and per-account caps** (§4) bound what any number of accounts can take, however they are created.
4. **Grants need a grant signer.** Off-chain checks, such as a QOR ID account with a verified email and QOR ID's own rate
   limits, decide whom to sponsor. The on-chain caps decide how much, and hold even if those checks fail.
5. **Fees are paid only for listed classes** (§6), so a sponsor never pays for an arbitrary call.

## 6. Fee classes

OPEN-4 needs a list of fee classes and a burn share per class. Sponsorship needs a list of which calls a sponsor pays
for. **Proposal: one list serves both,** so the fee handler classifies each call once. The classes, not their burn
shares:

| Class | Calls |
| --- | --- |
| Transfer | CGT transfers |
| Mint | DRC-369 collection creation and minting, metadata and fingerprint |
| Settlement | Sales and licences settled with royalties (ADR-025) |
| Hosting | Mesh payments (later, ADR-005) |
| Agent | Proxied calls under an agent authorisation (ADR-026) |
| Account | Adding or removing a proxy, and linking keys |
| Governance | Collective votes and proposals (ADR-021) |

Burn shares per class stay OPEN-4. A sponsor's policy lists which classes it pays for.

**How fees are paid by a sponsor.**
- **Proposed:** a transaction extension that wraps `ChargeTransactionPayment`. When a call's class is in the sponsor's
  policy and every cap holds, the fee is withdrawn from the sponsor's pot instead of the signer.
- **This departs from standard transaction payment,** so ADR-013 rule 1 needs a written reason. Standard components can
  make a call feeless (`SkipCheckIfFeeless`), but cannot make someone else pay for it. The alternative is below.
- **Alternative: make sponsored calls feeless** with `SkipCheckIfFeeless`, rate-limited per account.
  - For: stays standard.
  - Against: the network absorbs the cost instead of the sponsor, fees reach neither validators nor burn (ADR-004), and
    the rate limit must still be custom.
  - Not proposed.

## 7. Sponsored minting (F-D7)

A new creator mints without holding CGT, so the fee, the collection deposit, the item deposit and the metadata deposits
are all paid.

- **Fees:** the Mint class (§6).
- **Item deposits: the pot pays and gets them back.** `pallet-drc369`'s sponsored mint calls `pallet-nfts` `mint` with the
  pot as the caller and the creator as the recipient.
  - The item deposit is reserved from the pot and recorded as the pot's.
  - When the item is burned, it returns to the pot. Nothing is extractable.
  - The pot must hold the collection's issuer role.
- **Collection deposits: two options, for the owner.**
  - **a. A deposit-free collection** created by `force_create` under `pallet-sponsorship`'s origin, with the creator as
    owner and item deposits still required.
    - The collection's one storage entry is unpaid.
    - The per-sponsor new-collection cap bounds how many exist.
    - The creator then grants the pot the issuer role, in a sponsored call.
  - **b. A collection owned by the pot, with the creator as admin.** The deposit is paid and returned to the pot. But
    `pallet-nfts`, and so every third-party tool, would show the sponsor as the owner.
  - **Proposed: a.** A creator's collection shows the creator as owner everywhere, and the unpaid storage is bounded.
- **Metadata deposits** fall on the collection owner at the pinned release, which is the creator. So DRC-369's content
  fingerprint and fields live in `pallet-drc369` storage, whose deposits the pot pays. The creator's own `pallet-nfts`
  metadata is optional and unsponsored.
  - **Open for the owner:** whether that is acceptable, or sponsored metadata is needed.
- **Proxy deposits for agents** are reserved from the controller (ADR-026). They return to the controller when the proxy
  is removed, so sponsoring them is extractable once per add-and-remove cycle.
  - **Proposed:** a sponsor tops up the reservation, and each account may have a small, fixed number of sponsored proxy
    deposits in its lifetime.

## 8. Which demand sink this belongs to

ADR-006 requires every mechanic that consumes CGT to name its sink, or justify itself as a sixth.

**Proposed: sponsorship is not a sixth sink. It is a cost sponsors pay to reach the existing ones.**
- A studio or the project spends CGT so that its users can reach access gating (licences, unlocks) and Mesh hosting.
- **Spend test:** a sponsor would still need CGT to onboard its users even if CGT could never be traded.
- The fees it pays feed ADR-004's burn and validators, like any fee.
- The deposits it pays are held, and returned where possible.

**Open for the owner:** confirm the classification.

## 9. What is left to decide

1. The designation model (§3): governance-registered sponsors, with grant signers.
2. Whether the frozen deposit is permanent (§5).
3. The fee-class list, shared with OPEN-4 (§6).
4. A sponsor-paid fee extension against feeless calls (§6).
5. Collection deposits: option a or b (§7).
6. Metadata sponsorship (§7).
7. The sink classification (§8).
8. The onboarding sponsor's funding: a treasury spend; its amount is an economic value.

When decided, this becomes an ADR, and roadmap item M4.4 builds it.
