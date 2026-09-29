//! The Demiurge node.
//!
//! The chain this runs is the Substrate L1 of ADR-013, and it is the only chain
//! in this repository (AGENTS.md §7). The custom devnet it replaced was retired
//! and deleted at M3.5; `HANDOFF.md` §2.0 records what went with it.

#![warn(missing_docs)]
// `sc_cli::Error` is large by the SDK's own design, and it is the return type of
// every command a node exposes. Boxing it at each call site would fight the
// framework for no benefit, so the lint is allowed here with its reason rather
// than silenced case by case.
#![allow(clippy::result_large_err)]

mod chain_spec;
mod cli;
mod command;
mod rpc;
mod service;

fn main() -> polkadot_sdk::sc_cli::Result<()> {
    command::run()
}
