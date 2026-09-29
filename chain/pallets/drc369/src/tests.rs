//! Tests for M4.1. Each of the five the roadmap names was shown to fail against
//! a planted fault before it was trusted; the commit that added them records how.

use crate::{mock::*, *};
use codec::{DecodeAll, Encode, MaxEncodedLen};
use frame_support::{assert_noop, assert_ok, traits::Currency, BoundedVec};
use sp_runtime::{DispatchError, DispatchResult};

fn content(seed: u8) -> ContentRef {
    ContentRef {
        algo: HashAlgo::Blake3_256,
        root: H256::repeat_byte(seed),
        size: 1_000 + seed as u64,
    }
}

fn commit(seed: u8) -> Option<CommitId> {
    Some(CommitId::Sha1([seed; 20]))
}

fn name(text: &str) -> BoundedVec<u8, <Test as pallet_nfts::Config>::StringLimit> {
    text.as_bytes().to_vec().try_into().unwrap()
}

fn signed(who: u8) -> RuntimeOrigin {
    RuntimeOrigin::signed(account(who))
}

fn mint(who: u8, seed: u8) -> DispatchResult {
    Drc369::mint(
        signed(who),
        content(seed),
        commit(seed),
        name("a song"),
        true,
        None,
    )
}

fn remix(who: u8, seed: u8, source: (CollectionId, ItemId)) -> DispatchResult {
    Drc369::mint(
        signed(who),
        content(seed),
        commit(seed),
        name("a remix"),
        true,
        Some(source),
    )
}

// ---------------------------------------------------------------------------
// A mint must be authorised (requirement 7)
// ---------------------------------------------------------------------------

#[test]
fn an_unsigned_or_root_mint_is_refused() {
    new_test_ext().execute_with(|| {
        for origin in [RuntimeOrigin::none(), RuntimeOrigin::root()] {
            assert_noop!(
                Drc369::mint(origin, content(1), commit(1), name("x"), true, None),
                DispatchError::BadOrigin
            );
        }
        assert_eq!(Singles::<Test>::iter().count(), 0);
        assert_eq!(Assets::<Test>::iter().count(), 0);
        assert_eq!(nfts_collections_created(), 0);
    });
}

#[test]
fn a_mint_goes_to_the_signer_in_the_signers_own_collection() {
    new_test_ext().execute_with(|| {
        assert_ok!(mint(ALICE, 1));
        assert_ok!(mint(BOB, 2));

        let alice = Singles::<Test>::get(account(ALICE)).unwrap().collection;
        let bob = Singles::<Test>::get(account(BOB)).unwrap().collection;
        assert_ne!(alice, bob);

        assert_eq!(Nfts::owner(alice, 0), Some(account(ALICE)));
        assert_eq!(Nfts::collection_owner(alice), Some(account(ALICE)));
        assert_eq!(Nfts::owner(bob, 0), Some(account(BOB)));
        assert_eq!(Nfts::collection_owner(bob), Some(account(BOB)));

        // Nor can one touch the other's asset.
        assert_noop!(
            Drc369::revise(signed(BOB), alice, 0, content(3), commit(3)),
            Error::<Test>::NotOwner
        );
        assert_noop!(
            Drc369::make_permanent(signed(BOB), alice, 0),
            Error::<Test>::NotOwner
        );
    });
}

// ---------------------------------------------------------------------------
// The content reference (ADR-047, decisions 1 to 3)
// ---------------------------------------------------------------------------

#[test]
fn the_content_reference_is_41_bytes() {
    let reference = content(7);
    assert_eq!(reference.encode().len(), 41);
    assert_eq!(ContentRef::max_encoded_len(), 41);
    // Tag first, then the root, then the size, little-endian.
    let bytes = reference.encode();
    assert_eq!(bytes[0], 0);
    assert_eq!(&bytes[1..33], &[7u8; 32]);
    assert_eq!(&bytes[33..], &1_007u64.to_le_bytes());
}

#[test]
fn a_malformed_reference_is_refused() {
    let good = content(7).encode();
    assert_eq!(ContentRef::decode_all(&mut &good[..]), Ok(content(7)));

    // An algorithm tag that names nothing does not decode.
    for tag in [3u8, 0x7f, 0xff] {
        let mut bad = good.clone();
        bad[0] = tag;
        assert!(
            ContentRef::decode_all(&mut &bad[..]).is_err(),
            "tag {tag} decoded"
        );
    }

    // Nor does a reference of the wrong length, short or long.
    assert!(ContentRef::decode_all(&mut &good[..40]).is_err());
    let mut long = good.clone();
    long.push(0);
    assert!(ContentRef::decode_all(&mut &long[..]).is_err());

    // The same holds for the whole call, which is how the runtime meets it: a
    // mint carrying an unknown tag is refused before it is dispatched.
    let call = RuntimeCall::Drc369(Call::mint {
        content: content(7),
        commit: commit(7),
        name: name("x"),
        revisable: true,
        derived_from: None,
    });
    let encoded = call.encode();
    assert!(RuntimeCall::decode_all(&mut &encoded[..]).is_ok());
    // Byte 0 is the pallet, byte 1 the call, and the reference starts at 2.
    let mut unknown_tag = encoded.clone();
    unknown_tag[2] = 3;
    assert!(RuntimeCall::decode_all(&mut &unknown_tag[..]).is_err());
    assert!(RuntimeCall::decode_all(&mut &encoded[..encoded.len() - 1]).is_err());

    // Tags that name an algorithm a mint does not accept yet, and a manifest of
    // no bytes, are refused when dispatched, by mint and by revise alike.
    new_test_ext().execute_with(|| {
        for algo in [HashAlgo::Sha2_256, HashAlgo::Blake2_256] {
            let reference = ContentRef { algo, ..content(1) };
            assert_noop!(
                Drc369::mint(signed(ALICE), reference, commit(1), name("x"), true, None),
                Error::<Test>::UnsupportedAlgorithm
            );
        }
        let empty = ContentRef {
            size: 0,
            ..content(1)
        };
        assert_noop!(
            Drc369::mint(signed(ALICE), empty, commit(1), name("x"), true, None),
            Error::<Test>::EmptyContent
        );

        assert_ok!(mint(ALICE, 1));
        let sha2 = ContentRef {
            algo: HashAlgo::Sha2_256,
            ..content(2)
        };
        assert_noop!(
            Drc369::revise(signed(ALICE), 0, 0, sha2, commit(2)),
            Error::<Test>::UnsupportedAlgorithm
        );
    });
}

// ---------------------------------------------------------------------------
// Revision and the one-way switch (ADR-047, decision 10)
// ---------------------------------------------------------------------------

#[test]
fn make_permanent_is_one_way_and_revise_is_refused_after() {
    new_test_ext().execute_with(|| {
        assert_ok!(mint(ALICE, 1));
        assert_ok!(Drc369::revise(signed(ALICE), 0, 0, content(2), commit(2)));
        assert_ok!(Drc369::make_permanent(signed(ALICE), 0, 0));

        let asset = Assets::<Test>::get(0, 0).unwrap();
        assert!(!asset.revisable);
        assert_eq!(asset.origin, content(1));
        assert_eq!(asset.current, content(2));

        assert_noop!(
            Drc369::revise(signed(ALICE), 0, 0, content(3), commit(3)),
            Error::<Test>::Permanent
        );
        assert_noop!(
            Drc369::make_permanent(signed(ALICE), 0, 0),
            Error::<Test>::AlreadyPermanent
        );

        // Permanence travels with the asset: its next owner cannot revise it.
        assert_ok!(Nfts::transfer(signed(ALICE), 0, 0, account(BOB)));
        assert_noop!(
            Drc369::revise(signed(BOB), 0, 0, content(3), commit(3)),
            Error::<Test>::Permanent
        );

        // An asset minted permanent is permanent from the start.
        assert_ok!(Drc369::mint(
            signed(ALICE),
            content(4),
            commit(4),
            name("final"),
            false,
            None
        ));
        assert_noop!(
            Drc369::revise(signed(ALICE), 0, 1, content(5), commit(5)),
            Error::<Test>::Permanent
        );
    });

    // And nothing turns it back: the pallet has no call that could.
    let calls: Vec<&str> =
        <Call<Test> as frame_support::traits::GetCallName>::get_call_names().to_vec();
    assert_eq!(calls, vec!["mint", "revise", "make_permanent"]);
}

#[test]
fn a_revision_needs_the_owner_a_known_asset_and_a_change() {
    new_test_ext().execute_with(|| {
        assert_noop!(
            Drc369::revise(signed(ALICE), 0, 0, content(2), commit(2)),
            Error::<Test>::UnknownAsset
        );
        assert_noop!(
            Drc369::make_permanent(signed(ALICE), 0, 0),
            Error::<Test>::UnknownAsset
        );

        assert_ok!(mint(ALICE, 1));
        assert_noop!(
            Drc369::revise(signed(ALICE), 0, 0, content(1), commit(1)),
            Error::<Test>::Unchanged
        );
        // The same files from a later commit is a change: the pin moves.
        assert_ok!(Drc369::revise(signed(ALICE), 0, 0, content(1), commit(9)));
        assert_eq!(Assets::<Test>::get(0, 0).unwrap().commit, commit(9));

        // The owner is whoever holds it now.
        assert_ok!(Nfts::transfer(signed(ALICE), 0, 0, account(BOB)));
        assert_noop!(
            Drc369::revise(signed(ALICE), 0, 0, content(2), commit(2)),
            Error::<Test>::NotOwner
        );
        assert_ok!(Drc369::revise(signed(BOB), 0, 0, content(2), commit(2)));
    });
}

// ---------------------------------------------------------------------------
// Events (ADR-047, decision 12)
// ---------------------------------------------------------------------------

#[test]
fn events_carry_the_content_reference() {
    new_test_ext().execute_with(|| {
        assert_ok!(mint(ALICE, 1));
        assert_ok!(Drc369::revise(signed(ALICE), 0, 0, content(2), commit(2)));
        assert_ok!(Drc369::make_permanent(signed(ALICE), 0, 0));

        assert_eq!(
            events(),
            vec![
                Event::SinglesCollectionCreated {
                    creator: account(ALICE),
                    collection: 0,
                },
                Event::Minted {
                    collection: 0,
                    item: 0,
                    owner: account(ALICE),
                    by: account(ALICE),
                    origin: content(1),
                    commit: commit(1),
                    revisable: true,
                    derived_from: None,
                },
                Event::Revised {
                    collection: 0,
                    item: 0,
                    from: content(1),
                    to: content(2),
                    commit: commit(2),
                    by: account(ALICE),
                },
                Event::Locked {
                    collection: 0,
                    item: 0,
                    content: content(2),
                    by: account(ALICE),
                },
            ]
        );
    });
}

// ---------------------------------------------------------------------------
// One singles collection per creator (ADR-047, decision 13 row 12)
// ---------------------------------------------------------------------------

#[test]
fn the_singles_collection_is_created_exactly_once_per_creator() {
    new_test_ext().execute_with(|| {
        for seed in 1..=3 {
            assert_ok!(mint(ALICE, seed));
        }
        assert_eq!(
            Singles::<Test>::get(account(ALICE)),
            Some(SinglesCollection {
                collection: 0,
                next_item: 3
            })
        );
        for item in 0..3 {
            assert_eq!(Nfts::owner(0, item), Some(account(ALICE)));
        }
        assert_eq!(nfts_collections_created(), 1);

        assert_ok!(mint(BOB, 4));
        assert_eq!(Singles::<Test>::get(account(BOB)).unwrap().collection, 1);
        assert_eq!(nfts_collections_created(), 2);

        let created: Vec<_> = events()
            .into_iter()
            .filter_map(|e| match e {
                Event::SinglesCollectionCreated {
                    creator,
                    collection,
                } => Some((creator, collection)),
                _ => None,
            })
            .collect();
        assert_eq!(created, vec![(account(ALICE), 0), (account(BOB), 1)]);
    });
}

// ---------------------------------------------------------------------------
// Deposits, and a mint that cannot be paid for
// ---------------------------------------------------------------------------

#[test]
fn a_mint_holds_its_deposits_from_the_minter() {
    new_test_ext().execute_with(|| {
        // The first mint pays for the collection, the item and the name.
        assert_ok!(mint(ALICE, 1));
        let name_bytes = "a song".len() as Balance;
        let first = COLLECTION_DEPOSIT
            + ITEM_DEPOSIT
            + METADATA_DEPOSIT_BASE
            + name_bytes * DEPOSIT_PER_BYTE;
        assert_eq!(Balances::reserved_balance(account(ALICE)), first);

        // Later mints pay for the item alone, and nothing for an empty name.
        assert_ok!(Drc369::mint(
            signed(ALICE),
            content(2),
            commit(2),
            name(""),
            true,
            None
        ));
        assert_eq!(
            Balances::reserved_balance(account(ALICE)),
            first + ITEM_DEPOSIT
        );
    });
}

#[test]
fn a_mint_that_cannot_be_paid_for_moves_nothing() {
    new_test_ext().execute_with(|| {
        // Nothing at all.
        assert_noop!(
            mint(NOBODY, 1),
            pallet_balances::Error::<Test>::InsufficientBalance
        );

        // Enough for the collection but not for the item: the collection is not
        // left behind either.
        let short = account(NOBODY);
        let _ = Balances::deposit_creating(&short, COLLECTION_DEPOSIT + 50);
        assert_noop!(
            mint(NOBODY, 1),
            pallet_balances::Error::<Test>::InsufficientBalance
        );
        assert_eq!(Balances::reserved_balance(&short), 0);
        assert_eq!(Singles::<Test>::get(&short), None);
    });
}

// ---------------------------------------------------------------------------
// Owner enumeration, read from storage (ADR-025)
// ---------------------------------------------------------------------------

#[test]
fn owner_enumeration_follows_the_ledger() {
    new_test_ext().execute_with(|| {
        assert_ok!(mint(ALICE, 1));
        assert_ok!(Drc369::mint(
            signed(ALICE),
            content(2),
            commit(2),
            name("second"),
            true,
            None
        ));
        assert_ok!(mint(BOB, 3));

        let held = |who: u8| {
            let mut assets: Vec<(CollectionId, ItemId)> = Drc369::assets_of(&account(who))
                .into_iter()
                .map(|owned| (owned.collection, owned.item))
                .collect();
            assets.sort();
            assets
        };
        assert_eq!(held(ALICE), vec![(0, 0), (0, 1)]);
        assert_eq!(held(BOB), vec![(1, 0)]);

        let second = Drc369::assets_of(&account(ALICE))
            .into_iter()
            .find(|owned| owned.item == 1)
            .unwrap();
        assert_eq!(second.name, b"second".to_vec());
        assert_eq!(second.asset.origin, content(2));
        assert_eq!(second.asset.commit, commit(2));
        assert!(second.asset.revisable);

        // A transfer through the ledger moves it in the enumeration.
        assert_ok!(Nfts::transfer(signed(ALICE), 0, 1, account(BOB)));
        assert_eq!(held(ALICE), vec![(0, 0)]);
        assert_eq!(held(BOB), vec![(0, 1), (1, 0)]);

        // An item the ledger holds without a DRC-369 record is not a DRC-369
        // asset, and is not listed.
        assert_ok!(Nfts::force_create(
            RuntimeOrigin::root(),
            account(ALICE),
            pallet_nfts::CollectionConfig {
                settings: pallet_nfts::CollectionSettings::all_enabled(),
                max_supply: None,
                mint_settings: pallet_nfts::MintSettings::default(),
            }
        ));
        assert_ok!(Nfts::force_mint(
            RuntimeOrigin::root(),
            2,
            0,
            account(ALICE),
            pallet_nfts::ItemConfig {
                settings: pallet_nfts::ItemSettings::all_enabled()
            }
        ));
        assert_eq!(Nfts::owner(2, 0), Some(account(ALICE)));
        assert_eq!(held(ALICE), vec![(0, 0)]);
    });
}

// ---------------------------------------------------------------------------
// Remix provenance (M4.2, ADR-047 decisions 7 and 11, ADR-061)
// ---------------------------------------------------------------------------

#[test]
fn a_remix_records_its_source_and_depth_and_anyone_may_declare_one() {
    new_test_ext().execute_with(|| {
        assert_ok!(mint(ALICE, 1));
        // Bob remixes Alice's work without owning it: declaring a source obliges
        // the remix, not the source.
        assert_ok!(remix(BOB, 2, (0, 0)));
        // And Alice remixes Bob's remix.
        assert_ok!(remix(ALICE, 3, (1, 0)));

        let original = Drc369::asset(0, 0).unwrap();
        assert_eq!((original.derived_from, original.remix_depth), (None, 0));
        let first = Drc369::asset(1, 0).unwrap();
        assert_eq!((first.derived_from, first.remix_depth), (Some((0, 0)), 1));
        let second = Drc369::asset(0, 1).unwrap();
        assert_eq!((second.derived_from, second.remix_depth), (Some((1, 0)), 2));

        // Each source counts the remixes that name it.
        assert_eq!(Drc369::remixes_of(0, 0), 1);
        assert_eq!(Drc369::remixes_of(1, 0), 1);
        assert_eq!(Drc369::remixes_of(0, 1), 0);

        assert!(events().contains(&Event::Minted {
            collection: 1,
            item: 0,
            owner: account(BOB),
            by: account(BOB),
            origin: content(2),
            commit: commit(2),
            revisable: true,
            derived_from: Some((0, 0)),
        }));

        // Nothing changes it afterwards: a revision leaves the source alone.
        assert_ok!(Drc369::revise(signed(BOB), 1, 0, content(9), commit(9)));
        assert_eq!(Drc369::asset(1, 0).unwrap().derived_from, Some((0, 0)));
    });
}

#[test]
fn a_remix_of_nothing_or_past_the_depth_bound_is_refused_at_mint() {
    new_test_ext().execute_with(|| {
        // No such asset, including the id the remix itself is about to take.
        assert_noop!(remix(ALICE, 1, (0, 0)), Error::<Test>::UnknownSource);

        assert_ok!(mint(ALICE, 1));
        let mut source = (0, 0);
        for depth in 1..=MAX_REMIX_DEPTH {
            assert_ok!(remix(ALICE, 1 + depth, source));
            source = (0, depth as ItemId);
            assert_eq!(
                Drc369::asset(0, depth as ItemId).unwrap().remix_depth,
                depth
            );
        }
        // One more would be deeper than the bound: refused, and nothing is left
        // behind, not even an item id.
        let before = Singles::<Test>::get(account(ALICE)).unwrap();
        assert_noop!(remix(ALICE, 50, source), Error::<Test>::RemixTooDeep);
        assert_eq!(Singles::<Test>::get(account(ALICE)).unwrap(), before);
    });
}
