use crate::application::use_cases::add_service_item::AddServiceItemUseCase;
use crate::application::use_cases::add_stock_item::AddStockItemUseCase;
use crate::application::use_cases::connect_line::ConnectLineUseCase;
use crate::application::use_cases::create_service_order::CreateServiceOrderUseCase;
use crate::application::use_cases::delete_service_order::DeleteServiceOrderUseCase;
use crate::application::use_cases::delete_stock_item::DeleteStockItemUseCase;
use crate::application::use_cases::disconnect_line::DisconnectLineUseCase;
use crate::application::use_cases::get_dashboard_stats::GetDashboardStatsUseCase;
use crate::application::use_cases::get_profile::GetProfileUseCase;
use crate::application::use_cases::get_service_order_detail::GetServiceOrderDetailUseCase;
use crate::application::use_cases::list_feedbacks::ListFeedbacksUseCase;
use crate::application::use_cases::list_service_orders::ListServiceOrdersUseCase;
use crate::application::use_cases::list_stock_items::ListStockItemsUseCase;
use crate::application::use_cases::list_users::ListUsersUseCase;
use crate::application::use_cases::login::LoginUseCase;
use crate::application::use_cases::logout::LogoutUseCase;
use crate::application::use_cases::process_payment::ProcessPaymentUseCase;
use crate::application::use_cases::promote_user::PromoteUserUseCase;
use crate::application::use_cases::refresh_token::RefreshTokenUseCase;
use crate::application::use_cases::register_user::RegisterUserUseCase;
use crate::application::use_cases::submit_feedback::SubmitFeedbackUseCase;
use crate::application::use_cases::update_order_status::UpdateOrderStatusUseCase;
use crate::application::use_cases::update_profile::UpdateProfileUseCase;
use crate::application::use_cases::update_stock_item::UpdateStockItemUseCase;
use crate::application::use_cases::use_stock_item::UseStockItemUseCase;
use crate::infrastructure::security::jwt::service::JwtService;

pub struct AppState {
    pub submit_feedback_use_case: SubmitFeedbackUseCase,
    pub list_feedbacks_use_case: ListFeedbacksUseCase,
    pub register_user_use_case: RegisterUserUseCase,

    pub promote_user_use_case: PromoteUserUseCase,
    pub create_service_order_use_case: CreateServiceOrderUseCase,
    pub login_use_case: LoginUseCase,
    pub logout_use_case: LogoutUseCase,
    pub refresh_token_use_case: RefreshTokenUseCase,
    pub process_payment_use_case: ProcessPaymentUseCase,
    pub list_users_use_case: ListUsersUseCase,
    pub list_service_orders_use_case: ListServiceOrdersUseCase,
    pub update_order_status_use_case: UpdateOrderStatusUseCase,
    pub get_dashboard_stats_use_case: GetDashboardStatsUseCase,
    pub get_profile_use_case: GetProfileUseCase,
    pub connect_line_use_case: ConnectLineUseCase,
    pub disconnect_line_use_case: DisconnectLineUseCase,
    pub get_service_order_detail_use_case: GetServiceOrderDetailUseCase,
    pub add_service_item_use_case: AddServiceItemUseCase,
    pub add_stock_item_use_case: AddStockItemUseCase,
    pub list_stock_items_use_case: ListStockItemsUseCase,
    pub use_stock_item_use_case: UseStockItemUseCase,
    pub update_stock_item_use_case: UpdateStockItemUseCase,
    pub delete_stock_item_use_case: DeleteStockItemUseCase,
    pub update_profile_use_case: UpdateProfileUseCase,
    pub list_notifications_use_case:
        crate::application::use_cases::list_notifications::ListNotificationsUseCase,
    pub mark_notification_read_use_case:
        crate::application::use_cases::mark_notification_read::MarkNotificationReadUseCase,
    pub delete_service_order_use_case: DeleteServiceOrderUseCase,
    pub jwt_service: JwtService,
}
