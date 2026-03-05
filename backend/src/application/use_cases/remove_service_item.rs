use crate::infrastructure::db::repositories::inventory::InventoryRepository;

#[derive(Clone)]
pub struct RemoveServiceItemUseCase {
    inventory_repo: InventoryRepository,
}

impl RemoveServiceItemUseCase {
    pub fn new(inventory_repo: InventoryRepository) -> Self {
        Self { inventory_repo }
    }

    pub async fn execute(&self, item_id: i32) -> Result<(), String> {
        self.inventory_repo.remove_service_item(item_id).await
    }
}
