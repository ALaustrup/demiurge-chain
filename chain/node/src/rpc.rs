//! The node's JSON-RPC surface.
//!
//! Standard RPC only. The system RPC gives clients an account's next index,
//! which is what a signer needs for a nonce.
//!
//! **The custom devnet's RPC vocabulary is not served here, and will not be.**
//! That chain answered `chain_getHealth`, `chain_getBlockNumber` and
//! `account_getTransactionNonce`; it was retired at M3.5, and nothing here is
//! compatible with it, on purpose. A client still speaking it fails loudly
//! rather than appearing to work.

use std::sync::Arc;

use demiurge_runtime::{opaque::Block, AccountId, Nonce};
use polkadot_sdk::*;
use sc_transaction_pool_api::TransactionPool;
use substrate_frame_rpc_system::{System, SystemApiServer};

/// What the RPC handlers need.
pub struct FullDeps<C, P> {
    pub client: Arc<C>,
    pub pool: Arc<P>,
}

/// Assemble the RPC extensions.
pub fn create_full<C, P>(
    deps: FullDeps<C, P>,
) -> Result<jsonrpsee::RpcModule<()>, Box<dyn std::error::Error + Send + Sync>>
where
    C: sp_api::ProvideRuntimeApi<Block>
        + sc_client_api::HeaderBackend<Block>
        + sp_blockchain::HeaderMetadata<Block, Error = sp_blockchain::Error>
        + Send
        + Sync
        + 'static,
    C::Api: substrate_frame_rpc_system::AccountNonceApi<Block, AccountId, Nonce>,
    C::Api: sp_block_builder::BlockBuilder<Block>,
    P: TransactionPool + Sync + Send + 'static,
{
    let mut module = jsonrpsee::RpcModule::new(());
    let FullDeps { client, pool } = deps;

    module.merge(System::new(client, pool).into_rpc())?;

    Ok(module)
}
