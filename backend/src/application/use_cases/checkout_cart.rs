use crate::domain::service::entity::{OrderStatus, ServiceOrder};
use crate::infrastructure::db::repositories::inventory::InventoryRepository;
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CartItem {
    pub stock_item_id: i32,
    pub quantity: i32,
}

#[derive(Deserialize)]
pub struct CheckoutCommand {
    pub items: Vec<CartItem>,
}

pub struct CheckoutUseCase {
    order_repo: ServiceOrderRepository,
    inventory_repo: InventoryRepository,
}

impl CheckoutUseCase {
    pub fn new(order_repo: ServiceOrderRepository, inventory_repo: InventoryRepository) -> Self {
        Self {
            order_repo,
            inventory_repo,
        }
    }

    pub async fn execute(&self, command: CheckoutCommand, customer_id: i32) -> Result<i32, String> {
        if command.items.is_empty() {
            return Err("Cart is empty".to_string());
        }

        // 1. Create a base order for the purchase
        let order = ServiceOrder {
            id: None,
            bike_id: None,
            customer_id,
            status: OrderStatus::Booked,
            total_price: 0.0,
            items: Vec::new(),
        };

        let created_order = self.order_repo.create_order(order, customer_id).await?;
        let order_id = created_order.id.ok_or("Failed to create order")?;

        // 2. Add each item from cart
        for item in command.items {
            self.inventory_repo
                .use_stock_item(order_id, item.stock_item_id, item.quantity)
                .await?;
        }

        Ok(order_id)
    }
}
