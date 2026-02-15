use crate::domain::user::entity::Role;
use jsonwebtoken::{DecodingKey, EncodingKey, Header, TokenData, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use std::env;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // username
    pub user_id: i32,
    pub role: Role,
    pub exp: usize,
}

use std::sync::Arc;

#[derive(Clone)]
pub struct JwtService {
    encoding_key: Arc<EncodingKey>,
    decoding_key: Arc<DecodingKey>,
    expiration: usize,
}

impl JwtService {
    pub fn new() -> Self {
        let secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
        let expiration = env::var("JWT_EXPIRATION")
            .unwrap_or_else(|_| "3600".to_string())
            .parse::<usize>()
            .expect("JWT_EXPIRATION must be a number");

        Self {
            encoding_key: Arc::new(EncodingKey::from_secret(secret.as_bytes())),
            decoding_key: Arc::new(DecodingKey::from_secret(secret.as_bytes())),
            expiration,
        }
    }

    pub fn generate_token(
        &self,
        user_id: i32,
        username: &str,
        role: Role,
    ) -> Result<String, String> {
        let expiration = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_secs() as usize
            + self.expiration;

        let claims = Claims {
            sub: username.to_string(),
            user_id,
            role,
            exp: expiration,
        };

        encode(&Header::default(), &claims, &self.encoding_key).map_err(|e| e.to_string())
    }

    pub fn verify_token(&self, token: &str) -> Result<TokenData<Claims>, String> {
        decode::<Claims>(token, &self.decoding_key, &Validation::default())
            .map_err(|e| e.to_string())
    }
}
