# ADR-054: Unlocking the vault with Windows Hello

**Status:** Accepted, 26 September 2026, by the project owner. **Superseded by [ADR-055](ADR-055-the-vault-opens-with-windows-hello-alone.md)**
(28 September 2026, the owner): Windows Hello is no longer an opt-in copy beside a passphrase but the vault's only
seal. The signing mechanism below is kept.
**Extends:** [ADR-016](ADR-016-sign-in-with-unlock.md). ADR-016 named an opt-in unlock with Windows Hello as "a
possible later decision"; this is that decision. ADR-016's own decision stands unchanged: one approval opens the
vault and signs in to QOR ID. This record adds a second way to give that approval.

## Context

The owner asked for the vault to open without a passphrase: "It's ridiculous to have two separate passwords to
log in." Two things were behind it.

- **One of the two was not meant to be there.** Under ADR-016 the passphrase already signs in to QOR ID. The
  owner met a second prompt because QOR ID was not running, so the launcher fell back to its manual sign-in.
  That is a service being down, not a design, and it is not what this record changes.
- **The passphrase itself is friction** every time the launcher opens or locks after being idle.

The owner proposed a key file kept in the launcher's directory. Three ways of doing that were put to them:

1. **Windows Hello.** A key held in the device's TPM (its security chip), usable only after the person's
   face, fingerprint or Windows PIN.
2. **Sealed to the Windows account** with DPAPI (Windows' per-user encryption), opening silently whenever the
   person is logged in to Windows.
3. **A plain key file**, as proposed.

**The owner chose Windows Hello.**

## Decision

1. **Windows Hello is opt-in, per vault, turned on in Settings with the passphrase.** Turning it on asks
   Windows to create a key named "Demiurge QOR Launcher vault" in the person's Hello store, then asks the key to
   sign a challenge.
2. **The key is the TPM's and never leaves it.** RSA signatures with PKCS#1 v1.5 padding, which Hello uses, are
   deterministic, so the same key signing the same challenge gives the same bytes every time. The launcher
   seals a second copy of the recovery phrase with that signature as the secret, using the vault's own seal
   (Argon2id, then XChaCha20-Poly1305), and keeps it in `vault.hello` beside `vault.qor`.
   - **The challenge** is the tag `demiurge:vault:windows-hello:v1:` followed by 32 random bytes kept in the
     file, so the signature cannot be asked for, or reused, as anything else.
   - **The file holds** the salt, the sealed copy and a binding, and neither the phrase nor the signature.
3. **The copy is bound to the vault file it was made from**, by BLAKE3 of `vault.qor`. If that file is
   replaced — restored, or renamed by hand — the copy is inert and Hello is not even asked, so Hello can never
   open a different vault from the one the launcher shows. A restore moves the old copy aside with the old
   vault, never deleting either.
4. **Unlocking with Hello is the approval ADR-016 gives the passphrase.** It opens the same arrival grant, for
   the same five minutes, for the same narrow purpose: QOR ID challenges only. Every transfer, trade, mint,
   endpoint change and test run still asks in its own host dialog (L1.4).
5. **The passphrase stays.** Creating a vault still sets one; it unlocks when Hello is unavailable or declined,
   it is needed to turn Hello on, and the recovery phrase still recovers everything. Turning Hello off needs
   nothing, because it only removes a way in.
6. **The Gate asks Hello once on arrival** when it is on for this vault, with the passphrase underneath. A
   cancel is not re-asked on its own.
7. **Windows only, for now.** Other platforms report Hello as unavailable. Touch ID on macOS is the natural
   counterpart and would follow this record's shape; it is not decided here.

## Why this does not weaken security

- **A copied file opens nothing.** Without the TPM key on this device, and the person's gesture, the sealed
  copy is ciphertext. That is what ruled out the plain key file: a file that opens the vault, once copied by a
  backup, a sync folder or malware, holds the keys on any machine for ever.
- **Someone at the keyboard of an unlocked Windows session still needs the person.** Hello asks for a face,
  fingerprint or PIN each time. That is what ruled out DPAPI as a default: it opens for any program running
  as the person, with no one present.
- **What remains is the Windows PIN.** Hello falls back to it, and a PIN is shorter than a good passphrase.
  Hello's PIN is rate-limited by the TPM and bound to this device, which a passphrase guessed offline against a
  stolen `vault.qor` is not. A person who wants the passphrase only leaves Hello off, and one who wants it off
  later turns it off.

## Alternatives considered

- **DPAPI, unlocking with no prompt.** Rejected by the owner in favour of Hello, for the reason above. It
  remains possible as a further opt-in if a no-prompt unlock is ever wanted.
- **A plain key file.** Rejected by the owner once the risk was put to them.
- **`UserConsentVerifier`**, Windows' yes-or-no presence check, with the key stored separately. Rejected: the
  check gates nothing cryptographically, so a program that skipped it could open the key. With a signature as
  the secret, there is no key to open without the gesture.

## Consequences

- `tools/qor-launcher/src-tauri/src/vault/hello.rs` holds the `Presence` interface, its Windows implementation
  (`windows` 0.62, Windows-only, the latest release under ADR-033 rule 2) and a stand-in for tests. The vault
  gains `enable_hello`, `unlock_with_hello`, `disable_hello` and `hello_enabled`; the launcher gains four
  commands and a Settings panel; the Gate gains the Hello button.
- **The Hello prompt may open behind the launcher's window.** Raising it needs a Win32 call that is `unsafe` in
  Rust, which the launcher forbids (`unsafe_code = "forbid"` in its `Cargo.toml`), and that rule is not loosened
  for it. If it happens, the prompt is
  in the taskbar.
- **Tests cannot drive Hello itself.** The vault's behaviour is tested against the stand-in; the Windows
  implementation is exercised by a person at a running launcher, and one ignored test asks the real Windows
  whether Hello is set up, which shows no prompt.
