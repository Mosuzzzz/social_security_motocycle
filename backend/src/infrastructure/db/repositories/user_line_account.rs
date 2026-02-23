use crate::infrastructure::db::connection::DbPool;
use crate::infrastructure::db::models::{NewUserLineAccount, UserLineAccountModel};
use crate::infrastructure::db::schema::user_line_accounts::dsl::*;
use diesel::prelude::*;

#[derive(Clone)]
pub struct UserLineAccountRepository {
    pool: DbPool,
}

impl UserLineAccountRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn link_account(
        &self,
        user_id_val: i32,
        line_user_id_val: String,
        display_name_val: Option<String>,
        picture_url_val: Option<String>,
    ) -> Result<UserLineAccountModel, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let new_account = NewUserLineAccount {
            user_id: user_id_val,
            line_user_id: line_user_id_val,
            display_name: display_name_val,
            picture_url: picture_url_val,
        };

        diesel::insert_into(user_line_accounts)
            .values(&new_account)
            .on_conflict(user_id)
            .do_update()
            .set((
                line_user_id.eq(new_account.line_user_id.clone()),
                display_name.eq(new_account.display_name.clone()),
                picture_url.eq(new_account.picture_url.clone()),
            ))
            .get_result::<UserLineAccountModel>(&mut conn)
            .map_err(|e| e.to_string())
    }

    pub async fn find_by_user_id(
        &self,
        user_id_val: i32,
    ) -> Result<Option<UserLineAccountModel>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        user_line_accounts
            .filter(user_id.eq(user_id_val))
            .first::<UserLineAccountModel>(&mut conn)
            .optional()
            .map_err(|e| e.to_string())
    }

    pub async fn find_by_line_user_id(
        &self,
        line_user_id_val: &str,
    ) -> Result<Option<UserLineAccountModel>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        user_line_accounts
            .filter(line_user_id.eq(line_user_id_val))
            .first::<UserLineAccountModel>(&mut conn)
            .optional()
            .map_err(|e| e.to_string())
    }

    pub async fn unlink_account(&self, user_id_val: i32) -> Result<(), String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        diesel::delete(user_line_accounts.filter(user_id.eq(user_id_val)))
            .execute(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(())
    }
}
