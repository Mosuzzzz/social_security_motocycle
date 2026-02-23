use crate::infrastructure::db::connection::DbPool;
use crate::infrastructure::db::models::{NewRefreshToken, RefreshTokenModel};
use crate::infrastructure::db::schema::refresh_tokens;
use chrono::{DateTime, Utc};
use diesel::prelude::*;

#[derive(Clone)]
pub struct RefreshTokenRepository {
    pool: DbPool,
}

impl RefreshTokenRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_token(
        &self,
        user_id: i32,
        token_value: String,
        expires_at: DateTime<Utc>,
    ) -> Result<RefreshTokenModel, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let new_token = NewRefreshToken {
            user_id,
            token_value,
            expires_at,
        };

        diesel::insert_into(refresh_tokens::table)
            .values(&new_token)
            .get_result::<RefreshTokenModel>(&mut conn)
            .map_err(|e| e.to_string())
    }

    pub async fn find_by_token(
        &self,
        token_value: &str,
    ) -> Result<Option<RefreshTokenModel>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        refresh_tokens::table
            .filter(refresh_tokens::token_value.eq(token_value))
            .first::<RefreshTokenModel>(&mut conn)
            .optional()
            .map_err(|e| e.to_string())
    }

    pub async fn revoke_token(&self, token_value: &str) -> Result<(), String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        diesel::update(refresh_tokens::table.filter(refresh_tokens::token_value.eq(token_value)))
            .set(refresh_tokens::is_revoked.eq(true))
            .execute(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn revoke_all_for_user(&self, user_id: i32) -> Result<(), String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        diesel::update(refresh_tokens::table.filter(refresh_tokens::user_id.eq(user_id)))
            .set(refresh_tokens::is_revoked.eq(true))
            .execute(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(())
    }
}
