//! A test runtime for the pallet.
//!
//! Deliberately minimal: `frame_system` and this pallet. `pallet-session` is not
//! mounted, because what is under test is the pallet's own guards and its
//! `SessionManager` answers, which are callable directly.

use frame_support::{derive_impl, parameter_types, traits::ConstU32};
use polkadot_sdk::*;
use sp_runtime::BuildStorage;

use crate as pallet_validator_set;

type Block = frame_system::mocking::MockBlock<Test>;

frame_support::construct_runtime!(
    pub enum Test {
        System: frame_system,
        ValidatorSet: pallet_validator_set,
    }
);

#[derive_impl(frame_system::config_preludes::TestDefaultConfig)]
impl frame_system::Config for Test {
    type Block = Block;
}

parameter_types! {
    pub storage MinValidatorsValue: u32 = 1;
}

/// The minimum is read from storage in tests, so a test can raise it and check
/// the refusals move with it. In a real runtime it is a constant.
pub struct MinValidators;
impl frame_support::traits::Get<u32> for MinValidators {
    fn get() -> u32 {
        MinValidatorsValue::get()
    }
}

impl pallet_validator_set::Config for Test {
    type GovernanceOrigin = frame_system::EnsureRoot<u64>;
    type MaxValidators = ConstU32<4>;
    type MinValidators = MinValidators;
}

/// Build a test state with the given validators, bypassing the pallet's calls.
pub fn new_test_ext(validators: Vec<u64>) -> sp_io::TestExternalities {
    let mut t = frame_system::GenesisConfig::<Test>::default()
        .build_storage()
        .unwrap();

    pallet_validator_set::GenesisConfig::<Test> { validators }
        .assimilate_storage(&mut t)
        .unwrap();

    let mut ext: sp_io::TestExternalities = t.into();
    // Events are not deposited at block zero.
    ext.execute_with(|| System::set_block_number(1));
    ext
}

pub fn set_minimum(min: u32) {
    MinValidatorsValue::set(&min);
}

pub fn events() -> Vec<pallet_validator_set::Event<Test>> {
    System::events()
        .into_iter()
        .filter_map(|r| {
            if let RuntimeEvent::ValidatorSet(e) = r.event {
                Some(e)
            } else {
                None
            }
        })
        .collect()
}
