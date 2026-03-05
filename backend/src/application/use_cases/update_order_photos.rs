use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UpdateOrderPhotosCommand {
    pub order_id: i32,
    pub before_picture_url: Option<String>,
    pub after_picture_url: Option<String>,
}

#[derive(Clone)]
pub struct UpdateOrderPhotosUseCase {
    order_repo: ServiceOrderRepository,
}

impl UpdateOrderPhotosUseCase {
    pub fn new(order_repo: ServiceOrderRepository) -> Self {
        Self { order_repo }
    }

    pub async fn execute(&self, command: UpdateOrderPhotosCommand) -> Result<(), String> {
        let mut order = self
            .order_repo
            .find_by_id(command.order_id)
            .await?
            .ok_or("Order not found")?;

        if let Some(url) = command.before_picture_url {
            order.before_picture_url = Some(url);
        }
        if let Some(url) = command.after_picture_url {
            order.after_picture_url = Some(url);
        }

        self.order_repo.update_order(order).await?;
        Ok(())
    }
}
