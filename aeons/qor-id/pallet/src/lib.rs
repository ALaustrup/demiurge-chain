//! # Qor ID Pallet
//!
//! The non-dual identity system for Demiurge-Cloud.
//!
//! ## Overview
//!
//! Qor ID provides a singular, unified identity that transcends traditional
//! identity systems. There is no separation between user, account, and wallet—
//! all are One.
//!
//! ## Philosophy
//!
//! In Gnostic thought, the Qor represents the divine spark within each being.
//! The Qor ID captures this essence on-chain, providing:
//!
//! - **Self-Sovereignty**: Users control their own identity
//! - **Non-Duality**: One identity, infinite expressions
//! - **Privacy-Preserving**: Selective disclosure of attributes
//! - **Cross-Chain**: Identity persists across all Demiurge realms

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;
    use sp_std::prelude::*;

    /// Maximum length for identity names.
    pub const MAX_NAME_LENGTH: u32 = 64;
    
    /// Maximum length for identity metadata.
    pub const MAX_METADATA_LENGTH: u32 = 256;
    
    /// Maximum number of attributes per identity.
    pub const MAX_ATTRIBUTES: u32 = 16;

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    /// Configure the pallet.
    #[pallet::config]
    pub trait Config: frame_system::Config {
        /// The overarching runtime event type.
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        /// The deposit required to create an identity.
        #[pallet::constant]
        type IdentityDeposit: Get<u128>;
        
        /// Maximum name length.
        #[pallet::constant]
        type MaxNameLength: Get<u32>;
        
        /// Maximum metadata length.
        #[pallet::constant]
        type MaxMetadataLength: Get<u32>;
        
        /// Maximum attributes per identity.
        #[pallet::constant]
        type MaxAttributes: Get<u32>;
    }

    /// Qor Identity status.
    #[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, MaxEncodedLen, TypeInfo)]
    pub enum IdentityStatus {
        /// Identity is active.
        Active,
        /// Identity is suspended (recoverable).
        Suspended,
        /// Identity is being recovered.
        Recovering,
    }

    impl Default for IdentityStatus {
        fn default() -> Self {
            Self::Active
        }
    }

    /// Qor Identity attribute.
    #[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, MaxEncodedLen, TypeInfo)]
    pub struct IdentityAttribute<BoundedString> {
        /// Attribute key.
        pub key: BoundedString,
        /// Attribute value (may be encrypted or hashed).
        pub value: BoundedString,
        /// Whether this attribute is publicly visible.
        pub public: bool,
        /// Whether this attribute has been verified by an Archon.
        pub verified: bool,
    }

    /// The core Qor Identity structure.
    #[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, MaxEncodedLen, TypeInfo)]
    #[scale_info(skip_type_params(T))]
    pub struct QorIdentity<T: Config> {
        /// Unique Qor ID (derived from account + nonce).
        pub qor_id: [u8; 32],
        /// Display name.
        pub name: BoundedVec<u8, T::MaxNameLength>,
        /// Creation block.
        pub created_at: BlockNumberFor<T>,
        /// Last updated block.
        pub updated_at: BlockNumberFor<T>,
        /// Identity status.
        pub status: IdentityStatus,
        /// Recovery account (optional).
        pub recovery: Option<T::AccountId>,
        /// Deposit amount held.
        pub deposit: u128,
    }

    /// Mapping from account to Qor Identity.
    #[pallet::storage]
    #[pallet::getter(fn identities)]
    pub type Identities<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        QorIdentity<T>,
        OptionQuery,
    >;

    /// Mapping from Qor ID hash to account.
    #[pallet::storage]
    #[pallet::getter(fn qor_id_to_account)]
    pub type QorIdToAccount<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32],
        T::AccountId,
        OptionQuery,
    >;

    /// Identity attributes storage.
    #[pallet::storage]
    #[pallet::getter(fn attributes)]
    pub type Attributes<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        BoundedVec<
            IdentityAttribute<BoundedVec<u8, T::MaxMetadataLength>>,
            T::MaxAttributes
        >,
        ValueQuery,
    >;

    /// Total number of registered identities.
    #[pallet::storage]
    #[pallet::getter(fn identity_count)]
    pub type IdentityCount<T: Config> = StorageValue<_, u64, ValueQuery>;

    /// Nonce for generating unique Qor IDs.
    #[pallet::storage]
    pub type Nonce<T: Config> = StorageValue<_, u64, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// New Qor Identity created. \[account, qor_id\]
        IdentityCreated {
            account: T::AccountId,
            qor_id: [u8; 32],
        },
        /// Identity name updated. \[account\]
        IdentityUpdated {
            account: T::AccountId,
        },
        /// Identity suspended. \[account\]
        IdentitySuspended {
            account: T::AccountId,
        },
        /// Identity reactivated. \[account\]
        IdentityReactivated {
            account: T::AccountId,
        },
        /// Identity cleared (destroyed). \[account\]
        IdentityCleared {
            account: T::AccountId,
        },
        /// Recovery account set. \[account, recovery\]
        RecoverySet {
            account: T::AccountId,
            recovery: T::AccountId,
        },
        /// Attribute added. \[account, key\]
        AttributeAdded {
            account: T::AccountId,
            key: Vec<u8>,
        },
        /// Attribute removed. \[account, key\]
        AttributeRemoved {
            account: T::AccountId,
            key: Vec<u8>,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Identity already exists for this account.
        IdentityAlreadyExists,
        /// Identity not found.
        IdentityNotFound,
        /// Name too long.
        NameTooLong,
        /// Invalid identity status for this operation.
        InvalidStatus,
        /// Not authorized to perform this action.
        NotAuthorized,
        /// Maximum attributes reached.
        TooManyAttributes,
        /// Attribute not found.
        AttributeNotFound,
        /// Attribute already exists.
        AttributeAlreadyExists,
        /// Insufficient deposit.
        InsufficientDeposit,
        /// Cannot recover to same account.
        CannotRecoverToSelf,
        /// Qor ID collision (extremely rare).
        QorIdCollision,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Create a new Qor Identity.
        ///
        /// # Arguments
        /// * `name` - Display name for the identity.
        #[pallet::call_index(0)]
        #[pallet::weight(Weight::from_parts(50_000, 0))]
        pub fn create_identity(
            origin: OriginFor<T>,
            name: Vec<u8>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            // Ensure identity doesn't exist
            ensure!(!Identities::<T>::contains_key(&who), Error::<T>::IdentityAlreadyExists);
            
            // Validate name length
            let bounded_name: BoundedVec<u8, T::MaxNameLength> = name
                .try_into()
                .map_err(|_| Error::<T>::NameTooLong)?;
            
            // Generate Qor ID
            let qor_id = Self::generate_qor_id(&who);
            
            // Ensure no collision
            ensure!(!QorIdToAccount::<T>::contains_key(&qor_id), Error::<T>::QorIdCollision);
            
            let current_block = frame_system::Pallet::<T>::block_number();
            let deposit = T::IdentityDeposit::get();
            
            // Create identity
            let identity = QorIdentity {
                qor_id,
                name: bounded_name,
                created_at: current_block,
                updated_at: current_block,
                status: IdentityStatus::Active,
                recovery: None,
                deposit,
            };
            
            // Store identity
            Identities::<T>::insert(&who, identity);
            QorIdToAccount::<T>::insert(&qor_id, &who);
            
            // Increment counters
            IdentityCount::<T>::mutate(|count| *count = count.saturating_add(1));
            
            Self::deposit_event(Event::IdentityCreated { account: who, qor_id });
            
            Ok(())
        }

        /// Update identity name.
        #[pallet::call_index(1)]
        #[pallet::weight(Weight::from_parts(20_000, 0))]
        pub fn update_name(
            origin: OriginFor<T>,
            name: Vec<u8>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            Identities::<T>::try_mutate(&who, |maybe_identity| -> DispatchResult {
                let identity = maybe_identity.as_mut().ok_or(Error::<T>::IdentityNotFound)?;
                
                ensure!(identity.status == IdentityStatus::Active, Error::<T>::InvalidStatus);
                
                identity.name = name.try_into().map_err(|_| Error::<T>::NameTooLong)?;
                identity.updated_at = frame_system::Pallet::<T>::block_number();
                
                Ok(())
            })?;
            
            Self::deposit_event(Event::IdentityUpdated { account: who });
            
            Ok(())
        }

        /// Set recovery account for identity.
        #[pallet::call_index(2)]
        #[pallet::weight(Weight::from_parts(20_000, 0))]
        pub fn set_recovery(
            origin: OriginFor<T>,
            recovery: T::AccountId,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            ensure!(who != recovery, Error::<T>::CannotRecoverToSelf);
            
            Identities::<T>::try_mutate(&who, |maybe_identity| -> DispatchResult {
                let identity = maybe_identity.as_mut().ok_or(Error::<T>::IdentityNotFound)?;
                
                identity.recovery = Some(recovery.clone());
                identity.updated_at = frame_system::Pallet::<T>::block_number();
                
                Ok(())
            })?;
            
            Self::deposit_event(Event::RecoverySet { account: who, recovery });
            
            Ok(())
        }

        /// Suspend identity (self-initiated).
        #[pallet::call_index(3)]
        #[pallet::weight(Weight::from_parts(20_000, 0))]
        pub fn suspend_identity(origin: OriginFor<T>) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            Identities::<T>::try_mutate(&who, |maybe_identity| -> DispatchResult {
                let identity = maybe_identity.as_mut().ok_or(Error::<T>::IdentityNotFound)?;
                
                ensure!(identity.status == IdentityStatus::Active, Error::<T>::InvalidStatus);
                
                identity.status = IdentityStatus::Suspended;
                identity.updated_at = frame_system::Pallet::<T>::block_number();
                
                Ok(())
            })?;
            
            Self::deposit_event(Event::IdentitySuspended { account: who });
            
            Ok(())
        }

        /// Reactivate suspended identity.
        #[pallet::call_index(4)]
        #[pallet::weight(Weight::from_parts(20_000, 0))]
        pub fn reactivate_identity(origin: OriginFor<T>) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            Identities::<T>::try_mutate(&who, |maybe_identity| -> DispatchResult {
                let identity = maybe_identity.as_mut().ok_or(Error::<T>::IdentityNotFound)?;
                
                ensure!(identity.status == IdentityStatus::Suspended, Error::<T>::InvalidStatus);
                
                identity.status = IdentityStatus::Active;
                identity.updated_at = frame_system::Pallet::<T>::block_number();
                
                Ok(())
            })?;
            
            Self::deposit_event(Event::IdentityReactivated { account: who });
            
            Ok(())
        }

        /// Clear (destroy) identity and reclaim deposit.
        #[pallet::call_index(5)]
        #[pallet::weight(Weight::from_parts(30_000, 0))]
        pub fn clear_identity(origin: OriginFor<T>) -> DispatchResult {
            let who = ensure_signed(origin)?;
            
            let identity = Identities::<T>::get(&who).ok_or(Error::<T>::IdentityNotFound)?;
            
            // Remove from storage
            Identities::<T>::remove(&who);
            QorIdToAccount::<T>::remove(&identity.qor_id);
            Attributes::<T>::remove(&who);
            
            // Decrement count
            IdentityCount::<T>::mutate(|count| *count = count.saturating_sub(1));
            
            Self::deposit_event(Event::IdentityCleared { account: who });
            
            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// Generate a unique Qor ID from account and nonce.
        fn generate_qor_id(account: &T::AccountId) -> [u8; 32] {
            let nonce = Nonce::<T>::get();
            Nonce::<T>::put(nonce.saturating_add(1));
            
            let mut data = account.encode();
            data.extend_from_slice(&nonce.to_le_bytes());
            data.extend_from_slice(b"QOR");
            
            sp_io::hashing::blake2_256(&data)
        }

        /// Check if an account has a Qor Identity.
        pub fn has_identity(account: &T::AccountId) -> bool {
            Identities::<T>::contains_key(account)
        }

        /// Get Qor ID for an account.
        pub fn get_qor_id(account: &T::AccountId) -> Option<[u8; 32]> {
            Identities::<T>::get(account).map(|i| i.qor_id)
        }

        /// Get account for a Qor ID.
        pub fn get_account(qor_id: &[u8; 32]) -> Option<T::AccountId> {
            QorIdToAccount::<T>::get(qor_id)
        }
    }
}
