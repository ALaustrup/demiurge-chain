//! # Wallet WASM Package
//! 
//! Browser-based wallet signing for QOR ID accounts.
//! 
//! This package provides secure key generation and transaction signing
//! in the browser using WebAssembly.

use wasm_bindgen::prelude::*;
use schnorrkel::{Keypair, SecretKey, PUBLIC_KEY_LENGTH, SECRET_KEY_LENGTH};
use zeroize::ZeroizeOnDrop;
use serde::{Deserialize, Serialize};
use serde_json;
use sha2::{Sha256, Digest};

/// Initialize panic hook for better error messages
#[wasm_bindgen(start)]
pub fn init() {
    // Panic hook initialization
    // In production, use console_error_panic_hook crate if needed
}

/// Wallet keypair stored securely
#[derive(Serialize, Deserialize, ZeroizeOnDrop)]
struct StoredKeypair {
    #[serde(with = "serde_bytes")]
    secret_key: Vec<u8>,
    #[serde(with = "serde_bytes")]
    public_key: Vec<u8>,
}

impl StoredKeypair {
    fn from_keypair(keypair: &Keypair) -> Self {
        let secret = keypair.secret.to_bytes().to_vec();
        let public = keypair.public.to_bytes().to_vec();
        Self {
            secret_key: secret,
            public_key: public,
        }
    }

    fn to_keypair(&self) -> Result<Keypair, JsValue> {
        if self.secret_key.len() != SECRET_KEY_LENGTH {
            return Err(JsValue::from_str("Invalid secret key length"));
        }
        let secret_array: [u8; SECRET_KEY_LENGTH] = self.secret_key[..]
            .try_into()
            .map_err(|_| JsValue::from_str("Failed to convert secret key"))?;
        let secret = SecretKey::from_bytes(&secret_array)
            .map_err(|e| JsValue::from_str(&format!("Invalid secret key: {:?}", e)))?;
        Ok(Keypair::from(secret))
    }
}

/// Generate a keypair from a seed (deterministic)
/// 
/// Uses SHA256 hash of the seed to generate a deterministic keypair
#[wasm_bindgen]
pub fn generate_keypair_from_seed(seed: &str) -> Result<String, JsValue> {
    // Hash the seed to get 32 bytes for keypair generation
    let mut hasher = Sha256::new();
    hasher.update(seed.as_bytes());
    let seed_hash = hasher.finalize();
    
    // Use first 32 bytes as seed for keypair
    let seed_bytes: [u8; 32] = seed_hash[..32]
        .try_into()
        .map_err(|_| JsValue::from_str("Failed to create seed bytes"))?;
    
    let keypair = Keypair::from_bytes(&seed_bytes)
        .map_err(|e| JsValue::from_str(&format!("Keypair generation error: {:?}", e)))?;
    
    let stored = StoredKeypair::from_keypair(&keypair);
    let json = serde_json::to_string(&stored)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))?;
    Ok(json)
}

/// Get address from keypair JSON
#[wasm_bindgen]
pub fn get_address_from_keypair(keypair_json: &str) -> Result<String, JsValue> {
    let stored: StoredKeypair = serde_json::from_str(keypair_json)
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;
    
    // Return public key as hex (client can convert to SS58 using Polkadot.js)
    Ok(hex::encode(&stored.public_key))
}

/// Sign a message with a keypair
#[wasm_bindgen]
pub fn sign_message(keypair_json: &str, message: &[u8]) -> Result<String, JsValue> {
    let stored: StoredKeypair = serde_json::from_str(keypair_json)
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;
    
    let keypair = stored.to_keypair()?;
    let signature = keypair.sign_simple(b"substrate", message);
    let sig_bytes = signature.to_bytes();
    
    Ok(hex::encode(sig_bytes))
}

/// Verify a signature
#[wasm_bindgen]
pub fn verify_signature(public_key_hex: &str, message: &[u8], signature_hex: &str) -> Result<bool, JsValue> {
    let public_key_bytes = hex::decode(public_key_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid hex: {}", e)))?;
    
    if public_key_bytes.len() != PUBLIC_KEY_LENGTH {
        return Err(JsValue::from_str("Invalid public key length"));
    }
    
    let signature_bytes = hex::decode(signature_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid hex: {}", e)))?;
    
    if signature_bytes.len() != 64 {
        return Err(JsValue::from_str("Invalid signature length"));
    }
    
    let public_key_array: [u8; PUBLIC_KEY_LENGTH] = public_key_bytes[..]
        .try_into()
        .map_err(|_| JsValue::from_str("Failed to convert public key"))?;
    
    let signature_array: [u8; 64] = signature_bytes[..]
        .try_into()
        .map_err(|_| JsValue::from_str("Failed to convert signature"))?;
    
    let public_key = schnorrkel::PublicKey::from_bytes(&public_key_array)
        .map_err(|e| JsValue::from_str(&format!("Invalid public key: {:?}", e)))?;
    
    let signature = schnorrkel::Signature::from_bytes(&signature_array)
        .map_err(|e| JsValue::from_str(&format!("Invalid signature: {:?}", e)))?;
    
    Ok(public_key.verify_simple(b"substrate", message, &signature).is_ok())
}

/// Generate a random keypair (for testing)
#[wasm_bindgen]
pub fn generate_random_keypair() -> Result<String, JsValue> {
    use rand::RngCore;
    let mut rng = rand::rngs::OsRng;
    let mut seed = [0u8; 32];
    rng.fill_bytes(&mut seed);
    let keypair = Keypair::from_bytes(&seed)
        .map_err(|e| JsValue::from_str(&format!("Keypair generation error: {:?}", e)))?;
    let stored = StoredKeypair::from_keypair(&keypair);
    let json = serde_json::to_string(&stored)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))?;
    Ok(json)
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
    
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}! Wallet WASM loaded.", name));
}
