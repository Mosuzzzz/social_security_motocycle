use crate::infrastructure::db::connection::DbPool;
use crate::infrastructure::db::models::{FeedbackModel, NewFeedback};
use crate::infrastructure::db::schema::feedbacks;
use diesel::prelude::*;

#[derive(Clone)]
pub struct FeedbackRepository {
    pool: DbPool,
}

impl FeedbackRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_feedback(
        &self,
        new_feedback: NewFeedback,
    ) -> Result<FeedbackModel, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let result = diesel::insert_into(feedbacks::table)
            .values(&new_feedback)
            .returning(FeedbackModel::as_returning())
            .get_result::<FeedbackModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(result)
    }

    pub async fn list_feedbacks(&self) -> Result<Vec<FeedbackModel>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let results = feedbacks::table
            .select(FeedbackModel::as_select())
            .load::<FeedbackModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(results)
    }
}
