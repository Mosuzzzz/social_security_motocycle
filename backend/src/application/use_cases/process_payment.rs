use crate::domain::notification::gateway::{NotificationGateway, NotificationMessage};
use crate::domain::payment::gateway::PaymentGateway;
use crate::domain::service::entity::OrderStatus;
use crate::infrastructure::db::repositories::repair_log::RepairLogRepository;
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use crate::infrastructure::db::repositories::user::UserRepository;
use crate::infrastructure::db::repositories::user_line_account::UserLineAccountRepository;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

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
    pub details: Option<serde_json::Value>,
}

#[derive(Clone)]
pub struct ProcessPaymentUseCase {
    pub service_order_repo: ServiceOrderRepository,
    pub user_repo: UserRepository,
    pub line_repo: UserLineAccountRepository,
    pub payment_gateway: Arc<dyn PaymentGateway + Send + Sync>,
    pub notification_gateway: Arc<dyn NotificationGateway + Send + Sync>,
    pub repair_log_repo: RepairLogRepository,
}

impl ProcessPaymentUseCase {
    pub fn new(
        service_order_repo: ServiceOrderRepository,
        user_repo: UserRepository,
        line_repo: UserLineAccountRepository,
        payment_gateway: Arc<dyn PaymentGateway + Send + Sync>,
        notification_gateway: Arc<dyn NotificationGateway + Send + Sync>,
        repair_log_repo: RepairLogRepository,
    ) -> Self {
        Self {
            service_order_repo,
            user_repo,
            line_repo,
            payment_gateway,
            notification_gateway,
            repair_log_repo,
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
        let payment_result = self
            .payment_gateway
            .charge(order.total_price, "THB".to_string(), command.payment_token)
            .await?;

        if payment_result.status == crate::domain::payment::gateway::PaymentStatus::Failed {
            return Err("Payment failed".to_string());
        }

        let is_successful =
            payment_result.status == crate::domain::payment::gateway::PaymentStatus::Successful;
        let is_pending =
            payment_result.status == crate::domain::payment::gateway::PaymentStatus::Pending;

        if is_successful {
            // 3. Update order status
            order.status = OrderStatus::Paid;
            self.service_order_repo.update_order(order.clone()).await?;

            // New: Log the status change
            let _ = self
                .repair_log_repo
                .add_log(
                    order.id.unwrap(),
                    order.customer_id, // For payments, the customer is the one who effectively triggered it
                    "Order status updated to Paid via automated payment processing.".to_string(),
                    crate::infrastructure::db::models::ServiceOrderStatusEnum::Paid,
                )
                .await;

            // 4. Fire notifications in background
            let self_clone = self.clone();
            let order_clone = order.clone();

            tokio::spawn(async move {
                // Notify the user
                let line_id = self_clone
                    .line_repo
                    .find_by_user_id(order_clone.customer_id)
                    .await
                    .ok()
                    .flatten()
                    .map(|l| l.line_user_id)
                    .unwrap_or_default();

                let recipient = if !line_id.is_empty() {
                    line_id
                } else {
                    self_clone
                        .user_repo
                        .find_by_id(order_clone.customer_id)
                        .await
                        .ok()
                        .flatten()
                        .map(|u| u.phone)
                        .unwrap_or_default()
                };

                if !recipient.is_empty() {
                    let _ = self_clone
                        .notification_gateway
                        .send_notification(NotificationMessage {
                            user_id: order_clone.customer_id,
                            order_id: order_clone.id,
                            recipient,
                            title: "Payment Successful 🛵".to_string(),
                            body: format!(
                                "💳 [Payment Success] We received your payment of ฿{} for order #SO-{}. Thank you for using MotoFlow!",
                                order_clone.total_price,
                                order_clone.id.unwrap()
                            ),
                            custom_payload: None,
                        })
                        .await;
                }

                // Notify Admins about the payment
                if let Ok(admins) = self_clone.user_repo.find_admins().await {
                    for admin in admins {
                        if let Some(admin_id) = admin.id {
                            let admin_line_id = self_clone
                                .line_repo
                                .find_by_user_id(admin_id)
                                .await
                                .ok()
                                .flatten()
                                .map(|l| l.line_user_id)
                                .unwrap_or_default();

                            let _ = self_clone
                                .notification_gateway
                                .send_notification(NotificationMessage {
                                    user_id: admin_id,
                                    order_id: order_clone.id,
                                    recipient: admin_line_id,
                                    title: format!(
                                        "Admin: Payment Received #{}",
                                        order_clone.id.unwrap()
                                    ),
                                    body: format!(
                                        "Customer has paid ฿{} for order #SO-{}.",
                                        order_clone.total_price,
                                        order_clone.id.unwrap()
                                    ),
                                    custom_payload: None,
                                })
                                .await;
                        }
                    }
                }
            });
        }

        let status_str = if is_successful {
            "Success"
        } else if is_pending {
            "Pending"
        } else {
            "Failed"
        };

        Ok(ProcessPaymentResult {
            order_id: order.id.unwrap(),
            transaction_id: payment_result.transaction_id,
            status: status_str.to_string(),
            details: payment_result.details,
        })
    }
}
