use axum::Extension;
use axum::http::{HeaderValue, Method};
use backend::application::state::AppState;
use backend::application::use_cases::create_service_order::CreateServiceOrderUseCase;
use backend::application::use_cases::list_service_orders::ListServiceOrdersUseCase;
use backend::application::use_cases::list_users::ListUsersUseCase;
use backend::application::use_cases::login::LoginUseCase;
use backend::application::use_cases::process_payment::ProcessPaymentUseCase;
use backend::application::use_cases::promote_user::PromoteUserUseCase;
use backend::application::use_cases::register_user::RegisterUserUseCase;
use backend::application::use_cases::update_order_status::UpdateOrderStatusUseCase;
use backend::domain::notification::gateway::NotificationGateway;
use backend::domain::payment::gateway::PaymentGateway;
use backend::infrastructure::db::connection::establish_connection;
use backend::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use backend::infrastructure::db::repositories::user::UserRepository;
use backend::infrastructure::external::notification::line::LineNotificationGateway;
use backend::infrastructure::external::payment::omise::OmiseGateway;
use backend::infrastructure::security::jwt::service::JwtService;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    tracing::info!("Starting application...");

    let pool = establish_connection();
    tracing::info!("Database connection established!");

    // Repositories
    let user_repository = UserRepository::new(pool.clone());
    let service_order_repository = ServiceOrderRepository::new(pool.clone());

    // Gateways
    let omise_gateway: Arc<dyn PaymentGateway + Send + Sync> = Arc::new(OmiseGateway::new());
    let line_notification_gateway: Arc<dyn NotificationGateway + Send + Sync> =
        Arc::new(LineNotificationGateway::new());

    // Services
    let jwt_service = JwtService::new();

    // Use Cases
    let register_user_use_case = RegisterUserUseCase::new(user_repository.clone());
    let promote_user_use_case = PromoteUserUseCase::new(user_repository.clone());
    let login_use_case = LoginUseCase::new(user_repository.clone(), jwt_service.clone());
    let create_service_order_use_case =
        CreateServiceOrderUseCase::new(service_order_repository.clone());
    let process_payment_use_case = ProcessPaymentUseCase::new(
        service_order_repository.clone(),
        user_repository.clone(),
        omise_gateway,
        line_notification_gateway,
    );
    let list_users_use_case = ListUsersUseCase::new(user_repository);
    let list_service_orders_use_case =
        ListServiceOrdersUseCase::new(service_order_repository.clone());
    let update_order_status_use_case = UpdateOrderStatusUseCase::new(service_order_repository);

    let app_state = Arc::new(AppState {
        register_user_use_case,
        promote_user_use_case,
        create_service_order_use_case,
        login_use_case,
        process_payment_use_case,
        list_users_use_case,
        list_service_orders_use_case,
        update_order_status_use_case,
        jwt_service: jwt_service.clone(),
    });

    let cors = CorsLayer::new()
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(Any);

    let app = backend::infrastructure::http::routes::create_router()
        .layer(cors)
        .layer(Extension(jwt_service)) // Inject JwtService for middleware
        .layer(tower_http::trace::TraceLayer::new_for_http()) // Request logging
        .with_state(app_state); // Inject state

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8000".to_string())
        .parse::<u16>()
        .unwrap_or(3000);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Server running on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
