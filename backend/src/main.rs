use axum::Extension;
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

use backend::application::use_cases::login::LoginUseCase;
use backend::infrastructure::security::jwt::service::JwtService;

#[allow(dead_code)] // Repositories will be used in handlers
struct AppState {
    register_user_use_case: RegisterUserUseCase,
    promote_user_use_case: PromoteUserUseCase,
    create_service_order_use_case: CreateServiceOrderUseCase,
    login_use_case: LoginUseCase,
    jwt_service: JwtService,
    // gateways could also be here if needed for direct use or injection into other services
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();


    let pool = establish_connection();
    println!("Database connection established!");

    // Repositories
    let user_repository = UserRepository::new(pool.clone());
    let service_order_repository = ServiceOrderRepository::new(pool.clone());

    // Gateways
    let _omise_gateway = OmiseGateway::new();
    let _line_notification_gateway = LineNotificationGateway::new();

    // Services
    let jwt_service = JwtService::new();

    // Use Cases
    let register_user_use_case = RegisterUserUseCase::new(user_repository.clone());
    let promote_user_use_case = PromoteUserUseCase::new(user_repository.clone());
    let login_use_case = LoginUseCase::new(user_repository.clone(), jwt_service.clone());
    let create_service_order_use_case = CreateServiceOrderUseCase::new(service_order_repository);

    let app_state = Arc::new(AppState {
        register_user_use_case,
        promote_user_use_case,
        create_service_order_use_case,
        login_use_case,
        jwt_service,
    });

    let app = backend::infrastructure::http::routes::create_router().layer(Extension(app_state)); // Inject state. The handlers use Extension<Arc<AppState>>.

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()
        .unwrap_or(3000);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Server running on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
