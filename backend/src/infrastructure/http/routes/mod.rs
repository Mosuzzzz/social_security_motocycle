use crate::application::state::AppState;
use crate::application::use_cases::add_stock_item::AddStockItemCommand;
use crate::application::use_cases::connect_line::ConnectLineCommand;
use crate::application::use_cases::create_service_order::CreateServiceOrderCommand;
use crate::application::use_cases::login::LoginCommand;
use crate::application::use_cases::logout::LogoutCommand;
use crate::application::use_cases::process_payment::ProcessPaymentCommand;
use crate::application::use_cases::promote_user::PromoteUserCommand;
use crate::application::use_cases::refresh_token::RefreshTokenCommand;
use crate::application::use_cases::register_user::RegisterUserCommand;
use crate::application::use_cases::update_order_status::UpdateOrderStatusCommand;
use crate::application::use_cases::update_profile::UpdateProfileCommand;
use crate::application::use_cases::update_stock_item::UpdateStockItemCommand;
use crate::application::use_cases::use_stock_item::UseStockItemCommand;
use crate::domain::user::entity::Role;
use crate::infrastructure::http::middleware::auth::AuthUser;
use axum::{
    Router,
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
};
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize)]
pub struct ErrorResponse {
    pub message: String,
}

impl From<String> for ErrorResponse {
    fn from(message: String) -> Self {
        Self { message }
    }
}

impl From<&str> for ErrorResponse {
    fn from(message: &str) -> Self {
        Self {
            message: message.to_string(),
        }
    }
}

// Handlers

async fn register_user(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RegisterUserCommand>,
) -> impl IntoResponse {
    tracing::info!("Attempting to register user: {}", payload.username);
    match state.register_user_use_case.execute(payload).await {
        Ok(result) => (StatusCode::CREATED, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginCommand>,
) -> impl IntoResponse {
    tracing::info!("Login attempt for user: {}", payload.username);
    match state.login_use_case.execute(payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::UNAUTHORIZED, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn refresh_token(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RefreshTokenCommand>,
) -> impl IntoResponse {
    tracing::info!("Token refresh attempt");
    match state.refresh_token_use_case.execute(payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::UNAUTHORIZED, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn logout(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LogoutCommand>,
) -> impl IntoResponse {
    tracing::info!("Logout attempt");
    match state.logout_use_case.execute(payload).await {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({ "message": "Logged out" })),
        )
            .into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn promote_user(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<PromoteUserCommand>,
) -> impl IntoResponse {
    if user.role != Role::Admin {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse::from("Only admins can promote users")),
        )
            .into_response();
    }

    match state.promote_user_use_case.execute(payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn create_service_order(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<CreateServiceOrderCommand>,
) -> impl IntoResponse {
    tracing::info!("User {} creating service order", user.user_id);
    match state
        .create_service_order_use_case
        .execute(payload, user.user_id)
        .await
    {
        Ok(result) => (StatusCode::CREATED, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn process_payment(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<ProcessPaymentCommand>,
) -> impl IntoResponse {
    // Basic verification: Customer can only pay for their own order
    if user.role == Role::Customer {
        match state
            .get_service_order_detail_use_case
            .execute(payload.order_id)
            .await
        {
            Ok(order) if order.customer_id != user.user_id => {
                return (
                    StatusCode::FORBIDDEN,
                    Json(ErrorResponse::from("Access denied: Not your order")),
                )
                    .into_response();
            }
            Err(_) => {
                return (
                    StatusCode::NOT_FOUND,
                    Json(ErrorResponse::from("Order not found")),
                )
                    .into_response();
            }
            _ => {}
        }
    }

    match state.process_payment_use_case.execute(payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn list_users(State(state): State<Arc<AppState>>, user: AuthUser) -> impl IntoResponse {
    if user.role != Role::Admin {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse::from("Only admins can list users")),
        )
            .into_response();
    }

    match state.list_users_use_case.execute().await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::from(e)),
        )
            .into_response(),
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
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::from(e)),
        )
            .into_response(),
    }
}

async fn update_order_status(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<UpdateOrderStatusCommand>,
) -> impl IntoResponse {
    match state
        .update_order_status_use_case
        .execute(payload, user.user_id, user.role)
        .await
    {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn get_dashboard_stats(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
) -> impl IntoResponse {
    if user.role != Role::Admin {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse::from("Only admins can access statistics")),
        )
            .into_response();
    }

    match state.get_dashboard_stats_use_case.execute().await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::from(e)),
        )
            .into_response(),
    }
}

async fn get_profile(State(state): State<Arc<AppState>>, user: AuthUser) -> impl IntoResponse {
    match state.get_profile_use_case.execute(user.user_id).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::NOT_FOUND, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn update_profile(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<UpdateProfileCommand>,
) -> impl IntoResponse {
    match state
        .update_profile_use_case
        .execute(user.user_id, payload)
        .await
    {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({ "message": "Profile updated" })),
        )
            .into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn connect_line(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<ConnectLineCommand>,
) -> impl IntoResponse {
    match state
        .connect_line_use_case
        .execute(user.user_id, payload)
        .await
    {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn disconnect_line(State(state): State<Arc<AppState>>, user: AuthUser) -> impl IntoResponse {
    tracing::info!("User {} disconnecting LINE account", user.user_id);
    match state.disconnect_line_use_case.execute(user.user_id).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn get_service_order_detail(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    axum::extract::Path(order_id): axum::extract::Path<i32>,
) -> impl IntoResponse {
    tracing::info!(
        "User {} ({:?}) requesting order {} details",
        user.user_id,
        user.role,
        order_id
    );

    if let Some(err_msg) = match user.role {
        Role::Admin | Role::Mechanic => None,
        Role::Customer => {
            // Check if order belongs to customer
            match state
                .get_service_order_detail_use_case
                .execute(order_id)
                .await
            {
                Ok(order) if order.customer_id != user.user_id => {
                    Some("Access denied: Not your order")
                }
                Err(_) => Some("Order not found"),
                _ => None,
            }
        }
    } {
        return (StatusCode::FORBIDDEN, Json(ErrorResponse::from(err_msg))).into_response();
    }

    match state
        .get_service_order_detail_use_case
        .execute(order_id)
        .await
    {
        Ok(order) => {
            tracing::info!("Order {} details retrieved successfully", order_id);
            (StatusCode::OK, Json(order)).into_response()
        }
        Err(e) => {
            tracing::warn!("Failed to get order {} details: {}", order_id, e);
            (StatusCode::NOT_FOUND, Json(ErrorResponse::from(e))).into_response()
        }
    }
}

async fn add_service_item(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<crate::application::use_cases::add_service_item::AddServiceItemCommand>,
) -> impl IntoResponse {
    if user.role != Role::Mechanic && user.role != Role::Admin {
        tracing::warn!(
            "User {} ({:?}) attempted to add service item without permission",
            user.user_id,
            user.role
        );
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse::from(
                "Only mechanics or admins can add service items",
            )),
        )
            .into_response();
    }

    tracing::info!(
        "User {} ({:?}) adding service item to order {}",
        user.user_id,
        user.role,
        payload.order_id
    );

    match state.add_service_item_use_case.execute(payload).await {
        Ok(item) => {
            tracing::info!("Service item added successfully: {:?}", item.id);
            (StatusCode::CREATED, Json(item)).into_response()
        }
        Err(e) => {
            tracing::error!("Failed to add service item: {}", e);
            (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response()
        }
    }
}

// Router

async fn add_stock_item(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<AddStockItemCommand>,
) -> impl IntoResponse {
    if user.role != Role::Admin {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse::from("Only admins can manage stock")),
        )
            .into_response();
    }

    match state.add_stock_item_use_case.execute(payload).await {
        Ok(result) => (StatusCode::CREATED, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn update_stock_item(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<UpdateStockItemCommand>,
) -> impl IntoResponse {
    if user.role != Role::Admin {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse::from("Only admins can manage stock")),
        )
            .into_response();
    }

    match state.update_stock_item_use_case.execute(payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn delete_stock_item(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    axum::extract::Path(item_id): axum::extract::Path<i32>,
) -> impl IntoResponse {
    if user.role != Role::Admin {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse::from("Only admins can manage stock")),
        )
            .into_response();
    }

    match state.delete_stock_item_use_case.execute(item_id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn list_stock_items(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match state.list_stock_items_use_case.execute().await {
        Ok(items) => (StatusCode::OK, Json(items)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::from(e)),
        )
            .into_response(),
    }
}

async fn use_stock_item(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<UseStockItemCommand>,
) -> impl IntoResponse {
    if user.role != Role::Mechanic && user.role != Role::Admin {
        return (
            StatusCode::FORBIDDEN,
            Json(ErrorResponse::from(
                "Only mechanics or admins can use stock items",
            )),
        )
            .into_response();
    }

    match state.use_stock_item_use_case.execute(payload).await {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

async fn list_notifications(
    State(state): State<Arc<AppState>>,
    user: AuthUser,
) -> impl IntoResponse {
    match state
        .list_notifications_use_case
        .execute(user.user_id)
        .await
    {
        Ok(notifications) => (StatusCode::OK, Json(notifications)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::from(e)),
        )
            .into_response(),
    }
}

async fn mark_notification_read(
    State(state): State<Arc<AppState>>,
    _user: AuthUser,
    axum::extract::Path(notification_id): axum::extract::Path<i32>,
) -> impl IntoResponse {
    match state
        .mark_notification_read_use_case
        .execute(notification_id)
        .await
    {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(ErrorResponse::from(e))).into_response(),
    }
}

pub fn create_router() -> Router<Arc<AppState>> {
    let auth_middleware =
        axum::middleware::from_fn(crate::infrastructure::http::middleware::auth::auth_middleware);

    // Public API routes
    let public_routes = Router::new()
        .route("/register", post(register_user))
        .route("/login", post(login))
        .route("/auth/refresh", post(refresh_token))
        .route("/auth/logout", post(logout))
        .route("/ping", get(|| async { "pong" }));

    // Protected API routes
    let protected_routes = Router::new()
        .route("/promote", post(promote_user))
        .route(
            "/orders",
            get(list_service_orders)
                .post(create_service_order)
                .put(update_order_status),
        )
        .route("/orders/{id}", get(get_service_order_detail))
        .route("/orders/items", post(add_service_item))
        .route("/orders/use-stock", post(use_stock_item))
        .route(
            "/stock",
            get(list_stock_items)
                .post(add_stock_item)
                .put(update_stock_item),
        )
        .route("/stock/{id}", delete(delete_stock_item))
        .route("/payments", post(process_payment))
        .route("/users", get(list_users))
        .route("/stats", get(get_dashboard_stats))
        .route("/me", get(get_profile).put(update_profile))
        .route("/notifications", get(list_notifications))
        .route("/notifications/{id}/read", post(mark_notification_read))
        .route("/line/connect", post(connect_line))
        .route("/line/disconnect", post(disconnect_line))
        .layer(auth_middleware);

    Router::new().nest("/api", public_routes.merge(protected_routes))
}
