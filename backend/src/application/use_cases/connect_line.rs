use crate::infrastructure::db::repositories::user_line_account::UserLineAccountRepository;
use crate::infrastructure::external::notification::line::LineNotificationGateway;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
pub struct ConnectLineCommand {
    pub line_user_id: String,
    pub display_name: Option<String>,
    pub picture_url: Option<String>,
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
        // Fetch profile from LINE as a fallback or to verify
        // If it fails with 404, we can still use the provided info from the client
        let (display_name, picture_url) = match self
            .line_gateway
            .get_profile(&command.line_user_id)
            .await
        {
            Ok(profile) => {
                let d_name = profile["displayName"]
                    .as_str()
                    .map(|s| s.to_string())
                    .or(command.display_name);
                let p_url = profile["pictureUrl"]
                    .as_str()
                    .map(|s| s.to_string())
                    .or(command.picture_url);
                (d_name, p_url)
            }
            Err(e) if e.contains("404") => {
                tracing::warn!(
                    "LINE profile not found (user likely not a friend of bot): {}. Using provided info.",
                    e
                );
                (command.display_name, command.picture_url)
            }
            Err(e) => return Err(e),
        };

        self.line_repo
            .link_account(user_id_val, command.line_user_id, display_name, picture_url)
            .await?;

        Ok(ConnectLineResult {
            success: true,
            message: "LINE account connected successfully with profile".to_string(),
        })
    }
}
