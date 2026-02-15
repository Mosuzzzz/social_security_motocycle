use crate::application::state::AppState;
use crate::application::use_cases::create_service_order::CreateServiceOrderCommand;
use crate::application::use_cases::login::LoginCommand;
use crate::application::use_cases::process_payment::ProcessPaymentCommand;
use crate::application::use_cases::promote_user::PromoteUserCommand;
use crate::application::use_cases::register_user::RegisterUserCommand;
use crate::domain::user::entity::Role;
use crate::infrastructure::http::middleware::auth::AuthUser;
use axum::{
    Router,
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
    routing::post,
};
use std::sync::Arc;

// Handlers

async fn register_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RegisterUserCommand>,
) -> impl IntoResponse {
    match state.register_user_use_case.execute(payload).await {
        Ok(result) => (StatusCode::CREATED, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e).into_response(),
    }
}

async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginCommand>,
) -> impl IntoResponse {
    match state.login_use_case.execute(payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::UNAUTHORIZED, e).into_response(),
    }
}

async fn promote_user(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<PromoteUserCommand>,
) -> impl IntoResponse {
    if user.role != Role::Admin {
        return (StatusCode::FORBIDDEN, "Only admins can promote users").into_response();
    }

    match state.promote_user_use_case.execute(payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e).into_response(),
    }
}

async fn create_service_order(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<CreateServiceOrderCommand>,
) -> impl IntoResponse {
    match state
        .create_service_order_use_case
        .execute(payload, user.user_id)
        .await
    {
        Ok(result) => (StatusCode::CREATED, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e).into_response(),
    }
}

async fn process_payment(
    State(state): State<Arc<AppState>>,
    _user: AuthUser,
    Json(payload): Json<ProcessPaymentCommand>,
) -> impl IntoResponse {
    match state.process_payment_use_case.execute(payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, e).into_response(),
    }
}

// Router

pub fn create_router() -> Router<Arc<AppState>> {
    let public_routes = Router::new()
        .route("/register", post(register_user))
        .route("/login", post(login));

    let protected_routes = Router::new()
        .route("/promote", post(promote_user))
        .route("/orders", post(create_service_order))
        .route("/payments", post(process_payment))
        .route_layer(axum::middleware::from_fn(
            crate::infrastructure::http::middleware::auth::auth_middleware,
        ));

    Router::new().nest("/api", public_routes.merge(protected_routes))
}
