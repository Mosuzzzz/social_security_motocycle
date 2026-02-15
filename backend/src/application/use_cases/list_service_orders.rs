use crate::domain::service::entity::{OrderStatus, ServiceOrder};
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use serde::Serialize;

#[derive(Serialize)]
pub struct ServiceOrderResponse {
    pub id: i32,
    pub bike_id: i32,
    pub customer_id: i32,
    pub status: OrderStatus,
    pub total_price: f64,
}

pub struct ListServiceOrdersUseCase {
    order_repo: ServiceOrderRepository,
}

impl ListServiceOrdersUseCase {
    pub fn new(order_repo: ServiceOrderRepository) -> Self {
        Self { order_repo }
    }

    pub async fn execute_for_customer(
        &self,
        customer_id: i32,
    ) -> Result<Vec<ServiceOrderResponse>, String> {
        let orders = self
            .order_repo
            .list_orders_for_customer(customer_id)
            .await?;
        Ok(orders.into_iter().map(Self::map_to_response).collect())
    }

    pub async fn execute_all(&self) -> Result<Vec<ServiceOrderResponse>, String> {
        let orders = self.order_repo.list_orders().await?;
        Ok(orders.into_iter().map(Self::map_to_response).collect())
    }

    fn map_to_response(order: ServiceOrder) -> ServiceOrderResponse {
        ServiceOrderResponse {
            id: order.id.unwrap_or(0),
            bike_id: order.bike_id,
            customer_id: order.customer_id,
            status: order.status,
            total_price: order.total_price,
        }
    }
}
