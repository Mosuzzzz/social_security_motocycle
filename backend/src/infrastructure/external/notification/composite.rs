use crate::domain::notification::gateway::{NotificationGateway, NotificationMessage};
use async_trait::async_trait;
use std::sync::Arc;

pub struct CompositeNotificationGateway {
    gateways: Vec<Arc<dyn NotificationGateway + Send + Sync>>,
}

impl CompositeNotificationGateway {
    pub fn new(gateways: Vec<Arc<dyn NotificationGateway + Send + Sync>>) -> Self {
        Self { gateways }
    }
}

#[async_trait]
impl NotificationGateway for CompositeNotificationGateway {
    async fn send_notification(&self, message: NotificationMessage) -> Result<(), String> {
        for gateway in &self.gateways {
            if let Err(e) = gateway.send_notification(message.clone()).await {
                tracing::error!(
                    "Notification gateway failed for user {} (order {:?}): {}",
                    message.user_id,
                    message.order_id,
                    e
                );
            }
        }
        Ok(())
    }
}
