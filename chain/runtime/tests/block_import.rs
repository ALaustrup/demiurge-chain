//! Block production and import: what the custom chain's `block_execution_test`
//! and `chain_test` pinned down (roadmap M3.3, migration inventory §9).
//!
//! These build real blocks with the real runtime and execute them the way an
//! importing node does, so they cover the property that matters most on a
//! chain: **a block one node produced executes identically on another, or is
//! refused.** A chain whose producer and importer disagree forks.
//!
//! # How a block is built here
//!
//! Aura reads its slot from a pre-runtime digest, so a block without one panics
//! on import. Each block below therefore carries the digest an authoring node
//! would attach, with the slot derived from the timestamp exactly as
//! `sc-consensus-aura` does. That is why these tests exercise the same path a
//! node takes rather than a simplified one.

use codec::Encode;
use demiurge_runtime::{
    denomination::CGT, AccountId, Balance, Block, Executive, Header, Runtime, RuntimeCall,
    UncheckedExtrinsic, SLOT_DURATION,
};
use polkadot_sdk::*;

use sp_consensus_aura::{Slot, AURA_ENGINE_ID};
use sp_runtime::{
    traits::{BlakeTwo256, Hash as HashT, Header as HeaderT},
    BuildStorage, Digest, DigestItem,
};

const TIMESTAMP_AT_BLOCK_ONE: u64 = 1_800_000_000_000;

fn account(seed: u8) -> AccountId {
    sp_runtime::AccountId32::new([seed; 32])
}

fn genesis(endowments: Vec<(AccountId, Balance)>) -> sp_io::TestExternalities {
    let mut storage = frame_system::GenesisConfig::<Runtime>::default()
        .build_storage()
        .expect("the system genesis builds");

    pallet_balances::GenesisConfig::<Runtime> {
        balances: endowments,
        ..Default::default()
    }
    .assimilate_storage(&mut storage)
    .expect("the balances genesis builds");

    storage.into()
}

/// The digest an authoring node attaches: the slot this block belongs to.
fn aura_digest(timestamp: u64) -> Digest {
    let slot = Slot::from(timestamp / SLOT_DURATION);
    Digest {
        logs: vec![DigestItem::PreRuntime(AURA_ENGINE_ID, slot.encode())],
    }
}

/// The timestamp inherent, which every block must carry.
fn timestamp_inherent(now: u64) -> UncheckedExtrinsic {
    UncheckedExtrinsic::new_bare(RuntimeCall::Timestamp(pallet_timestamp::Call::set { now }))
}

/// Sign an extrinsic the way a wallet does: over the call plus the transaction
/// extensions, including the genesis hash, so a transaction signed for one
/// network is not valid on another (D-009).
///
/// Must be built inside the externality, because the extensions read chain state
/// (the genesis hash, the runtime version) to form what is signed.
fn signed(call: RuntimeCall, signer: &sp_core::sr25519::Pair, nonce: u32) -> UncheckedExtrinsic {
    use sp_core::Pair;
    use sp_runtime::generic::{Era, SignedPayload};
    use sp_runtime::traits::IdentifyAccount;
    use sp_runtime::{MultiSignature, MultiSigner};

    let tx_ext: demiurge_runtime::TxExtension = (
        frame_system::CheckNonZeroSender::<Runtime>::new(),
        frame_system::CheckSpecVersion::<Runtime>::new(),
        frame_system::CheckTxVersion::<Runtime>::new(),
        frame_system::CheckGenesis::<Runtime>::new(),
        frame_system::CheckEra::<Runtime>::from(Era::immortal()),
        frame_system::CheckNonce::<Runtime>::from(nonce),
        frame_system::CheckWeight::<Runtime>::new(),
    );

    let payload = SignedPayload::new(call, tx_ext).expect("the payload forms");
    let signature = payload.using_encoded(|bytes| signer.sign(bytes));
    let (call, tx_ext, _) = payload.deconstruct();
    let account = MultiSigner::Sr25519(signer.public()).into_account();

    // The address is a `MultiAddress`, not a bare account (ADR-041).
    UncheckedExtrinsic::new_signed(
        call,
        sp_runtime::MultiAddress::Id(account),
        MultiSignature::Sr25519(signature),
        tx_ext,
    )
}

fn transfer_call(to: &AccountId, amount: Balance) -> RuntimeCall {
    RuntimeCall::Balances(pallet_balances::Call::transfer_keep_alive {
        dest: sp_runtime::MultiAddress::Id(to.clone()),
        value: amount,
    })
}

/// Produce a block the way an authoring node does: initialise, apply the
/// inherents and extrinsics, then finalise. Returns the block it built.
fn produce_block(
    parent: <Header as HeaderT>::Hash,
    number: u32,
    timestamp: u64,
    extrinsics: Vec<UncheckedExtrinsic>,
) -> Block {
    let header = Header::new(
        number,
        Default::default(),
        Default::default(),
        parent,
        aura_digest(timestamp),
    );

    Executive::initialize_block(&header);

    let mut applied = vec![timestamp_inherent(timestamp)];
    Executive::apply_extrinsic(applied[0].clone())
        .expect("the timestamp inherent applies")
        .expect("and succeeds");

    for xt in extrinsics {
        Executive::apply_extrinsic(xt.clone())
            .expect("the extrinsic applies")
            .expect("and succeeds");
        applied.push(xt);
    }

    let header = Executive::finalize_block();
    Block {
        header,
        extrinsics: applied,
    }
}

// ---------------------------------------------------------------------------
// Producer and importer agree
// ---------------------------------------------------------------------------

/// The property a chain lives or dies by: a block built on one node executes on
/// another and reaches the same state. If this ever fails, nodes fork.
#[test]
fn a_block_one_node_produced_executes_identically_on_another() {
    let alice = account(1);
    let bob = account(2);
    let endowments = vec![(alice.clone(), 5_000 * CGT), (bob.clone(), 5_000 * CGT)];

    // The producing node.
    let mut producer = genesis(endowments.clone());
    let block = producer.execute_with(|| {
        let parent = frame_system::Pallet::<Runtime>::parent_hash();
        produce_block(parent, 1, TIMESTAMP_AT_BLOCK_ONE, vec![])
    });

    // A different node, from the same genesis, importing that block.
    let mut importer = genesis(endowments);
    importer.execute_with(|| {
        Executive::execute_block(block.clone().into());
        assert_eq!(
            frame_system::Pallet::<Runtime>::block_number(),
            1,
            "the importer must end at the block it imported"
        );
    });

    // The state root the producer sealed into the header is the one the
    // importer computed, or `execute_block` above would have panicked. Assert it
    // is a real root rather than the default, so this test cannot pass vacuously.
    assert_ne!(
        *block.header.state_root(),
        Default::default(),
        "the block must carry a computed state root"
    );
}

/// The same, for a block that actually moves value: the importer must reach the
/// same balances, not merely the same height.
#[test]
fn a_block_carrying_a_transfer_reaches_the_same_state_on_both_nodes() {
    use sp_core::Pair;
    use sp_runtime::traits::IdentifyAccount;

    let alice_pair = sp_core::sr25519::Pair::from_seed(&[1u8; 32]);
    let alice = sp_runtime::MultiSigner::Sr25519(alice_pair.public()).into_account();
    let bob = account(2);
    let endowments = vec![(alice.clone(), 5_000 * CGT), (bob.clone(), 5_000 * CGT)];

    let mut producer = genesis(endowments.clone());
    let block = producer.execute_with(|| {
        let parent = frame_system::Pallet::<Runtime>::parent_hash();
        let xt = signed(transfer_call(&bob, 250 * CGT), &alice_pair, 0);
        produce_block(parent, 1, TIMESTAMP_AT_BLOCK_ONE, vec![xt])
    });

    let mut importer = genesis(endowments);
    importer.execute_with(|| {
        Executive::execute_block(block.clone().into());
        assert_eq!(
            pallet_balances::Pallet::<Runtime>::free_balance(&bob),
            5_250 * CGT,
            "the importer must reach the balances the producer reached"
        );
        assert_eq!(
            pallet_balances::Pallet::<Runtime>::free_balance(&alice),
            4_750 * CGT
        );
    });
}

// ---------------------------------------------------------------------------
// Replay refusal
// ---------------------------------------------------------------------------

/// A transaction cannot be applied twice. The nonce is what stops it, and a
/// chain without this has no notion of a transaction happening once.
#[test]
fn the_same_transaction_cannot_be_applied_twice() {
    use sp_core::Pair;
    use sp_runtime::traits::IdentifyAccount;
    use sp_runtime::transaction_validity::{InvalidTransaction, TransactionValidityError};

    let alice_pair = sp_core::sr25519::Pair::from_seed(&[1u8; 32]);
    let alice = sp_runtime::MultiSigner::Sr25519(alice_pair.public()).into_account();
    let bob = account(2);

    genesis(vec![
        (alice.clone(), 5_000 * CGT),
        (bob.clone(), 5_000 * CGT),
    ])
    .execute_with(|| {
        let parent = frame_system::Pallet::<Runtime>::parent_hash();
        let header = Header::new(
            1,
            Default::default(),
            Default::default(),
            parent,
            aura_digest(TIMESTAMP_AT_BLOCK_ONE),
        );
        Executive::initialize_block(&header);
        Executive::apply_extrinsic(timestamp_inherent(TIMESTAMP_AT_BLOCK_ONE))
            .expect("inherent applies")
            .expect("and succeeds");

        let xt = signed(transfer_call(&bob, 100 * CGT), &alice_pair, 0);

        Executive::apply_extrinsic(xt.clone())
            .expect("the first application is valid")
            .expect("and succeeds");

        let replayed = Executive::apply_extrinsic(xt);
        assert_eq!(
            replayed,
            Err(TransactionValidityError::Invalid(InvalidTransaction::Stale)),
            "replaying a transaction must be refused as stale"
        );

        assert_eq!(
            pallet_balances::Pallet::<Runtime>::free_balance(&bob),
            5_100 * CGT,
            "the replay must not have moved value a second time"
        );

        // The control: a genuine second transaction, at the next nonce, is
        // applied. Without this the test above would also pass on a chain that
        // refused every second transaction, which is not the property wanted.
        let next = signed(transfer_call(&bob, 100 * CGT), &alice_pair, 1);
        Executive::apply_extrinsic(next)
            .expect("a transaction at the next nonce is valid")
            .expect("and succeeds");
        assert_eq!(
            pallet_balances::Pallet::<Runtime>::free_balance(&bob),
            5_200 * CGT,
            "it is replays that are refused, not second transactions"
        );
    });
}

/// A transaction signed for a later nonce is held rather than applied, so
/// transactions from one account take effect in the order that account chose.
#[test]
fn a_transaction_with_a_future_nonce_is_not_applied() {
    use sp_core::Pair;
    use sp_runtime::traits::IdentifyAccount;
    use sp_runtime::transaction_validity::{InvalidTransaction, TransactionValidityError};

    let alice_pair = sp_core::sr25519::Pair::from_seed(&[1u8; 32]);
    let alice = sp_runtime::MultiSigner::Sr25519(alice_pair.public()).into_account();
    let bob = account(2);

    genesis(vec![
        (alice.clone(), 5_000 * CGT),
        (bob.clone(), 5_000 * CGT),
    ])
    .execute_with(|| {
        let parent = frame_system::Pallet::<Runtime>::parent_hash();
        let header = Header::new(
            1,
            Default::default(),
            Default::default(),
            parent,
            aura_digest(TIMESTAMP_AT_BLOCK_ONE),
        );
        Executive::initialize_block(&header);
        Executive::apply_extrinsic(timestamp_inherent(TIMESTAMP_AT_BLOCK_ONE))
            .expect("inherent applies")
            .expect("and succeeds");

        // Nonce 5, when the account is at 0.
        let ahead = signed(transfer_call(&bob, 100 * CGT), &alice_pair, 5);
        assert_eq!(
            Executive::apply_extrinsic(ahead),
            Err(TransactionValidityError::Invalid(
                InvalidTransaction::Future
            )),
            "a transaction ahead of the account's nonce must not be applied"
        );
        assert_eq!(
            pallet_balances::Pallet::<Runtime>::free_balance(&bob),
            5_000 * CGT
        );
    });
}

// ---------------------------------------------------------------------------
// Import rules: a block that does not add up is refused
// ---------------------------------------------------------------------------

/// A block whose sealed state root is not the state the block actually produces
/// must be refused. This is what stops a node accepting a forged or corrupted
/// block that claims a state nobody can reach.
#[test]
#[should_panic(expected = "Storage root must match that calculated")]
fn a_block_with_a_tampered_state_root_is_refused() {
    let alice = account(1);
    let endowments = vec![(alice.clone(), 5_000 * CGT)];

    let mut producer = genesis(endowments.clone());
    let mut block = producer.execute_with(|| {
        let parent = frame_system::Pallet::<Runtime>::parent_hash();
        produce_block(parent, 1, TIMESTAMP_AT_BLOCK_ONE, vec![])
    });

    // Claim a state the block does not produce.
    block.header.state_root = BlakeTwo256::hash(b"a state root nobody computed");

    let mut importer = genesis(endowments);
    importer.execute_with(|| Executive::execute_block(block.into()));
}

/// A block whose extrinsics root does not match its extrinsics must be refused,
/// so a block cannot carry different transactions from the ones it commits to.
#[test]
#[should_panic(expected = "Transaction trie root must be valid")]
fn a_block_with_a_tampered_extrinsics_root_is_refused() {
    let alice = account(1);
    let endowments = vec![(alice.clone(), 5_000 * CGT)];

    let mut producer = genesis(endowments.clone());
    let mut block = producer.execute_with(|| {
        let parent = frame_system::Pallet::<Runtime>::parent_hash();
        produce_block(parent, 1, TIMESTAMP_AT_BLOCK_ONE, vec![])
    });

    block.header.extrinsics_root = BlakeTwo256::hash(b"not the extrinsics in this block");

    let mut importer = genesis(endowments);
    importer.execute_with(|| Executive::execute_block(block.into()));
}

/// **Parent validation is the node's job, not the runtime's, and this pins that
/// rather than pretending otherwise.**
///
/// Established by reading the pinned sources on 18 September 2026:
/// `Executive::execute_block` calls `initialize_block` and *then*
/// `initial_checks` (`frame-executive` 48.0.0, lines 695 and 696), and
/// `frame_system::initialize` writes `BlockHash(n - 1) = parent_hash` (line
/// 1981). So `initial_checks` compares `BlockHash(n - 1)` against the very value
/// it has just written from the header. **The runtime's "Parent hash should be
/// valid" assertion is therefore unreachable through `execute_block`**, at any
/// height, and a first attempt to test it by tampering with a parent passed
/// nothing.
///
/// This is not a hole. A node's import queue resolves a block's parent in its
/// database before the runtime is ever called, and a block whose parent is
/// unknown is never executed. But it means **this rule cannot be covered from
/// inside the runtime**, and its real test belongs to the multi-node harness.
/// Recorded in the migration inventory §9 so the gap is not mistaken for
/// coverage.
///
/// If this test ever starts failing, the SDK has begun checking the parent
/// before initialising, and the note above should be revisited.
#[test]
fn the_runtime_alone_does_not_refuse_a_block_naming_the_wrong_parent() {
    let alice = account(1);
    let endowments = vec![(alice.clone(), 5_000 * CGT)];

    let mut producer = genesis(endowments.clone());
    let on_a_lie = producer.execute_with(|| {
        let wrong_parent = BlakeTwo256::hash(b"a parent from another chain");
        produce_block(wrong_parent, 1, TIMESTAMP_AT_BLOCK_ONE, vec![])
    });

    let mut importer = genesis(endowments);
    importer.execute_with(|| {
        // Accepted, because initialize_block wrote the parent the header claims
        // before initial_checks read it back.
        Executive::execute_block(on_a_lie.into());
        assert_eq!(frame_system::Pallet::<Runtime>::block_number(), 1);
    });
}

// ---------------------------------------------------------------------------
// A chain of blocks
// ---------------------------------------------------------------------------

/// Blocks import in sequence, and the importer follows the producer's chain
/// through several of them rather than only the first.
#[test]
fn a_run_of_blocks_imports_in_order() {
    let alice = account(1);
    let endowments = vec![(alice.clone(), 5_000 * CGT)];

    let mut producer = genesis(endowments.clone());
    let blocks = producer.execute_with(|| {
        let mut parent = frame_system::Pallet::<Runtime>::parent_hash();
        let mut built = Vec::new();
        for number in 1..=4u32 {
            let timestamp = TIMESTAMP_AT_BLOCK_ONE + (number as u64 - 1) * SLOT_DURATION;
            let block = produce_block(parent, number, timestamp, vec![]);
            parent = block.header.hash();
            built.push(block);
        }
        built
    });

    let mut importer = genesis(endowments);
    importer.execute_with(|| {
        for (i, block) in blocks.iter().enumerate() {
            Executive::execute_block(block.clone().into());
            assert_eq!(
                frame_system::Pallet::<Runtime>::block_number(),
                i as u32 + 1
            );
        }
    });
}
