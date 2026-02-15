use crate::domain::user::entity::Role;
use crate::infrastructure::security::jwt::service::JwtService;
use axum::{
    Extension,
    extract::Request,
    http::{StatusCode, header},
    middleware::Next,
    response::Response,
};

// Define a struct to hold the user data extracted from the token
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: i32,
    pub username: String,
    pub role: Role,
}

// Middleware function to handle authentication
pub async fn auth_middleware(
    Extension(jwt_service): Extension<JwtService>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extract the Authorization header
    let auth_header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok());

    match auth_header {
        Some(header_value) => {
            if !header_value.starts_with("Bearer ") {
                return Err(StatusCode::UNAUTHORIZED);
            }
            let token = &header_value[7..];

            match jwt_service.verify_token(token) {
                Ok(token_data) => {
                    let user = AuthUser {
                        user_id: token_data.claims.user_id,
                        username: token_data.claims.sub,
                        role: token_data.claims.role,
                    };
                    // Insert the user into the request extensions
                    req.extensions_mut().insert(user);
                    Ok(next.run(req).await)
                }
                Err(_) => Err(StatusCode::UNAUTHORIZED),
            }
        }
        None => Err(StatusCode::UNAUTHORIZED),
    }
}
