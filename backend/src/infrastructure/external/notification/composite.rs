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
            // We ignore errors in individual gateways to ensure others still try to send
            let _ = gateway.send_notification(message.clone()).await;
        }
        Ok(())
    }
}
