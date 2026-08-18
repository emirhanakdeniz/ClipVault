use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use base64::prelude::*;
use rand::RngCore;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use zeroize::Zeroize;

pub const CIPHER_PREFIX: &str = "enc:v1:";
pub const CANARY_PLAINTEXT: &str = "CLIPVAULT_ENCRYPTION_CANARY_V1";
pub const ENCRYPTION_CONFIG_KEY: &str = "encryption_config";

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct EncryptionConfig {
    pub salt: String,   // Base64-encoded 16-byte salt
    pub canary: String, // "enc:v1:<base64(nonce + ciphertext_tag)>"
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EncryptionStatus {
    pub configured: bool,
    pub unlocked: bool,
}

pub struct VaultManager {
    pub active_key: Mutex<Option<[u8; 32]>>,
}

impl Default for VaultManager {
    fn default() -> Self {
        Self::new()
    }
}

impl VaultManager {
    pub fn new() -> Self {
        Self {
            active_key: Mutex::new(None),
        }
    }

    /// Derives a 32-byte (256-bit) encryption key from a passphrase and a 16-byte salt using Argon2id.
    pub fn derive_key(passphrase: &str, salt: &[u8]) -> Result<[u8; 32], String> {
        let trimmed = passphrase.trim();
        if trimmed.is_empty() {
            return Err("Passphrase cannot be empty".to_string());
        }
        let mut key = [0u8; 32];
        let argon2 = argon2::Argon2::default();
        argon2
            .hash_password_into(passphrase.as_bytes(), salt, &mut key)
            .map_err(|e| format!("Key derivation failed: {e}"))?;
        Ok(key)
    }

    /// Encrypts plaintext using AES-256-GCM with a random 96-bit nonce.
    /// Returns a versioned string: "enc:v1:<base64(nonce + ciphertext + tag)>"
    pub fn encrypt_payload(key: &[u8; 32], plaintext: &str) -> Result<String, String> {
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
        let mut nonce_bytes = [0u8; 12];
        rand::rngs::OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let ciphertext = cipher
            .encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| format!("Encryption failed: {e}"))?;

        let mut combined = Vec::with_capacity(12 + ciphertext.len());
        combined.extend_from_slice(&nonce_bytes);
        combined.extend_from_slice(&ciphertext);

        let b64 = BASE64_STANDARD.encode(&combined);
        Ok(format!("{}{}", CIPHER_PREFIX, b64))
    }

    /// True if content string has the encrypted prefix.
    pub fn is_encrypted(content: &str) -> bool {
        content.starts_with(CIPHER_PREFIX)
    }

    /// Decrypts a versioned AES-256-GCM ciphertext payload.
    /// If content is not encrypted, returns it unchanged.
    pub fn decrypt_payload(key: &[u8; 32], raw_payload: &str) -> Result<String, String> {
        if !Self::is_encrypted(raw_payload) {
            return Ok(raw_payload.to_string());
        }
        let b64_str = &raw_payload[CIPHER_PREFIX.len()..];
        let combined = BASE64_STANDARD
            .decode(b64_str)
            .map_err(|e| format!("Malformed ciphertext encoding: {e}"))?;

        if combined.len() < 12 + 16 {
            return Err("Ciphertext payload is truncated".to_string());
        }

        let (nonce_bytes, ciphertext) = combined.split_at(12);
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
        let nonce = Nonce::from_slice(nonce_bytes);

        let decrypted_bytes = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| format!("Decryption failed: {e}"))?;

        String::from_utf8(decrypted_bytes)
            .map_err(|e| format!("Decrypted payload is not valid UTF-8: {e}"))
    }

    /// Reads the current encryption config from the settings table.
    pub fn read_config(conn: &Connection) -> Result<Option<EncryptionConfig>, String> {
        let result = conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![ENCRYPTION_CONFIG_KEY],
            |row| row.get::<_, String>(0),
        );

        match result {
            Ok(json_str) => {
                let config: EncryptionConfig = serde_json::from_str(&json_str)
                    .map_err(|e| format!("Invalid encryption configuration JSON: {e}"))?;
                Ok(Some(config))
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    /// Returns the current vault status (configured, unlocked).
    pub fn get_status(&self, conn: &Connection) -> Result<EncryptionStatus, String> {
        let config = Self::read_config(conn)?;
        let configured = config.is_some();
        let unlocked = self.is_unlocked();
        Ok(EncryptionStatus {
            configured,
            unlocked,
        })
    }

    /// True if an encryption key is currently held in volatile memory.
    pub fn is_unlocked(&self) -> bool {
        self.active_key
            .lock()
            .map(|guard| guard.is_some())
            .unwrap_or(false)
    }

    /// Initial setup: sets up a master passphrase, encrypts validation canary,
    /// and encrypts all existing sensitive snippets in the database.
    pub fn setup(&self, conn: &Connection, passphrase: &str) -> Result<(), String> {
        if passphrase.trim().len() < 4 {
            return Err("Passphrase must be at least 4 characters long".to_string());
        }

        if Self::read_config(conn)?.is_some() {
            return Err("Encryption is already configured on this vault".to_string());
        }

        let mut salt = [0u8; 16];
        rand::rngs::OsRng.fill_bytes(&mut salt);
        let key = Self::derive_key(passphrase, &salt)?;

        let canary = Self::encrypt_payload(&key, CANARY_PLAINTEXT)?;
        let config = EncryptionConfig {
            salt: BASE64_STANDARD.encode(&salt),
            canary,
        };
        let config_json = serde_json::to_string(&config).map_err(|e| e.to_string())?;

        // 1. Transaction to write config and encrypt existing sensitive snippets
        let mut stmt = conn
            .prepare("SELECT id, content FROM snippets WHERE sensitive = 1")
            .map_err(|e| e.to_string())?;

        let sensitive_items: Vec<(String, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![ENCRYPTION_CONFIG_KEY, config_json],
        )
        .map_err(|e| e.to_string())?;

        for (id, content) in sensitive_items {
            if !Self::is_encrypted(&content) {
                let encrypted = Self::encrypt_payload(&key, &content)?;
                tx.execute(
                    "UPDATE snippets SET content = ?1 WHERE id = ?2",
                    params![encrypted, id],
                )
                .map_err(|e| e.to_string())?;
            }
        }

        tx.commit().map_err(|e| e.to_string())?;

        // 2. Retain derived key in memory
        let mut active = self.active_key.lock().map_err(|e| e.to_string())?;
        *active = Some(key);

        Ok(())
    }

    /// Unlocks the vault by verifying the passphrase against the stored canary.
    pub fn unlock(&self, conn: &Connection, passphrase: &str) -> Result<(), String> {
        let config = Self::read_config(conn)?
            .ok_or_else(|| "Encryption is not configured on this vault".to_string())?;

        let salt_bytes = BASE64_STANDARD
            .decode(&config.salt)
            .map_err(|e| format!("Invalid stored salt: {e}"))?;

        let key = Self::derive_key(passphrase, &salt_bytes)?;

        // Verify key against canary
        let decrypted_canary = Self::decrypt_payload(&key, &config.canary)
            .map_err(|_| "Incorrect passphrase".to_string())?;

        if decrypted_canary != CANARY_PLAINTEXT {
            return Err("Incorrect passphrase".to_string());
        }

        let mut active = self.active_key.lock().map_err(|e| e.to_string())?;
        *active = Some(key);

        Ok(())
    }

    /// Clears and zeroizes the active encryption key in memory.
    pub fn lock(&self) -> Result<(), String> {
        let mut active = self.active_key.lock().map_err(|e| e.to_string())?;
        if let Some(mut key) = active.take() {
            key.zeroize();
        }
        Ok(())
    }

    /// Re-encrypts canary and all sensitive snippets with a new passphrase.
    pub fn change_passphrase(
        &self,
        conn: &Connection,
        old_passphrase: &str,
        new_passphrase: &str,
    ) -> Result<(), String> {
        if new_passphrase.trim().len() < 4 {
            return Err("New passphrase must be at least 4 characters long".to_string());
        }

        let config = Self::read_config(conn)?
            .ok_or_else(|| "Encryption is not configured on this vault".to_string())?;

        let old_salt_bytes = BASE64_STANDARD
            .decode(&config.salt)
            .map_err(|e| format!("Invalid stored salt: {e}"))?;

        let old_key = Self::derive_key(old_passphrase, &old_salt_bytes)?;

        // Verify old key
        let decrypted_canary = Self::decrypt_payload(&old_key, &config.canary)
            .map_err(|_| "Current passphrase is incorrect".to_string())?;
        if decrypted_canary != CANARY_PLAINTEXT {
            return Err("Current passphrase is incorrect".to_string());
        }

        // Fetch and decrypt all sensitive snippets with old key
        let mut stmt = conn
            .prepare("SELECT id, content FROM snippets WHERE sensitive = 1")
            .map_err(|e| e.to_string())?;

        let sensitive_items: Vec<(String, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let mut decrypted_items = Vec::with_capacity(sensitive_items.len());
        for (id, content) in sensitive_items {
            let plaintext = if Self::is_encrypted(&content) {
                Self::decrypt_payload(&old_key, &content)
                    .map_err(|e| format!("Failed to decrypt snippet {id}: {e}"))?
            } else {
                content
            };
            decrypted_items.push((id, plaintext));
        }

        // Derive new key with new random salt
        let mut new_salt = [0u8; 16];
        rand::rngs::OsRng.fill_bytes(&mut new_salt);
        let new_key = Self::derive_key(new_passphrase, &new_salt)?;

        let new_canary = Self::encrypt_payload(&new_key, CANARY_PLAINTEXT)?;
        let new_config = EncryptionConfig {
            salt: BASE64_STANDARD.encode(&new_salt),
            canary: new_canary,
        };
        let new_config_json = serde_json::to_string(&new_config).map_err(|e| e.to_string())?;

        // Re-encrypt in transaction
        let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;

        tx.execute(
            "UPDATE settings SET value = ?1 WHERE key = ?2",
            params![new_config_json, ENCRYPTION_CONFIG_KEY],
        )
        .map_err(|e| e.to_string())?;

        for (id, plaintext) in decrypted_items {
            let encrypted = Self::encrypt_payload(&new_key, &plaintext)?;
            tx.execute(
                "UPDATE snippets SET content = ?1 WHERE id = ?2",
                params![encrypted, id],
            )
            .map_err(|e| e.to_string())?;
        }

        tx.commit().map_err(|e| e.to_string())?;

        // Update active key
        let mut active = self.active_key.lock().map_err(|e| e.to_string())?;
        *active = Some(new_key);

        Ok(())
    }

    /// Disables encryption, decrypting all sensitive snippets back to plaintext
    /// and removing the encryption configuration from settings.
    pub fn disable_encryption(&self, conn: &Connection, passphrase: &str) -> Result<(), String> {
        let config = Self::read_config(conn)?
            .ok_or_else(|| "Encryption is not configured on this vault".to_string())?;

        let salt_bytes = BASE64_STANDARD
            .decode(&config.salt)
            .map_err(|e| format!("Invalid stored salt: {e}"))?;

        let key = Self::derive_key(passphrase, &salt_bytes)?;

        // Verify key
        let decrypted_canary = Self::decrypt_payload(&key, &config.canary)
            .map_err(|_| "Incorrect passphrase".to_string())?;
        if decrypted_canary != CANARY_PLAINTEXT {
            return Err("Incorrect passphrase".to_string());
        }

        // Fetch and decrypt all sensitive snippets
        let mut stmt = conn
            .prepare("SELECT id, content FROM snippets WHERE sensitive = 1")
            .map_err(|e| e.to_string())?;

        let sensitive_items: Vec<(String, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let mut decrypted_items = Vec::with_capacity(sensitive_items.len());
        for (id, content) in sensitive_items {
            let plaintext = if Self::is_encrypted(&content) {
                Self::decrypt_payload(&key, &content)
                    .map_err(|e| format!("Failed to decrypt snippet {id}: {e}"))?
            } else {
                content
            };
            decrypted_items.push((id, plaintext));
        }

        // Restore plaintext and delete settings
        let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;

        tx.execute(
            "DELETE FROM settings WHERE key = ?1",
            params![ENCRYPTION_CONFIG_KEY],
        )
        .map_err(|e| e.to_string())?;

        for (id, plaintext) in decrypted_items {
            tx.execute(
                "UPDATE snippets SET content = ?1 WHERE id = ?2",
                params![plaintext, id],
            )
            .map_err(|e| e.to_string())?;
        }

        tx.commit().map_err(|e| e.to_string())?;

        // Clear active key
        let mut active = self.active_key.lock().map_err(|e| e.to_string())?;
        if let Some(mut k) = active.take() {
            k.zeroize();
        }

        Ok(())
    }

    /// Encrypts content with the active key if unlocked.
    /// If encryption is not configured, returns plaintext unchanged.
    /// If configured but locked, returns an error.
    pub fn encrypt_for_storage(&self, conn: &Connection, plaintext: &str) -> Result<String, String> {
        let is_configured = Self::read_config(conn)?.is_some();
        if !is_configured {
            return Ok(plaintext.to_string());
        }

        let guard = self.active_key.lock().map_err(|e| e.to_string())?;
        match *guard {
            Some(ref key) => Self::encrypt_payload(key, plaintext),
            None => Err("Vault is locked. Unlock to perform encryption.".to_string()),
        }
    }

    /// Decrypts content from storage for display.
    /// Returns (decrypted_content, is_locked).
    pub fn decrypt_from_storage(
        &self,
        raw_content: &str,
        is_sensitive: bool,
    ) -> (String, bool) {
        if !is_sensitive || !Self::is_encrypted(raw_content) {
            return (raw_content.to_string(), false);
        }

        let guard = match self.active_key.lock() {
            Ok(g) => g,
            Err(_) => return ("[Decryption error: lock poisoned]".to_string(), false),
        };

        match *guard {
            Some(ref key) => match Self::decrypt_payload(key, raw_content) {
                Ok(plain) => (plain, false),
                Err(_) => (
                    "[Decryption error: corrupted content or invalid key]".to_string(),
                    false,
                ),
            },
            None => ("[Locked sensitive snippet]".to_string(), true),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::setup_schema;

    #[test]
    fn test_argon2_key_derivation_deterministic() {
        let salt = [42u8; 16];
        let key1 = VaultManager::derive_key("my-secret-passphrase", &salt).unwrap();
        let key2 = VaultManager::derive_key("my-secret-passphrase", &salt).unwrap();
        assert_eq!(key1, key2);

        let other_key = VaultManager::derive_key("different-passphrase", &salt).unwrap();
        assert_ne!(key1, other_key);

        assert!(VaultManager::derive_key("", &salt).is_err());
        assert!(VaultManager::derive_key("   ", &salt).is_err());
    }

    #[test]
    fn test_aes_gcm_encrypt_and_decrypt_roundtrip() {
        let salt = [7u8; 16];
        let key = VaultManager::derive_key("secure-passphrase", &salt).unwrap();

        let original = "Hello, ClipVault Sensitive Snippet! 🔐 \nSpecial characters: $&%#@!";
        let ciphertext = VaultManager::encrypt_payload(&key, original).unwrap();

        assert!(ciphertext.starts_with(CIPHER_PREFIX));
        assert_ne!(ciphertext, original);

        let decrypted = VaultManager::decrypt_payload(&key, &ciphertext).unwrap();
        assert_eq!(decrypted, original);
    }

    #[test]
    fn test_tampered_ciphertext_fails_gracefully() {
        let salt = [1u8; 16];
        let key = VaultManager::derive_key("passphrase-1", &salt).unwrap();
        let wrong_key = VaultManager::derive_key("passphrase-2", &salt).unwrap();

        let original = "Sensitive token: secret_api_key_12345";
        let ciphertext = VaultManager::encrypt_payload(&key, original).unwrap();

        // Decrypting with wrong key returns Err without crashing
        let result = VaultManager::decrypt_payload(&wrong_key, &ciphertext);
        assert!(result.is_err());

        // Malformed base64
        let malformed = format!("{}not-valid-base64-content!@#$", CIPHER_PREFIX);
        assert!(VaultManager::decrypt_payload(&key, &malformed).is_err());

        // Truncated payload
        let truncated = format!("{}AAAA", CIPHER_PREFIX);
        assert!(VaultManager::decrypt_payload(&key, &truncated).is_err());
    }

    #[test]
    fn test_vault_manager_setup_unlock_and_lock_lifecycle() {
        let conn = Connection::open_in_memory().unwrap();
        setup_schema(&conn).unwrap();

        let vault = VaultManager::new();

        // Initially not configured, locked
        let status = vault.get_status(&conn).unwrap();
        assert_eq!(
            status,
            EncryptionStatus {
                configured: false,
                unlocked: false
            }
        );

        // Setup encryption
        vault.setup(&conn, "master-password-123").unwrap();
        let status = vault.get_status(&conn).unwrap();
        assert_eq!(
            status,
            EncryptionStatus {
                configured: true,
                unlocked: true
            }
        );

        // Lock vault
        vault.lock().unwrap();
        let status = vault.get_status(&conn).unwrap();
        assert_eq!(
            status,
            EncryptionStatus {
                configured: true,
                unlocked: false
            }
        );

        // Failed unlock with wrong password
        let unlock_err = vault.unlock(&conn, "wrong-password");
        assert!(unlock_err.is_err());
        assert!(!vault.is_unlocked());

        // Successful unlock
        vault.unlock(&conn, "master-password-123").unwrap();
        assert!(vault.is_unlocked());
    }

    #[test]
    fn test_vault_change_passphrase_and_disable() {
        let conn = Connection::open_in_memory().unwrap();
        setup_schema(&conn).unwrap();

        let vault = VaultManager::new();

        // Add a sensitive snippet prior to encryption
        let now = 1000i64;
        conn.execute(
            "INSERT INTO snippets (id, title, content, type, favorite, pinned, archived, tags, created_at, updated_at, source, sensitive)
             VALUES ('snip-1', 'Secret Key', 'super-secret-api-token', 'text', 0, 0, 0, '[]', ?1, ?1, 'manual', 1)",
            params![now],
        )
        .unwrap();

        // Setup encryption -> encrypts existing sensitive snippets
        vault.setup(&conn, "pass-alpha").unwrap();

        let stored_content: String = conn
            .query_row(
                "SELECT content FROM snippets WHERE id = 'snip-1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert!(stored_content.starts_with(CIPHER_PREFIX));

        // Decrypt from storage returns plaintext
        let (plain, locked) = vault.decrypt_from_storage(&stored_content, true);
        assert!(!locked);
        assert_eq!(plain, "super-secret-api-token");

        // Change passphrase
        vault
            .change_passphrase(&conn, "pass-alpha", "pass-beta-new")
            .unwrap();
        assert!(vault.is_unlocked());

        // Lock and unlock with new passphrase
        vault.lock().unwrap();
        assert!(vault.unlock(&conn, "pass-alpha").is_err());
        vault.unlock(&conn, "pass-beta-new").unwrap();
        assert!(vault.is_unlocked());

        // Disable encryption -> restores plaintext in DB
        vault.disable_encryption(&conn, "pass-beta-new").unwrap();
        let status = vault.get_status(&conn).unwrap();
        assert_eq!(
            status,
            EncryptionStatus {
                configured: false,
                unlocked: false
            }
        );

        let restored_content: String = conn
            .query_row(
                "SELECT content FROM snippets WHERE id = 'snip-1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(restored_content, "super-secret-api-token");
        assert!(!restored_content.starts_with(CIPHER_PREFIX));
    }
}
