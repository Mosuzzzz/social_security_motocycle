use crate::domain::service::stock_entity::StockItem;
use crate::infrastructure::db::repositories::stock::StockItemRepository;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UpdateStockItemCommand {
    pub id: i32,
    pub name: String,
    pub price: f64,
    pub quantity: i32,
}

pub struct UpdateStockItemUseCase {
    stock_repo: StockItemRepository,
}

impl UpdateStockItemUseCase {
    pub fn new(stock_repo: StockItemRepository) -> Self {
        Self { stock_repo }
    }

    pub async fn execute(&self, command: UpdateStockItemCommand) -> Result<StockItem, String> {
        let item = StockItem {
            id: Some(command.id),
            name: command.name,
            price: command.price,
            quantity: command.quantity,
        };
        self.stock_repo.update_stock_item(item).await
    }
}
