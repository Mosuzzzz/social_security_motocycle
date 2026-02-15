use crate::application::use_cases::create_service_order::CreateServiceOrderUseCase;
use crate::application::use_cases::list_service_orders::ListServiceOrdersUseCase;
use crate::application::use_cases::list_users::ListUsersUseCase;
use crate::application::use_cases::login::LoginUseCase;
use crate::application::use_cases::process_payment::ProcessPaymentUseCase;
use crate::application::use_cases::promote_user::PromoteUserUseCase;
use crate::application::use_cases::register_user::RegisterUserUseCase;
use crate::application::use_cases::update_order_status::UpdateOrderStatusUseCase;
use crate::infrastructure::security::jwt::service::JwtService;

#[allow(dead_code)]
pub struct AppState {
    pub register_user_use_case: RegisterUserUseCase,
    pub promote_user_use_case: PromoteUserUseCase,
    pub create_service_order_use_case: CreateServiceOrderUseCase,
    pub login_use_case: LoginUseCase,
    pub process_payment_use_case: ProcessPaymentUseCase,
    pub list_users_use_case: ListUsersUseCase,
    pub list_service_orders_use_case: ListServiceOrdersUseCase,
    pub update_order_status_use_case: UpdateOrderStatusUseCase,
    pub jwt_service: JwtService,
}
