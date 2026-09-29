//! Application state management.
//!
//! Shared state across all request handlers.

use deadpool_redis::Pool as RedisPool;
use sqlx::PgPool;
use std::sync::Arc;

use crate::config::AppConfig;
use crate::services::EmailService;

/// Shared application state
pub struct AppState {
    /// Application configuration
    pub config: AppConfig,
    /// PostgreSQL connection pool
    pub db: PgPool,
    /// Redis connection pool
    pub redis: RedisPool,
    /// Email service for sending transactional emails
    pub email_service: Arc<EmailService>,
}

impl AppState {
    /// Create new application state
    pub fn new(
        config: AppConfig,
        db: PgPool,
        redis: RedisPool,
        email_service: EmailService,
    ) -> Self {
        // Every send checks the list of undeliverable addresses, so none can be sent without it.
        let email_service = Arc::new(email_service.with_suppression_list(db.clone()));
        Self {
            config,
            db,
            redis,
            email_service,
        }
    }
}
