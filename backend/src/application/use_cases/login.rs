use crate::domain::user::entity::Role;
use crate::infrastructure::db::repositories::refresh_token::RefreshTokenRepository;
use crate::infrastructure::db::repositories::user::UserRepository;
use crate::infrastructure::db::repositories::user_line_account::UserLineAccountRepository;
use crate::infrastructure::external::notification::line::LineNotificationGateway;
use crate::infrastructure::security::jwt::service::JwtService;
use crate::infrastructure::security::password::verify_password;
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Deserialize)]
pub struct LoginCommand {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResult {
    pub access_token: String,
    pub refresh_token: String,
    pub user_id: i32,
    pub username: String,
    pub role: Role,
    pub avatar_url: Option<String>,
}

#[derive(Clone)]
pub struct LoginUseCase {
    user_repository: UserRepository,
    line_repository: UserLineAccountRepository,
    refresh_token_repository: RefreshTokenRepository,
    jwt_service: JwtService,
    line_gateway: Arc<LineNotificationGateway>,
}

impl LoginUseCase {
    pub fn new(
        user_repository: UserRepository,
        line_repository: UserLineAccountRepository,
        refresh_token_repository: RefreshTokenRepository,
        jwt_service: JwtService,
        line_gateway: Arc<LineNotificationGateway>,
    ) -> Self {
        Self {
            user_repository,
            line_repository,
            refresh_token_repository,
            jwt_service,
            line_gateway,
        }
    }

    pub async fn execute(&self, command: LoginCommand) -> Result<LoginResult, String> {
        // 1. Find user
        let user = self
            .user_repository
            .find_by_username(&command.username)
            .await?
            .ok_or("Invalid username or password".to_string())?;

        // 2. Verify password
        if !verify_password(&user.password_hash, &command.password)? {
            return Err("Invalid username or password".to_string());
        }

        // 3. Generate Tokens
        let user_id = user.id.ok_or("User has no ID")?;
        let token = self
            .jwt_service
            .generate_token(user_id, &user.username, user.role.clone())?;

        let refresh_token_value =
            self.jwt_service
                .generate_refresh_token(user_id, &user.username, user.role.clone())?;

        // 4. Save Refresh Token (expires in 7 days by default)
        let expires_at = Utc::now() + Duration::days(7);
        self.refresh_token_repository
            .create_token(user_id, refresh_token_value.clone(), expires_at)
            .await?;

        // 5. Get LINE profile if available
        let line_account = self
            .line_repository
            .find_by_user_id(user_id)
            .await
            .unwrap_or(None);

        let mut avatar_url = line_account
            .as_ref()
            .and_then(|acc| acc.picture_url.clone());

        // Proactive sync: if we have a line_user_id but no avatar, try to fetch it
        if let Some(acc) = line_account {
            if acc.picture_url.is_none() {
                if let Ok(profile) = self.line_gateway.get_profile(&acc.line_user_id).await {
                    let dn = profile["displayName"].as_str().map(|s| s.to_string());
                    let pu = profile["pictureUrl"].as_str().map(|s| s.to_string());
                    // Update DB with latest profile
                    let _ = self
                        .line_repository
                        .link_account(user_id, acc.line_user_id, dn, pu.clone())
                        .await;
                    avatar_url = pu;
                }
            }
        }

        Ok(LoginResult {
            access_token: token,
            refresh_token: refresh_token_value,
            user_id,
            username: user.username,
            role: user.role,
            avatar_url,
        })
    }
}
