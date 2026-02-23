use crate::domain::notification::gateway::{NotificationGateway, NotificationMessage};
use crate::domain::service::entity::{OrderStatus, ServiceOrder};
use crate::domain::user::entity::Role;
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use crate::infrastructure::db::repositories::user::UserRepository;
use crate::infrastructure::db::repositories::user_line_account::UserLineAccountRepository;
use serde::Deserialize;
use std::sync::Arc;

#[derive(Deserialize)]
pub struct UpdateOrderStatusCommand {
    pub order_id: i32,
    pub status: OrderStatus,
    pub total_price: Option<f64>,
}

#[derive(Clone)]
pub struct UpdateOrderStatusUseCase {
    order_repo: ServiceOrderRepository,
    line_repo: UserLineAccountRepository,
    user_repo: UserRepository,
    notification_gateway: Arc<dyn NotificationGateway + Send + Sync>,
}

impl UpdateOrderStatusUseCase {
    pub fn new(
        order_repo: ServiceOrderRepository,
        line_repo: UserLineAccountRepository,
        user_repo: UserRepository,
        notification_gateway: Arc<dyn NotificationGateway + Send + Sync>,
    ) -> Self {
        Self {
            order_repo,
            line_repo,
            user_repo,
            notification_gateway,
        }
    }

    pub async fn execute(
        &self,
        command: UpdateOrderStatusCommand,
        user_id: i32,
        role: Role,
    ) -> Result<ServiceOrder, String> {
        let mut order = self
            .order_repo
            .find_by_id(command.order_id)
            .await?
            .ok_or("Order not found")?;

        // RBAC Checks
        match role {
            Role::Customer => {
                if order.customer_id != user_id {
                    return Err("Access denied: Not your order".into());
                }

                match command.status {
                    OrderStatus::Repairing => {
                        if order.status != OrderStatus::OfferSent {
                            return Err(
                                "You can only confirm an order that has a price offer".into()
                            );
                        }
                    }
                    OrderStatus::Cancelled => {
                        if order.status == OrderStatus::Repairing
                            || order.status == OrderStatus::Completed
                            || order.status == OrderStatus::Paid
                        {
                            return Err(
                                "Cannot cancel an order that is in progress or completed".into()
                            );
                        }
                    }
                    _ => {
                        return Err("Customers can only confirm offers or cancel bookings".into());
                    }
                }
            }
            Role::Mechanic => {
                // Mechanics can't send final price offers (must be Admin)
                if command.status == OrderStatus::OfferSent {
                    return Err(
                        "Only admins can send price offers. Please send for review instead.".into(),
                    );
                }

                // Mechanics cannot mark as Paid
                if command.status == OrderStatus::Paid {
                    return Err("Mechanics cannot mark an order as Paid. Only the system or admin can do this.".into());
                }

                // Disallow moving back to Booked or ReviewPending once repairing has started
                if order.status == OrderStatus::Repairing
                    && (command.status == OrderStatus::Booked
                        || command.status == OrderStatus::ReviewPending)
                {
                    return Err(
                        "Cannot move order back to booking/review once repair has started.".into(),
                    );
                }
            }
            Role::Admin => {
                // Even admins should be careful about marking as Paid manually
                // For now allow it for flexibility (e.g. cash payment), but could be restricted
            }
        }

        // Global check: Everyone (except Admin/System) must follow the state machine
        if command.status == OrderStatus::Paid && role != Role::Admin {
            return Err("Unauthorized to set Paid status manually".into());
        }

        let old_status = order.status;
        order.status = command.status;

        if let Some(price) = command.total_price {
            order.total_price = price;
        }

        let updated_order = self.order_repo.update_order(order).await?;

        // Only send notification if status has changed
        if old_status != updated_order.status {
            let status_text = match updated_order.status {
                OrderStatus::Booked => "Booked",
                OrderStatus::ReviewPending => "Review Pending",
                OrderStatus::OfferSent => "Price Offer Sent",
                OrderStatus::Repairing => "Under Repair",
                OrderStatus::Completed => "Ready for Pickup",
                OrderStatus::Cancelled => "Cancelled",
                OrderStatus::Paid => "Paid",
            };

            let status_color = match updated_order.status {
                OrderStatus::ReviewPending => "#8b5cf6", // Violet
                OrderStatus::OfferSent => "#6366f1",     // Indigo
                OrderStatus::Repairing => "#f59e0b",     // Amber
                OrderStatus::Completed => "#10b981",     // Emerald
                OrderStatus::Paid => "#3b82f6",          // Blue
                OrderStatus::Cancelled => "#ef4444",     // Red
                _ => "#6b7280",                          // Gray
            };

            let flex_payload =
                self.create_flex_message(&updated_order, "ORDER UPDATE", status_text, status_color);

            // 1. Notify Customer
            let customer_line_id = self
                .line_repo
                .find_by_user_id(updated_order.customer_id)
                .await
                .ok()
                .flatten()
                .map(|l| l.line_user_id)
                .unwrap_or_default();

            let body = match updated_order.status {
                OrderStatus::Completed => format!(
                    "✅ [เสร็จสมบูรณ์] รถของคุณสำหรับออเดอร์ #{} ซ่อมเสร็จเรียบร้อยแล้ว! สามารถมารับรถได้เลยครับ",
                    updated_order.id.unwrap()
                ),
                OrderStatus::Repairing => format!(
                    "🔧 [กำลังซ่อม] ออเดอร์ #{} เริ่มดำเนินการซ่อมโดยช่างแล้วครับ",
                    updated_order.id.unwrap()
                ),
                OrderStatus::OfferSent => format!(
                    "💰 [เสนอราคา] ออเดอร์ #{} ประเมินราคาเสร็จแล้ว: ฿{} โปรดตรวจสอบและยืนยันเพื่อเริ่มการซ่อมครับ",
                    updated_order.id.unwrap(),
                    updated_order.total_price
                ),
                OrderStatus::ReviewPending => format!(
                    "🔍 [ตรวจสอบ] ออเดอร์ #{} อยู่ในระหว่างการตรวจสอบสภาพโดยช่างและรอแอดมินส่งใบเสนอราคาครับ",
                    updated_order.id.unwrap()
                ),
                OrderStatus::Cancelled => format!(
                    "❌ [ยกเลิก] ออเดอร์ #{} ของคุณถูกยกเลิกแล้ว",
                    updated_order.id.unwrap()
                ),
                _ => format!(
                    "ℹ️ ออเดอร์ #{} เปลี่ยนสถานะเป็น: {}",
                    updated_order.id.unwrap(),
                    status_text
                ),
            };

            let _ = self
                .notification_gateway
                .send_notification(NotificationMessage {
                    user_id: updated_order.customer_id,
                    order_id: updated_order.id,
                    recipient: customer_line_id,
                    title: format!("Service Update: #{}", updated_order.id.unwrap()),
                    body,
                    custom_payload: Some(flex_payload.clone()),
                })
                .await;

            // 2. Notify Admins
            if let Ok(admins) = self.user_repo.find_admins().await {
                for admin in admins {
                    if let Some(admin_id) = admin.id {
                        // Don't notify the person who made the change if they are an admin
                        if admin_id == user_id {
                            continue;
                        }

                        let admin_line_id = self
                            .line_repo
                            .find_by_user_id(admin_id)
                            .await
                            .ok()
                            .flatten()
                            .map(|l| l.line_user_id)
                            .unwrap_or_default();

                        let body = match updated_order.status {
                            OrderStatus::ReviewPending => format!(
                                "Order #{} is pending review. Please verify items and send price offer.",
                                updated_order.id.unwrap()
                            ),
                            _ => format!(
                                "Order #{} status updated to: {}.",
                                updated_order.id.unwrap(),
                                status_text
                            ),
                        };

                        let _ = self
                            .notification_gateway
                            .send_notification(NotificationMessage {
                                user_id: admin_id,
                                order_id: updated_order.id,
                                recipient: admin_line_id,
                                title: format!(
                                    "Admin: Order Update #{}",
                                    updated_order.id.unwrap()
                                ),
                                body,
                                custom_payload: Some(flex_payload.clone()),
                            })
                            .await;
                    }
                }
            }

            // 3. Notify Mechanics
            if let Ok(mechanics) = self.user_repo.find_mechanics().await {
                for mechanic in mechanics {
                    if let Some(mech_id) = mechanic.id {
                        // Don't notify the person who made the change
                        if mech_id == user_id {
                            continue;
                        }

                        let mech_line_id = self
                            .line_repo
                            .find_by_user_id(mech_id)
                            .await
                            .ok()
                            .flatten()
                            .map(|l| l.line_user_id)
                            .unwrap_or_default();

                        let body = match updated_order.status {
                            OrderStatus::Repairing => format!(
                                "Order #{} has been confirmed by customer. You can start the repair.",
                                updated_order.id.unwrap()
                            ),
                            _ => format!(
                                "Order #{} status updated to: {}.",
                                updated_order.id.unwrap(),
                                status_text
                            ),
                        };

                        let _ = self
                            .notification_gateway
                            .send_notification(NotificationMessage {
                                user_id: mech_id,
                                order_id: updated_order.id,
                                recipient: mech_line_id,
                                title: format!(
                                    "Mechanic: Order Update #{}",
                                    updated_order.id.unwrap()
                                ),
                                body,
                                custom_payload: Some(flex_payload.clone()),
                            })
                            .await;
                    }
                }
            }
        }

        Ok(updated_order)
    }
    fn create_flex_message(
        &self,
        order: &ServiceOrder,
        title: &str,
        status_text: &str,
        status_color: &str,
    ) -> serde_json::Value {
        serde_json::json!({
            "type": "flex",
            "altText": format!("{}: #{}", title, order.id.unwrap()),
            "contents": {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": title,
                            "weight": "bold",
                            "color": status_color,
                            "size": "sm"
                        }
                    ]
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": format!("Order #{}", order.id.unwrap()),
                            "weight": "bold",
                            "size": "xl"
                        },
                        {
                            "type": "box",
                            "layout": "vertical",
                            "margin": "lg",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "box",
                                    "layout": "baseline",
                                    "spacing": "sm",
                                    "contents": [
                                        {
                                            "type": "text",
                                            "text": "Status",
                                            "color": "#aaaaaa",
                                            "size": "sm",
                                            "flex": 1
                                        },
                                        {
                                            "type": "text",
                                            "text": status_text,
                                            "wrap": true,
                                            "color": "#666666",
                                            "size": "sm",
                                            "flex": 4
                                        }
                                    ]
                                },
                                {
                                    "type": "box",
                                    "layout": "baseline",
                                    "spacing": "sm",
                                    "contents": [
                                        {
                                            "type": "text",
                                            "text": "Total",
                                            "color": "#aaaaaa",
                                            "size": "sm",
                                            "flex": 1
                                        },
                                        {
                                            "type": "text",
                                            "text": format!("฿{}", order.total_price),
                                            "wrap": true,
                                            "color": "#666666",
                                            "size": "sm",
                                            "flex": 4
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        })
    }
}
