//! Qor ID specific models and utilities.

use serde::{Deserialize, Serialize};
use std::fmt;

/// Parsed Qor ID components
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QorId {
    pub username: String,
    pub discriminator: i16,
}

impl QorId {
    /// Parse a Qor ID string (e.g., "username#1337")
    pub fn parse(s: &str) -> Option<Self> {
        let parts: Vec<&str> = s.split('#').collect();
        if parts.len() != 2 {
            return None;
        }

        let username = parts[0].to_lowercase();
        let discriminator = parts[1].parse::<i16>().ok()?;

        if !(0..=9999).contains(&discriminator) {
            return None;
        }

        Some(Self {
            username,
            discriminator,
        })
    }

    /// Validate username format
    pub fn is_valid_username(username: &str) -> bool {
        // 3-20 characters, alphanumeric and underscores only
        let len = username.len();
        if !(3..=20).contains(&len) {
            return false;
        }

        username
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_')
    }
}

impl fmt::Display for QorId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}#{:04}", self.username, self.discriminator)
    }
}

impl Serialize for QorId {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl<'de> Deserialize<'de> for QorId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        QorId::parse(&s).ok_or_else(|| serde::de::Error::custom("Invalid Qor ID format"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_qor_id_parse() {
        let qor_id = QorId::parse("alaustrup#1337").unwrap();
        assert_eq!(qor_id.username, "alaustrup");
        assert_eq!(qor_id.discriminator, 1337);
    }

    #[test]
    fn test_qor_id_display() {
        let qor_id = QorId {
            username: "alaustrup".into(),
            discriminator: 42,
        };
        assert_eq!(qor_id.to_string(), "alaustrup#0042");
    }

    #[test]
    fn test_invalid_qor_id() {
        assert!(QorId::parse("invalid").is_none());
        assert!(QorId::parse("user#99999").is_none());
        assert!(QorId::parse("user#-1").is_none());
    }

    #[test]
    fn test_username_validation() {
        assert!(QorId::is_valid_username("alaustrup"));
        assert!(QorId::is_valid_username("user_123"));
        assert!(!QorId::is_valid_username("ab")); // too short
        assert!(!QorId::is_valid_username("user name")); // space
        assert!(!QorId::is_valid_username("user@name")); // special char
    }
}
