use crate::infrastructure::db::repositories::inventory::InventoryRepository;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UseStockItemCommand {
    pub order_id: i32,
    pub stock_item_id: i32,
    pub quantity: i32,
}

pub struct UseStockItemUseCase {
    inventory_repo: InventoryRepository,
}

impl UseStockItemUseCase {
    pub fn new(inventory_repo: InventoryRepository) -> Self {
        Self { inventory_repo }
    }

    pub async fn execute(&self, command: UseStockItemCommand) -> Result<(), String> {
        self.inventory_repo
            .use_stock_item(command.order_id, command.stock_item_id, command.quantity)
            .await
    }
}
