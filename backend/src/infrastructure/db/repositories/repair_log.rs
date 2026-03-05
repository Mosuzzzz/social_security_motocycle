use crate::infrastructure::db::connection::DbPool;
use crate::infrastructure::db::models::ServiceOrderStatusEnum;
use crate::infrastructure::db::schema::repair_logs;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Insertable)]
#[diesel(table_name = repair_logs)]
pub struct NewRepairLog {
    pub order_id: i32,
    pub mechanic_id: i32,
    pub note: String,
    pub status: ServiceOrderStatusEnum,
}

#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = repair_logs)]
pub struct RepairLogModel {
    pub log_id: i32,
    pub order_id: i32,
    pub mechanic_id: i32,
    pub note: String,
    pub status: ServiceOrderStatusEnum,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Clone)]
pub struct RepairLogRepository {
    pool: DbPool,
}

impl RepairLogRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn add_log(
        &self,
        order_id: i32,
        mechanic_id: i32,
        note: String,
        status: ServiceOrderStatusEnum,
    ) -> Result<(), String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let new_log = NewRepairLog {
            order_id,
            mechanic_id,
            note,
            status,
        };

        diesel::insert_into(repair_logs::table)
            .values(&new_log)
            .execute(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn get_logs_for_order(
        &self,
        order_id_val: i32,
    ) -> Result<Vec<RepairLogModel>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        repair_logs::table
            .filter(repair_logs::order_id.eq(order_id_val))
            .order(repair_logs::updated_at.desc())
            .load::<RepairLogModel>(&mut conn)
            .map_err(|e| e.to_string())
    }
}
