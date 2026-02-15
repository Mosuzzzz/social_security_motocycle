use crate::domain::user::entity::Role;
use crate::infrastructure::db::repositories::user::UserRepository;
use serde::Serialize;

#[derive(Serialize)]
pub struct UserResponse {
    pub id: i32,
    pub username: String,
    pub name: String,
    pub phone: String,
    pub role: Role,
}

#[derive(Clone)]
pub struct ListUsersUseCase {
    pub user_repo: UserRepository,
}

impl ListUsersUseCase {
    pub fn new(user_repo: UserRepository) -> Self {
        Self { user_repo }
    }

    pub async fn execute(&self) -> Result<Vec<UserResponse>, String> {
        let users = self.user_repo.list_users().await?;

        Ok(users
            .into_iter()
            .map(|u| UserResponse {
                id: u.id.unwrap_or(0),
                username: u.username,
                name: u.name,
                phone: u.phone,
                role: u.role,
            })
            .collect())
    }
}
