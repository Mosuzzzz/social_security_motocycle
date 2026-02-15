use crate::application::state::AppState;
use crate::application::use_cases::create_service_order::CreateServiceOrderCommand;
use crate::application::use_cases::login::LoginCommand;
use crate::application::use_cases::process_payment::ProcessPaymentCommand;
use crate::application::use_cases::promote_user::PromoteUserCommand;
use crate::application::use_cases::register_user::RegisterUserCommand;
use crate::application::use_cases::update_order_status::UpdateOrderStatusCommand;
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

async fn list_users(State(state): State<Arc<AppState>>, user: AuthUser) -> impl IntoResponse {
    if user.role != Role::Admin {
        return (StatusCode::FORBIDDEN, "Only admins can list users").into_response();
    }

    match state.list_users_use_case.execute().await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}
async fn list_service_orders(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
) -> impl IntoResponse {
    let result = match user.role {
        Role::Customer => {
            state
                .list_service_orders_use_case
                .execute_for_customer(user.user_id)
                .await
        }
        _ => state.list_service_orders_use_case.execute_all().await,
    };

    match result {
        Ok(orders) => (StatusCode::OK, Json(orders)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn update_order_status(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<UpdateOrderStatusCommand>,
) -> impl IntoResponse {
    if user.role != Role::Admin && user.role != Role::Mechanic {
        return (StatusCode::FORBIDDEN, "Only staff can update order status").into_response();
    }

    match state.update_order_status_use_case.execute(payload).await {
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
        .route("/users", axum::routing::get(list_users))
        .route("/orders", axum::routing::get(list_service_orders))
        .route("/orders", axum::routing::put(update_order_status))
        .route_layer(axum::middleware::from_fn(
            crate::infrastructure::http::middleware::auth::auth_middleware,
        ));

    Router::new().nest("/api", public_routes.merge(protected_routes))
}
