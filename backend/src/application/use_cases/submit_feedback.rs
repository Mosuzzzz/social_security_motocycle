use crate::infrastructure::db::models::NewFeedback;
use crate::infrastructure::db::repositories::feedback::FeedbackRepository;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct SubmitFeedbackCommand {
    pub user_id: Option<i32>, // Still optional in command but we'll check it
    pub name: String,
    pub email: String,
    pub phone: String,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct SubmitFeedbackResult {
    pub feedback_id: i32,
    pub status: String,
}

#[derive(Clone)]
pub struct SubmitFeedbackUseCase {
    feedback_repository: FeedbackRepository,
}

impl SubmitFeedbackUseCase {
    pub fn new(feedback_repository: FeedbackRepository) -> Self {
        Self {
            feedback_repository,
        }
    }

    pub async fn execute(
        &self,
        command: SubmitFeedbackCommand,
    ) -> Result<SubmitFeedbackResult, String> {
        let new_feedback = NewFeedback {
            user_id: command.user_id,
            name: command.name,
            email: command.email,
            phone: command.phone,
            message: command.message,
        };

        let result = self
            .feedback_repository
            .create_feedback(new_feedback)
            .await?;

        Ok(SubmitFeedbackResult {
            feedback_id: result.feedback_id,
            status: "success".to_string(),
        })
    }
}
