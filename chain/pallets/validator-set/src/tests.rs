//! Tests.
//!
//! The ones that matter are in the last section: they assert that no governance
//! action can stop the chain, and they do it by defeating the pallet's own
//! guards rather than by trusting them.

use frame_support::{assert_noop, assert_ok, traits::Get};
use polkadot_sdk::*;
use sp_runtime::traits::BadOrigin;

use pallet_session::SessionManager;

use crate::{mock::*, Error, Event, Validators};

/// Ask the pallet for a new set, the way `pallet-session` does.
fn new_session(index: u32) -> Option<Vec<u64>> {
    <ValidatorSet as SessionManager<u64>>::new_session(index)
}

const ALICE: u64 = 1;
const BOB: u64 = 2;
const CHARLIE: u64 = 3;
const DAVE: u64 = 4;
const EVE: u64 = 5;

fn root() -> RuntimeOrigin {
    RuntimeOrigin::root()
}

// ---------------------------------------------------------------------------
// Who may change the set
// ---------------------------------------------------------------------------

#[test]
fn only_the_governance_origin_may_change_the_set() {
    new_test_ext(vec![ALICE, BOB]).execute_with(|| {
        assert_noop!(
            ValidatorSet::add_validator(RuntimeOrigin::signed(ALICE), CHARLIE),
            BadOrigin
        );
        assert_noop!(
            ValidatorSet::remove_validator(RuntimeOrigin::signed(ALICE), BOB),
            BadOrigin
        );
        assert_noop!(
            ValidatorSet::set_validators(RuntimeOrigin::signed(ALICE), vec![CHARLIE]),
            BadOrigin
        );
        assert_eq!(ValidatorSet::validators(), vec![ALICE, BOB]);
    });
}

// ---------------------------------------------------------------------------
// The ordinary cases
// ---------------------------------------------------------------------------

#[test]
fn governance_adds_removes_and_replaces() {
    new_test_ext(vec![ALICE, BOB]).execute_with(|| {
        assert_ok!(ValidatorSet::add_validator(root(), CHARLIE));
        assert_eq!(ValidatorSet::validators(), vec![ALICE, BOB, CHARLIE]);

        assert_ok!(ValidatorSet::remove_validator(root(), BOB));
        assert_eq!(ValidatorSet::validators(), vec![ALICE, CHARLIE]);

        assert_ok!(ValidatorSet::set_validators(root(), vec![DAVE, EVE]));
        assert_eq!(ValidatorSet::validators(), vec![DAVE, EVE]);
    });
}

#[test]
fn the_same_validator_cannot_be_added_twice() {
    new_test_ext(vec![ALICE]).execute_with(|| {
        assert_noop!(
            ValidatorSet::add_validator(root(), ALICE),
            Error::<Test>::AlreadyAValidator
        );
    });
}

#[test]
fn a_validator_that_is_not_in_the_set_cannot_be_removed() {
    new_test_ext(vec![ALICE, BOB]).execute_with(|| {
        assert_noop!(
            ValidatorSet::remove_validator(root(), CHARLIE),
            Error::<Test>::NotAValidator
        );
    });
}

#[test]
fn a_set_with_a_duplicate_is_refused() {
    new_test_ext(vec![ALICE, BOB]).execute_with(|| {
        assert_noop!(
            ValidatorSet::set_validators(root(), vec![CHARLIE, CHARLIE]),
            Error::<Test>::DuplicateValidator
        );
        assert_eq!(ValidatorSet::validators(), vec![ALICE, BOB]);
    });
}

#[test]
fn the_set_cannot_grow_past_its_maximum() {
    new_test_ext(vec![ALICE, BOB, CHARLIE, DAVE]).execute_with(|| {
        // MaxValidators is 4 in the mock.
        assert_noop!(
            ValidatorSet::add_validator(root(), EVE),
            Error::<Test>::TooManyValidators
        );
        assert_noop!(
            ValidatorSet::set_validators(root(), vec![ALICE, BOB, CHARLIE, DAVE, EVE]),
            Error::<Test>::TooManyValidators
        );
    });
}

// ---------------------------------------------------------------------------
// No governance action may stop the chain
//
// This is the section that matters. A validator set that cannot author is a
// halted chain, and a halted chain is not repairable by governance: it needs a
// new genesis. So the constraint is asserted, not the constant, and each guard
// is tested with the guards above it defeated.
// ---------------------------------------------------------------------------

#[test]
fn governance_cannot_empty_the_set_by_removing() {
    new_test_ext(vec![ALICE]).execute_with(|| {
        // One validator, minimum one: this removal would halt the chain.
        assert_noop!(
            ValidatorSet::remove_validator(root(), ALICE),
            Error::<Test>::TooFewValidators
        );
        assert_eq!(ValidatorSet::validators(), vec![ALICE]);
    });
}

#[test]
fn governance_cannot_empty_the_set_by_replacing_it() {
    new_test_ext(vec![ALICE, BOB]).execute_with(|| {
        assert_noop!(
            ValidatorSet::set_validators(root(), vec![]),
            Error::<Test>::TooFewValidators
        );
        assert_eq!(ValidatorSet::validators(), vec![ALICE, BOB]);
    });
}

#[test]
fn removing_down_to_the_minimum_is_allowed_and_no_further() {
    new_test_ext(vec![ALICE, BOB, CHARLIE]).execute_with(|| {
        set_minimum(2);

        assert_ok!(ValidatorSet::remove_validator(root(), CHARLIE));
        assert_eq!(ValidatorSet::validators(), vec![ALICE, BOB]);

        // At the minimum, the next removal is refused.
        assert_noop!(
            ValidatorSet::remove_validator(root(), BOB),
            Error::<Test>::TooFewValidators
        );
    });
}

#[test]
fn the_refusal_moves_with_the_minimum_rather_than_being_hard_coded() {
    new_test_ext(vec![ALICE, BOB, CHARLIE]).execute_with(|| {
        // The bound is the configured minimum, not the number one. Raise it and
        // a set that was legal becomes illegal.
        set_minimum(3);
        assert_noop!(
            ValidatorSet::remove_validator(root(), CHARLIE),
            Error::<Test>::TooFewValidators
        );
        assert_noop!(
            ValidatorSet::set_validators(root(), vec![ALICE, BOB]),
            Error::<Test>::TooFewValidators
        );

        set_minimum(1);
        assert_ok!(ValidatorSet::set_validators(root(), vec![ALICE, BOB]));
    });
}

/// Guard 3, with guards 1 and 2 defeated.
///
/// Storage is written directly, as a botched migration or a defect in a future
/// call would, so no call is involved and no guard above the session boundary
/// can help. `new_session` must still not hand `pallet-session` an empty set.
#[test]
fn an_empty_set_in_storage_still_does_not_stop_block_production() {
    new_test_ext(vec![ALICE]).execute_with(|| {
        Validators::<Test>::put(frame_support::BoundedVec::try_from(Vec::<u64>::new()).unwrap());
        assert!(
            ValidatorSet::validators().is_empty(),
            "storage was forced empty"
        );

        // `None` tells pallet-session to keep the set it already has. An empty
        // `Some(vec![])` would be the halt this pallet exists to prevent.
        assert_eq!(new_session(1), None);

        assert!(
            events().iter().any(|e| matches!(
                e,
                Event::PreviousSetKept {
                    held: 0,
                    minimum: 1
                }
            )),
            "the failsafe must record that it fired: it means a guard above it failed"
        );
    });
}

/// The same failsafe for a set that is short rather than empty.
#[test]
fn a_set_below_the_minimum_in_storage_keeps_the_previous_set() {
    new_test_ext(vec![ALICE, BOB, CHARLIE]).execute_with(|| {
        set_minimum(3);
        Validators::<Test>::put(frame_support::BoundedVec::try_from(vec![ALICE]).unwrap());

        assert_eq!(new_session(7), None);
        assert!(events().iter().any(|e| matches!(
            e,
            Event::PreviousSetKept {
                held: 1,
                minimum: 3
            }
        )));
    });
}

#[test]
fn a_healthy_set_is_handed_over_unchanged() {
    new_test_ext(vec![ALICE, BOB]).execute_with(|| {
        assert_eq!(new_session(1), Some(vec![ALICE, BOB]));
        assert!(
            !events()
                .iter()
                .any(|e| matches!(e, Event::PreviousSetKept { .. })),
            "the failsafe must not fire for a healthy set"
        );
    });
}

/// Whatever sequence of calls governance makes, the set can never become
/// unable to author. This walks every call repeatedly rather than checking one
/// path, because the guard has to hold for sequences, not just single calls.
#[test]
fn no_sequence_of_governance_calls_can_leave_the_chain_unable_to_author() {
    new_test_ext(vec![ALICE, BOB, CHARLIE]).execute_with(|| {
        let candidates = [ALICE, BOB, CHARLIE, DAVE, EVE];

        for round in 0..3 {
            for (i, who) in candidates.iter().enumerate() {
                // Results are deliberately ignored: a refusal is a valid
                // outcome, and what is asserted is the state afterwards.
                let _ = ValidatorSet::remove_validator(root(), *who);
                if (i + round) % 2 == 0 {
                    let _ = ValidatorSet::add_validator(root(), *who);
                }
                let _ = ValidatorSet::set_validators(root(), vec![*who]);
                let _ = ValidatorSet::set_validators(root(), vec![]);
                // The set now holds exactly one validator, so this is the
                // removal that would halt the chain. It must be refused, and an
                // earlier version of this test never reached this line, which is
                // why it survived the per-call guard being deleted.
                let _ = ValidatorSet::remove_validator(root(), *who);

                let set = ValidatorSet::validators();
                assert!(
                    set.len() as u32 >= <Test as crate::Config>::MinValidators::get(),
                    "after removing and re-adding {who}, the set was {set:?}, which cannot author"
                );
                assert_ne!(new_session(1), Some(Vec::new()));
            }
        }
    });
}

#[test]
fn the_invariant_holds_after_every_ordinary_change() {
    new_test_ext(vec![ALICE, BOB]).execute_with(|| {
        assert_ok!(crate::Pallet::<Test>::do_try_state());
        assert_ok!(ValidatorSet::add_validator(root(), CHARLIE));
        assert_ok!(crate::Pallet::<Test>::do_try_state());
        assert_ok!(ValidatorSet::remove_validator(root(), ALICE));
        assert_ok!(crate::Pallet::<Test>::do_try_state());
        assert_ok!(ValidatorSet::set_validators(root(), vec![DAVE, EVE]));
        assert_ok!(crate::Pallet::<Test>::do_try_state());
    });
}

/// The invariant check must be able to fail, or it is not evidence.
#[test]
fn the_invariant_check_catches_a_set_that_cannot_author() {
    new_test_ext(vec![ALICE]).execute_with(|| {
        Validators::<Test>::put(frame_support::BoundedVec::try_from(Vec::<u64>::new()).unwrap());
        assert!(
            crate::Pallet::<Test>::do_try_state().is_err(),
            "an empty set must fail try_state"
        );
    });
}

/// The configuration itself is checked at startup: a runtime that allows an
/// empty set must not start. `integrity_test` is what `construct_runtime!` runs.
#[test]
fn a_minimum_of_zero_is_refused_at_startup() {
    new_test_ext(vec![ALICE]).execute_with(|| {
        set_minimum(1);
        <crate::Pallet<Test> as frame_support::traits::Hooks<u64>>::integrity_test();

        set_minimum(0);
        let refused = std::panic::catch_unwind(|| {
            <crate::Pallet<Test> as frame_support::traits::Hooks<u64>>::integrity_test()
        })
        .is_err();
        set_minimum(1);
        assert!(
            refused,
            "a runtime configured with MinValidators = 0 must refuse to start"
        );
    });
}

/// An empty genesis is allowed, and it is loud rather than silent.
///
/// A chain launched this way has no authorities and never produces block one,
/// which nobody ships by accident. That is why emptiness is refused by the calls
/// and the session boundary rather than at genesis: see the note on
/// `BuildGenesisConfig`. This test exists so that reasoning stays true.
#[test]
fn an_empty_genesis_builds_but_authors_nothing() {
    new_test_ext(vec![]).execute_with(|| {
        assert!(ValidatorSet::validators().is_empty());
        assert_eq!(
            new_session(0),
            None,
            "an empty genesis must not hand pallet-session an empty set either"
        );
        assert!(
            crate::Pallet::<Test>::do_try_state().is_err(),
            "try_state must report an empty set, so a chain launched this way is visibly wrong"
        );
    });
}

/// A genesis with a duplicate is refused, as the precedent pallet refuses it.
#[test]
#[should_panic(expected = "duplicate")]
fn a_genesis_with_a_duplicate_is_refused() {
    new_test_ext(vec![ALICE, ALICE]);
}
