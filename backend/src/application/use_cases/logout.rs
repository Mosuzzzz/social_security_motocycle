use crate::infrastructure::db::repositories::refresh_token::RefreshTokenRepository;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct LogoutCommand {
    pub refresh_token: String,
}

#[derive(Clone)]
pub struct LogoutUseCase {
    refresh_token_repository: RefreshTokenRepository,
}

impl LogoutUseCase {
    pub fn new(refresh_token_repository: RefreshTokenRepository) -> Self {
        Self {
            refresh_token_repository,
        }
    }

    pub async fn execute(&self, command: LogoutCommand) -> Result<(), String> {
        // Revoke the refresh token in the database
        self.refresh_token_repository
            .revoke_token(&command.refresh_token)
            .await
    }
}
