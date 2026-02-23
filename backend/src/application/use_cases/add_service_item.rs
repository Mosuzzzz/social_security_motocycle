use crate::domain::service::entity::ServiceItem;
use crate::infrastructure::db::repositories::service_item::ServiceItemRepository;
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct AddServiceItemCommand {
    pub order_id: i32,
    pub description: String,
    pub price: f64,
}

#[derive(Clone)]
pub struct AddServiceItemUseCase {
    item_repo: ServiceItemRepository,
    order_repo: ServiceOrderRepository,
}

impl AddServiceItemUseCase {
    pub fn new(item_repo: ServiceItemRepository, order_repo: ServiceOrderRepository) -> Self {
        Self {
            item_repo,
            order_repo,
        }
    }

    pub async fn execute(&self, command: AddServiceItemCommand) -> Result<ServiceItem, String> {
        // 1. Verify order exists
        let mut order = self
            .order_repo
            .find_by_id(command.order_id)
            .await?
            .ok_or_else(|| format!("Service order {} not found", command.order_id))?;

        // 2. Create and add item
        let new_item = ServiceItem {
            id: None,
            order_id: command.order_id,
            description: command.description,
            price: command.price,
        };

        let added_item = self.item_repo.add_item(new_item).await?;

        // 3. Update order total price
        order.total_price += command.price;
        self.order_repo.update_order(order).await?;

        Ok(added_item)
    }
}
