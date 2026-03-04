use crate::infrastructure::db::repositories::feedback::FeedbackRepository;
use chrono::{DateTime, Utc};
use serde::Serialize;

#[derive(Serialize)]
pub struct FeedbackResponse {
    pub feedback_id: i32,
    pub user_id: Option<i32>,
    pub name: String,
    pub email: String,
    pub phone: String,
    pub message: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Clone)]
pub struct ListFeedbacksUseCase {
    feedback_repository: FeedbackRepository,
}

impl ListFeedbacksUseCase {
    pub fn new(feedback_repository: FeedbackRepository) -> Self {
        Self {
            feedback_repository,
        }
    }

    pub async fn execute(&self) -> Result<Vec<FeedbackResponse>, String> {
        let feedbacks = self.feedback_repository.list_feedbacks().await?;

        Ok(feedbacks
            .into_iter()
            .map(|f| FeedbackResponse {
                feedback_id: f.feedback_id,
                user_id: f.user_id,
                name: f.name,
                email: f.email,
                phone: f.phone,
                message: f.message,
                created_at: f.created_at,
            })
            .collect())
    }
}
