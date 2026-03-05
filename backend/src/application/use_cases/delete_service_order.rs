use crate::domain::notification::gateway::{NotificationGateway, NotificationMessage};
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use crate::infrastructure::db::repositories::user_line_account::UserLineAccountRepository;
use std::sync::Arc;

#[derive(Clone)]
pub struct DeleteServiceOrderUseCase {
    order_repo: ServiceOrderRepository,
    line_repo: UserLineAccountRepository,
    notification_gateway: Arc<dyn NotificationGateway + Send + Sync>,
}

impl DeleteServiceOrderUseCase {
    pub fn new(
        order_repo: ServiceOrderRepository,
        line_repo: UserLineAccountRepository,
        notification_gateway: Arc<dyn NotificationGateway + Send + Sync>,
    ) -> Self {
        Self {
            order_repo,
            line_repo,
            notification_gateway,
        }
    }

    pub async fn execute(&self, order_id: i32, reason: String) -> Result<(), String> {
        // 1. Fetch order to get customer_id before deleting
        let order = self
            .order_repo
            .find_by_id(order_id)
            .await?
            .ok_or("Order not found")?;

        let customer_id = order.customer_id;

        // 2. Clone for async background task
        let self_clone = self.clone();
        let reason_clone = reason.clone();

        // Fire notification in background
        tokio::spawn(async move {
            let customer_line_id = self_clone
                .line_repo
                .find_by_user_id(customer_id)
                .await
                .ok()
                .flatten()
                .map(|l| l.line_user_id)
                .unwrap_or_default();

            let flex_payload = serde_json::json!({
                "type": "flex",
                "altText": format!("Order #SO-{} cancelled", order_id),
                "contents": {
                    "type": "bubble",
                    "header": {
                        "type": "box",
                        "layout": "vertical",
                        "backgroundColor": "#b91c1c",
                        "contents": [
                            { "type": "text", "text": "ORDER CANCELLED", "color": "#ffcdd2", "size": "xs", "weight": "bold" },
                            { "type": "text", "text": format!("#SO-{}", order_id), "color": "#FFFFFF", "size": "xl", "weight": "bold" }
                        ]
                    },
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "md",
                        "contents": [
                            { "type": "text", "text": "Your order has been cancelled by the shop.", "size": "sm", "color": "#444444", "wrap": true },
                            { "type": "box", "layout": "vertical", "margin": "lg", "contents": [
                                { "type": "text", "text": "Reason", "size": "xs", "color": "#888888" },
                                { "type": "text", "text": reason_clone.clone(), "size": "sm", "weight": "bold", "wrap": true }
                            ]},
                            { "type": "text", "text": "Please contact us if you have any questions.", "size": "xs", "color": "#888888", "wrap": true }
                        ]
                    }
                }
            });

            let _ = self_clone
                .notification_gateway
                .send_notification(NotificationMessage {
                    user_id: customer_id,
                    order_id: Some(order_id),
                    recipient: customer_line_id,
                    title: format!("❌ Order Cancelled #SO-{}", order_id),
                    body: format!(
                        "Your order #SO-{} has been cancelled.\nReason: {}",
                        order_id, reason_clone
                    ),
                    custom_payload: Some(flex_payload),
                })
                .await;
        });

        // 3. Delete the order (notifications + items + order)
        self.order_repo.delete_order(order_id).await
    }
}
