use crate::infrastructure::db::repositories::user_line_account::UserLineAccountRepository;
use crate::infrastructure::external::notification::line::LineNotificationGateway;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
pub struct ConnectLineCommand {
    pub line_user_id: String,
}

#[derive(Serialize)]
pub struct ConnectLineResult {
    pub success: bool,
    pub message: String,
}

pub struct ConnectLineUseCase {
    line_repo: UserLineAccountRepository,
    line_gateway: Arc<LineNotificationGateway>,
}

impl ConnectLineUseCase {
    pub fn new(
        line_repo: UserLineAccountRepository,
        line_gateway: Arc<LineNotificationGateway>,
    ) -> Self {
        Self {
            line_repo,
            line_gateway,
        }
    }

    pub async fn execute(
        &self,
        user_id_val: i32,
        command: ConnectLineCommand,
    ) -> Result<ConnectLineResult, String> {
        // Fetch profile from LINE
        let profile = self.line_gateway.get_profile(&command.line_user_id).await?;

        let display_name = profile["displayName"].as_str().map(|s| s.to_string());
        let picture_url = profile["pictureUrl"].as_str().map(|s| s.to_string());

        self.line_repo
            .link_account(user_id_val, command.line_user_id, display_name, picture_url)
            .await?;

        Ok(ConnectLineResult {
            success: true,
            message: "LINE account connected successfully with profile".to_string(),
        })
    }
}
