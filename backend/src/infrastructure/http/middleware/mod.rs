pub mod auth;

use self::auth::AuthUser;
use axum::{
    Extension, RequestPartsExt,
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let Extension(user) = parts
            .extract::<Extension<AuthUser>>()
            .await
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

        Ok(user)
    }
}
