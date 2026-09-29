//! Health check endpoints.

use axum::{Json, extract::State, http::StatusCode};
use serde_json::{Value, json};
use std::sync::Arc;

use crate::state::AppState;

/// Basic health check
pub async fn health_check() -> (StatusCode, Json<Value>) {
    (
        StatusCode::OK,
        Json(json!({
            "status": "healthy",
            "service": "qor-auth",
            "version": env!("CARGO_PKG_VERSION")
        })),
    )
}

/// Readiness check (verifies database and cache connectivity)
pub async fn readiness_check(State(state): State<Arc<AppState>>) -> (StatusCode, Json<Value>) {
    // Check database
    let db_ok = sqlx::query("SELECT 1").fetch_one(&state.db).await.is_ok();

    // Check Redis
    let redis_ok = state.redis.get().await.is_ok();

    let status = if db_ok && redis_ok {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };

    (
        status,
        Json(json!({
            "status": if db_ok && redis_ok { "ready" } else { "not_ready" },
            "checks": {
                "database": if db_ok { "ok" } else { "failed" },
                "cache": if redis_ok { "ok" } else { "failed" }
            }
        })),
    )
}
