# ADR-055: The vault opens with Windows Hello alone

**Status:** Accepted, 28 September 2026, by the project owner. **Superseded the same day by
[ADR-056](ADR-056-no-lock-screen.md)**: the vault's key moved to the keychain and the lock screen went. Its vaults
move with one last Hello gesture.
**Supersedes:** [ADR-054](ADR-054-unlocking-with-windows-hello.md), whose Windows Hello was an opt-in second copy
beside a passphrase. Its mechanism, a TPM key's deterministic signature as the sealing secret, is kept.
**Amends:** [ADR-016](ADR-016-sign-in-with-unlock.md). ADR-016's decision stands: one approval opens the vault
and signs in to QOR ID. That approval is now the Windows Hello gesture, not a typed passphrase.

## Context

The owner, on 28 September 2026: "EVERY SINGLE TIME i attempt to access the Qor Launcher I run into problems
with my password or the vault key … this whole two password shit is not okay." They asked for the vault key to
be removed from the launcher entirely.

Two things were behind it.

- **ADR-054 did not remove the passphrase.** Hello was off by default, turned on in Settings, and turning it on
  asked for the passphrase. Until someone found that panel, every arrival was the passphrase screen, as before.
  To the owner, Hello "isn't implemented".
- **The launcher still offered a second secret.** When QOR ID could not be reached after an unlock, the Gate
  showed its sign-in screen with *Use a password instead*, a QOR ID password that a vault-made account never has.

The keys themselves cannot go. The vault holds the recovery phrase behind the keys that prove a QOR ID and sign
every transaction. What can go is the secret a person types to open it. Three ways to open it with no passphrase
were put to the owner: Windows Hello only; a silent unlock sealed to the Windows account (DPAPI, Windows'
per-user encryption); or both, with Hello as the default. **The owner chose Windows Hello only.**

## Decision

1. **The vault is sealed under Windows Hello, and nothing else.** Creating or restoring a vault never asks for a
   passphrase. `vault.qor` holds `"unlock": "windows-hello"`, a 32-byte salt and the recovery phrase sealed
   (Argon2id, then XChaCha20-Poly1305, as before) under the Hello key's signature of the domain-tagged challenge
   ADR-054 defined. The signature never touches disk. There is no `vault.hello` beside it and no second copy.
2. **One key per Windows account, kept.** Sealing makes the key "Demiurge QOR Launcher vault" only if the account
   has none, so a vault set aside under it still opens with it. ADR-054 replaced the key each time it was turned on.
3. **Sealing checks the seal.** Hello is asked to sign the challenge twice; if the two signatures differ, nothing is
   written. ADR-054 relied on RSA PKCS#1 v1.5 signatures being deterministic, which no person had confirmed on a
   real device. As the only seal, a wrong assumption would make a vault that never opens again. So creating a vault
   asks Windows two or three times, once, and every unlock after that asks once.
4. **Unlocking is one Hello gesture.** The Gate asks it once on arrival, and a cancel is not asked again on its own.
   The gesture is ADR-016's approval: it opens the same arrival grant, for the same five minutes, for QOR ID
   challenges only. Every transfer, trade, mint, endpoint change and test run still asks in its own host dialog (L1.4).
5. **Revealing the recovery phrase asks Hello again**, for the reason it asked for the passphrase again: an open
   session is not proof that it is fine to print the phrase now.
6. **The recovery phrase is the only way back.** If Windows loses the key (a reset Windows PIN removes Hello keys)
   or the device is new, the person restores from the phrase; the old vault is set aside, never deleted.
7. **A passphrase vault from before this decision moves once.** The locked status reports it, and the Gate goes
   straight to a screen that asks for the old passphrase one last time, reseals the phrase under Hello, and sets the
   passphrase file aside. If an ADR-054 copy belongs to that file, Hello moves it with no passphrase at all.
   Restoring from the recovery phrase also works.
8. **The launcher has no password sign-in.** The Gate signs in to QOR ID only with the vault's key. When QOR ID cannot
   be reached, it says so and offers to try again or change the network, never a password. The host's `qor_login`
   command is left in place, unused by any screen.
9. **Windows only.** On other platforms no vault can be created or opened until a counterpart (Touch ID, the Secret
   Service) is decided. Only Windows installers of the launcher have been built.

## Why this does not weaken security

- **A copied `vault.qor` opens nothing.** Without this device's TPM key and the person's gesture it is ciphertext,
  as under ADR-054. That is what still rules out a plain key file.
- **There is no longer a passphrase to guess offline.** Under ADR-054 a stolen `vault.qor` could be attacked with
  a GPU at the passphrase's strength. Now the secret is a 2048-bit RSA signature that only the TPM can make.
- **Someone at an unlocked Windows session still needs the person.** Hello asks for a face, fingerprint or PIN each
  time, which is what ruled out the silent DPAPI unlock.
- **What remains is the Windows PIN.** Hello falls back to it. It is rate-limited by the TPM and bound to this
  device, which a passphrase guessed offline was not.
- **The trade the owner accepted:** losing Hello's key means restoring from the recovery phrase, and there is no
  passphrase to fall back on. The phrase was always the real backup; the passphrase only ever opened this device.

## Alternatives considered

- **DPAPI, opening silently when the person is logged in to Windows.** Offered; not chosen. It opens for any
  program running as the person, with no one present.
- **Both, Hello by default with a silent switch in Settings.** Offered; not chosen.
- **Keeping ADR-054 and turning Hello on by default.** Rejected: it keeps a passphrase that must be set at creation
  and typed to turn Hello on, which is the friction the owner asked to remove, and a second copy to keep in step.

## Consequences

- `vault/hello.rs` defines the vault file (`HelloVault`), `Presence::ensure` in place of `enrol`, and reads
  ADR-054's `vault.hello` only to move it. `vault/mod.rs` seals, opens, restores and exports through Hello, and
  `move_to_hello` moves a passphrase vault. `VaultStatus::Locked` carries `passphrase`.
- The launcher's commands are `vault_create(phrase)`, `vault_restore(phrase)`, `vault_unlock()`,
  `vault_move_to_hello(passphrase)`, `vault_export_phrase()` and `vault_hello_available()`. ADR-054's four
  `vault_hello_*` commands are gone, with the Settings panel that turned Hello on and off.
- A new error kind, `passphrase_vault`, names a vault that must move first.
- **The Hello prompt may open behind the launcher's window**, as under ADR-054: raising it needs `unsafe` Win32
  code, which the launcher forbids. The sealing screen says to look in the taskbar.
- **Tests cannot drive Hello itself.** The vault is tested against a stand-in, including one that signs differently
  each time; the Windows implementation is exercised by a person at a running launcher.
