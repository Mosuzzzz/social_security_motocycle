use crate::domain::service::stock_entity::StockItem;
use crate::infrastructure::db::repositories::stock::StockItemRepository;

pub struct ListStockItemsUseCase {
    stock_repo: StockItemRepository,
}

impl ListStockItemsUseCase {
    pub fn new(stock_repo: StockItemRepository) -> Self {
        Self { stock_repo }
    }

    pub async fn execute(&self) -> Result<Vec<StockItem>, String> {
        self.stock_repo.list_stock_items().await
    }
}
