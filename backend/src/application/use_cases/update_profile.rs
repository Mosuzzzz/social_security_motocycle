use crate::infrastructure::db::repositories::user::UserRepository;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UpdateProfileCommand {
    pub name: String,
    pub phone: String,
}

pub struct UpdateProfileUseCase {
    user_repo: UserRepository,
}

impl UpdateProfileUseCase {
    pub fn new(user_repo: UserRepository) -> Self {
        Self { user_repo }
    }

    pub async fn execute(&self, user_id: i32, command: UpdateProfileCommand) -> Result<(), String> {
        let mut user = self
            .user_repo
            .find_by_id(user_id)
            .await?
            .ok_or("User not found".to_string())?;

        user.name = command.name;
        user.phone = command.phone;

        self.user_repo.update_user(user).await?;

        Ok(())
    }
}
