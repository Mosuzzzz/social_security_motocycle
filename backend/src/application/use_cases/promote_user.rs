use crate::domain::user::entity::Role;
use crate::infrastructure::db::repositories::user::UserRepository;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct PromoteUserCommand {
    pub user_id: i32,
    pub target_role: Role,
}

#[derive(Debug, Serialize)]
pub struct PromoteUserResult {
    pub user_id: i32,
    pub username: String,
    pub role: Role,
}

#[derive(Clone)]
pub struct PromoteUserUseCase {
    user_repository: UserRepository,
}

impl PromoteUserUseCase {
    pub fn new(user_repository: UserRepository) -> Self {
        Self { user_repository }
    }

    pub async fn execute(&self, command: PromoteUserCommand) -> Result<PromoteUserResult, String> {
        // 1. Find user by ID
        let mut user = self
            .user_repository
            .find_by_id(command.user_id)
            .await?
            .ok_or("User not found".to_string())?;

        // 2. Update role
        // Simple update: just change the role field.
        user.role = command.target_role;

        // 3. Save changes
        let updated_user = self.user_repository.update_user(user).await?;

        Ok(PromoteUserResult {
            user_id: updated_user.id.unwrap_or(0),
            username: updated_user.username,
            role: updated_user.role,
        })
    }
}
