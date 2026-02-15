use crate::domain::service::entity::{OrderStatus, ServiceOrder};
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct CreateServiceOrderCommand {
    pub bike_id: i32,
    pub customer_id: i32,
    pub initial_price: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct CreateServiceOrderResult {
    pub order_id: i32,
    pub status: OrderStatus,
    pub total_price: f64,
}

#[derive(Clone)]
pub struct CreateServiceOrderUseCase {
    order_repository: ServiceOrderRepository,
}

impl CreateServiceOrderUseCase {
    pub fn new(order_repository: ServiceOrderRepository) -> Self {
        Self { order_repository }
    }

    pub async fn execute(
        &self,
        command: CreateServiceOrderCommand,
        creator_id: i32,
    ) -> Result<CreateServiceOrderResult, String> {
        let order = ServiceOrder {
            id: None,
            bike_id: command.bike_id,
            customer_id: command.customer_id,
            status: OrderStatus::Booked,
            total_price: command.initial_price.unwrap_or(0.0),
        };

        // Note: Additional validation could be here (e.g. bike belongs to customer)

        let created_order = self
            .order_repository
            .create_order(order, creator_id)
            .await?;

        Ok(CreateServiceOrderResult {
            order_id: created_order.id.unwrap_or(0),
            status: created_order.status,
            total_price: created_order.total_price,
        })
    }
}
