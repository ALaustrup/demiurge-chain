//! Builds the runtime's wasm blob.
//!
//! The wasm is what the chain actually executes and what a runtime upgrade
//! replaces, so it is built from this crate rather than assembled by hand.

fn main() {
    #[cfg(feature = "std")]
    {
        polkadot_sdk::substrate_wasm_builder::WasmBuilder::build_using_defaults();
    }
}
