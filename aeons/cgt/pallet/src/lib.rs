//! # Creator God Token (CGT) Pallet
//!
//! The divine currency of the Demiurge-Cloud ecosystem.
//!
//! ## Overview
//!
//! CGT is the native token with:
//! - **Total Supply**: 13,000,000,000 (13 Billion) - Fixed
//! - **Decimals**: 8
//! - **Symbol**: CGT
//! - **Smallest Unit**: 1 Spark (0.00000001 CGT)
//!
//! ## Tokenomics: "The Creation Model"
//!
//! Distribution designed to reward creators and validators:
//!
//! | Bucket               | Allocation | Amount (CGT)  | Purpose                           |
//! |----------------------|------------|---------------|-----------------------------------|
//! | Pleroma Mining       | 40%        | 5,200,000,000 | In-game creation & Play-to-Earn   |
//! | Archon Staking       | 20%        | 2,600,000,000 | Validator/Nominator rewards       |
//! | Demiurge Treasury    | 15%        | 1,950,000,000 | DAO-managed ecosystem growth      |
//! | Core Team & Founders | 15%        | 1,950,000,000 | 4-year linear vesting             |
//! | Genesis Offering     | 10%        | 1,300,000,000 | Initial public liquidity          |
//!
//! ## Gnostic Philosophy
//!
//! The Creator God Token represents the creative power of the Demiurge—
//! the ability to shape reality within the blockchain. Each CGT is a
//! fragment of divine creative potential.

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::{Currency, ReservableCurrency, ExistenceRequirement},
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::{AtLeast32BitUnsigned, CheckedAdd, CheckedSub, Zero};

    /// CGT precision: 8 decimal places
    pub const CGT_DECIMALS: u8 = 8;
    
    /// One CGT in smallest units (Sparks)
    pub const CGT_UNIT: u128 = 100_000_000; // 10^8
    
    /// CGT total supply: 13,000,000,000 (13 billion)
    /// With 8 decimals: 13_000_000_000 * 10^8 = 1_300_000_000_000_000_000
    pub const CGT_TOTAL_SUPPLY: u128 = 13_000_000_000 * CGT_UNIT;
    
    /// CGT symbol
    pub const CGT_SYMBOL: &str = "CGT";
    
    /// CGT name
    pub const CGT_NAME: &str = "Creator God Token";
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TOKENOMICS: The Creation Model - Distribution Buckets
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// 40% - Pleroma Mining: In-game creation rewards & Play-to-Earn
    pub const PLEROMA_MINING_ALLOCATION: u128 = 5_200_000_000 * CGT_UNIT;
    
    /// 20% - Archon Staking: Validator/Nominator rewards (NPoS)
    pub const ARCHON_STAKING_ALLOCATION: u128 = 2_600_000_000 * CGT_UNIT;
    
    /// 15% - Demiurge Treasury: DAO-managed ecosystem growth
    pub const TREASURY_ALLOCATION: u128 = 1_950_000_000 * CGT_UNIT;
    
    /// 15% - Core Team & Founders: 4-year linear vesting
    pub const TEAM_ALLOCATION: u128 = 1_950_000_000 * CGT_UNIT;
    
    /// 10% - Initial Genesis Offering: Public liquidity
    pub const GENESIS_OFFERING_ALLOCATION: u128 = 1_300_000_000 * CGT_UNIT;
    
    /// Existential deposit: 0.001 CGT (prevents dust accounts)
    pub const EXISTENTIAL_DEPOSIT: u128 = CGT_UNIT / 1000;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    /// Configure the pallet by specifying the parameters and types on which it depends.
    #[pallet::config]
    pub trait Config: frame_system::Config {
        /// The overarching runtime event type.
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        /// The balance type for CGT.
        type Balance: Member
            + Parameter
            + AtLeast32BitUnsigned
            + Default
            + Copy
            + MaybeSerializeDeserialize
            + MaxEncodedLen
            + TypeInfo
            + CheckedAdd
            + CheckedSub;
        
        /// The minimum balance required to keep an account open.
        #[pallet::constant]
        type ExistentialDeposit: Get<Self::Balance>;
        
        /// Maximum number of locks on an account.
        #[pallet::constant]
        type MaxLocks: Get<u32>;
        
        /// Maximum number of reserves on an account.
        #[pallet::constant]
        type MaxReserves: Get<u32>;
    }

    /// The total issuance of CGT.
    #[pallet::storage]
    #[pallet::getter(fn total_issuance)]
    pub type TotalIssuance<T: Config> = StorageValue<_, T::Balance, ValueQuery>;

    /// The balance of each account.
    #[pallet::storage]
    #[pallet::getter(fn balance_of)]
    pub type Balances<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        T::Balance,
        ValueQuery,
    >;

    /// Reserved balance for each account (used for staking, governance, etc.).
    #[pallet::storage]
    #[pallet::getter(fn reserved_balance)]
    pub type Reserved<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        T::Balance,
        ValueQuery,
    >;

    /// Locks on an account's balance.
    #[pallet::storage]
    pub type Locks<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        BoundedVec<BalanceLock<T::Balance>, T::MaxLocks>,
        ValueQuery,
    >;

    /// A balance lock.
    #[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, MaxEncodedLen, TypeInfo)]
    pub struct BalanceLock<Balance> {
        /// Identifier for the lock.
        pub id: [u8; 8],
        /// Amount locked.
        pub amount: Balance,
    }

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// CGT transferred. \[from, to, amount\]
        Transfer {
            from: T::AccountId,
            to: T::AccountId,
            amount: T::Balance,
        },
        /// CGT minted (genesis only). \[to, amount\]
        Minted {
            to: T::AccountId,
            amount: T::Balance,
        },
        /// CGT burned. \[from, amount\]
        Burned {
            from: T::AccountId,
            amount: T::Balance,
        },
        /// CGT reserved. \[who, amount\]
        Reserved {
            who: T::AccountId,
            amount: T::Balance,
        },
        /// CGT unreserved. \[who, amount\]
        Unreserved {
            who: T::AccountId,
            amount: T::Balance,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Insufficient balance for transfer.
        InsufficientBalance,
        /// Insufficient reserved balance.
        InsufficientReservedBalance,
        /// Balance overflow.
        Overflow,
        /// Balance underflow.
        Underflow,
        /// Account would be killed (below existential deposit).
        ExistentialDeposit,
        /// Too many locks on account.
        TooManyLocks,
        /// Transfer to self not allowed.
        TransferToSelf,
    }

    #[pallet::genesis_config]
    #[derive(frame_support::DefaultNoBound)]
    pub struct GenesisConfig<T: Config> {
        /// Initial balances for accounts.
        pub balances: Vec<(T::AccountId, T::Balance)>,
    }

    #[pallet::genesis_build]
    impl<T: Config> BuildGenesisConfig for GenesisConfig<T> {
        fn build(&self) {
            let mut total: T::Balance = Zero::zero();
            
            for (account, balance) in &self.balances {
                Balances::<T>::insert(account, balance);
                total = total.checked_add(balance).expect("CGT: Genesis overflow");
            }
            
            TotalIssuance::<T>::put(total);
        }
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Transfer CGT from the caller to another account.
        ///
        /// # Arguments
        /// * `to` - The recipient account.
        /// * `amount` - The amount of CGT to transfer.
        #[pallet::call_index(0)]
        #[pallet::weight(Weight::from_parts(10_000, 0))]
        pub fn transfer(
            origin: OriginFor<T>,
            to: T::AccountId,
            amount: T::Balance,
        ) -> DispatchResult {
            let from = ensure_signed(origin)?;
            
            ensure!(from != to, Error::<T>::TransferToSelf);
            
            Self::do_transfer(&from, &to, amount)?;
            
            Self::deposit_event(Event::Transfer { from, to, amount });
            
            Ok(())
        }

        /// Reserve CGT from the caller's free balance.
        ///
        /// # Arguments
        /// * `amount` - The amount to reserve.
        #[pallet::call_index(1)]
        #[pallet::weight(Weight::from_parts(10_000, 0))]
        pub fn reserve(
            origin: OriginFor<T>,
            amount: T::Balance,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            Self::do_reserve(&who, amount)?;
            
            Self::deposit_event(Event::Reserved { who, amount });
            
            Ok(())
        }

        /// Unreserve CGT back to the caller's free balance.
        ///
        /// # Arguments
        /// * `amount` - The amount to unreserve.
        #[pallet::call_index(2)]
        #[pallet::weight(Weight::from_parts(10_000, 0))]
        pub fn unreserve(
            origin: OriginFor<T>,
            amount: T::Balance,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            Self::do_unreserve(&who, amount)?;
            
            Self::deposit_event(Event::Unreserved { who, amount });
            
            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// Internal transfer logic.
        fn do_transfer(
            from: &T::AccountId,
            to: &T::AccountId,
            amount: T::Balance,
        ) -> DispatchResult {
            let from_balance = Balances::<T>::get(from);
            let to_balance = Balances::<T>::get(to);
            
            // Check sufficient balance
            let new_from_balance = from_balance
                .checked_sub(&amount)
                .ok_or(Error::<T>::InsufficientBalance)?;
            
            // Check existential deposit
            if !new_from_balance.is_zero() {
                ensure!(
                    new_from_balance >= T::ExistentialDeposit::get(),
                    Error::<T>::ExistentialDeposit
                );
            }
            
            // Calculate new recipient balance
            let new_to_balance = to_balance
                .checked_add(&amount)
                .ok_or(Error::<T>::Overflow)?;
            
            // Update storage
            Balances::<T>::insert(from, new_from_balance);
            Balances::<T>::insert(to, new_to_balance);
            
            Ok(())
        }

        /// Internal reserve logic.
        fn do_reserve(who: &T::AccountId, amount: T::Balance) -> DispatchResult {
            let balance = Balances::<T>::get(who);
            let reserved = Reserved::<T>::get(who);
            
            let new_balance = balance
                .checked_sub(&amount)
                .ok_or(Error::<T>::InsufficientBalance)?;
            
            let new_reserved = reserved
                .checked_add(&amount)
                .ok_or(Error::<T>::Overflow)?;
            
            Balances::<T>::insert(who, new_balance);
            Reserved::<T>::insert(who, new_reserved);
            
            Ok(())
        }

        /// Internal unreserve logic.
        fn do_unreserve(who: &T::AccountId, amount: T::Balance) -> DispatchResult {
            let balance = Balances::<T>::get(who);
            let reserved = Reserved::<T>::get(who);
            
            let new_reserved = reserved
                .checked_sub(&amount)
                .ok_or(Error::<T>::InsufficientReservedBalance)?;
            
            let new_balance = balance
                .checked_add(&amount)
                .ok_or(Error::<T>::Overflow)?;
            
            Balances::<T>::insert(who, new_balance);
            Reserved::<T>::insert(who, new_reserved);
            
            Ok(())
        }

        /// Get the free balance of an account.
        pub fn free_balance(who: &T::AccountId) -> T::Balance {
            Balances::<T>::get(who)
        }

        /// Get the total balance (free + reserved) of an account.
        pub fn total_balance(who: &T::AccountId) -> T::Balance {
            let free = Balances::<T>::get(who);
            let reserved = Reserved::<T>::get(who);
            free.checked_add(&reserved).unwrap_or(free)
        }
    }
}
