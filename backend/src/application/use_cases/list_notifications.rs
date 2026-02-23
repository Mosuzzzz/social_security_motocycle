use crate::infrastructure::db::models::NotificationModel;
use crate::infrastructure::db::repositories::notification::NotificationRepository;

#[derive(Clone)]
pub struct ListNotificationsUseCase {
    repo: NotificationRepository,
}

impl ListNotificationsUseCase {
    pub fn new(repo: NotificationRepository) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, user_id: i32) -> Result<Vec<NotificationModel>, String> {
        self.repo.find_by_user_id(user_id).await
    }
}
