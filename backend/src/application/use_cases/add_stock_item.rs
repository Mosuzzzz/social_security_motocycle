use crate::domain::service::stock_entity::StockItem;
use crate::infrastructure::db::repositories::stock::StockItemRepository;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct AddStockItemCommand {
    pub name: String,
    pub price: f64,
    pub quantity: i32,
}

pub struct AddStockItemUseCase {
    stock_repo: StockItemRepository,
}

impl AddStockItemUseCase {
    pub fn new(stock_repo: StockItemRepository) -> Self {
        Self { stock_repo }
    }

    pub async fn execute(&self, command: AddStockItemCommand) -> Result<StockItem, String> {
        let item = StockItem {
            id: None,
            name: command.name,
            price: command.price,
            quantity: command.quantity,
        };
        self.stock_repo.create_stock_item(item).await
    }
}
