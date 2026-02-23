use crate::domain::service::entity::ServiceOrder;
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;

#[derive(Clone)]
pub struct GetServiceOrderDetailUseCase {
    order_repo: ServiceOrderRepository,
}

impl GetServiceOrderDetailUseCase {
    pub fn new(order_repo: ServiceOrderRepository) -> Self {
        Self { order_repo }
    }

    pub async fn execute(&self, order_id: i32) -> Result<ServiceOrder, String> {
        self.order_repo
            .find_by_id(order_id)
            .await?
            .ok_or_else(|| format!("Service order {} not found", order_id))
    }
}
