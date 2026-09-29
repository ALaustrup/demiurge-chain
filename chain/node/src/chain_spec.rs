//! Chain specifications.
//!
//! # These are development and test networks only
//!
//! There is no mainnet specification here, and there will not be one until the
//! genesis allocation split (OPEN-2) and the issuance rate (OPEN-1) are decided.
//! Every endowment below is a **development** endowment: it exists so a local
//! node is usable, and it is not a genesis allocation of the base supply.
//!
//! The address prefix is 42 and the ticker is `CGT`, from the runtime's own
//! constants (ADR-024, ADR-034), so the node cannot disagree with the runtime
//! about either.

use demiurge_runtime::{denomination, WASM_BINARY};
use polkadot_sdk::*;
use sc_service::{ChainType, Properties};
use sp_keyring::{Ed25519Keyring, Sr25519Keyring};

type AccountId = demiurge_runtime::AccountId;
type AuraId = sp_consensus_aura::sr25519::AuthorityId;
type GrandpaId = sp_consensus_grandpa::AuthorityId;

/// The chain specification type for this chain.
pub type ChainSpec = sc_service::GenericChainSpec;

/// How a development node names itself, so nobody has to guess which chain they
/// reached. `system_chain` answers with the name below, which is how a client
/// confirms what it is talking to (see `chain/README.md`).
pub const DEV_CHAIN_ID: &str = "demiurge_dev";
pub const DEV_CHAIN_NAME: &str = "Demiurge Development";
pub const LOCAL_CHAIN_ID: &str = "demiurge_local";
pub const LOCAL_CHAIN_NAME: &str = "Demiurge Local Testnet";

/// What wallets and explorers read to display amounts: the unit and prefix the
/// runtime itself defines.
fn properties() -> Properties {
    let mut properties = Properties::new();
    properties.insert("tokenSymbol".into(), denomination::TOKEN_SYMBOL.into());
    properties.insert("tokenDecimals".into(), denomination::DECIMALS.into());
    properties.insert("ss58Format".into(), denomination::SS58_PREFIX.into());
    properties
}

/// A single-validator development chain: Alice authors and finalises.
pub fn development_chain_spec() -> Result<ChainSpec, String> {
    Ok(ChainSpec::builder(
        WASM_BINARY.ok_or_else(|| "the development runtime wasm is not available".to_string())?,
        None,
    )
    .with_name(DEV_CHAIN_NAME)
    .with_id(DEV_CHAIN_ID)
    .with_chain_type(ChainType::Development)
    .with_properties(properties())
    .with_genesis_config_patch(genesis(
        // The account identifies the validator (ADR-018); Aura authors with an
        // Sr25519 key and GRANDPA votes with an Ed25519 one.
        vec![(
            Sr25519Keyring::Alice.to_account_id(),
            Sr25519Keyring::Alice.public().into(),
            Ed25519Keyring::Alice.public().into(),
        )],
        development_endowed_accounts(),
        Sr25519Keyring::Alice.to_account_id(),
    ))
    .build())
}

/// A two-validator local test chain: Alice and Bob.
pub fn local_chain_spec() -> Result<ChainSpec, String> {
    Ok(ChainSpec::builder(
        WASM_BINARY.ok_or_else(|| "the development runtime wasm is not available".to_string())?,
        None,
    )
    .with_name(LOCAL_CHAIN_NAME)
    .with_id(LOCAL_CHAIN_ID)
    .with_chain_type(ChainType::Local)
    .with_properties(properties())
    .with_genesis_config_patch(genesis(
        vec![
            (
                Sr25519Keyring::Alice.to_account_id(),
                Sr25519Keyring::Alice.public().into(),
                Ed25519Keyring::Alice.public().into(),
            ),
            (
                Sr25519Keyring::Bob.to_account_id(),
                Sr25519Keyring::Bob.public().into(),
                Ed25519Keyring::Bob.public().into(),
            ),
        ],
        development_endowed_accounts(),
        Sr25519Keyring::Alice.to_account_id(),
    ))
    .build())
}

/// The well-known development accounts, endowed so a local node is usable.
///
/// **Not a genesis allocation.** The base supply's split is OPEN-2 and is not
/// invented here; these are the SDK's public test accounts, whose keys everyone
/// has, on a network that holds nothing.
fn development_endowed_accounts() -> Vec<AccountId> {
    Sr25519Keyring::well_known()
        .map(|k| k.to_account_id())
        .collect()
}

/// A development endowment per account.
///
/// **A placeholder, clearly marked**, not a decided value: it is large enough to
/// be useful on a network whose keys are public, and it says nothing about the
/// base supply or its split (OPEN-2). It is far below the base supply so that
/// no development genesis can be mistaken for a real one.
const DEVELOPMENT_ENDOWMENT: u128 = 1_000_000 * denomination::CGT;

fn genesis(
    initial_authorities: Vec<(AccountId, AuraId, GrandpaId)>,
    endowed: Vec<AccountId>,
    root: AccountId,
) -> serde_json::Value {
    let balances: Vec<_> = endowed
        .iter()
        .cloned()
        .map(|a| (a, DEVELOPMENT_ENDOWMENT))
        .collect();

    // Aura and GRANDPA take their authorities from `pallet-session`, which takes
    // the set from `pallet-validator-set` (ADR-020). So their own genesis lists
    // stay empty: setting both would be two sources of truth for who authors.
    let session_keys: Vec<_> = initial_authorities
        .iter()
        .map(|(account, aura, grandpa)| {
            serde_json::json!([
                account,
                account,
                { "aura": aura, "grandpa": grandpa },
            ])
        })
        .collect();

    let validators: Vec<_> = initial_authorities
        .iter()
        .map(|(account, _, _)| account.clone())
        .collect();

    let patch = serde_json::json!({
        "balances": { "balances": balances },
        "session": { "keys": session_keys },
        "validatorSet": { "validators": validators },
    });

    // Only a runtime built with the `sudo` feature has this key, and only
    // development and test networks are (ADR-037). Written as two shadowing
    // bindings so neither configuration carries an unused `mut` or argument:
    // both are built, so both must compile clean.
    #[cfg(feature = "sudo")]
    let patch = {
        let mut patch = patch;
        patch["sudo"] = serde_json::json!({ "key": Some(root) });
        patch
    };
    #[cfg(not(feature = "sudo"))]
    let _ = root;

    patch
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The specification tells a person which chain they are on. Every
    /// Substrate development node looks alike on port 9944, so the identifiers
    /// must not be vague: `system_chain` is what a client asks, and the launcher
    /// asks automatically (ADR-040).
    #[test]
    fn the_development_chain_says_which_chain_it_is() {
        let spec = development_chain_spec().expect("the development spec builds");
        assert_eq!(spec.id(), DEV_CHAIN_ID);
        assert_eq!(spec.name(), DEV_CHAIN_NAME);
        assert!(spec.id().starts_with("demiurge"));
    }

    /// The unit a wallet displays comes from the runtime, so the node cannot
    /// disagree with the runtime about the ticker, the decimals or the prefix.
    #[test]
    fn the_properties_come_from_the_runtime() {
        let props = properties();
        assert_eq!(
            props.get("tokenSymbol").and_then(|v| v.as_str()),
            Some(denomination::TOKEN_SYMBOL)
        );
        assert_eq!(
            props.get("tokenDecimals").and_then(|v| v.as_u64()),
            Some(denomination::DECIMALS as u64)
        );
        assert_eq!(
            props.get("ss58Format").and_then(|v| v.as_u64()),
            Some(denomination::SS58_PREFIX as u64)
        );
    }

    /// A development endowment is not a genesis allocation. If one ever
    /// approached the base supply, somebody would be inventing OPEN-2.
    #[test]
    fn a_development_endowment_is_nowhere_near_the_base_supply() {
        const BASE_SUPPLY: u128 = 100_000_000_000_000 * denomination::CGT;
        let handed_out = DEVELOPMENT_ENDOWMENT * Sr25519Keyring::well_known().count() as u128;
        assert!(
            handed_out * 1_000_000 < BASE_SUPPLY,
            "development genesis hands out {handed_out} Sparks, too close to the base supply to be \
             obviously not a genesis allocation"
        );
    }

    #[test]
    fn the_local_chain_is_distinct_from_the_development_chain() {
        let dev = development_chain_spec().expect("dev spec builds");
        let local = local_chain_spec().expect("local spec builds");
        assert_ne!(dev.id(), local.id());
        assert_ne!(dev.name(), local.name());
    }
}
