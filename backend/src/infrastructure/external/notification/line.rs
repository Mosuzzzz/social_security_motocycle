use crate::domain::notification::gateway::{NotificationGateway, NotificationMessage};
use async_trait::async_trait;
use reqwest::Client;
use std::env;

pub struct LineNotificationGateway {
    client: Client,
    channel_access_token: String,
}

impl LineNotificationGateway {
    pub fn new() -> Self {
        let channel_access_token =
            env::var("LINE_CHANNEL_ACCESS_TOKEN").expect("LINE_CHANNEL_ACCESS_TOKEN must be set");

        Self {
            client: Client::new(),
            channel_access_token,
        }
    }

    pub async fn get_profile(&self, line_user_id: &str) -> Result<serde_json::Value, String> {
        let url = format!("https://api.line.me/v2/bot/profile/{}", line_user_id);

        let response = self
            .client
            .get(url)
            .header(
                "Authorization",
                format!("Bearer {}", self.channel_access_token),
            )
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Line API error: {} - {}", status, error_text));
        }

        let profile = response
            .json::<serde_json::Value>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(profile)
    }
}

#[async_trait]
impl NotificationGateway for LineNotificationGateway {
    async fn send_notification(&self, message: NotificationMessage) -> Result<(), String> {
        if message.recipient.is_empty() {
            // Can't send to LINE without recipient ID, but this is not an error
            // (e.g. user hasn't linked LINE, but web notification should still work)
            return Ok(());
        }
        let url = "https://api.line.me/v2/bot/message/push";

        let message_content = if let Some(payload) = message.custom_payload {
            payload
        } else {
            serde_json::json!({
                "type": "text",
                "text": format!("{}\n{}", message.title, message.body)
            })
        };

        let body = serde_json::json!({
            "to": message.recipient,
            "messages": [message_content]
        });

        let response = self
            .client
            .post(url)
            .header(
                "Authorization",
                format!("Bearer {}", self.channel_access_token),
            )
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Line API error: {} - {}", status, error_text));
        }

        Ok(())
    }
}
