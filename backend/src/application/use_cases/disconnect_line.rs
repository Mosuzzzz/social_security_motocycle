use crate::infrastructure::db::repositories::user_line_account::UserLineAccountRepository;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct DisconnectLineResult {
    pub success: bool,
    pub message: String,
}

#[derive(Clone)]
pub struct DisconnectLineUseCase {
    line_repo: UserLineAccountRepository,
}

impl DisconnectLineUseCase {
    pub fn new(line_repo: UserLineAccountRepository) -> Self {
        Self { line_repo }
    }

    pub async fn execute(&self, user_id: i32) -> Result<DisconnectLineResult, String> {
        self.line_repo.unlink_account(user_id).await?;

        Ok(DisconnectLineResult {
            success: true,
            message: "LINE account disconnected successfully".to_string(),
        })
    }
}
