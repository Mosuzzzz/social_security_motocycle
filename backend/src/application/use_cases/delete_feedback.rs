use crate::infrastructure::db::repositories::feedback::FeedbackRepository;

#[derive(Clone)]
pub struct DeleteFeedbackUseCase {
    feedback_repo: FeedbackRepository,
}

impl DeleteFeedbackUseCase {
    pub fn new(feedback_repo: FeedbackRepository) -> Self {
        Self { feedback_repo }
    }

    pub async fn execute(&self, id: i32) -> Result<(), String> {
        self.feedback_repo.delete_feedback(id).await
    }
}
