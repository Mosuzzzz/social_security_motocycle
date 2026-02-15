use axum::{Extension, Router};
use backend::application::use_cases::create_service_order::CreateServiceOrderUseCase;
use backend::application::use_cases::promote_user::PromoteUserUseCase;
use backend::application::use_cases::register_user::RegisterUserUseCase;
use backend::infrastructure::db::connection::establish_connection;
use backend::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use backend::infrastructure::db::repositories::user::UserRepository;
use backend::infrastructure::external::notification::line::LineNotificationGateway;
use backend::infrastructure::external::payment::omise::OmiseGateway;
use std::net::SocketAddr;
use std::sync::Arc;

#[allow(dead_code)] // Repositories will be used in handlers
struct AppState {
    register_user_use_case: RegisterUserUseCase,
    promote_user_use_case: PromoteUserUseCase,
    create_service_order_use_case: CreateServiceOrderUseCase,
    // gateways could also be here if needed for direct use or injection into other services
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    println!("Hello, world!");

    let pool = establish_connection();
    println!("Database connection established!");

    // Repositories
    let user_repository = UserRepository::new(pool.clone());
    let service_order_repository = ServiceOrderRepository::new(pool.clone());

    // Gateways
    let _omise_gateway = OmiseGateway::new();
    let _line_notification_gateway = LineNotificationGateway::new();

    // Use Cases
    let register_user_use_case = RegisterUserUseCase::new(user_repository);
    let promote_user_use_case = PromoteUserUseCase::new(UserRepository::new(pool.clone())); // Creating fresh repo instance or clone? Clone is cheap for pool, but repo likely cheap too.
    // Wait, PromoteUserUseCase needs a UserRepository. I can reuse `user_repository` if I clone it or if it implements Clone.
    // UserRepository holds DbPool which is cheap to clone. Does UserRepository implement Clone?
    // Let's check user repo content. It has `pool: DbPool`. I should derive Clone for UserRepository.

    let create_service_order_use_case = CreateServiceOrderUseCase::new(service_order_repository);

    let app_state = Arc::new(AppState {
        register_user_use_case,
        promote_user_use_case,
        create_service_order_use_case,
    });

    let app = Router::new()
        .route(
            "/",
            axum::routing::get(|| async { "Social Security Motocycle API" }),
        )
        .layer(Extension(app_state));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server running on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
