use crate::domain::user::entity::{Role, User};
use crate::infrastructure::db::repositories::user::UserRepository;
use crate::infrastructure::security::password::hash_password;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct RegisterUserCommand {
    pub username: String,
    pub password: String,
    pub name: String,
    pub phone: String,
}

#[derive(Debug, Serialize)]
pub struct RegisterUserResult {
    pub user_id: i32,
    pub username: String,
    pub role: Role,
}

#[derive(Clone)]
pub struct RegisterUserUseCase {
    user_repository: UserRepository,
}

impl RegisterUserUseCase {
    pub fn new(user_repository: UserRepository) -> Self {
        Self { user_repository }
    }

    pub async fn execute(
        &self,
        command: RegisterUserCommand,
    ) -> Result<RegisterUserResult, String> {
        // 1. Check if user already exists
        if let Some(_) = self
            .user_repository
            .find_by_username(&command.username)
            .await?
        {
            return Err("Username already exists".to_string());
        }

        // 2. Hash password
        let password_hash = hash_password(&command.password)?;

        // 3. Create user entity (Customer role by default)
        let new_user =
            User::new_customer(command.username, password_hash, command.name, command.phone);

        // 4. Save to repository
        let created_user = self.user_repository.create_user(new_user).await?;

        Ok(RegisterUserResult {
            user_id: created_user.id.unwrap_or(0), // Should define consistent behavior for ID
            username: created_user.username,
            role: created_user.role,
        })
    }
}
