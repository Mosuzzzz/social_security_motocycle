use crate::infrastructure::db::connection::DbPool;
use crate::infrastructure::db::models::{
    NewNotification, NotificationModel, NotificationStatusEnum,
};
use crate::infrastructure::db::schema::notifications;
use diesel::prelude::*;

#[derive(Clone)]
pub struct NotificationRepository {
    pool: DbPool,
}

impl NotificationRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_notification(
        &self,
        new_notification: NewNotification,
    ) -> Result<NotificationModel, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let result = diesel::insert_into(notifications::table)
            .values(&new_notification)
            .returning(NotificationModel::as_returning())
            .get_result::<NotificationModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(result)
    }

    pub async fn find_by_user_id(&self, user_id: i32) -> Result<Vec<NotificationModel>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let results = notifications::table
            .filter(notifications::user_id.eq(user_id))
            .order(notifications::sent_at.desc())
            .limit(20)
            .select(NotificationModel::as_select())
            .load::<NotificationModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(results)
    }

    pub async fn mark_as_read(&self, notification_id: i32) -> Result<(), String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        diesel::update(notifications::table.find(notification_id))
            .set(notifications::status.eq(NotificationStatusEnum::Read))
            .execute(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(())
    }
}
