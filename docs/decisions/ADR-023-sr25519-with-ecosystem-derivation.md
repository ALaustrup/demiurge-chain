# ADR-023: Sr25519 accounts, derived the way the ecosystem derives them

**Status:** Accepted, 15 September 2026, by the project owner.
**Resolves:** migration inventory question Q-6 ([`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) F-Q4).
**Amends:** [ADR-013](ADR-013-polkadot-sdk-migration.md) on one point. ADR-013 says the launcher's chain client is rebuilt
and its vault is not. The vault's custody and sealing are unchanged, but **its key derivation changes.**
**Follows:** [ADR-009](ADR-009-universal-minting.md) (third-party wallets and SDKs support Demiurge from the start).

## Context

- **The launcher today.** Its vault seals a 24-word BIP-39 phrase with Argon2id and XChaCha20-Poly1305. It derives
  Ed25519 keys by SLIP-0010 at `m/44'/369'/account'/0'/index'`, from the BIP-39 seed
  (`tools/qor-launcher/src-tauri/src/vault/derive.rs`; Verified repo).
- **The ecosystem's derivation,** checked at `polkadot-stable2606-1` on 15 September 2026:
  - **sp-core** turns a phrase into a key from the phrase's **entropy**, not its seed: PBKDF2-HMAC-SHA512 with the
    salt `"mnemonic"` followed by the password, 2048 rounds, keeping the first 32 bytes as the Sr25519 mini secret
    (`substrate/primitives/core/src/crypto.rs`, `substrate/utils/substrate-bip39/src/lib.rs`).
  - **Paths** use `//hard` and `/soft` junctions, and `///password` supplies the password.
  - **Polkadot.js** does the same (`@polkadot/util-crypto` `mnemonicToMiniSecret`).
- **SLIP-0010 cannot produce the same keys.** Its seed is PBKDF2 over the phrase's text, not its entropy, and it then
  applies HMAC-SHA512 keyed `"ed25519 seed"` and walks a hardened path. Even sp-core's own Ed25519 derivation would
  not reproduce the launcher's keys.

ADR-009 needs the same recovery phrase to open the same accounts in Polkadot.js, Talisman, Nova and the launcher.

## Decision

**Accounts use Sr25519 keys, derived from the recovery phrase exactly as sp-core and Polkadot.js derive them.** One
scheme, chosen now. **No dual-scheme compatibility path is built.**
- **The launcher's first account is the phrase with no derivation path.** That is the account the ecosystem's wallets
  open when a phrase is imported. This is Verified for Polkadot.js, and Inferred for Talisman and Nova: confirm it
  against each before the launcher's address work (L3.2) ships.
- **Further accounts** use hard junctions, in a form chosen and recorded in that launcher work.
- **The vault's optional BIP-39 passphrase** becomes the Substrate password (`///password`), so a phrase with a
  passphrase opens the same accounts everywhere.

## Consequences

**This is the cheapest this change will ever be. Nobody holds anything yet.**

1. **The launcher's derivation changes.** `vault/derive.rs` is replaced by the ecosystem's derivation, starting from the
   phrase's entropy. The vault already keeps the phrase, so nothing a user has is lost. Sealing, custody and unlocking
   are unchanged (ADR-016).
2. **Accounts derived by the launcher so far do not carry over.** The same phrase opens different accounts under the new
   scheme. Nothing of value is held on any network, and no devnet balance is migrated.
3. **QOR ID's key verification changes.** Keypair sign-in and registration, the two key links, and agent registration
   (ADR-014) verify Sr25519 signatures instead of strict Ed25519. They verify under the signing context sp-core uses
   (Inferred to be `b"substrate"`; confirm when the code is written).
   - **Unchanged:** the challenge's domain tag, `demiurge:qor-id:challenge:v1:` (security track item 7).
   - **Already bound Ed25519 keys and agent registrations stop verifying.** They must be linked or registered again,
     together with ADR-024's address migration.
4. **Requirement R-1 still stands.** The runtime's `MultiSignature` accepts Ed25519 signatures from any Ed25519 signer,
   so strict Ed25519 verification (refusing small-order keys and non-canonical signatures) remains a chain requirement.
   Sr25519 works in a prime-order group with no small-order public keys (Inferred; confirmed when its tests are
   written).
5. **The Ed25519 forgery test stays.** `docs/GATES.toml` `alpha.qor-auth-tests` requires
   `a_forged_signature_for_a_small_order_key_is_rejected`. **The owner decided on 15 September 2026 to keep it:**
   - the runtime still accepts Ed25519 signatures, even once QOR ID verifies Sr25519 only, so the test still covers
     something real;
   - removing it would be loosening, which the owner did not approve.

   QOR ID's move to Sr25519 adds Sr25519 negative tests alongside it, and does not replace it.
6. **The arrival grant (ADR-016)** signs QOR ID challenges with the Sr25519 key. Its reasoning is unchanged.
7. **Agents and the MCP server** (ADR-010, ADR-014) use Sr25519 keys through standard Substrate keyrings.
8. **The frozen wallet extension's own scheme** (inventory F-Q4) is not carried.

## Alternatives rejected

- **Ed25519 with the launcher's SLIP-0010 path.** No other wallet opens those accounts from the phrase, which fails
  ADR-009.
- **Ed25519 with sp-core's derivation.** Hard junctions only. Wallets default to Sr25519, so a phrase imported elsewhere
  would open a different account unless the user knew to choose Ed25519.
- **Both schemes, with a compatibility path.** Two accounts per phrase, a choice to explain to every user, and twice
  the verification surface. The owner ruled it out.
