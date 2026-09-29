# Agent key custody in QOR ID

**Status:** Decided and implemented, 14 September 2026.

> **Read §1, §2 and §6 as history, not as a live report.** They are written in the present tense and
> describe QOR ID generating, storing and returning agent private keys. **None of that is true any
> more.** ADR-014 decided that QOR ID authorises agent keys and never creates them; migration 011
> removed the stored keys; `services/qor-auth/src/handlers/agents.rs` states at the top that it never
> stores or returns a private key, binds the controller from the verified token, and scopes every agent
> route to its controller. The sections are kept as written because they are the record of what was
> wrong and why it mattered.
- **Decision.** The owner took the second reading of ADR-010 (§3) and option A (§5), recorded in
  [ADR-014](../decisions/ADR-014-agent-keys-authorised-not-created.md).
- **Containment.** The fastest route to zero server-held private keys: registration now requires the agent's
  own public key with proof of possession, and migration 011 removes every stored key.
- **Not yet built.** The controller's vault signing each authorisation, part of option A, is launcher
  track L5.

The rest of this document is kept as the record of the proposal, written as item five of the security
track (DIRECTION §7.1).

Labels: **V** means verified in the code for this document; **I** means inferred.

---

## 1. What happens today

`POST /api/v1/agents/register` (`services/qor-auth/src/main.rs:211`, behind `require_auth` at `:216`)
does the following in `services/qor-auth/src/handlers/agents.rs`. **V** throughout.

1. It draws 32 random bytes as the agent's private key (`:98`).
2. It stores the hex of those bytes as the agent's **public** key, `primary_pubkey` (`:99, :130`).
3. It builds an "address" from the first 40 hex characters of the private key (`:100`).
4. It stores an Argon2 hash of the private key as the agent's password hash (`:103`).
5. It stores no controller: `controller_id` is always `None` (`:105-107`).
6. It returns the private key to the caller as `pubkey` (`:147`).

The neighbouring agent endpoints also lack checks. Listing returns every agent in the database
(`:199-203`). Updating capabilities and deactivating an agent check no ownership (`:246-276`).

Capabilities and the spending limit are database columns (`migrations/007_agent_accounts.sql:16-23`).
Nothing enforces them.

## 2. How exposed it is

- **Databases that have applied migration 009.**
  - Every registration fails at the insert. Migration 009 requires `on_chain_address` to be `0x`
    followed by 64 hex characters (`migrations/009_fix_on_chain_address.sql:49`), and the handler
    writes 42 characters.
  - A private key is still generated on every request and then discarded. None is stored or
    returned. **V** for the constraint and the value; **I** that no other path inserts agents.
- **Databases that ran migration 007 but not 009 when an agent was registered.**
  - Before 009 the column held 64 characters, so the 42-character value fitted. The insert succeeded,
    the private key was stored in `primary_pubkey`, and it was returned.
  - When 009 later ran, it rebuilt `on_chain_address` as `0x` plus `primary_pubkey` for every 64-character
    public key (`009:31-35`). It therefore copied those agents' private keys into a second column. **V**
    for the migration logic; **I** that such rows exist anywhere.
- **The only client in the repository** is the frozen `packages/agent-foundry`. It calls the endpoint
  without an `Authorization` header, so it is refused before the handler runs. It also generates and
  returns raw private keys of its own (`packages/agent-foundry/src/agent.ts:509-542, 641-651, 695`).
  These points come from the read-only evidence sweep of 14 September and were not re-read for this
  document.
- **Whether any agent rows exist in any database: Unknown.** Check with:

  ```sql
  SELECT count(*) FROM users WHERE account_type = 'agent';
  ```

## 3. Why this needs a design, not a fix

Removing the generation leaves registration without a key, and something has to replace it. That
replacement decides who creates an agent's key, how its authority is bound to a user, and how the
authority is limited and revoked. Those are exactly the questions ADR-010 and the migration
inventory's Q-9 leave to the owner.

There is also a wording conflict to resolve. ADR-010 says *QOR ID mints a scoped, revocable session key
for an agent*. "Mints" can be read two ways:

- **QOR ID generates the key.** Then QOR ID holds the secret at least momentarily and must hand it to
  the agent. That is the defect this item removes.
- **QOR ID issues an authorisation for a key the agent generated.** Then QOR ID never sees a secret.

Choosing between the readings changes ADR-010, so it is not done here.

## 4. Requirements any design must meet

These come from ADR-010, the migration inventory (F-Q3, F-Q6, Q-9) and the defects above.

1. `qor-auth` never generates, stores, logs or returns an agent's private key.
2. An agent is bound to the authenticated user who created it. The controller comes from the verified
   token, never from the request body.
3. Only the controller can list, change or revoke its agents.
4. Capabilities are enumerable per operation. Spend caps are enforced by the protocol, which in the end
   means on chain; a database column is not protocol enforcement.
5. Any single agent can be revoked without affecting the user's other agents or the user's own keys.
6. Every signature involved is domain-separated, so a registration or grant signature can never be
   replayed as a transaction (inventory F-Q6).
7. Addresses are valid accounts (`0x` and 64 hex characters today; the Polkadot SDK format after Q-7).
8. The design carries onto the Polkadot SDK chain unchanged in principle. Only the enforcement point
   moves: from `qor-auth` to a pallet or `pallet-proxy` (inventory §3.4).

## 5. Options

| Option | How it works | For | Against |
| --- | --- | --- | --- |
| **A. Agent-held key, QOR ID-issued grant** | The agent generates its keypair where it runs. Registration submits the public key and a signature over a domain-separated challenge, proving possession. The controlling user's launcher vault signs a grant naming the agent's public key, capabilities, spend cap, expiry and a nonce. `qor-auth` stores the grant, never a key. Revocation marks the grant revoked; on the new chain it becomes a `remove_proxy` or its custom equivalent. | QOR ID never touches a secret. Matches the delegation model the inventory recommends (Q-9, option A). Works for agents anywhere: local, remote, hosted. | Agents must manage their own key storage. Needs a grant format and a signing flow in the launcher. |
| **B. Launcher-derived agent key** | The launcher derives a separate key per agent from the user's vault on a dedicated hardened path, and hands it to a local agent process. QOR ID records the public key and the grant. | Agent keys are recoverable from the user's recovery phrase. No server-side secret. | The secret still leaves the vault, into the agent process. It only works for agents on the user's own machine. It ties agent keys to the user's phrase, which cuts against "the agent never holds the user's identity" (I). |
| **C. Custodial signing** | QOR ID holds agent keys in a hardware security module or key management service and signs on the agent's behalf, under policy. | Simplest for agent developers. | Custodial: a single place where every agent key lives. It contradicts this item's instruction that QOR ID stop storing agent keys. Carries regulatory weight. |

**Recommendation: A.** It is the only option in which no Demiurge service ever holds an agent secret,
and it lines up with the recommended delegation model for the migrated chain.

## 6. Containment until the design lands

These are for the owner to choose. None has been done.

1. **Disable the agent routes.** Remove or refuse `/api/v1/agents/*` until the chosen design is built.
   This stops the generation code running at all, and closes the missing ownership checks on list,
   update and deactivate.
2. **Leave the routes as they are.** On databases with migration 009, registration already fails before
   anything is stored. The generation code stays in the source, and the other endpoints stay unchecked.
3. **Clean existing data.** Wherever the count in §2 is not zero:

   ```sql
   UPDATE users
   SET primary_pubkey = NULL,
       on_chain_address = NULL,
       password_hash = '!disabled: agent key was server-generated',
       status = 'inactive',
       updated_at = NOW()
   WHERE account_type = 'agent';
   ```

   The agent's key was exposed to whoever held the registration response and to anyone with database
   access, so treat any value it controlled as compromised.

## 7. Decision needed

1. Which reading of "mints" in ADR-010 is intended. Option A needs the second reading. The answer is
   recorded by amending ADR-010 through a new ADR.
2. Which option in §5.
3. Which containment in §6, and whether to run it now.

Found during the M1 audit of the custom chain and its services. The requirements in §4 carry forward to
QOR ID's agent rails on the Polkadot SDK chain (ADR-010, ADR-013).
