use crate::domain::user::entity::{Role, User};
use crate::infrastructure::db::connection::DbPool;
use crate::infrastructure::db::models::{NewUser, UserModel, UserRoleEnum};
use crate::infrastructure::db::schema::users;
use diesel::prelude::*;

#[derive(Clone)]
pub struct UserRepository {
    pool: DbPool,
}

impl UserRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_user(&self, user: User) -> Result<User, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let new_user_role = match user.role {
            Role::Admin => UserRoleEnum::Admin,
            Role::Customer => UserRoleEnum::Customer,
            Role::Mechanic => UserRoleEnum::Mechanic,
        };

        let new_user = NewUser {
            username: &user.username,
            password_hash: &user.password_hash,
            name: &user.name,
            phone: &user.phone,
            role: new_user_role,
        };

        let result = diesel::insert_into(users::table)
            .values(&new_user)
            .returning(UserModel::as_returning())
            .get_result::<UserModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(self.map_model_to_entity(result))
    }

    pub async fn find_by_username(&self, username: &str) -> Result<Option<User>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let result = users::table
            .filter(users::username.eq(username))
            .select(UserModel::as_select())
            .first::<UserModel>(&mut conn)
            .optional()
            .map_err(|e| e.to_string())?;

        Ok(result.map(|model| self.map_model_to_entity(model)))
    }

    pub async fn find_by_id(&self, user_id: i32) -> Result<Option<User>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let result = users::table
            .find(user_id)
            .select(UserModel::as_select())
            .first::<UserModel>(&mut conn)
            .optional()
            .map_err(|e| e.to_string())?;

        Ok(result.map(|model| self.map_model_to_entity(model)))
    }

    pub async fn list_users(&self) -> Result<Vec<User>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let results = users::table
            .select(UserModel::as_select())
            .load::<UserModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(results
            .into_iter()
            .map(|model| self.map_model_to_entity(model))
            .collect())
    }

    pub async fn update_user(&self, user: User) -> Result<User, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let user_id = user.id.ok_or("User ID is required for update")?;

        let new_user_role = match user.role {
            Role::Admin => UserRoleEnum::Admin,
            Role::Customer => UserRoleEnum::Customer,
            Role::Mechanic => UserRoleEnum::Mechanic,
        };

        // Note: We don't update password hash here usually, unless it's explicitly part of the flow.
        // Assuming this method updates profile info.

        let target = users::table.find(user_id);

        let result = diesel::update(target)
            .set((
                users::name.eq(&user.name),
                users::phone.eq(&user.phone),
                users::role.eq(new_user_role),
                // users::password_hash ... should we update it? Assuming yes if provided, but maybe separate method is better.
                // For simplicity let's update everything except username usually?
                // Let's stick to update profile fields.
            ))
            .returning(UserModel::as_returning())
            .get_result::<UserModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(self.map_model_to_entity(result))
    }

    fn map_model_to_entity(&self, model: UserModel) -> User {
        let role = match model.role {
            UserRoleEnum::Admin => Role::Admin,
            UserRoleEnum::Customer => Role::Customer,
            UserRoleEnum::Mechanic => Role::Mechanic,
        };

        User {
            id: Some(model.user_id),
            username: model.username,
            password_hash: model.password_hash,
            name: model.name,
            phone: model.phone,
            role,
        }
    }
}
