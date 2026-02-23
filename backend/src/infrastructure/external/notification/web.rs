use crate::domain::notification::gateway::{NotificationGateway, NotificationMessage};
use crate::infrastructure::db::models::{
    NewNotification, NotificationChannelEnum, NotificationStatusEnum,
};
use crate::infrastructure::db::repositories::notification::NotificationRepository;
use async_trait::async_trait;

pub struct WebNotificationGateway {
    repo: NotificationRepository,
}

impl WebNotificationGateway {
    pub fn new(repo: NotificationRepository) -> Self {
        Self { repo }
    }
}

#[async_trait]
impl NotificationGateway for WebNotificationGateway {
    async fn send_notification(&self, message: NotificationMessage) -> Result<(), String> {
        let new_notif = NewNotification {
            user_id: message.user_id,
            order_id: message.order_id.unwrap_or(0),
            channel: NotificationChannelEnum::Web,
            message: format!("{}\n{}", message.title, message.body),
            status: NotificationStatusEnum::Sent,
        };

        self.repo.create_notification(new_notif).await?;
        Ok(())
    }
}
