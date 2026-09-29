//! DRC-369's semantics over `pallet-nfts` (ADR-025), in the shape ADR-047 decides.
//!
//! # What this pallet is, at M4.1
//!
//! `pallet-nfts` is the ownership ledger: it holds collections, items, owners,
//! approvals, transfers and deposits, and it keeps the index of what each account
//! holds. This pallet adds what makes an item a DRC-369 asset, and at M4.1 only
//! that much of it:
//!
//! - **the content reference** of every asset, exactly as ADR-047 decision 3
//!   defines it: a hash algorithm tag, a 32-byte root and a size, 41 bytes. The
//!   root is the BLAKE3-256 hash of the asset's manifest, which lives off chain
//!   (decision 4). The chain never computes it; it stores it and compares it;
//! - **the commit a mint pins**, by hash and never by branch (decisions 8 and 9);
//! - **revision** until a **one-way switch** makes an asset permanent
//!   (decision 10, and the owner's answer to decision 13 row 11);
//! - **one singles collection per creator**, created by the creator's first mint
//!   (the owner's answer to decision 13 row 12);
//! - **remix provenance** (M4.2, ADR-061): a mint may name the asset it was
//!   derived from. The field is immutable, and the remix depth is checked **at
//!   mint** and refused past [`Config::MaxRemixDepth`], so no settlement path
//!   ever walks the graph (decision 11).
//!
//! Royalties live beside this pallet, in `pallet-drc369-royalties`, which reads
//! `derived_from` to pay a remix's upstream creator. Nesting, state and XP and
//! physics are later M4 items and are not started here. Neither is sponsorship
//! (M4.4): the minter pays every deposit.
//!
//! # A mint must be authorised (requirement 7)
//!
//! A mint is signed, and it mints **to the signer, into the signer's own
//! collection**. The call has no recipient and no collection parameter, so there
//! is nothing to point at somebody else's account. That is the defect the custom
//! chain had and fixed on 14 September 2026, carried as a requirement by the
//! migration inventory, and here it cannot be written at all.
//!
//! # What this pallet relies on the runtime for
//!
//! `pallet-nfts`'s own calls can create collections and mint bare items, and a
//! collection's admin can hand its roles away. None of that would carry a content
//! reference. The runtime's base call filter lets through only `pallet-nfts`'s
//! transfer and approval calls, so this pallet's `mint` is the only way an item
//! comes into existence. That rule lives in the runtime, next to the filter, and
//! is tested there.
//!
//! # Weights
//!
//! **Placeholders, not benchmarks.** See [`weights`]: every weight here is built
//! from `pallet-nfts`'s own reference weights plus this pallet's storage accesses,
//! and is debt owed to roadmap item M7.2.

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

use alloc::vec::Vec;
use codec::{Decode, DecodeWithMemTracking, Encode, MaxEncodedLen};
use polkadot_sdk::*;
use scale_info::TypeInfo;
use sp_core::H256;

pub use pallet::*;
pub use weights::WeightInfo;

#[cfg(test)]
mod mock;
#[cfg(test)]
mod tests;
pub mod weights;

/// A collection's identifier. `u32`, as on Asset Hub (ADR-047, decision 13 row 5).
pub type CollectionId = u32;

/// An item's identifier within its collection. `u32` (ADR-047, decision 13 row 5).
pub type ItemId = u32;

/// The algorithm that produced a fingerprint (ADR-047, decision 2).
///
/// A tag, so that a second algorithm is a runtime upgrade rather than a breaking
/// change to a frozen format. The indices are part of the wire format and are
/// pinned explicitly. A byte that is none of them does not decode, so a call
/// carrying one is refused before it is dispatched.
#[derive(
    Clone,
    Copy,
    PartialEq,
    Eq,
    Debug,
    Encode,
    Decode,
    DecodeWithMemTracking,
    MaxEncodedLen,
    TypeInfo,
)]
pub enum HashAlgo {
    /// BLAKE3 with a 256-bit output. **The only algorithm a mint accepts today**
    /// (decision 1).
    #[codec(index = 0)]
    Blake3_256,
    /// SHA-256. Named so the tag can carry it later; refused today.
    #[codec(index = 1)]
    Sha2_256,
    /// BLAKE2b with a 256-bit output. Named so the tag can carry it later;
    /// refused today.
    #[codec(index = 2)]
    Blake2_256,
}

/// What an asset is: the fingerprint of its manifest (ADR-047, decisions 3 and 4).
///
/// **41 bytes, constant, forever:** one byte of algorithm, 32 of root, eight of
/// size. `root` hashes the manifest, never a file and never a location, and
/// `size` is the length of the bytes that hash to `root`, so a fetcher can check
/// what it was sent before it hashes it.
#[derive(
    Clone,
    Copy,
    PartialEq,
    Eq,
    Debug,
    Encode,
    Decode,
    DecodeWithMemTracking,
    MaxEncodedLen,
    TypeInfo,
)]
pub struct ContentRef {
    pub algo: HashAlgo,
    pub root: H256,
    pub size: u64,
}

/// The source commit an asset's content was taken from (ADR-047, decision 8).
///
/// A Qontrol project is a git repository on disk, so its commit ids are git
/// object ids: SHA-1 today, SHA-256 in a repository created that way. Never
/// BLAKE3, and never a branch name (decision 9). Tagged for the same reason as
/// [`HashAlgo`].
#[derive(
    Clone,
    Copy,
    PartialEq,
    Eq,
    Debug,
    Encode,
    Decode,
    DecodeWithMemTracking,
    MaxEncodedLen,
    TypeInfo,
)]
pub enum CommitId {
    #[codec(index = 0)]
    Sha1([u8; 20]),
    #[codec(index = 1)]
    Sha256([u8; 32]),
}

/// The per-asset record: the part of ADR-047 decision 7 that M4.1 needs.
///
/// `pallet-nfts` keeps who owns it. This keeps what it is.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Encode, Decode, MaxEncodedLen, TypeInfo)]
pub struct Asset {
    /// The reference it was minted with. Never written again.
    pub origin: ContentRef,
    /// The reference it carries now. Equal to `origin` until it is revised.
    pub current: ContentRef,
    /// The commit `current` was taken from, if it came from a repository.
    pub commit: Option<CommitId>,
    /// Whether it may still be revised. One-way: `true` may become `false`,
    /// and nothing makes it `true` again.
    pub revisable: bool,
    /// The asset this one was derived from, if its minter declared one. Never
    /// written after mint (ADR-047 decision 7, ADR-061).
    pub derived_from: Option<(CollectionId, ItemId)>,
    /// How many remixes deep it is: `0` for an original, the parent's depth
    /// plus one for a remix. Bounded at mint by [`Config::MaxRemixDepth`].
    pub remix_depth: u8,
}

/// A creator's singles collection, and the next item id in it.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Encode, Decode, MaxEncodedLen, TypeInfo)]
pub struct SinglesCollection {
    pub collection: CollectionId,
    pub next_item: ItemId,
}

/// One asset an account holds, as the runtime API returns it.
#[derive(Clone, PartialEq, Eq, Debug, Encode, Decode, TypeInfo)]
pub struct OwnedAsset {
    pub collection: CollectionId,
    pub item: ItemId,
    pub asset: Asset,
    /// The item's `pallet-nfts` metadata, which a mint sets to the asset's name.
    pub name: Vec<u8>,
}

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::{
        pallet_prelude::*,
        traits::tokens::nonfungibles_v2::{Create, Mutate},
    };
    use frame_system::pallet_prelude::*;
    use pallet_nfts::{
        CollectionConfig, CollectionSettings, ItemConfig, ItemSettings, MintSettings,
    };

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    /// Tightly coupled to `pallet-nfts`, whose identifiers ADR-047 fixes at
    /// `u32`/`u32`. `RuntimeEvent` is inherited from `frame_system::Config`.
    #[pallet::config]
    pub trait Config:
        polkadot_sdk::frame_system::Config
        + pallet_nfts::Config<CollectionId = CollectionId, ItemId = ItemId>
    {
        /// Placeholders until M7.2 benchmarks them. See [`crate::weights`].
        type WeightInfo: WeightInfo;

        /// How many remixes deep an asset may be (ADR-047 decision 13 row 7:
        /// `16`, an engineering bound and part of the wire format).
        #[pallet::constant]
        type MaxRemixDepth: Get<u8>;
    }

    /// Each creator's singles collection. Written by the creator's first mint,
    /// and never by anything else.
    #[pallet::storage]
    pub type Singles<T: Config> =
        StorageMap<_, Blake2_128Concat, T::AccountId, SinglesCollection, OptionQuery>;

    /// What each asset is. Who holds it is `pallet-nfts`'s `Item` and `Account`.
    #[pallet::storage]
    pub type Assets<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        CollectionId,
        Blake2_128Concat,
        ItemId,
        Asset,
        OptionQuery,
    >;

    /// How many remixes name each asset as their source. Written only by a
    /// remix's mint. `pallet-drc369-royalties` reads it: once a work has been
    /// remixed, its remix share may not rise (ADR-062).
    #[pallet::storage]
    pub type RemixCount<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        CollectionId,
        Blake2_128Concat,
        ItemId,
        u32,
        ValueQuery,
    >;

    /// Every event carries what an indexer needs, because it can recover nothing
    /// an event leaves out (ADR-047 decision 12, ADR-028).
    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// A creator's first mint created their singles collection.
        SinglesCollectionCreated {
            creator: T::AccountId,
            collection: CollectionId,
        },
        /// An asset was minted.
        Minted {
            collection: CollectionId,
            item: ItemId,
            owner: T::AccountId,
            by: T::AccountId,
            origin: ContentRef,
            commit: Option<CommitId>,
            revisable: bool,
            /// The asset it was derived from, if it is a remix.
            derived_from: Option<(CollectionId, ItemId)>,
        },
        /// An asset now carries a new content reference.
        Revised {
            collection: CollectionId,
            item: ItemId,
            from: ContentRef,
            to: ContentRef,
            commit: Option<CommitId>,
            by: T::AccountId,
        },
        /// An asset was made permanent: it can never be revised again. `content`
        /// is the reference it is now fixed at. Named `Locked` in ADR-047
        /// decision 12.
        Locked {
            collection: CollectionId,
            item: ItemId,
            content: ContentRef,
            by: T::AccountId,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// The reference is tagged with an algorithm a mint does not accept.
        /// Only BLAKE3-256 is accepted today (ADR-047, decision 1).
        UnsupportedAlgorithm,
        /// The reference says its manifest is zero bytes long, which no manifest
        /// is.
        EmptyContent,
        /// No DRC-369 asset has that collection and item.
        UnknownAsset,
        /// Only the asset's owner may do that.
        NotOwner,
        /// The asset was made permanent and can never be revised.
        Permanent,
        /// The asset is already permanent.
        AlreadyPermanent,
        /// The revision names the content and commit the asset already carries.
        Unchanged,
        /// The creator's singles collection has used every item id.
        NoItemIdsLeft,
        /// The asset a remix names as its source is not a DRC-369 asset.
        UnknownSource,
        /// The remix would be deeper than `MaxRemixDepth` allows.
        RemixTooDeep,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Mint an asset to the signer, in the signer's singles collection.
        ///
        /// The signer's first mint creates that collection, and pays its deposit.
        /// `name` becomes the item's `pallet-nfts` metadata, where wallets and
        /// explorers already look for it.
        ///
        /// `derived_from` names the asset this one remixes, if any. Naming one is
        /// open to anyone — it obliges the remix, not its source — and cannot be
        /// changed afterwards. Its depth is checked here, so nothing later has to
        /// walk the remix graph.
        #[pallet::call_index(0)]
        #[pallet::weight(<T as Config>::WeightInfo::mint())]
        pub fn mint(
            origin: OriginFor<T>,
            content: ContentRef,
            commit: Option<CommitId>,
            name: BoundedVec<u8, <T as pallet_nfts::Config>::StringLimit>,
            revisable: bool,
            derived_from: Option<(CollectionId, ItemId)>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            Self::accept(&content)?;
            // Checked before the new item exists, so a remix cannot name itself.
            let remix_depth = Self::remix_depth_under(derived_from)?;

            let (collection, item) = Self::next_single(&who)?;

            let item_config = ItemConfig {
                settings: ItemSettings::all_enabled(),
            };
            // The minter pays the item deposit (`false`: not the collection owner,
            // though today they are the same account).
            <pallet_nfts::Pallet<T> as Mutate<T::AccountId, ItemConfig>>::mint_into(
                &collection,
                &item,
                &who,
                &item_config,
                false,
            )?;
            if !name.is_empty() {
                <pallet_nfts::Pallet<T> as Mutate<T::AccountId, ItemConfig>>::set_item_metadata(
                    Some(&who),
                    &collection,
                    &item,
                    &name,
                )?;
            }

            if let Some((source_collection, source_item)) = derived_from {
                RemixCount::<T>::mutate(source_collection, source_item, |count| {
                    *count = count.saturating_add(1)
                });
            }
            Assets::<T>::insert(
                collection,
                item,
                Asset {
                    origin: content,
                    current: content,
                    commit,
                    revisable,
                    derived_from,
                    remix_depth,
                },
            );

            Self::deposit_event(Event::Minted {
                collection,
                item,
                owner: who.clone(),
                by: who,
                origin: content,
                commit,
                revisable,
                derived_from,
            });
            Ok(())
        }

        /// Carry a new version: the owner points the asset at new content.
        ///
        /// Refused once the asset is permanent. `origin` is untouched.
        #[pallet::call_index(1)]
        #[pallet::weight(<T as Config>::WeightInfo::revise())]
        pub fn revise(
            origin: OriginFor<T>,
            collection: CollectionId,
            item: ItemId,
            content: ContentRef,
            commit: Option<CommitId>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            Self::accept(&content)?;

            Assets::<T>::try_mutate(collection, item, |maybe| -> DispatchResult {
                let asset = maybe.as_mut().ok_or(Error::<T>::UnknownAsset)?;
                Self::ensure_owner(&who, collection, item)?;
                ensure!(asset.revisable, Error::<T>::Permanent);
                ensure!(
                    asset.current != content || asset.commit != commit,
                    Error::<T>::Unchanged
                );

                let from = asset.current;
                asset.current = content;
                asset.commit = commit;

                Self::deposit_event(Event::Revised {
                    collection,
                    item,
                    from,
                    to: content,
                    commit,
                    by: who,
                });
                Ok(())
            })
        }

        /// Make an asset permanent. **One-way:** there is no call that undoes it.
        #[pallet::call_index(2)]
        #[pallet::weight(<T as Config>::WeightInfo::make_permanent())]
        pub fn make_permanent(
            origin: OriginFor<T>,
            collection: CollectionId,
            item: ItemId,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;

            Assets::<T>::try_mutate(collection, item, |maybe| -> DispatchResult {
                let asset = maybe.as_mut().ok_or(Error::<T>::UnknownAsset)?;
                Self::ensure_owner(&who, collection, item)?;
                ensure!(asset.revisable, Error::<T>::AlreadyPermanent);

                asset.revisable = false;

                Self::deposit_event(Event::Locked {
                    collection,
                    item,
                    content: asset.current,
                    by: who,
                });
                Ok(())
            })
        }
    }

    impl<T: Config> Pallet<T> {
        /// A reference a mint or a revision will carry.
        fn accept(content: &ContentRef) -> DispatchResult {
            ensure!(
                content.algo == HashAlgo::Blake3_256,
                Error::<T>::UnsupportedAlgorithm
            );
            ensure!(content.size > 0, Error::<T>::EmptyContent);
            Ok(())
        }

        /// The depth a remix of `source` would have: `0` for no source, and
        /// the source's depth plus one otherwise, refused past the bound.
        fn remix_depth_under(source: Option<(CollectionId, ItemId)>) -> Result<u8, DispatchError> {
            let Some((collection, item)) = source else {
                return Ok(0);
            };
            let parent = Assets::<T>::get(collection, item).ok_or(Error::<T>::UnknownSource)?;
            let depth = parent
                .remix_depth
                .checked_add(1)
                .ok_or(Error::<T>::RemixTooDeep)?;
            ensure!(depth <= T::MaxRemixDepth::get(), Error::<T>::RemixTooDeep);
            Ok(depth)
        }

        fn ensure_owner(
            who: &T::AccountId,
            collection: CollectionId,
            item: ItemId,
        ) -> DispatchResult {
            ensure!(
                pallet_nfts::Pallet::<T>::owner(collection, item).as_ref() == Some(who),
                Error::<T>::NotOwner
            );
            Ok(())
        }

        /// The creator's singles collection and the next item id in it, creating
        /// the collection if this is the creator's first mint.
        fn next_single(creator: &T::AccountId) -> Result<(CollectionId, ItemId), DispatchError> {
            let mut singles = match Singles::<T>::get(creator) {
                Some(singles) => singles,
                None => {
                    // The creator owns it, pays its deposit and administers it.
                    let collection = <pallet_nfts::Pallet<T> as Create<
                        T::AccountId,
                        pallet_nfts::CollectionConfigFor<T>,
                    >>::create_collection(
                        creator, creator, &Self::singles_config()
                    )?;
                    Self::deposit_event(Event::SinglesCollectionCreated {
                        creator: creator.clone(),
                        collection,
                    });
                    SinglesCollection {
                        collection,
                        next_item: 0,
                    }
                }
            };

            let item = singles.next_item;
            singles.next_item = item.checked_add(1).ok_or(Error::<T>::NoItemIdsLeft)?;
            Singles::<T>::insert(creator, singles);
            Ok((singles.collection, item))
        }

        /// Deposits required, items transferable, no supply cap, and only the
        /// issuer may mint — which, behind the runtime's call filter, means only
        /// this pallet.
        fn singles_config() -> pallet_nfts::CollectionConfigFor<T> {
            CollectionConfig {
                settings: CollectionSettings::all_enabled(),
                max_supply: None,
                mint_settings: MintSettings::default(),
            }
        }

        /// Every DRC-369 asset `owner` holds, read from `pallet-nfts`'s owner
        /// index. An item that index lists without a DRC-369 record is not a
        /// DRC-369 asset and is left out.
        pub fn assets_of(owner: &T::AccountId) -> Vec<OwnedAsset> {
            pallet_nfts::Account::<T>::iter_key_prefix((owner.clone(),))
                .filter_map(|(collection, item)| {
                    let asset = Assets::<T>::get(collection, item)?;
                    let name = pallet_nfts::ItemMetadataOf::<T>::get(collection, item)
                        .map(|metadata| metadata.data.into_inner())
                        .unwrap_or_default();
                    Some(OwnedAsset {
                        collection,
                        item,
                        asset,
                        name,
                    })
                })
                .collect()
        }

        /// How many remixes name this asset as their source.
        pub fn remixes_of(collection: CollectionId, item: ItemId) -> u32 {
            RemixCount::<T>::get(collection, item)
        }

        /// One asset's record, if it is a DRC-369 asset.
        pub fn asset(collection: CollectionId, item: ItemId) -> Option<Asset> {
            Assets::<T>::get(collection, item)
        }
    }
}

/// The runtime API a client reads DRC-369 through, besides raw storage.
pub mod runtime_api {
    use super::*;

    sp_api::decl_runtime_apis! {
        /// DRC-369 assets, read from chain state.
        pub trait Drc369Api<AccountId> where AccountId: codec::Codec {
            /// Every DRC-369 asset `owner` holds.
            fn assets_of(owner: AccountId) -> Vec<OwnedAsset>;
            /// One asset's record, if `(collection, item)` is a DRC-369 asset.
            fn asset(collection: CollectionId, item: ItemId) -> Option<Asset>;
        }
    }
}
