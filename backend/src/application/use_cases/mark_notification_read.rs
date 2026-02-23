use crate::infrastructure::db::repositories::notification::NotificationRepository;

#[derive(Clone)]
pub struct MarkNotificationReadUseCase {
    repo: NotificationRepository,
}

impl MarkNotificationReadUseCase {
    pub fn new(repo: NotificationRepository) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, notification_id: i32) -> Result<(), String> {
        self.repo.mark_as_read(notification_id).await
    }
}
