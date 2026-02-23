use crate::domain::notification::gateway::{NotificationGateway, NotificationMessage};
use crate::domain::payment::gateway::PaymentGateway;
use crate::domain::service::entity::OrderStatus;
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
}

impl ProcessPaymentUseCase {
    pub fn new(
        service_order_repo: ServiceOrderRepository,
        user_repo: UserRepository,
        line_repo: UserLineAccountRepository,
        payment_gateway: Arc<dyn PaymentGateway + Send + Sync>,
        notification_gateway: Arc<dyn NotificationGateway + Send + Sync>,
    ) -> Self {
        Self {
            service_order_repo,
            user_repo,
            line_repo,
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

            // 4. Notify the user
            let line_id = self
                .line_repo
                .find_by_user_id(order.customer_id)
                .await
                .ok()
                .flatten()
                .map(|l| l.line_user_id)
                .unwrap_or_default();

            let recipient = if !line_id.is_empty() {
                line_id
            } else {
                self.user_repo
                    .find_by_id(order.customer_id)
                    .await?
                    .ok_or("Customer not found")?
                    .phone
            };

            let _ = self
                .notification_gateway
                .send_notification(NotificationMessage {
                    user_id: order.customer_id,
                    order_id: order.id,
                    recipient,
                    title: "Payment Successful 🛵".to_string(),
                    body: format!(
                        "💳 [จ่ายเงินสำเร็จ]เราได้รับยอดชำระเงินของคุณแล้วสำหรับออเดอร์ #SO-{} เป็นจำนวน ฿{} ขอบคุณที่ใช้บริการ MotoFlow ครับ!",
                        order.id.unwrap(),
                        order.total_price
                    ),
                    custom_payload: None,
                })
                .await;

            // 5. Notify Admins about the payment
            if let Ok(admins) = self.user_repo.find_admins().await {
                for admin in admins {
                    if let Some(admin_id) = admin.id {
                        let admin_line_id = self
                            .line_repo
                            .find_by_user_id(admin_id)
                            .await
                            .ok()
                            .flatten()
                            .map(|l| l.line_user_id)
                            .unwrap_or_default();

                        let _ = self
                            .notification_gateway
                            .send_notification(NotificationMessage {
                                user_id: admin_id,
                                order_id: order.id,
                                recipient: admin_line_id,
                                title: format!("Admin: Payment Received #{}", order.id.unwrap()),
                                body: format!(
                                    "Customer has paid ฿{} for order #SO-{}.",
                                    order.total_price,
                                    order.id.unwrap()
                                ),
                                custom_payload: None,
                            })
                            .await;
                    }
                }
            }
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
