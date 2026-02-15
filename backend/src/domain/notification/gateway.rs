use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationMessage {
    pub recipient: String,
    pub title: String,
    pub body: String,
}

#[async_trait]
pub trait NotificationGateway {
    async fn send_notification(&self, message: NotificationMessage) -> Result<(), String>;
}
