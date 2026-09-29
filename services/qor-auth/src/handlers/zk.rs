//! Zero-knowledge attestation endpoints.
//!
//! None of this is implemented. `verify_proof` previously answered
//! `valid: true` for any non-empty hex string without verifying anything, and
//! `create_attestation` returned an invented request id. Both now refuse with
//! 501, so no client can mistake them for working verification. No document
//! may describe ZK as a security property (D-010).

use axum::{Json, extract::State};
use serde_json::{Value, json};
use std::sync::Arc;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

const NOT_IMPLEMENTED: &str =
    "Zero-knowledge attestations are not implemented; no proof is verified (D-010)";

/// Verify a ZK proof: not implemented.
pub async fn verify_proof(State(_state): State<Arc<AppState>>) -> AppResult<Json<Value>> {
    Err(AppError::NotImplemented(NOT_IMPLEMENTED.into()))
}

/// List the current user's attestations. None can exist, so the list is empty.
pub async fn get_attestations(State(_state): State<Arc<AppState>>) -> AppResult<Json<Value>> {
    Ok(Json(json!({
        "attestations": []
    })))
}

/// Request a new attestation: not implemented.
pub async fn create_attestation(State(_state): State<Arc<AppState>>) -> AppResult<Json<Value>> {
    Err(AppError::NotImplemented(NOT_IMPLEMENTED.into()))
}
