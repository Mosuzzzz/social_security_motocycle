use crate::domain::user::entity::Role;
use crate::infrastructure::db::repositories::user::UserRepository;
use crate::infrastructure::security::jwt::service::JwtService;
use crate::infrastructure::security::password::verify_password;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct LoginCommand {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResult {
    pub token: String,
    pub user_id: i32,
    pub username: String,
    pub role: Role,
}

#[derive(Clone)]
pub struct LoginUseCase {
    user_repository: UserRepository,
    jwt_service: JwtService,
}

impl LoginUseCase {
    pub fn new(user_repository: UserRepository, jwt_service: JwtService) -> Self {
        Self {
            user_repository,
            jwt_service,
        }
    }

    pub async fn execute(&self, command: LoginCommand) -> Result<LoginResult, String> {
        // 1. Find user
        let user = self
            .user_repository
            .find_by_username(&command.username)
            .await?
            .ok_or("Invalid username or password".to_string())?;

        // 2. Verify password
        if !verify_password(&user.password_hash, &command.password)? {
            return Err("Invalid username or password".to_string());
        }

        // 3. Generate Token
        let user_id = user.id.ok_or("User has no ID")?;
        let token = self
            .jwt_service
            .generate_token(user_id, &user.username, user.role.clone())?;

        Ok(LoginResult {
            token,
            user_id,
            username: user.username,
            role: user.role,
        })
    }
}
