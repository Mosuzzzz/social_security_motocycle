use crate::domain::service::entity::{OrderStatus, ServiceOrder};
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UpdateOrderStatusCommand {
    pub order_id: i32,
    pub status: OrderStatus,
    pub total_price: Option<f64>,
}

pub struct UpdateOrderStatusUseCase {
    order_repo: ServiceOrderRepository,
}

impl UpdateOrderStatusUseCase {
    pub fn new(order_repo: ServiceOrderRepository) -> Self {
        Self { order_repo }
    }

    pub async fn execute(&self, command: UpdateOrderStatusCommand) -> Result<ServiceOrder, String> {
        let mut order = self
            .order_repo
            .find_by_id(command.order_id)
            .await?
            .ok_or("Order not found")?;

        order.status = command.status;
        if let Some(price) = command.total_price {
            order.total_price = price;
        }

        self.order_repo.update_order(order).await
    }
}
