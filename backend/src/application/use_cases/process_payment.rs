use crate::domain::notification::gateway::{NotificationGateway, NotificationMessage};
use crate::domain::payment::gateway::PaymentGateway;
use crate::domain::service::entity::OrderStatus;
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use crate::infrastructure::db::repositories::user::UserRepository;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct ProcessPaymentCommand {
    pub order_id: i32,
    pub payment_token: String,
}

#[derive(Debug, Serialize)]
pub struct ProcessPaymentResult {
    pub order_id: i32,
    pub transaction_id: String,
    pub status: String,
}

#[derive(Clone)]
pub struct ProcessPaymentUseCase {
    pub service_order_repo: ServiceOrderRepository,
    pub user_repo: UserRepository,
    pub payment_gateway: std::sync::Arc<dyn PaymentGateway + Send + Sync>,
    pub notification_gateway: std::sync::Arc<dyn NotificationGateway + Send + Sync>,
}

impl ProcessPaymentUseCase {
    pub fn new(
        service_order_repo: ServiceOrderRepository,
        user_repo: UserRepository,
        payment_gateway: std::sync::Arc<dyn PaymentGateway + Send + Sync>,
        notification_gateway: std::sync::Arc<dyn NotificationGateway + Send + Sync>,
    ) -> Self {
        Self {
            service_order_repo,
            user_repo,
            payment_gateway,
            notification_gateway,
        }
    }

    pub async fn execute(
        &self,
        command: ProcessPaymentCommand,
    ) -> Result<ProcessPaymentResult, String> {
        // 1. Find the order
        let mut order = self
            .service_order_repo
            .find_by_id(command.order_id)
            .await?
            .ok_or("Order not found")?;

        if order.status == OrderStatus::Paid {
            return Err("Order is already paid".to_string());
        }

        // 2. Process payment
        // For Omise, we might need currency. Defaulting to THB.
        let payment_result = self
            .payment_gateway
            .charge(order.total_price, "THB".to_string(), command.payment_token)
            .await?;

        if payment_result.status != crate::domain::payment::gateway::PaymentStatus::Successful {
            return Err("Payment failed".to_string());
        }

        // 3. Update order status
        order.status = OrderStatus::Paid;
        self.service_order_repo.update_order(order.clone()).await?;

        // 4. Notify the user
        let user = self
            .user_repo
            .find_by_id(order.customer_id)
            .await?
            .ok_or("Customer not found")?;

        let _ = self
            .notification_gateway
            .send_notification(NotificationMessage {
                recipient: user.phone, // Assuming phone can be used for SMS/Line
                title: "Payment Successful".to_string(),
                body: format!(
                    "Payment for order #{} successful. Total: {}",
                    order.id.unwrap(),
                    order.total_price
                ),
            })
            .await;

        Ok(ProcessPaymentResult {
            order_id: order.id.unwrap(),
            transaction_id: payment_result.transaction_id,
            status: "Success".to_string(),
        })
    }
}
