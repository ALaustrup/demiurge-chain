//! Delivery reports from Resend: bounces and complaints.
//!
//! POST /api/v1/webhooks/resend
//!
//! Resend signs every delivery the Svix way: `svix-id`, `svix-timestamp` and `svix-signature`
//! headers, and an HMAC-SHA256 over `{id}.{timestamp}.{raw body}` keyed with the endpoint's signing
//! secret (`whsec_` followed by base64), set here as `RESEND_WEBHOOK_SECRET`. Nothing in a request is
//! read until its signature checks out. A timestamp more than five minutes from now is refused, so a
//! captured request cannot be replayed later, and within that window each delivery id is acted on
//! once. Without a secret, every delivery is refused with 503, and Resend keeps retrying.
//!
//! - `email.bounced` with a permanent bounce, `email.suppressed` and `email.complained` mark each
//!   recipient address undeliverable. Nothing more is sent to it (`EmailService`), a pending change
//!   of address to it is withdrawn, and an account that holds it sees `email_deliverable: false` in
//!   its profile, and an audit row.
//! - A temporary bounce, and every other event, is recorded as received and changes nothing.
//!
//! Logs name the event, Resend's email id, and how many addresses and accounts it touched. They
//! never carry an address, a subject or a link.

use axum::{Json, body::Bytes, extract::State, http::HeaderMap};
use base64::Engine;
use hmac::{Hmac, Mac};
use serde_json::{Value, json};
use sha2::Sha256;
use std::sync::Arc;
use tracing::{info, warn};

use crate::error::{AppError, AppResult};
use crate::services::email_service::address_hash;
use crate::state::AppState;

/// How far a delivery's timestamp may be from now, in seconds.
const TOLERANCE_SECS: u64 = 5 * 60;

/// Why a delivery was not accepted.
#[derive(Debug, PartialEq, Eq)]
pub(crate) enum Refusal {
    /// The configured secret is not a `whsec_` base64 secret.
    BadSecret,
    /// The timestamp is not a number, or is more than five minutes from now.
    StaleTimestamp,
    /// No `v1` signature in the header matches.
    BadSignature,
}

/// Check a delivery's signature. `now` is seconds since the Unix epoch.
pub(crate) fn verify_signature(
    secret: &str,
    id: &str,
    timestamp: &str,
    signatures: &str,
    body: &[u8],
    now: i64,
) -> Result<(), Refusal> {
    let key = secret
        .strip_prefix("whsec_")
        .and_then(|encoded| {
            base64::engine::general_purpose::STANDARD
                .decode(encoded)
                .ok()
        })
        .filter(|key| !key.is_empty())
        .ok_or(Refusal::BadSecret)?;

    let sent_at: i64 = timestamp.parse().map_err(|_| Refusal::StaleTimestamp)?;
    if now
        .checked_sub(sent_at)
        .is_none_or(|distance| distance.unsigned_abs() > TOLERANCE_SECS)
    {
        return Err(Refusal::StaleTimestamp);
    }

    let mut mac = Hmac::<Sha256>::new_from_slice(&key).map_err(|_| Refusal::BadSecret)?;
    mac.update(id.as_bytes());
    mac.update(b".");
    mac.update(timestamp.as_bytes());
    mac.update(b".");
    mac.update(body);

    // The header may carry several signatures, as while a secret is rotated; one match is enough.
    // `verify_slice` compares in constant time.
    let matched = signatures
        .split(' ')
        .filter_map(|entry| entry.split_once(','))
        .filter(|(version, _)| *version == "v1")
        .filter_map(|(_, signature)| {
            base64::engine::general_purpose::STANDARD
                .decode(signature)
                .ok()
        })
        .any(|signature| mac.clone().verify_slice(&signature).is_ok());
    if matched {
        Ok(())
    } else {
        Err(Refusal::BadSignature)
    }
}

/// Receive a delivery report from Resend.
pub async fn resend(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    body: Bytes,
) -> AppResult<Json<Value>> {
    let Some(secret) = state.email_service.webhook_secret() else {
        warn!("Resend webhook refused: RESEND_WEBHOOK_SECRET is not set");
        return Err(AppError::ServiceUnavailable(
            "Resend webhooks are not configured on this service".into(),
        ));
    };

    let header = |name: &str| headers.get(name).and_then(|value| value.to_str().ok());
    let (Some(id), Some(timestamp), Some(signatures)) = (
        header("svix-id"),
        header("svix-timestamp"),
        header("svix-signature"),
    ) else {
        warn!("Resend webhook refused: signature headers missing");
        return Err(AppError::InvalidToken);
    };

    match verify_signature(
        secret,
        id,
        timestamp,
        signatures,
        &body,
        chrono::Utc::now().timestamp(),
    ) {
        Ok(()) => {}
        Err(Refusal::BadSecret) => {
            warn!("Resend webhook refused: RESEND_WEBHOOK_SECRET is not a whsec_ secret");
            return Err(AppError::ServiceUnavailable(
                "Resend webhooks are misconfigured on this service".into(),
            ));
        }
        Err(refusal) => {
            warn!("Resend webhook refused: {:?}", refusal);
            return Err(AppError::InvalidToken);
        }
    }
    if id.len() > 128 {
        return Err(AppError::ValidationError(
            "The delivery id is too long".into(),
        ));
    }

    let event: Value = serde_json::from_slice(&body)
        .map_err(|_| AppError::ValidationError("The delivery is not JSON".into()))?;
    let kind = event["type"].as_str().unwrap_or("unknown");
    let email_id = event["data"]["email_id"].as_str().unwrap_or("unknown");
    let bounce_type = event["data"]["bounce"]["type"].as_str();
    let reason = match kind {
        "email.bounced" if bounce_type == Some("Permanent") => Some("bounce"),
        "email.suppressed" => Some("suppressed"),
        "email.complained" => Some("complaint"),
        _ => None,
    };
    let recipients: Vec<String> = event["data"]["to"]
        .as_array()
        .map(|to| {
            to.iter()
                .filter_map(Value::as_str)
                .map(|address| address.trim().to_lowercase())
                .collect()
        })
        .unwrap_or_default();

    // The delivery is recorded and acted on in one transaction: if acting on it fails, it is not
    // recorded either, and Resend's retry is acted on.
    let mut tx = state.db.begin().await?;
    let first = sqlx::query(
        "INSERT INTO resend_webhook_deliveries (svix_id, event_type) VALUES ($1, $2) ON CONFLICT (svix_id) DO NOTHING",
    )
    .bind(id)
    .bind(kind)
    .execute(&mut *tx)
    .await?
    .rows_affected()
        == 1;
    if !first {
        info!("Resend webhook {kind} for email {email_id}: already handled");
        return Ok(Json(json!({ "received": true, "duplicate": true })));
    }

    let (mut marked, mut accounts, mut withdrawn) = (0u64, 0u64, 0u64);
    if let Some(reason) = reason {
        for address in &recipients {
            let newly = sqlx::query(
                "INSERT INTO email_suppressions (address_hash, reason, resend_email_id) VALUES ($1, $2, $3) ON CONFLICT (address_hash) DO NOTHING",
            )
            .bind(address_hash(address))
            .bind(reason)
            .bind(email_id)
            .execute(&mut *tx)
            .await?
            .rows_affected();
            marked += newly;

            // A change of address to it could never be confirmed.
            withdrawn += sqlx::query(
                "UPDATE users SET pending_email = NULL, pending_email_token = NULL, pending_email_expires_at = NULL, updated_at = NOW() WHERE LOWER(pending_email) = $1",
            )
            .bind(address)
            .execute(&mut *tx)
            .await?
            .rows_affected();

            if newly == 1 {
                accounts += sqlx::query(
                    "INSERT INTO audit_log (user_id, action, details) SELECT id, 'email_undeliverable', $2 FROM users WHERE LOWER(email) = $1",
                )
                .bind(address)
                .bind(json!({ "reason": reason, "resend_email_id": email_id }))
                .execute(&mut *tx)
                .await?
                .rows_affected();
            }
        }
    }
    tx.commit().await?;

    match reason {
        Some(reason) => info!(
            "Resend webhook {kind} for email {email_id}: {} recipient(s), {marked} newly marked undeliverable ({reason}), {accounts} account(s) affected, {withdrawn} pending change(s) withdrawn",
            recipients.len()
        ),
        None if kind == "email.bounced" => info!(
            "Resend webhook {kind} for email {email_id}: a {} bounce, nothing marked",
            bounce_type.unwrap_or("unclassified")
        ),
        None => info!("Resend webhook {kind} for email {email_id}: recorded, nothing to do"),
    }

    Ok(Json(json!({ "received": true })))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::AppConfig;
    use crate::handlers::profile::{get_profile, request_email_change};
    use crate::models::ChangeEmailRequest;
    use crate::services::auth_service::AuthService;
    use crate::services::{EmailConfig, EmailService};
    use axum::{
        Json as AxumJson, Router,
        extract::{Extension, State as AxumState},
        http::HeaderValue,
        routing::post,
    };
    use sqlx::PgPool;
    use std::sync::Mutex;
    use uuid::Uuid;

    const SECRET: &str = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
    const OTHER_SECRET: &str = "whsec_plJ3nmyCDGBKInavdOK15jsl";
    const PASSWORD: &str = "correct horse battery staple";

    type Inbox = Arc<Mutex<Vec<Value>>>;

    /// A stand-in for Resend's `POST /emails` that keeps every message.
    async fn fake_resend() -> (String, Inbox) {
        let inbox: Inbox = Arc::default();
        let app = Router::new()
            .route(
                "/emails",
                post(
                    |AxumState(inbox): AxumState<Inbox>, AxumJson(body): AxumJson<Value>| async move {
                        inbox.lock().expect("lock").push(body);
                        AxumJson(json!({ "id": "email-1" }))
                    },
                ),
            )
            .with_state(inbox.clone());
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind");
        let url = format!("http://{}", listener.local_addr().expect("address"));
        tokio::spawn(async move { axum::serve(listener, app).await.expect("serve") });
        (url, inbox)
    }

    fn state(db: PgPool, api_url: String, secret: Option<&str>) -> Arc<AppState> {
        let email = EmailService::new(EmailConfig {
            resend_api_key: "re_test_key".into(),
            from: "Test <noreply@example.invalid>".into(),
            base_url: "https://example.invalid".into(),
            api_url,
        })
        .with_webhook_secret(secret.map(str::to_string));
        let redis = deadpool_redis::Config::from_url("redis://127.0.0.1:1")
            .create_pool(Some(deadpool_redis::Runtime::Tokio1))
            .expect("redis pool");
        Arc::new(AppState::new(AppConfig::default(), db, redis, email))
    }

    fn sign(secret: &str, id: &str, timestamp: i64, body: &str) -> String {
        let key = base64::engine::general_purpose::STANDARD
            .decode(secret.trim_start_matches("whsec_"))
            .expect("secret");
        let mut mac = Hmac::<Sha256>::new_from_slice(&key).expect("key");
        mac.update(format!("{id}.{timestamp}.{body}").as_bytes());
        format!(
            "v1,{}",
            base64::engine::general_purpose::STANDARD.encode(mac.finalize().into_bytes())
        )
    }

    fn headers(id: &str, timestamp: i64, signature: &str) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert("svix-id", HeaderValue::from_str(id).expect("id"));
        headers.insert(
            "svix-timestamp",
            HeaderValue::from_str(&timestamp.to_string()).expect("timestamp"),
        );
        headers.insert(
            "svix-signature",
            HeaderValue::from_str(signature).expect("signature"),
        );
        headers
    }

    /// An event shaped as Resend documents it.
    fn event(kind: &str, to: &str, bounce_type: Option<&str>) -> String {
        let mut data = json!({
            "email_id": "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
            "created_at": "2026-09-15T12:00:00.000Z",
            "from": "Test <noreply@example.invalid>",
            "to": [to],
            "subject": "Reset your QOR ID password",
        });
        if let Some(bounce_type) = bounce_type {
            data["bounce"] = json!({
                "message": "The recipient's mail server permanently rejected the email.",
                "subType": "General",
                "type": bounce_type,
            });
        }
        json!({ "type": kind, "created_at": "2026-09-15T12:00:01.000Z", "data": data }).to_string()
    }

    async fn deliver(state: &Arc<AppState>, id: &str, body: &str) -> AppResult<Json<Value>> {
        let now = chrono::Utc::now().timestamp();
        resend(
            State(state.clone()),
            headers(id, now, &sign(SECRET, id, now, body)),
            Bytes::from(body.to_string()),
        )
        .await
    }

    async fn account(db: &PgPool, username: &str, email: &str) -> Uuid {
        let hash = AuthService::hash_password(PASSWORD).expect("hash");
        sqlx::query_scalar(
            "INSERT INTO users (email, username, discriminator, password_hash, email_verified) VALUES ($1, $2, 1, $3, TRUE) RETURNING id",
        )
        .bind(email)
        .bind(username)
        .bind(hash)
        .fetch_one(db)
        .await
        .expect("account")
    }

    async fn reason(db: &PgPool, address: &str) -> Option<String> {
        sqlx::query_scalar("SELECT reason FROM email_suppressions WHERE address_hash = $1")
            .bind(address_hash(address))
            .fetch_optional(db)
            .await
            .expect("reason")
    }

    async fn deliveries(db: &PgPool) -> i64 {
        sqlx::query_scalar("SELECT COUNT(*) FROM resend_webhook_deliveries")
            .fetch_one(db)
            .await
            .expect("count")
    }

    async fn audit_rows(db: &PgPool, user: Uuid) -> i64 {
        sqlx::query_scalar(
            "SELECT COUNT(*) FROM audit_log WHERE user_id = $1 AND action = 'email_undeliverable'",
        )
        .bind(user)
        .fetch_one(db)
        .await
        .expect("count")
    }

    #[test]
    fn the_documented_svix_example_verifies() {
        // From Svix's documentation of manual verification, checked independently.
        assert_eq!(
            verify_signature(
                OTHER_SECRET,
                "msg_loFOjxBNrRLzqYUf",
                "1731705121",
                "v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0=",
                br#"{"event_type":"ping","data":{"success":true}}"#,
                1731705121,
            ),
            Ok(())
        );
    }

    #[test]
    fn another_secret_body_or_id_is_refused() {
        let body = r#"{"type":"email.bounced"}"#;
        let now = 1_800_000_000;
        let ts = now.to_string();
        let good = sign(SECRET, "msg_1", now, body);
        assert_eq!(
            verify_signature(SECRET, "msg_1", &ts, &good, body.as_bytes(), now),
            Ok(())
        );
        for (secret, id, signed_body, signature) in [
            (OTHER_SECRET, "msg_1", body, good.as_str()),
            (
                SECRET,
                "msg_1",
                r#"{"type":"email.complained"}"#,
                good.as_str(),
            ),
            (SECRET, "msg_2", body, good.as_str()),
            (SECRET, "msg_1", body, ""),
            (SECRET, "msg_1", body, "v1,not base64!"),
        ] {
            assert_eq!(
                verify_signature(secret, id, &ts, signature, signed_body.as_bytes(), now),
                Err(Refusal::BadSignature)
            );
        }
    }

    #[test]
    fn a_timestamp_more_than_five_minutes_away_is_refused() {
        let body = r#"{"type":"email.bounced"}"#;
        let now = 1_800_000_000;
        for sent in [now - 300, now + 300] {
            let signature = sign(SECRET, "msg_1", sent, body);
            assert_eq!(
                verify_signature(
                    SECRET,
                    "msg_1",
                    &sent.to_string(),
                    &signature,
                    body.as_bytes(),
                    now
                ),
                Ok(())
            );
        }
        for sent in [now - 301, now + 301, i64::MIN, i64::MAX] {
            let signature = sign(SECRET, "msg_1", sent, body);
            assert_eq!(
                verify_signature(
                    SECRET,
                    "msg_1",
                    &sent.to_string(),
                    &signature,
                    body.as_bytes(),
                    now
                ),
                Err(Refusal::StaleTimestamp)
            );
        }
        assert_eq!(
            verify_signature(SECRET, "msg_1", "yesterday", "v1,x", body.as_bytes(), now),
            Err(Refusal::StaleTimestamp)
        );
    }

    #[test]
    fn one_matching_v1_signature_among_several_is_enough() {
        let body = r#"{"type":"email.bounced"}"#;
        let now = 1_800_000_000;
        let ts = now.to_string();
        let good = sign(SECRET, "msg_1", now, body);
        let other = sign(OTHER_SECRET, "msg_1", now, body);
        assert_eq!(
            verify_signature(
                SECRET,
                "msg_1",
                &ts,
                &format!("{other} {good}"),
                body.as_bytes(),
                now
            ),
            Ok(())
        );
        // Only v1 is understood: the right signature under another version is not accepted.
        let v2 = good.replacen("v1,", "v2,", 1);
        assert_eq!(
            verify_signature(SECRET, "msg_1", &ts, &v2, body.as_bytes(), now),
            Err(Refusal::BadSignature)
        );
    }

    #[test]
    fn a_secret_that_is_not_a_whsec_secret_is_a_configuration_error() {
        for secret in [
            "",
            "whsec_",
            "MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw",
            "whsec_***",
        ] {
            assert_eq!(
                verify_signature(secret, "msg_1", "1", "v1,x", b"{}", 1),
                Err(Refusal::BadSecret),
                "{secret}"
            );
        }
    }

    #[sqlx::test]
    async fn without_a_secret_nothing_is_read(db: PgPool) {
        let (url, _) = fake_resend().await;
        let state = state(db.clone(), url, None);
        let body = event("email.bounced", "gone@example.invalid", Some("Permanent"));
        assert!(matches!(
            deliver(&state, "msg_nosecret", &body).await,
            Err(AppError::ServiceUnavailable(_))
        ));
        assert_eq!(deliveries(&db).await, 0);
        assert_eq!(reason(&db, "gone@example.invalid").await, None);
    }

    #[sqlx::test]
    async fn an_unsigned_forged_or_stale_delivery_marks_nothing(db: PgPool) {
        let (url, _) = fake_resend().await;
        let state = state(db.clone(), url, Some(SECRET));
        let body = event("email.complained", "victim@example.invalid", None);
        let now = chrono::Utc::now().timestamp();

        assert!(matches!(
            resend(
                State(state.clone()),
                HeaderMap::new(),
                Bytes::from(body.clone())
            )
            .await,
            Err(AppError::InvalidToken)
        ));
        let forged = sign(OTHER_SECRET, "msg_forged", now, &body);
        assert!(matches!(
            resend(
                State(state.clone()),
                headers("msg_forged", now, &forged),
                Bytes::from(body.clone())
            )
            .await,
            Err(AppError::InvalidToken)
        ));
        // A genuine delivery from ten minutes ago, replayed.
        let old = now - 600;
        let replayed = sign(SECRET, "msg_old", old, &body);
        assert!(matches!(
            resend(
                State(state.clone()),
                headers("msg_old", old, &replayed),
                Bytes::from(body.clone())
            )
            .await,
            Err(AppError::InvalidToken)
        ));

        assert_eq!(deliveries(&db).await, 0);
        assert_eq!(reason(&db, "victim@example.invalid").await, None);
    }

    #[sqlx::test]
    async fn a_permanent_bounce_stops_every_send_to_the_address(db: PgPool) {
        let (url, inbox) = fake_resend().await;
        let state = state(db.clone(), url, Some(SECRET));
        let user = account(&db, "bounced", "Bounced@Example.invalid").await;

        let Json(reply) = deliver(
            &state,
            "msg_bounce",
            &event(
                "email.bounced",
                "bounced@example.invalid",
                Some("Permanent"),
            ),
        )
        .await
        .expect("accepted");
        assert_eq!(reply["received"], json!(true));
        assert_eq!(
            reason(&db, "bounced@example.invalid").await.as_deref(),
            Some("bounce")
        );

        assert!(matches!(
            state
                .email_service
                .send_password_reset_email("Bounced@Example.invalid", "bounced", "a-token")
                .await,
            Err(AppError::Undeliverable(_))
        ));
        assert!(matches!(
            state
                .email_service
                .send_verification_email("bounced@example.invalid", "bounced", "a-token")
                .await,
            Err(AppError::Undeliverable(_))
        ));
        assert!(
            inbox.lock().expect("lock").is_empty(),
            "nothing reached Resend"
        );

        assert_eq!(audit_rows(&db, user).await, 1);
        let Json(profile) = get_profile(State(state.clone()), Extension(user))
            .await
            .expect("profile");
        assert_eq!(profile["email_deliverable"], json!(false));

        let stored: String = sqlx::query_scalar("SELECT address_hash FROM email_suppressions")
            .fetch_one(&db)
            .await
            .expect("hash");
        assert!(
            !stored.contains('@'),
            "the list holds no address in the clear"
        );
    }

    #[sqlx::test]
    async fn a_temporary_bounce_or_another_event_marks_nothing(db: PgPool) {
        let (url, inbox) = fake_resend().await;
        let state = state(db.clone(), url, Some(SECRET));
        let user = account(&db, "wobbly", "wobbly@example.invalid").await;

        let Json(_) = deliver(
            &state,
            "msg_temporary",
            &event("email.bounced", "wobbly@example.invalid", Some("Temporary")),
        )
        .await
        .expect("accepted");
        let Json(_) = deliver(
            &state,
            "msg_delivered",
            &event("email.delivered", "wobbly@example.invalid", None),
        )
        .await
        .expect("accepted");

        assert_eq!(deliveries(&db).await, 2);
        assert_eq!(reason(&db, "wobbly@example.invalid").await, None);
        state
            .email_service
            .send_password_reset_email("wobbly@example.invalid", "wobbly", "a-token")
            .await
            .expect("still sent");
        assert_eq!(inbox.lock().expect("lock").len(), 1);
        let Json(profile) = get_profile(State(state.clone()), Extension(user))
            .await
            .expect("profile");
        assert_eq!(profile["email_deliverable"], json!(true));
    }

    #[sqlx::test]
    async fn a_complaint_stops_sending_to_that_address(db: PgPool) {
        let (url, inbox) = fake_resend().await;
        let state = state(db.clone(), url, Some(SECRET));
        let user = account(&db, "complainer", "complainer@example.invalid").await;

        let Json(_) = deliver(
            &state,
            "msg_complaint",
            &event("email.complained", "COMPLAINER@example.invalid", None),
        )
        .await
        .expect("accepted");

        assert_eq!(
            reason(&db, "complainer@example.invalid").await.as_deref(),
            Some("complaint")
        );
        assert!(matches!(
            state
                .email_service
                .send_password_reset_email("complainer@example.invalid", "complainer", "a-token")
                .await,
            Err(AppError::Undeliverable(_))
        ));
        assert!(inbox.lock().expect("lock").is_empty());
        assert_eq!(audit_rows(&db, user).await, 1);
    }

    #[sqlx::test]
    async fn a_delivery_is_acted_on_once(db: PgPool) {
        let (url, _) = fake_resend().await;
        let state = state(db.clone(), url, Some(SECRET));
        let user = account(&db, "twice", "twice@example.invalid").await;
        let body = event("email.bounced", "twice@example.invalid", Some("Permanent"));

        let Json(first) = deliver(&state, "msg_same", &body).await.expect("first");
        assert!(first.get("duplicate").is_none());
        let Json(second) = deliver(&state, "msg_same", &body).await.expect("second");
        assert_eq!(second["duplicate"], json!(true));

        assert_eq!(deliveries(&db).await, 1);
        assert_eq!(audit_rows(&db, user).await, 1);
    }

    #[sqlx::test]
    async fn a_bounced_new_address_withdraws_the_pending_change(db: PgPool) {
        let (url, _) = fake_resend().await;
        let state = state(db.clone(), url, Some(SECRET));
        let user = account(&db, "moving", "old@example.invalid").await;
        sqlx::query(
            "UPDATE users SET pending_email = 'new@example.invalid', pending_email_token = 'pending-token', pending_email_expires_at = NOW() + INTERVAL '1 day' WHERE id = $1",
        )
        .bind(user)
        .execute(&db)
        .await
        .expect("pending");

        let Json(_) = deliver(
            &state,
            "msg_new_bounced",
            &event("email.bounced", "new@example.invalid", Some("Permanent")),
        )
        .await
        .expect("accepted");

        let (email, pending): (Option<String>, Option<String>) =
            sqlx::query_as("SELECT email, pending_email FROM users WHERE id = $1")
                .bind(user)
                .fetch_one(&db)
                .await
                .expect("row");
        assert_eq!(email.as_deref(), Some("old@example.invalid"));
        assert_eq!(pending, None);
        assert_eq!(reason(&db, "old@example.invalid").await, None);
    }

    #[sqlx::test]
    async fn moving_away_from_an_undeliverable_address_skips_the_notice(db: PgPool) {
        let (url, inbox) = fake_resend().await;
        let state = state(db.clone(), url, Some(SECRET));
        let user = account(&db, "stuck", "dead@example.invalid").await;
        let Json(_) = deliver(
            &state,
            "msg_dead",
            &event("email.bounced", "dead@example.invalid", Some("Permanent")),
        )
        .await
        .expect("accepted");

        let Json(body) = request_email_change(
            State(state.clone()),
            Extension(user),
            Json(ChangeEmailRequest {
                email: "alive@example.invalid".into(),
                password: PASSWORD.into(),
            }),
        )
        .await
        .expect("accepted");
        assert_eq!(body["current_email_notified"], json!(false));

        let inbox = inbox.lock().expect("lock");
        assert!(
            inbox
                .iter()
                .all(|m| m["to"] != json!(["dead@example.invalid"]))
        );
        assert!(
            inbox
                .iter()
                .any(|m| m["to"] == json!(["alive@example.invalid"]))
        );
    }

    #[sqlx::test]
    async fn an_undeliverable_address_cannot_be_added(db: PgPool) {
        let (url, inbox) = fake_resend().await;
        let state = state(db.clone(), url, Some(SECRET));
        let user = account(&db, "adding", "fine@example.invalid").await;
        let Json(_) = deliver(
            &state,
            "msg_refused",
            &event("email.complained", "refused@example.invalid", None),
        )
        .await
        .expect("accepted");

        assert!(matches!(
            request_email_change(
                State(state.clone()),
                Extension(user),
                Json(ChangeEmailRequest {
                    email: "refused@example.invalid".into(),
                    password: PASSWORD.into(),
                }),
            )
            .await,
            Err(AppError::Undeliverable(_))
        ));
        let pending: Option<String> =
            sqlx::query_scalar("SELECT pending_email FROM users WHERE id = $1")
                .bind(user)
                .fetch_one(&db)
                .await
                .expect("pending");
        assert_eq!(pending, None);
        assert!(inbox.lock().expect("lock").is_empty());
    }
}
