# ADR-017: A password-only account has no chain identity until it proves a key

**Status:** Accepted, 15 September 2026, by the project owner, who took the recommendation in the migration
inventory.
**Resolves:** migration inventory question Q-16, set out in
[`MIGRATION_INVENTORY.md`](../architecture/MIGRATION_INVENTORY.md) F-Q8.
**Follows:** [ADR-014](ADR-014-agent-keys-authorised-not-created.md), under which QOR ID authorises keys and
never creates or holds them, and [ADR-001](ADR-001-innovation-budget.md), which keeps key custody boring.

## Context

QOR ID has three kinds of account, and two of them already tie chain identity to a key the holder proved.
- **Keypair accounts and agents.** The account's address is its own Ed25519 public key, proven by a
  signature over a single-use challenge.
- **Key links.** `link-keypair` and `link-wallet` bind a key the holder proves in the same way, and set the
  address to `0x` followed by that key (`link_verified_key` in `services/qor-auth/src/handlers/auth.rs`).
- **Password-only accounts are the exception.** Registration derives an `on_chain_address` as SHA-256 over
  `demiurge:address:` followed by `username#discriminator:timestamp` (`hash_to_address` in
  `services/qor-auth/src/services/auth_service.rs`, called from `register`). Verified (repo).
  - No key corresponds to that address, so anything sent to it could never be moved (Inferred from the
    derivation).
  - It passes the format constraint of migration 009, and it is returned at registration and in the
    profile, so every interface shows it as a real account.

The inventory set out four options:
1. no chain identity until the user proves a key;
2. a key QOR ID generates and holds on the user's behalf;
3. today's keyless derived address;
4. a chain-side account controlled through an authorisation QOR ID attests to.

## Decision

**A password-only account has no chain identity until the user proves they hold a key.** QOR ID never holds
a key on anyone's behalf: the same principle as ADR-014, now applied to people as well as agents.

- A password-only account has no `on_chain_address` until a key link binds a key the holder has proven.
- Once set, the address is exactly that proven key. It is never derived, generated or assigned.
- Nothing is sent, granted or paid to an account with no proven key, and the chain never treats a derived
  address as anyone's account.

## Alternatives rejected

- **A key QOR ID holds (option 2).** It would make QOR ID a custodian of every password account's assets
  and a single point of compromise for all of them. That reverses ADR-014 and breaks ADR-001.
- **The keyless derived address (option 3).** It can receive and never send, so anything sent to it is lost,
  while it looks like a real account everywhere. It is not viable for anything of value.
- **A chain-side account QOR ID attests to (option 4)** is not taken now. It needs custom,
  security-sensitive runtime design, and it would make a QOR ID attestation something the chain trusts,
  which touches R-3, Q-9 and Q-10. This decision does not close it off: an account that wants recovery or
  sponsorship could later be given one on top of a proven key, through its own ADR.

## Consequences

**Not implemented yet.** The change lands with the Substrate work: the base chain (M3) and the launcher's
address display (L3.2). Until then the current behaviour stays, and a derived address is treated as unusable,
as F-Q8 says.

When it lands, the current account-creation path changes as follows:
1. **`register`** stops calling `hash_to_address`. A password-only account is created with no
   `on_chain_address`, and registration and the profile report no address for it.
2. **`AuthService::hash_to_address`** is removed, so nothing can derive an address again.
3. **A migration clears the derived addresses already stored.** On today's write paths, a derived address is
   one set on a row with no `primary_pubkey`: every key link sets `primary_pubkey`, and keypair and agent
   accounts have one from creation (Inferred; confirm against the data when the migration is written).
4. **Key links stay the only route to a chain identity** for a password-only account. They already require
   proof of possession, and already set the address to the proven key.
5. **Clients handle an account with no address.** Any flow that pays, grants or sends to an account requires
   a proven key first, and the launcher offers to create one in the vault.
6. **Address display on the new chain** follows whatever Q-7 decides.

People who use only the web need one onboarding step before they hold anything on chain: creating a key,
in the launcher's vault or later in another wallet. That is the cost of keeping QOR ID out of custody.
