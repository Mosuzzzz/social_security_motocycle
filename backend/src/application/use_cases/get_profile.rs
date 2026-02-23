use crate::domain::user::entity::Role;
use crate::infrastructure::db::repositories::user::UserRepository;
use crate::infrastructure::db::repositories::user_line_account::UserLineAccountRepository;
use serde::Serialize;

#[derive(Serialize)]
pub struct ProfileResult {
    pub id: i32,
    pub username: String,
    pub name: String,
    pub phone: String,
    pub role: Role,
    pub line_connected: bool,
    pub avatar_url: Option<String>,
}

pub struct GetProfileUseCase {
    user_repo: UserRepository,
    line_repo: UserLineAccountRepository,
}

impl GetProfileUseCase {
    pub fn new(user_repo: UserRepository, line_repo: UserLineAccountRepository) -> Self {
        Self {
            user_repo,
            line_repo,
        }
    }

    pub async fn execute(&self, user_id: i32) -> Result<ProfileResult, String> {
        let user = self
            .user_repo
            .find_by_id(user_id)
            .await?
            .ok_or("User not found".to_string())?;

        let line_account = self.line_repo.find_by_user_id(user_id).await?;

        Ok(ProfileResult {
            id: user.id.unwrap_or(user_id),
            username: user.username,
            name: user.name,
            phone: user.phone,
            role: user.role,
            line_connected: line_account.is_some(),
            avatar_url: line_account.and_then(|a| a.picture_url),
        })
    }
}
