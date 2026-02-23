use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationMessage {
    pub user_id: i32,
    pub order_id: Option<i32>,
    pub recipient: String,
    pub title: String,
    pub body: String,
    pub custom_payload: Option<serde_json::Value>,
}

#[async_trait]
pub trait NotificationGateway {
    async fn send_notification(&self, message: NotificationMessage) -> Result<(), String>;
}
