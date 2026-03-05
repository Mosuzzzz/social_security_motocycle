use axum::Extension;
use axum::http::{HeaderValue, Method};
use backend::application::state::AppState;
use backend::application::use_cases::submit_feedback::SubmitFeedbackUseCase;
use backend::infrastructure::db::repositories::feedback::FeedbackRepository;

use backend::application::use_cases::add_service_item::AddServiceItemUseCase;
use backend::application::use_cases::connect_line::ConnectLineUseCase;
use backend::application::use_cases::create_service_order::CreateServiceOrderUseCase;
use backend::application::use_cases::delete_feedback::DeleteFeedbackUseCase;
use backend::application::use_cases::delete_service_order::DeleteServiceOrderUseCase;
use backend::application::use_cases::disconnect_line::DisconnectLineUseCase;
use backend::application::use_cases::get_dashboard_stats::GetDashboardStatsUseCase;
use backend::application::use_cases::get_profile::GetProfileUseCase;
use backend::application::use_cases::get_service_order_detail::GetServiceOrderDetailUseCase;
use backend::application::use_cases::list_feedbacks::ListFeedbacksUseCase;
use backend::application::use_cases::list_service_orders::ListServiceOrdersUseCase;
use backend::application::use_cases::list_users::ListUsersUseCase;
use backend::application::use_cases::login::LoginUseCase;
use backend::application::use_cases::logout::LogoutUseCase;
use backend::application::use_cases::process_payment::ProcessPaymentUseCase;
use backend::application::use_cases::promote_user::PromoteUserUseCase;
use backend::application::use_cases::refresh_token::RefreshTokenUseCase;
use backend::application::use_cases::register_user::RegisterUserUseCase;
use backend::application::use_cases::remove_service_item::RemoveServiceItemUseCase;
use backend::application::use_cases::update_order_photos::UpdateOrderPhotosUseCase;
use backend::application::use_cases::update_order_status::UpdateOrderStatusUseCase;
use backend::application::use_cases::update_profile::UpdateProfileUseCase;
use backend::domain::notification::gateway::NotificationGateway;
use backend::domain::payment::gateway::PaymentGateway;
use backend::infrastructure::db::connection::establish_connection;
use backend::infrastructure::db::repositories::inventory::InventoryRepository;
use backend::infrastructure::db::repositories::motorcycle::MotorcycleRepository;
use backend::infrastructure::db::repositories::refresh_token::RefreshTokenRepository;
use backend::infrastructure::db::repositories::repair_log::RepairLogRepository;
use backend::infrastructure::db::repositories::service_item::ServiceItemRepository;
use backend::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use backend::infrastructure::db::repositories::user::UserRepository;
use backend::infrastructure::db::repositories::user_line_account::UserLineAccountRepository;
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
    let service_item_repository = ServiceItemRepository::new(pool.clone());
    let motorcycle_repository = MotorcycleRepository::new(pool.clone());
    let user_line_account_repository = UserLineAccountRepository::new(pool.clone());
    let refresh_token_repository = RefreshTokenRepository::new(pool.clone());
    let inventory_repository = InventoryRepository::new(pool.clone());
    let stock_item_repository =
        backend::infrastructure::db::repositories::stock::StockItemRepository::new(pool.clone());
    let notification_repository =
        backend::infrastructure::db::repositories::notification::NotificationRepository::new(
            pool.clone(),
        );
    let feedback_repository = FeedbackRepository::new(pool.clone());
    let repair_log_repository = RepairLogRepository::new(pool.clone());

    // Gateways
    let omise_gateway: Arc<dyn PaymentGateway + Send + Sync> = Arc::new(OmiseGateway::new());
    let line_gateway = Arc::new(LineNotificationGateway::new());
    let web_gateway = Arc::new(
        backend::infrastructure::external::notification::web::WebNotificationGateway::new(
            notification_repository.clone(),
        ),
    );

    let notification_gateway: Arc<dyn NotificationGateway + Send + Sync> =
        Arc::new(backend::infrastructure::external::notification::composite::CompositeNotificationGateway::new(vec![
            line_gateway.clone(),
            web_gateway,
        ]));

    // Services
    let jwt_service = JwtService::new();

    // Use Cases
    let register_user_use_case = RegisterUserUseCase::new(user_repository.clone());
    let promote_user_use_case = PromoteUserUseCase::new(user_repository.clone());
    let login_use_case = LoginUseCase::new(
        user_repository.clone(),
        user_line_account_repository.clone(),
        refresh_token_repository.clone(),
        jwt_service.clone(),
        line_gateway.clone(),
    );
    let logout_use_case = LogoutUseCase::new(refresh_token_repository.clone());
    let refresh_token_use_case =
        RefreshTokenUseCase::new(refresh_token_repository, jwt_service.clone());
    let create_service_order_use_case = CreateServiceOrderUseCase::new(
        service_order_repository.clone(),
        motorcycle_repository.clone(),
        user_line_account_repository.clone(),
        user_repository.clone(),
        notification_gateway.clone(),
    );
    let process_payment_use_case = ProcessPaymentUseCase::new(
        service_order_repository.clone(),
        user_repository.clone(),
        user_line_account_repository.clone(),
        omise_gateway,
        notification_gateway.clone(),
        repair_log_repository.clone(),
    );
    let list_users_use_case = ListUsersUseCase::new(user_repository.clone());
    let list_service_orders_use_case =
        ListServiceOrdersUseCase::new(service_order_repository.clone());
    let update_order_status_use_case = UpdateOrderStatusUseCase::new(
        service_order_repository.clone(),
        user_line_account_repository.clone(),
        user_repository.clone(),
        notification_gateway.clone(),
        repair_log_repository,
    );
    let get_profile_use_case = GetProfileUseCase::new(
        user_repository.clone(),
        user_line_account_repository.clone(),
    );
    let connect_line_use_case =
        ConnectLineUseCase::new(user_line_account_repository.clone(), line_gateway.clone());
    let disconnect_line_use_case = DisconnectLineUseCase::new(user_line_account_repository.clone());
    let get_dashboard_stats_use_case = GetDashboardStatsUseCase::new(
        service_order_repository.clone(),
        user_repository.clone(),
        motorcycle_repository,
    );
    let update_profile_use_case = UpdateProfileUseCase::new(user_repository);
    let update_order_photos_use_case =
        UpdateOrderPhotosUseCase::new(service_order_repository.clone());
    let get_service_order_detail_use_case =
        GetServiceOrderDetailUseCase::new(service_order_repository.clone());
    let add_service_item_use_case = AddServiceItemUseCase::new(
        service_item_repository.clone(),
        service_order_repository.clone(),
    );
    let delete_service_order_use_case = DeleteServiceOrderUseCase::new(
        service_order_repository.clone(),
        user_line_account_repository.clone(),
        notification_gateway.clone(),
    );
    let submit_feedback_use_case = SubmitFeedbackUseCase::new(feedback_repository.clone());
    let list_feedbacks_use_case = ListFeedbacksUseCase::new(feedback_repository.clone());
    let delete_feedback_use_case = DeleteFeedbackUseCase::new(feedback_repository.clone());

    let add_stock_item_use_case =
        backend::application::use_cases::add_stock_item::AddStockItemUseCase::new(
            stock_item_repository.clone(),
        );
    let list_stock_items_use_case =
        backend::application::use_cases::list_stock_items::ListStockItemsUseCase::new(
            stock_item_repository.clone(),
        );
    let update_stock_item_use_case =
        backend::application::use_cases::update_stock_item::UpdateStockItemUseCase::new(
            stock_item_repository.clone(),
        );
    let delete_stock_item_use_case =
        backend::application::use_cases::delete_stock_item::DeleteStockItemUseCase::new(
            stock_item_repository.clone(),
        );
    let use_stock_item_use_case =
        backend::application::use_cases::use_stock_item::UseStockItemUseCase::new(
            inventory_repository.clone(),
        );
    let remove_service_item_use_case = RemoveServiceItemUseCase::new(inventory_repository.clone());

    let mark_notification_read_use_case =
        backend::application::use_cases::mark_notification_read::MarkNotificationReadUseCase::new(
            notification_repository.clone(),
        );
    let list_notifications_use_case =
        backend::application::use_cases::list_notifications::ListNotificationsUseCase::new(
            notification_repository.clone(),
        );

    let app_state = Arc::new(AppState {
        submit_feedback_use_case,
        list_feedbacks_use_case,
        delete_feedback_use_case,
        register_user_use_case,
        promote_user_use_case,
        create_service_order_use_case,
        login_use_case,
        logout_use_case,
        refresh_token_use_case,
        process_payment_use_case,
        list_users_use_case,
        list_service_orders_use_case,
        update_order_status_use_case,
        get_dashboard_stats_use_case,
        get_profile_use_case,
        connect_line_use_case,
        disconnect_line_use_case,
        get_service_order_detail_use_case,
        add_service_item_use_case,
        add_stock_item_use_case,
        list_stock_items_use_case,
        use_stock_item_use_case,
        update_stock_item_use_case,
        delete_stock_item_use_case,
        update_profile_use_case,
        update_order_photos_use_case,
        list_notifications_use_case,
        mark_notification_read_use_case,
        delete_service_order_use_case,
        remove_service_item_use_case,
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
