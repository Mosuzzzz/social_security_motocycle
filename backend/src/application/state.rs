use crate::application::use_cases::create_service_order::CreateServiceOrderUseCase;
use crate::application::use_cases::login::LoginUseCase;
use crate::application::use_cases::promote_user::PromoteUserUseCase;
use crate::application::use_cases::register_user::RegisterUserUseCase;
use crate::infrastructure::security::jwt::service::JwtService;

#[allow(dead_code)]
pub struct AppState {
    pub register_user_use_case: RegisterUserUseCase,
    pub promote_user_use_case: PromoteUserUseCase,
    pub create_service_order_use_case: CreateServiceOrderUseCase,
    pub login_use_case: LoginUseCase,
    pub jwt_service: JwtService,
}
