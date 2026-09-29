//! A governance-chosen validator set, acting as `pallet-session`'s session
//! manager (ADR-020).
//!
//! # Why this pallet exists at all
//!
//! ADR-013 says a departure from a standard component needs a written reason.
//! The reason, checked against the pinned release: there is no standard pallet
//! for a governance-chosen validator set on a standalone chain.
//! `pallet-node-authorization` manages network peers, `pallet-staking` is
//! nominated proof of stake, `pallet-staking-async` is Asset-Hub-only, and
//! `pallet-collator-selection` manages parachain collators with a bonded
//! candidate auction, whose winners would become finality voters on a GRANDPA
//! chain. ADR-020 records that survey.
//!
//! # The one thing this pallet must never do
//!
//! **A governance action must not be able to stop the chain.** This is the first
//! place in Demiurge where that is possible: the validator set is what produces
//! blocks, so an empty or too-small set is a halted chain, and recovery from a
//! halted chain is not a governance action but a new genesis.
//!
//! Three separate guards, deliberately redundant, because the consequence is
//! unrecoverable:
//!
//! 1. **Compile time.** `MinValidators` must be at least one, asserted in the
//!    pallet's integrity test, so a runtime configured with zero cannot start.
//! 2. **Every call.** No call may leave fewer than `MinValidators` in the set.
//!    A call that would is refused, whoever made it.
//! 3. **The session boundary.** `new_session` never hands `pallet-session` an
//!    empty set. If storage were somehow empty — a botched migration, a genesis
//!    mistake, a future call with a defect — it returns `None`, which tells
//!    `pallet-session` to keep the set it already has. Keeping the previous
//!    authors is always better than having none.
//!
//! Guard 3 exists because guards 1 and 2 are promises about code that could be
//! wrong. Its test writes an empty set directly into storage, bypassing every
//! call, and asserts the chain would still be authored.
//!
//! # Shaped for replacement
//!
//! Storage and calls mirror `pallet-collator-selection`'s invulnerables, so that
//! a parachain move (ADR-018) or the handover to staking (ADR-020's migration)
//! can swap this pallet out. Nothing is bonded and nothing is slashed: with no
//! stake there is nothing to slash, and misbehaviour is handled by governance
//! removing the validator.

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

use alloc::vec::Vec;
use frame_support::traits::Get;
use polkadot_sdk::*;

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::{pallet_prelude::*, traits::EnsureOrigin};
    use frame_system::pallet_prelude::*;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::config]
    pub trait Config: polkadot_sdk::frame_system::Config {
        // `RuntimeEvent` is not declared here: at the pinned release a pallet
        // inherits it from `frame_system::Config`, and declaring it is
        // deprecated.

        /// Who may change the set.
        ///
        /// An `EnsureOrigin` rather than a concrete origin, so that it can be
        /// widened later — to the collective of ADR-021, to OpenGov, or to a
        /// relay-chain origin on a parachain — without touching this pallet
        /// (ADR-018's parachain condition).
        type GovernanceOrigin: EnsureOrigin<Self::RuntimeOrigin>;

        /// The most validators the set may hold.
        #[pallet::constant]
        type MaxValidators: Get<u32>;

        /// The fewest validators the set may hold, which must be at least one.
        ///
        /// This is the bound that keeps the chain alive. See the module
        /// documentation: below it, nobody authors blocks.
        #[pallet::constant]
        type MinValidators: Get<u32>;
    }

    /// The current validator set. Bounded, and never shorter than
    /// `MinValidators` through any call this pallet offers.
    #[pallet::storage]
    pub type Validators<T: Config> =
        StorageValue<_, BoundedVec<T::AccountId, T::MaxValidators>, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// The whole set was replaced. Applied from the session after next.
        ValidatorsSet { validators: Vec<T::AccountId> },
        /// One validator was added.
        ValidatorAdded { validator: T::AccountId },
        /// One validator was removed.
        ValidatorRemoved { validator: T::AccountId },
        /// `new_session` was asked for a set and storage held too few, so the
        /// previous set was kept.
        ///
        /// **This should never be emitted.** It means a guard above the session
        /// boundary failed and the failsafe caught it. Treat it as an incident.
        PreviousSetKept { held: u32, minimum: u32 },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// The set would hold fewer than `MinValidators`, which would stop the
        /// chain. Refused.
        TooFewValidators,
        /// The set would hold more than `MaxValidators`.
        TooManyValidators,
        /// That account is already a validator.
        AlreadyAValidator,
        /// That account is not a validator.
        NotAValidator,
        /// The same account appeared twice in one set.
        DuplicateValidator,
    }

    #[pallet::genesis_config]
    #[derive(frame_support::DefaultNoBound)]
    pub struct GenesisConfig<T: Config> {
        pub validators: Vec<T::AccountId>,
    }

    #[pallet::genesis_build]
    impl<T: Config> BuildGenesisConfig for GenesisConfig<T> {
        fn build(&self) {
            // Duplicates and the bound are refused here, as
            // `pallet-collator-selection` does for its invulnerables, which
            // ADR-020 says to mirror.
            //
            // Emptiness is deliberately **not** refused here, for two reasons.
            // The precedent pallet does not refuse it, and an empty genesis is
            // not the danger this pallet exists to prevent: it produces a chain
            // with no authorities that never authors block one, which is
            // immediate and unmissable. The danger is a *running* chain being
            // governed into a halt, which the calls and the session boundary
            // refuse. A test below pins that an empty genesis stays loud.
            let mut sorted = self.validators.clone();
            sorted.sort();
            sorted.dedup();
            assert_eq!(
                sorted.len(),
                self.validators.len(),
                "genesis validator set contains a duplicate"
            );

            let bounded =
                BoundedVec::<T::AccountId, T::MaxValidators>::try_from(self.validators.clone())
                    .expect("genesis validator set exceeds MaxValidators");
            Validators::<T>::put(bounded);
        }
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {
        #[cfg(feature = "try-runtime")]
        fn try_state(_: BlockNumberFor<T>) -> Result<(), sp_runtime::TryRuntimeError> {
            Pallet::<T>::do_try_state()
        }

        fn integrity_test() {
            // Guard 1. A runtime configured to allow an empty set is a runtime
            // that can be governed into a halt, so it must not start at all.
            assert!(
                T::MinValidators::get() >= 1,
                "MinValidators must be at least 1: a chain with no validators cannot author blocks"
            );
            assert!(
                T::MaxValidators::get() >= T::MinValidators::get(),
                "MaxValidators must be at least MinValidators"
            );
        }
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Replace the whole set.
        ///
        /// Refused if it would hold fewer than `MinValidators`, more than
        /// `MaxValidators`, or the same account twice.
        #[pallet::call_index(0)]
        #[pallet::weight(Weight::from_parts(10_000, 0).saturating_add(T::DbWeight::get().writes(1)))]
        pub fn set_validators(
            origin: OriginFor<T>,
            validators: Vec<T::AccountId>,
        ) -> DispatchResult {
            T::GovernanceOrigin::ensure_origin(origin)?;

            ensure!(
                validators.len() as u32 >= T::MinValidators::get(),
                Error::<T>::TooFewValidators
            );

            let mut sorted = validators.clone();
            sorted.sort();
            let before = sorted.len();
            sorted.dedup();
            ensure!(sorted.len() == before, Error::<T>::DuplicateValidator);

            let bounded =
                BoundedVec::<T::AccountId, T::MaxValidators>::try_from(validators.clone())
                    .map_err(|_| Error::<T>::TooManyValidators)?;

            Validators::<T>::put(bounded);
            Self::deposit_event(Event::ValidatorsSet { validators });
            Ok(())
        }

        /// Add one validator.
        #[pallet::call_index(1)]
        #[pallet::weight(Weight::from_parts(10_000, 0).saturating_add(T::DbWeight::get().writes(1)))]
        pub fn add_validator(origin: OriginFor<T>, validator: T::AccountId) -> DispatchResult {
            T::GovernanceOrigin::ensure_origin(origin)?;

            Validators::<T>::try_mutate(|set| -> DispatchResult {
                ensure!(!set.contains(&validator), Error::<T>::AlreadyAValidator);
                set.try_push(validator.clone())
                    .map_err(|_| Error::<T>::TooManyValidators)?;
                Ok(())
            })?;

            Self::deposit_event(Event::ValidatorAdded { validator });
            Ok(())
        }

        /// Remove one validator.
        ///
        /// Refused if it would take the set below `MinValidators`. Governance
        /// removing the last validators is how this chain would be halted, and
        /// it is the case this pallet exists to make impossible.
        #[pallet::call_index(2)]
        #[pallet::weight(Weight::from_parts(10_000, 0).saturating_add(T::DbWeight::get().writes(1)))]
        pub fn remove_validator(origin: OriginFor<T>, validator: T::AccountId) -> DispatchResult {
            T::GovernanceOrigin::ensure_origin(origin)?;

            Validators::<T>::try_mutate(|set| -> DispatchResult {
                let at = set
                    .iter()
                    .position(|v| v == &validator)
                    .ok_or(Error::<T>::NotAValidator)?;
                ensure!(
                    (set.len() as u32).saturating_sub(1) >= T::MinValidators::get(),
                    Error::<T>::TooFewValidators
                );
                set.remove(at);
                Ok(())
            })?;

            Self::deposit_event(Event::ValidatorRemoved { validator });
            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// The current set.
        pub fn validators() -> Vec<T::AccountId> {
            Validators::<T>::get().into_inner()
        }

        /// The invariant this pallet exists to hold: the set is large enough to
        /// author, and holds no duplicates.
        pub fn do_try_state() -> Result<(), sp_runtime::TryRuntimeError> {
            let set = Validators::<T>::get();
            ensure!(
                set.len() as u32 >= T::MinValidators::get(),
                "validator set is below MinValidators: the chain cannot author"
            );
            let mut sorted = set.into_inner();
            let before = sorted.len();
            sorted.sort();
            sorted.dedup();
            ensure!(
                sorted.len() == before,
                "validator set contains a duplicate validator"
            );
            Ok(())
        }
    }
}

/// `pallet-session` asks this pallet for each new set.
///
/// Guard 3 lives here. Returning an empty set would stop block production, so
/// this never does: if storage holds too few, the previous set is kept by
/// answering `None`, and an event records that it happened.
impl<T: Config> pallet_session::SessionManager<T::AccountId> for Pallet<T> {
    fn new_session(_new_index: u32) -> Option<Vec<T::AccountId>> {
        let set = Validators::<T>::get();
        let held = set.len() as u32;
        let minimum = T::MinValidators::get();

        if held < minimum || held == 0 {
            // Deliberately not an error and not a panic: a halted chain cannot
            // be repaired by governance, while a chain that keeps authoring can.
            Pallet::<T>::deposit_event(Event::PreviousSetKept { held, minimum });
            return None;
        }

        Some(set.into_inner())
    }

    fn end_session(_end_index: u32) {}

    fn start_session(_start_index: u32) {}
}

#[cfg(test)]
mod mock;
#[cfg(test)]
mod tests;
