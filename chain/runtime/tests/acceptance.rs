//! Acceptance tests: behaviour the new chain must reproduce, and defects it
//! must not have (roadmap M3.3).
//!
//! The migration inventory §9 lists what the custom chain's tests pin down.
//! Nothing there is ported as code — the implementations have nothing in common
//! — so these assert the same *behaviour* against the real runtime.
//!
//! # What these tests are, and are not
//!
//! Most of the behaviour below is `pallet-balances`', not ours. A test over
//! someone else's pallet cannot be verified by deleting a guard we wrote,
//! because we wrote none. Their value is different and worth stating plainly:
//! they are **regression tests against the SDK**, and they fail if an upgrade
//! changes a rule this chain's economics depend on. ADR-033 makes moving the
//! pinned release a deliberate, tested step; this file is part of what that step
//! has to pass.
//!
//! Where a rule *is* ours, the guard is tested by defeating it. That is done in
//! `pallet-validator-set`, whose guards we wrote.
//!
//! The self-transfer tests were checked the equivalent way: simulating the
//! custom chain's defect, by growing total issuance during the call, fails them
//! with the intended message. A test that cannot fail is not evidence.

use demiurge_runtime::{
    denomination::{CGT, EXISTENTIAL_DEPOSIT},
    AccountId, Balance, Balances, Runtime, RuntimeOrigin, System,
};
use polkadot_sdk::*;

use frame_support::traits::fungible::Inspect;
use frame_support::{assert_noop, assert_ok, traits::OnFinalize};
use sp_runtime::{BuildStorage, DispatchError, TokenError};

fn account(seed: u8) -> AccountId {
    sp_runtime::AccountId32::new([seed; 32])
}

/// A chain with two funded accounts, well above the existential deposit.
fn chain_with(endowments: Vec<(AccountId, Balance)>) -> sp_io::TestExternalities {
    let mut storage = frame_system::GenesisConfig::<Runtime>::default()
        .build_storage()
        .expect("the system genesis builds");

    pallet_balances::GenesisConfig::<Runtime> {
        balances: endowments,
        ..Default::default()
    }
    .assimilate_storage(&mut storage)
    .expect("the balances genesis builds");

    let mut ext: sp_io::TestExternalities = storage.into();
    ext.execute_with(|| System::set_block_number(1));
    ext
}

fn total_issuance() -> Balance {
    <Balances as Inspect<AccountId>>::total_issuance()
}

/// How a balances call names the account it pays: a `MultiAddress`, not a bare
/// account (ADR-041). Written once here so the tests read as they did.
fn dest(who: &AccountId) -> demiurge_runtime::Address {
    sp_runtime::MultiAddress::Id(who.clone())
}

fn free(who: &AccountId) -> Balance {
    <Balances as Inspect<AccountId>>::balance(who)
}

// ---------------------------------------------------------------------------
// The defect that must not come back
//
// On the custom chain a signed Balances transfer naming the sender as the
// recipient credited the sender and created CGT from nothing. It was security
// track item 3, fixed there on 2026-09-14 and pinned by two tests. The new
// chain must not have it, whatever route is taken to the same call.
// ---------------------------------------------------------------------------

#[test]
fn a_transfer_to_oneself_creates_no_cgt() {
    let alice = account(1);
    chain_with(vec![(alice.clone(), 500 * CGT)]).execute_with(|| {
        let supply_before = total_issuance();
        let balance_before = free(&alice);

        assert_ok!(Balances::transfer_allow_death(
            RuntimeOrigin::signed(alice.clone()),
            dest(&alice),
            10 * CGT,
        ));

        assert_eq!(
            free(&alice),
            balance_before,
            "a self-transfer must leave the balance exactly as it was"
        );
        assert_eq!(
            total_issuance(),
            supply_before,
            "a self-transfer must create no CGT: this is the defect the custom chain had"
        );
    });
}

#[test]
fn a_keep_alive_transfer_to_oneself_creates_no_cgt() {
    // The same defect by the other route into the same pallet.
    let alice = account(1);
    chain_with(vec![(alice.clone(), 500 * CGT)]).execute_with(|| {
        let supply_before = total_issuance();

        assert_ok!(Balances::transfer_keep_alive(
            RuntimeOrigin::signed(alice.clone()),
            dest(&alice),
            10 * CGT,
        ));

        assert_eq!(free(&alice), 500 * CGT);
        assert_eq!(total_issuance(), supply_before);
    });
}

#[test]
fn transferring_everything_to_oneself_creates_no_cgt() {
    let alice = account(1);
    chain_with(vec![(alice.clone(), 500 * CGT)]).execute_with(|| {
        let supply_before = total_issuance();

        assert_ok!(Balances::transfer_all(
            RuntimeOrigin::signed(alice.clone()),
            dest(&alice),
            false,
        ));

        assert_eq!(free(&alice), 500 * CGT);
        assert_eq!(total_issuance(), supply_before);
    });
}

// ---------------------------------------------------------------------------
// Transfers conserve supply
// ---------------------------------------------------------------------------

#[test]
fn an_ordinary_transfer_moves_value_without_creating_any() {
    let alice = account(1);
    let bob = account(2);
    chain_with(vec![(alice.clone(), 500 * CGT), (bob.clone(), 500 * CGT)]).execute_with(|| {
        let supply_before = total_issuance();

        assert_ok!(Balances::transfer_allow_death(
            RuntimeOrigin::signed(alice.clone()),
            dest(&bob),
            120 * CGT,
        ));

        assert_eq!(free(&alice), 380 * CGT);
        assert_eq!(free(&bob), 620 * CGT);
        assert_eq!(
            total_issuance(),
            supply_before,
            "a transfer moves CGT; it never creates or destroys any"
        );
    });
}

#[test]
fn a_transfer_of_more_than_the_balance_changes_nothing() {
    let alice = account(1);
    let bob = account(2);
    chain_with(vec![(alice.clone(), 200 * CGT), (bob.clone(), 200 * CGT)]).execute_with(|| {
        let supply_before = total_issuance();

        // The exact error variant is an SDK internal and is deliberately not
        // pinned here: what this chain depends on is that the transfer fails
        // and moves nothing, not which of two error shapes says so.
        assert!(
            Balances::transfer_allow_death(
                RuntimeOrigin::signed(alice.clone()),
                dest(&bob),
                5_000 * CGT,
            )
            .is_err(),
            "a transfer of more than the balance must fail"
        );

        assert_eq!(free(&alice), 200 * CGT);
        assert_eq!(free(&bob), 200 * CGT);
        assert_eq!(total_issuance(), supply_before);
    });
}

// ---------------------------------------------------------------------------
// The existential deposit, at the value ADR-036 decided
// ---------------------------------------------------------------------------

#[test]
fn the_runtime_uses_the_existential_deposit_that_was_decided() {
    chain_with(vec![]).execute_with(|| {
        assert_eq!(
            <Runtime as pallet_balances::Config>::ExistentialDeposit::get(),
            EXISTENTIAL_DEPOSIT,
            "the runtime's existential deposit must be ADR-036's 100 CGT"
        );
        assert_eq!(EXISTENTIAL_DEPOSIT, 100 * CGT);
    });
}

#[test]
fn an_account_left_below_the_existential_deposit_is_reaped_and_its_dust_is_lost() {
    let alice = account(1);
    let bob = account(2);
    chain_with(vec![(alice.clone(), 150 * CGT), (bob.clone(), 100 * CGT)]).execute_with(|| {
        let supply_before = total_issuance();

        // Leaves Alice with 50 CGT, below the 100 CGT deposit.
        assert_ok!(Balances::transfer_allow_death(
            RuntimeOrigin::signed(alice.clone()),
            dest(&bob),
            100 * CGT,
        ));

        assert_eq!(free(&alice), 0, "the account below the deposit is reaped");
        assert_eq!(free(&bob), 200 * CGT);
        assert_eq!(
            total_issuance(),
            supply_before - 50 * CGT,
            "the dust is destroyed, not moved: issuance falls by exactly the dust"
        );
    });
}

#[test]
fn a_keep_alive_transfer_will_not_reap_the_sender() {
    let alice = account(1);
    let bob = account(2);
    chain_with(vec![(alice.clone(), 150 * CGT), (bob.clone(), 100 * CGT)]).execute_with(|| {
        let supply_before = total_issuance();

        assert_noop!(
            Balances::transfer_keep_alive(
                RuntimeOrigin::signed(alice.clone()),
                dest(&bob),
                100 * CGT,
            ),
            DispatchError::Token(TokenError::NotExpendable)
        );

        assert_eq!(free(&alice), 150 * CGT, "nothing moved");
        assert_eq!(total_issuance(), supply_before, "and no dust was burned");
    });
}

#[test]
fn an_account_cannot_be_created_below_the_existential_deposit() {
    let alice = account(1);
    let carol = account(3);
    chain_with(vec![(alice.clone(), 500 * CGT)]).execute_with(|| {
        let supply_before = total_issuance();

        assert_noop!(
            Balances::transfer_allow_death(
                RuntimeOrigin::signed(alice.clone()),
                dest(&carol),
                99 * CGT,
            ),
            DispatchError::Token(TokenError::BelowMinimum)
        );

        assert_eq!(free(&carol), 0, "the account was not created");
        assert_eq!(free(&alice), 500 * CGT);
        assert_eq!(total_issuance(), supply_before);
    });
}

// ---------------------------------------------------------------------------
// What the chain says about itself
// ---------------------------------------------------------------------------

#[test]
fn the_runtime_reports_the_decided_unit_and_prefix() {
    use demiurge_runtime::denomination;
    assert_eq!(denomination::DECIMALS, 18, "ADR-035");
    assert_eq!(denomination::TOKEN_SYMBOL, "CGT", "ADR-034");
    assert_eq!(
        denomination::SS58_PREFIX,
        42,
        "ADR-024, development and test"
    );
    assert_eq!(
        <Runtime as frame_system::Config>::SS58Prefix::get(),
        denomination::SS58_PREFIX,
        "the runtime must not disagree with its own denomination module"
    );
}

/// No path in this runtime creates CGT. There is no issuance (OPEN-1), no
/// genesis allocation beyond what a chain specification endows (OPEN-2), and no
/// transaction payment (OPEN-4). Blocks therefore leave supply untouched.
///
/// This is the runtime-side counterpart of requirement R-3, which says no
/// service outside the chain can cause CGT to be created.
#[test]
fn producing_blocks_creates_no_cgt() {
    let alice = account(1);
    chain_with(vec![(alice.clone(), 500 * CGT)]).execute_with(|| {
        let supply_before = total_issuance();

        for block in 1..=5u32 {
            System::set_block_number(block);
            <pallet_balances::Pallet<Runtime> as OnFinalize<u32>>::on_finalize(block);
        }

        assert_eq!(
            total_issuance(),
            supply_before,
            "no reward, no issuance, no fee: producing blocks must not change supply"
        );
    });
}

// ---------------------------------------------------------------------------
// Requirement R-1: signature verification is strict
//
// This is the defect that made the custom chain untrusted. On 2026-09-14 its
// non-strict Ed25519 verification accepted a signature nobody made — R as the
// identity point and s = 0 — for the identity-point key on 64 of 64 messages
// and for the all-zero key on 13 of 64.
//
// **What was found on 2026-09-18, writing these tests: R-1 is met for Sr25519
// and is NOT met for Ed25519, and that cannot be fixed inside the pallet.**
// Measured against the pinned release:
//
// | Scheme        | identity-point key | all-zero key |
// | ---           | ---                | ---          |
// | Ed25519       | accepted 64 of 64  | 64 of 64     |
// | Sr25519       | refused 64 of 64   | 64 of 64     |
//
// The cause is not an accident like the custom chain's. `sp-core` verifies
// Ed25519 with `ed25519-zebra`, which implements ZIP-215: a precisely specified
// validity rule chosen so that every node agrees on whether a signature is
// valid. Consensus needs that agreement more than it needs strictness, and
// ZIP-215 deliberately accepts some signatures that `ed25519-dalek`'s strict
// mode rejects. Changing it would mean departing from the SDK's standard
// verification, which ADR-013 does not allow without a written reason.
//
// What it means in practice: an account whose *address* is a small-order
// Ed25519 point can be spent from by anyone. Nobody holds the secret for such
// an address, so nothing is stolen from a person; funds sent to one are lost to
// whoever claims them first, as they would be sent to any unowned address.
//
// ADR-023 decided account keys are Sr25519, which refuses the forgery, so the
// chain's own key scheme is not exposed.
//
// **Decided on 2026-09-18 (ADR-038): the runtime is not restricted to Sr25519
// signatures, and R-1 is closed as met by standard behaviour.** Restricting it
// would own a consensus-critical divergence permanently in exchange for closing
// a hole that harms nobody, since no secret key produces a small-order address
// and so no person holds one. ADR-001 names consensus and key handling as
// exactly where not to be clever.
// ---------------------------------------------------------------------------

/// Sr25519, the account key scheme ADR-023 decided, refuses the forgery that
/// the custom chain accepted. This is R-1 for the keys this chain actually uses.
#[test]
fn a_forged_signature_for_a_small_order_key_is_refused_for_sr25519() {
    use sp_runtime::traits::{IdentifyAccount, Verify};
    use sp_runtime::{MultiSignature, MultiSigner};

    // R = the identity point, s = 0: the forgery the custom chain accepted.
    let mut forged = [0u8; 64];
    forged[0] = 1;
    let signature = MultiSignature::Sr25519(sp_core::sr25519::Signature::from_raw(forged));

    let mut identity_point = [0u8; 32];
    identity_point[0] = 1;

    for (which, raw) in [identity_point, [0u8; 32]].iter().enumerate() {
        let account = MultiSigner::Sr25519(sp_core::sr25519::Public::from_raw(*raw)).into_account();

        // Many messages, because the custom chain accepted the forgery for some
        // messages and not others: a single message could pass by luck.
        for i in 0..64u32 {
            let message = format!("demiurge:transfer:{i}");
            assert!(
                !signature.verify(message.as_bytes(), &account),
                "a forged signature was accepted for small-order key {which} on message {i}:                  requirement R-1 is broken for the scheme ADR-023 chose"
            );
        }
    }
}

/// Ed25519 under ZIP-215 accepts it, which is the SDK's deliberate behaviour
/// and not something this runtime can change from inside a pallet.
///
/// This test pins the accepted behaviour rather than hiding it. **If it ever
/// starts failing, that is good news** — the SDK changed to a stricter rule —
/// and ADR-038 should be revisited, along with the inventory's R-1 row.
#[test]
fn ed25519_accepts_the_forgery_which_is_the_recorded_gap_in_r1() {
    use sp_runtime::traits::{IdentifyAccount, Verify};
    use sp_runtime::{MultiSignature, MultiSigner};

    let mut forged = [0u8; 64];
    forged[0] = 1;
    let signature = MultiSignature::Ed25519(sp_core::ed25519::Signature::from_raw(forged));

    let mut identity_point = [0u8; 32];
    identity_point[0] = 1;
    let account =
        MultiSigner::Ed25519(sp_core::ed25519::Public::from_raw(identity_point)).into_account();

    assert!(
        signature.verify(&b"demiurge:transfer:0"[..], &account),
        "ZIP-215 accepted this when measured on 2026-09-18. If it no longer does, the SDK has          become stricter: revisit R-1 in the migration inventory and delete this test"
    );
}

/// The forgery is refused for an ordinary Sr25519 key too, and an honest
/// signature by that key is still accepted, so the refusal above is not a
/// verifier that refuses everything.
#[test]
fn an_honest_sr25519_signature_still_verifies() {
    use sp_core::Pair;
    use sp_runtime::traits::{IdentifyAccount, Verify};
    use sp_runtime::{MultiSignature, MultiSigner};

    let pair = sp_core::sr25519::Pair::from_seed(&[7u8; 32]);
    let account = MultiSigner::Sr25519(pair.public()).into_account();

    let mut forged = [0u8; 64];
    forged[0] = 1;
    assert!(
        !MultiSignature::Sr25519(sp_core::sr25519::Signature::from_raw(forged))
            .verify(&b"demiurge:transfer:0"[..], &account)
    );

    let honest = MultiSignature::Sr25519(pair.sign(&b"demiurge:transfer:0"[..]));
    assert!(
        honest.verify(&b"demiurge:transfer:0"[..], &account),
        "an honest signature must still verify: otherwise this test proves nothing"
    );
}
