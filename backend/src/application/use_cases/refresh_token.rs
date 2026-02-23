use crate::infrastructure::db::repositories::refresh_token::RefreshTokenRepository;
use crate::infrastructure::security::jwt::service::JwtService;
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct RefreshTokenCommand {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct TokenPair {
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Clone)]
pub struct RefreshTokenUseCase {
    refresh_token_repository: RefreshTokenRepository,
    jwt_service: JwtService,
}

impl RefreshTokenUseCase {
    pub fn new(refresh_token_repository: RefreshTokenRepository, jwt_service: JwtService) -> Self {
        Self {
            refresh_token_repository,
            jwt_service,
        }
    }

    pub async fn execute(&self, command: RefreshTokenCommand) -> Result<TokenPair, String> {
        // 1. Verify Refresh Token format/signature
        let token_data = self
            .jwt_service
            .verify_refresh_token(&command.refresh_token)?;
        let claims = token_data.claims;

        // 2. Check if token exists and is not revoked in DB
        let db_token = self
            .refresh_token_repository
            .find_by_token(&command.refresh_token)
            .await?
            .ok_or("Invalid refresh token")?;

        if db_token.is_revoked {
            // Potential reuse attack! Revoking all tokens for this user for security.
            self.refresh_token_repository
                .revoke_all_for_user(claims.user_id)
                .await?;
            return Err("Token has been revoked. Re-login required for security.".to_string());
        }

        if db_token.expires_at < Utc::now() {
            return Err("Refresh token expired".to_string());
        }

        // 3. Rotate Token: Revoke current and issue new pair
        self.refresh_token_repository
            .revoke_token(&command.refresh_token)
            .await?;

        let new_access_token =
            self.jwt_service
                .generate_token(claims.user_id, &claims.sub, claims.role.clone())?;
        let new_refresh_token_value = self.jwt_service.generate_refresh_token(
            claims.user_id,
            &claims.sub,
            claims.role.clone(),
        )?;

        let expires_at = Utc::now() + Duration::days(7);
        self.refresh_token_repository
            .create_token(claims.user_id, new_refresh_token_value.clone(), expires_at)
            .await?;

        Ok(TokenPair {
            access_token: new_access_token,
            refresh_token: new_refresh_token_value,
        })
    }
}
