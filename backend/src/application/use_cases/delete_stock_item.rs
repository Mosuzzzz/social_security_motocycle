use crate::infrastructure::db::repositories::stock::StockItemRepository;

pub struct DeleteStockItemUseCase {
    stock_repo: StockItemRepository,
}

impl DeleteStockItemUseCase {
    pub fn new(stock_repo: StockItemRepository) -> Self {
        Self { stock_repo }
    }

    pub async fn execute(&self, item_id: i32) -> Result<(), String> {
        self.stock_repo.delete_stock_item(item_id).await
    }
}
