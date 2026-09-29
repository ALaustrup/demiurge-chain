//! DRC-369 royalties, and remix royalties, settled in CGT (M4.2, ADR-061).
//!
//! # What a royalty can bind to
//!
//! A plain transfer names no price, so nothing can be taken from it — on this
//! chain or any other (ADR-047's constraint table, inventory F-D5). A royalty
//! binds only to a sale the chain itself settles. So this pallet holds both
//! halves, and nothing else:
//!
//! - **the terms** an asset's creator sets, and may change while they still
//!   hold it (ADR-062): up to
//!   [`Config::MaxRoyaltyRecipients`] recipients, each with a share of every sale
//!   (a `Permill`), and a **remix share** — what a sale of any asset derived from
//!   this one owes this one's recipients;
//! - **the settled sale**: an owner lists an asset at a price in CGT, and a buyer
//!   pays it. One transaction pays the remix share upstream, then the royalties,
//!   then the seller, and hands the asset over. All of it happens, or none of it.
//!
//! # The arithmetic, in one place
//!
//! [`split`] is the whole of it, a pure function, and every CGT amount this
//! pallet moves comes out of it. For a price `p`:
//!
//! 1. **Upstream.** If the asset was derived from a source that has terms, the
//!    pool is the source's remix share of `p`, rounded down. It is divided
//!    between the source's recipients in proportion to their shares, each part
//!    rounded down.
//! 2. **Royalties.** Each of the asset's own recipients receives their share of
//!    what the upstream payments left, rounded down. Shares apply to the
//!    remainder, not to `p`, so the two never add up to more than the price,
//!    whatever order the terms were set in.
//! 3. **The seller** receives everything else, rounding included.
//!
//! The parts always sum to exactly `p`. Every fraction uses the SDK's own helpers
//! — `Permill::mul_floor` and `multiply_by_rational_with_rounding` — never a
//! hand-written `a * b / c` (AGENTS.md §5, ADR-035), and the test
//! `the_largest_intermediate_cannot_overflow` pins that `p = u128::MAX` is safe.
//!
//! # One level of remix, by design
//!
//! A sale pays its direct source only, never the source's source. Paying the
//! whole ancestry would mean walking the remix graph inside a sale's weight,
//! which ADR-047 decision 11 forbids. A creator who wants their work's remixes'
//! remixes to pay them is paid by the remix in between, whose own remix share
//! they cannot set — see ADR-061 for why that is accepted.
//!
//! # What this pallet does not do
//!
//! It takes no platform share (U-15 is open, and no treasury exists), charges no
//! fee (OPEN-4) and creates no CGT. A listing and a set of terms are bounded,
//! one of each per asset, and carry no deposit of their own: an asset's own
//! deposits already bound how many can exist (ADR-061, U-14).
//!
//! # Weights
//!
//! **Placeholders, not benchmarks** — debt owed to M7.2. See [`weights`].

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

use alloc::vec::Vec;
use polkadot_sdk::*;
use sp_arithmetic::{
    helpers_128bit::multiply_by_rational_with_rounding, per_things::Rounding, PerThing, Permill,
};

pub use pallet::*;
pub use weights::WeightInfo;

#[cfg(test)]
mod mock;
#[cfg(test)]
mod tests;
pub mod weights;

pub use pallet_drc369::{CollectionId, ItemId};

/// An amount of CGT, in Sparks (AGENTS.md §5): the runtime's balance type.
pub type Balance = u128;

/// How one sale's price is divided. Every amount this pallet moves comes from
/// here, and the three parts always sum to the price.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Split<AccountId> {
    /// What the source's recipients receive, if the asset is a remix.
    pub remix: Vec<(AccountId, Balance)>,
    /// What the asset's own recipients receive.
    pub royalties: Vec<(AccountId, Balance)>,
    /// What the seller receives: everything else.
    pub seller: Balance,
}

/// Divide `price` between a remix's source, the asset's own recipients and the
/// seller. See the module documentation for the rule.
///
/// `upstream` is the source's remix share and the source's recipients. Shares of
/// zero never occur in stored terms (`set_terms` refuses them); if every share
/// in `upstream` were zero, nothing would be paid upstream.
pub fn split<AccountId: Clone>(
    price: Balance,
    upstream: Option<(Permill, &[(AccountId, Permill)])>,
    own: &[(AccountId, Permill)],
) -> Split<AccountId> {
    let mut remix = Vec::new();
    let mut paid_upstream: Balance = 0;
    if let Some((share, recipients)) = upstream {
        let pool = share.mul_floor(price);
        let weights: u128 = recipients
            .iter()
            .map(|(_, part)| u128::from(part.deconstruct()))
            .sum();
        if weights > 0 {
            for (who, part) in recipients {
                // `part <= weights`, so the result is at most `pool` and the
                // helper cannot report an overflow.
                let amount = multiply_by_rational_with_rounding(
                    pool,
                    u128::from(part.deconstruct()),
                    weights,
                    Rounding::Down,
                )
                .unwrap_or(0);
                paid_upstream = paid_upstream.saturating_add(amount);
                remix.push((who.clone(), amount));
            }
        }
    }

    // `paid_upstream <= pool <= price`.
    let rest = price.saturating_sub(paid_upstream);
    let mut paid_own: Balance = 0;
    let royalties = own
        .iter()
        .map(|(who, share)| {
            let amount = share.mul_floor(rest);
            paid_own = paid_own.saturating_add(amount);
            (who.clone(), amount)
        })
        .collect();

    // Stored shares sum to at most one whole, so `paid_own <= rest`.
    Split {
        remix,
        royalties,
        seller: rest.saturating_sub(paid_own),
    }
}

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::{
        pallet_prelude::*,
        traits::{
            fungible::{Inspect, Mutate},
            tokens::{nonfungibles_v2::Transfer, DepositConsequence, Preservation, Provenance},
        },
        CloneNoBound, DebugNoBound, EqNoBound, PartialEqNoBound,
    };
    use frame_system::pallet_prelude::*;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    /// Tightly coupled to `pallet-drc369`, whose records say what an asset is and
    /// what it was derived from, and through it to `pallet-nfts`, which says who
    /// holds it. `RuntimeEvent` is inherited from `frame_system::Config`.
    #[pallet::config]
    pub trait Config: polkadot_sdk::frame_system::Config + pallet_drc369::Config {
        /// CGT. A sale is paid in it and nothing else.
        type Currency: Mutate<Self::AccountId, Balance = Balance>;

        /// How many recipients one asset's terms may name. `8` (ADR-047 decision
        /// 13 row 7, confirmed by the owner in ADR-057). Part of the wire format.
        #[pallet::constant]
        type MaxRoyaltyRecipients: Get<u32>;

        /// Placeholders until M7.2 benchmarks them. See [`crate::weights`].
        type WeightInfo: WeightInfo;
    }

    /// An asset's royalty terms: who is paid from each sale, and what a sale of
    /// a remix of it owes them.
    #[derive(
        CloneNoBound,
        PartialEqNoBound,
        EqNoBound,
        DebugNoBound,
        Encode,
        Decode,
        DecodeWithMemTracking,
        MaxEncodedLen,
        TypeInfo,
    )]
    #[scale_info(skip_type_params(T))]
    #[codec(mel_bound())]
    pub struct Terms<T: Config> {
        /// Each recipient and their share of every sale of this asset. No
        /// account appears twice, no share is zero, and the shares sum to at
        /// most one whole.
        pub recipients: BoundedVec<(T::AccountId, Permill), T::MaxRoyaltyRecipients>,
        /// The share of every sale of a remix of this asset that is paid to
        /// `recipients`, divided in proportion to their shares. Zero when there
        /// are no recipients.
        pub remix: Permill,
    }

    /// An asset offered for sale at a fixed price in CGT.
    #[derive(
        Clone, PartialEq, Eq, Debug, Encode, Decode, DecodeWithMemTracking, MaxEncodedLen, TypeInfo,
    )]
    pub struct Listing<AccountId> {
        /// Who listed it. A sale goes ahead only while they still hold it.
        pub seller: AccountId,
        /// The price, in Sparks.
        pub price: Balance,
    }

    /// Each asset's royalty terms. Written by the asset's creator, and changed
    /// only while they still hold it, so no buyer ever holds an asset whose
    /// terms change under them (ADR-062).
    #[pallet::storage]
    pub type RoyaltyTerms<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        CollectionId,
        Blake2_128Concat,
        ItemId,
        Terms<T>,
        OptionQuery,
    >;

    /// Assets offered for sale. At most one listing per asset.
    #[pallet::storage]
    pub type Listings<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        CollectionId,
        Blake2_128Concat,
        ItemId,
        Listing<T::AccountId>,
        OptionQuery,
    >;

    /// Every event carries what an indexer needs, because it can recover nothing
    /// an event leaves out (ADR-047 decision 12, ADR-028).
    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// An asset's creator set its royalty terms, or changed them.
        TermsSet {
            collection: CollectionId,
            item: ItemId,
            recipients: Vec<(T::AccountId, Permill)>,
            remix: Permill,
            by: T::AccountId,
        },
        /// An asset was offered for sale, or its price changed.
        Listed {
            collection: CollectionId,
            item: ItemId,
            seller: T::AccountId,
            price: Balance,
        },
        /// A listing was withdrawn.
        Unlisted {
            collection: CollectionId,
            item: ItemId,
            by: T::AccountId,
        },
        /// An asset was sold and settled on chain. `remix` is what the source's
        /// recipients received and `royalties` what the asset's own recipients
        /// received; `seller_received` is the rest. Together they are `price`.
        Sold {
            collection: CollectionId,
            item: ItemId,
            from: T::AccountId,
            to: T::AccountId,
            price: Balance,
            source: Option<(CollectionId, ItemId)>,
            remix: Vec<(T::AccountId, Balance)>,
            royalties: Vec<(T::AccountId, Balance)>,
            seller_received: Balance,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// No DRC-369 asset has that collection and item.
        UnknownAsset,
        /// Only the asset's holder may do that.
        NotOwner,
        /// Only the asset's creator, while they still hold it, may set its terms.
        NotCreator,
        /// The asset has been remixed, so its remix share may be lowered but not
        /// raised: the remixes were made on the share it had (ADR-062).
        RemixShareLocked,
        /// The shares add up to more than the whole price.
        SharesExceedWhole,
        /// A share of zero names a recipient who would receive nothing.
        ZeroShare,
        /// The same account is named twice.
        DuplicateRecipient,
        /// A remix share needs at least one recipient to pay it to.
        RemixShareWithoutRecipients,
        /// A price of nothing is a gift, which is a transfer, not a sale.
        ZeroPrice,
        /// The asset is not listed.
        NotListed,
        /// Whoever listed the asset no longer holds it; the listing is void.
        ListingStale,
        /// The seller cannot buy their own listing.
        OwnListing,
        /// The price is above what the buyer agreed to pay.
        PriceAboveLimit,
        /// A recipient cannot receive their part — most often because it is below
        /// the existential deposit and their account does not exist yet. The
        /// whole sale is refused rather than paying anyone else their part.
        PaymentCannotBeReceived,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Set an asset's royalty terms, or change them.
        ///
        /// Only the asset's creator — the owner of the collection it was minted
        /// into — and only while they hold it, so a creator can correct a
        /// mistake but never change the terms of an asset someone else holds.
        /// `remix` is the share of every sale of a remix of this asset owed to
        /// `recipients`; once the asset has been remixed it may be lowered, never
        /// raised (ADR-062).
        #[pallet::call_index(0)]
        #[pallet::weight(<T as Config>::WeightInfo::set_terms())]
        pub fn set_terms(
            origin: OriginFor<T>,
            collection: CollectionId,
            item: ItemId,
            recipients: BoundedVec<(T::AccountId, Permill), T::MaxRoyaltyRecipients>,
            remix: Permill,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            Self::ensure_asset(collection, item)?;
            ensure!(
                pallet_nfts::Pallet::<T>::collection_owner(collection).as_ref() == Some(&who)
                    && Self::holder(collection, item).as_ref() == Some(&who),
                Error::<T>::NotCreator
            );
            if pallet_drc369::Pallet::<T>::remixes_of(collection, item) > 0 {
                let current = RoyaltyTerms::<T>::get(collection, item)
                    .map(|terms| terms.remix)
                    .unwrap_or_else(Permill::zero);
                ensure!(remix <= current, Error::<T>::RemixShareLocked);
            }

            let mut total: u32 = 0;
            for (index, (account, share)) in recipients.iter().enumerate() {
                ensure!(!share.is_zero(), Error::<T>::ZeroShare);
                ensure!(
                    !recipients[..index]
                        .iter()
                        .any(|(other, _)| other == account),
                    Error::<T>::DuplicateRecipient
                );
                // At most eight parts of a million each: no overflow.
                total = total.saturating_add(share.deconstruct());
            }
            ensure!(total <= Permill::ACCURACY, Error::<T>::SharesExceedWhole);
            ensure!(
                remix.is_zero() || !recipients.is_empty(),
                Error::<T>::RemixShareWithoutRecipients
            );

            RoyaltyTerms::<T>::insert(
                collection,
                item,
                Terms::<T> {
                    recipients: recipients.clone(),
                    remix,
                },
            );
            Self::deposit_event(Event::TermsSet {
                collection,
                item,
                recipients: recipients.into_inner(),
                remix,
                by: who,
            });
            Ok(())
        }

        /// Offer an asset for sale at `price`, or change the price it is offered
        /// at. Only its holder.
        #[pallet::call_index(1)]
        #[pallet::weight(<T as Config>::WeightInfo::list())]
        pub fn list(
            origin: OriginFor<T>,
            collection: CollectionId,
            item: ItemId,
            price: Balance,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            Self::ensure_asset(collection, item)?;
            ensure!(
                Self::holder(collection, item).as_ref() == Some(&who),
                Error::<T>::NotOwner
            );
            ensure!(price > 0, Error::<T>::ZeroPrice);

            Listings::<T>::insert(
                collection,
                item,
                Listing {
                    seller: who.clone(),
                    price,
                },
            );
            Self::deposit_event(Event::Listed {
                collection,
                item,
                seller: who,
                price,
            });
            Ok(())
        }

        /// Withdraw a listing. Its seller or the asset's holder may; so may
        /// anyone once the listing is void because the seller no longer holds the
        /// asset, which clears state nobody can use.
        #[pallet::call_index(2)]
        #[pallet::weight(<T as Config>::WeightInfo::unlist())]
        pub fn unlist(
            origin: OriginFor<T>,
            collection: CollectionId,
            item: ItemId,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            let listing = Listings::<T>::get(collection, item).ok_or(Error::<T>::NotListed)?;
            let holder = Self::holder(collection, item);
            let void = holder.as_ref() != Some(&listing.seller);
            ensure!(
                void || who == listing.seller || holder.as_ref() == Some(&who),
                Error::<T>::NotOwner
            );

            Listings::<T>::remove(collection, item);
            Self::deposit_event(Event::Unlisted {
                collection,
                item,
                by: who,
            });
            Ok(())
        }

        /// Buy a listed asset. `max_price` is the most the buyer agrees to pay,
        /// so a price raised after they looked cannot be taken from them.
        ///
        /// Pays the remix share upstream, then the royalties, then the seller,
        /// then hands the asset over, in one transaction: if any part fails,
        /// nothing moves.
        #[pallet::call_index(3)]
        #[pallet::weight(<T as Config>::WeightInfo::buy())]
        pub fn buy(
            origin: OriginFor<T>,
            collection: CollectionId,
            item: ItemId,
            max_price: Balance,
        ) -> DispatchResult {
            let buyer = ensure_signed(origin)?;
            let listing = Listings::<T>::get(collection, item).ok_or(Error::<T>::NotListed)?;
            let asset = Self::ensure_asset(collection, item)?;
            ensure!(
                Self::holder(collection, item).as_ref() == Some(&listing.seller),
                Error::<T>::ListingStale
            );
            ensure!(buyer != listing.seller, Error::<T>::OwnListing);
            ensure!(listing.price <= max_price, Error::<T>::PriceAboveLimit);

            let source_terms = asset
                .derived_from
                .and_then(|(c, i)| RoyaltyTerms::<T>::get(c, i));
            let own_terms = RoyaltyTerms::<T>::get(collection, item);
            let split = split(
                listing.price,
                source_terms
                    .as_ref()
                    .map(|terms| (terms.remix, &terms.recipients[..])),
                own_terms
                    .as_ref()
                    .map(|terms| &terms.recipients[..])
                    .unwrap_or(&[]),
            );

            for (to, amount) in split.remix.iter().chain(split.royalties.iter()) {
                Self::pay(&buyer, to, *amount)?;
            }
            Self::pay(&buyer, &listing.seller, split.seller)?;

            <pallet_nfts::Pallet<T> as Transfer<T::AccountId>>::transfer(
                &collection,
                &item,
                &buyer,
            )?;
            Listings::<T>::remove(collection, item);

            Self::deposit_event(Event::Sold {
                collection,
                item,
                from: listing.seller,
                to: buyer,
                price: listing.price,
                source: asset.derived_from,
                remix: split.remix,
                royalties: split.royalties,
                seller_received: split.seller,
            });
            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        fn ensure_asset(
            collection: CollectionId,
            item: ItemId,
        ) -> Result<pallet_drc369::Asset, DispatchError> {
            pallet_drc369::Pallet::<T>::asset(collection, item)
                .ok_or_else(|| Error::<T>::UnknownAsset.into())
        }

        fn holder(collection: CollectionId, item: ItemId) -> Option<T::AccountId> {
            pallet_nfts::Pallet::<T>::owner(collection, item)
        }

        /// Move `amount` from the buyer, who must keep their account alive. A
        /// payment to the buyer themselves, or of nothing, moves nothing.
        fn pay(buyer: &T::AccountId, to: &T::AccountId, amount: Balance) -> DispatchResult {
            if amount == 0 || to == buyer {
                return Ok(());
            }
            ensure!(
                <<T as Config>::Currency as Inspect<T::AccountId>>::can_deposit(
                    to,
                    amount,
                    Provenance::Extant
                ) == DepositConsequence::Success,
                Error::<T>::PaymentCannotBeReceived
            );
            <<T as Config>::Currency as Mutate<T::AccountId>>::transfer(
                buyer,
                to,
                amount,
                Preservation::Preserve,
            )?;
            Ok(())
        }

        /// An asset's royalty terms, if its creator set them.
        pub fn terms(collection: CollectionId, item: ItemId) -> Option<Terms<T>> {
            RoyaltyTerms::<T>::get(collection, item)
        }

        /// An asset's listing, if it is offered for sale.
        pub fn listing(collection: CollectionId, item: ItemId) -> Option<Listing<T::AccountId>> {
            Listings::<T>::get(collection, item)
        }
    }
}
