use crate::domain::notification::gateway::{NotificationGateway, NotificationMessage};
use crate::domain::service::entity::{OrderStatus, ServiceOrder};
use crate::domain::user::entity::Role;
use crate::infrastructure::db::repositories::repair_log::RepairLogRepository;
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
    repair_log_repo: RepairLogRepository,
}

impl UpdateOrderStatusUseCase {
    pub fn new(
        order_repo: ServiceOrderRepository,
        line_repo: UserLineAccountRepository,
        user_repo: UserRepository,
        notification_gateway: Arc<dyn NotificationGateway + Send + Sync>,
        repair_log_repo: RepairLogRepository,
    ) -> Self {
        Self {
            order_repo,
            line_repo,
            user_repo,
            notification_gateway,
            repair_log_repo,
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

                // Mechanics cannot Complete from Booked or OfferSent — must be Repairing first
                if (order.status == OrderStatus::Booked || order.status == OrderStatus::OfferSent)
                    && command.status == OrderStatus::Completed
                {
                    return Err(
                        "The order must be in Repairing status before it can be marked as Completed.".into(),
                    );
                }

                // Mechanics cannot Quick Start (Booked → Repairing) directly
                if order.status == OrderStatus::Booked && command.status == OrderStatus::Repairing {
                    return Err(
                        "Please submit the order for review before starting the repair.".into(),
                    );
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

        // 4. Log the repair trail
        let log_note = format!(
            "Status changed from {:?} to {:?} by {:?} (ID: {})",
            old_status, updated_order.status, role, user_id
        );
        let _ = self
            .repair_log_repo
            .add_log(
                updated_order.id.unwrap(),
                user_id,
                log_note,
                updated_order.status.clone().into(),
            )
            .await;

        // Only send notification if status has changed
        if old_status != updated_order.status {
            let status_text = match updated_order.status {
                OrderStatus::Booked => "📋 Review Pending",
                OrderStatus::ReviewPending => "🔍 Inspection in Progress",
                OrderStatus::OfferSent => "💰 Quote Sent - Awaiting Confirmation",
                OrderStatus::Repairing => "🔧 Repairing",
                OrderStatus::Completed => "✅ Repair Completed - Ready for Pickup",
                OrderStatus::Cancelled => "❌ Cancelled",
                OrderStatus::Paid => "💳 Paid",
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

            let self_clone = self.clone();
            let updated_order_clone = updated_order.clone();
            let status_text_str = status_text.to_string();
            let flex_payload =
                self.create_flex_message(&updated_order, "ORDER UPDATE", status_text, status_color);

            // Fire and forget notifications in background
            tokio::spawn(async move {
                // 1. Notify Customer
                let customer_line_id = self_clone
                    .line_repo
                    .find_by_user_id(updated_order_clone.customer_id)
                    .await
                    .ok()
                    .flatten()
                    .map(|l| l.line_user_id)
                    .unwrap_or_default();

                let (customer_title, customer_body, _customer_alt) = match updated_order_clone
                    .status
                {
                    OrderStatus::Completed => (
                        format!(
                            "✅ Repair Completed! | #SO-{}",
                            updated_order_clone.id.unwrap()
                        ),
                        format!(
                            "Your vehicle for order #SO-{} is ready for pickup! 🛵",
                            updated_order_clone.id.unwrap()
                        ),
                        format!(
                            "✅ Repair Completed! Order #SO-{}\nYour vehicle is ready for pickup!",
                            updated_order_clone.id.unwrap()
                        ),
                    ),
                    OrderStatus::Repairing => (
                        format!(
                            "🔧 Repair Started | #SO-{}",
                            updated_order_clone.id.unwrap()
                        ),
                        format!(
                            "Repair has started for order #SO-{}. We will notify you once it's finished.",
                            updated_order_clone.id.unwrap()
                        ),
                        format!(
                            "🔧 Order #SO-{} is now being repaired.\nOur mechanics have started. We'll notify you when done.",
                            updated_order_clone.id.unwrap()
                        ),
                    ),
                    OrderStatus::OfferSent => (
                        format!("💰 Repair Quote | #SO-{}", updated_order_clone.id.unwrap()),
                        format!(
                            "Quote for order #SO-{} is available: ฿{}.\nPlease confirm to start the repair.",
                            updated_order_clone.id.unwrap(),
                            updated_order_clone.total_price
                        ),
                        format!(
                            "💰 Quote Sent! Order #SO-{}\nPrice: ฿{}\nPlease check and confirm.",
                            updated_order_clone.id.unwrap(),
                            updated_order_clone.total_price
                        ),
                    ),
                    OrderStatus::ReviewPending => (
                        format!(
                            "🔍 Inspection in Progress | #SO-{}",
                            updated_order_clone.id.unwrap()
                        ),
                        format!(
                            "Order #SO-{} is currently being inspected by our mechanic.\nWe will provide a quote shortly.",
                            updated_order_clone.id.unwrap()
                        ),
                        format!(
                            "🔍 Inspection started for #SO-{}\nWait for our quote. We'll notify you soon.",
                            updated_order_clone.id.unwrap()
                        ),
                    ),
                    OrderStatus::Cancelled => (
                        format!(
                            "❌ Order Cancelled | #SO-{}",
                            updated_order_clone.id.unwrap()
                        ),
                        format!(
                            "Order #SO-{} has been cancelled.\nPlease contact us if you have any questions.",
                            updated_order_clone.id.unwrap()
                        ),
                        format!(
                            "❌ Order #SO-{} cancelled.\nContact us if you have issues.",
                            updated_order_clone.id.unwrap()
                        ),
                    ),
                    _ => (
                        format!("📋 Status Update | #SO-{}", updated_order_clone.id.unwrap()),
                        format!(
                            "Order #SO-{} status updated to: {}",
                            updated_order_clone.id.unwrap(),
                            status_text_str
                        ),
                        format!(
                            "Order #SO-{} status changed: {}",
                            updated_order_clone.id.unwrap(),
                            status_text_str
                        ),
                    ),
                };

                let _ = self_clone
                    .notification_gateway
                    .send_notification(NotificationMessage {
                        user_id: updated_order_clone.customer_id,
                        order_id: updated_order_clone.id,
                        recipient: customer_line_id,
                        title: customer_title,
                        body: customer_body,
                        custom_payload: Some(flex_payload.clone()),
                    })
                    .await;

                // 2. Notify Admins
                if let Ok(admins) = self_clone.user_repo.find_admins().await {
                    for admin in admins {
                        if let Some(admin_id) = admin.id {
                            // Don't notify the person who made the change if they are an admin
                            if admin_id == user_id {
                                continue;
                            }

                            let admin_line_id = self_clone
                                .line_repo
                                .find_by_user_id(admin_id)
                                .await
                                .ok()
                                .flatten()
                                .map(|l| l.line_user_id)
                                .unwrap_or_default();

                            let admin_body = match updated_order_clone.status {
                                OrderStatus::ReviewPending => format!(
                                    "⚠️ Order #SO-{} pending inspection.\nPlease review and send a quote.",
                                    updated_order_clone.id.unwrap()
                                ),
                                OrderStatus::Completed => format!(
                                    "✅ Order #SO-{} completed successfully.\nTotal Price: ฿{}",
                                    updated_order_clone.id.unwrap(),
                                    updated_order_clone.total_price
                                ),
                                OrderStatus::Cancelled => {
                                    format!(
                                        "❌ Order #SO-{} has been cancelled.",
                                        updated_order_clone.id.unwrap()
                                    )
                                }
                                _ => format!(
                                    "📋 Order #SO-{} Status Update: {}\nPrice: ฿{}",
                                    updated_order_clone.id.unwrap(),
                                    status_text_str,
                                    updated_order_clone.total_price
                                ),
                            };

                            let _ = self_clone
                                .notification_gateway
                                .send_notification(NotificationMessage {
                                    user_id: admin_id,
                                    order_id: updated_order_clone.id,
                                    recipient: admin_line_id,
                                    title: format!(
                                        "🔔 Order Update | #SO-{}",
                                        updated_order_clone.id.unwrap()
                                    ),
                                    body: admin_body,
                                    custom_payload: Some(flex_payload.clone()),
                                })
                                .await;
                        }
                    }
                }

                // 3. Notify Mechanics
                if let Ok(mechanics) = self_clone.user_repo.find_mechanics().await {
                    for mechanic in mechanics {
                        if let Some(mech_id) = mechanic.id {
                            // Don't notify the person who made the change
                            if mech_id == user_id {
                                continue;
                            }

                            let mech_line_id = self_clone
                                .line_repo
                                .find_by_user_id(mech_id)
                                .await
                                .ok()
                                .flatten()
                                .map(|l| l.line_user_id)
                                .unwrap_or_default();

                            let mech_body = match updated_order_clone.status {
                                OrderStatus::Repairing => format!(
                                    "🔧 Order #SO-{} customer confirmed!\nYou can start the repair now.",
                                    updated_order_clone.id.unwrap()
                                ),
                                OrderStatus::Cancelled => {
                                    format!(
                                        "❌ Order #SO-{} has been cancelled.",
                                        updated_order_clone.id.unwrap()
                                    )
                                }
                                _ => format!(
                                    "📋 Order #SO-{} Status Update: {}",
                                    updated_order_clone.id.unwrap(),
                                    status_text_str
                                ),
                            };

                            let _ = self_clone
                                .notification_gateway
                                .send_notification(NotificationMessage {
                                    user_id: mech_id,
                                    order_id: updated_order_clone.id,
                                    recipient: mech_line_id,
                                    title: format!(
                                        "🔧 Repair Update | #SO-{}",
                                        updated_order_clone.id.unwrap()
                                    ),
                                    body: mech_body,
                                    custom_payload: Some(flex_payload.clone()),
                                })
                                .await;
                        }
                    }
                }
            });
        }

        Ok(updated_order)
    }
    fn create_flex_message(
        &self,
        order: &ServiceOrder,
        _title: &str,
        status_text: &str,
        status_color: &str,
    ) -> serde_json::Value {
        let order_id = order.id.unwrap_or(0);
        let price_text = format!("฿{:.0}", order.total_price);
        let alt_text = format!("Update: #SO-{}", order_id);

        serde_json::json!({
            "type": "flex",
            "altText": alt_text,
            "contents": {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "backgroundColor": "#004B7E",
                    "contents": [
                        {
                            "type": "text",
                            "text": "MotoFlow Service",
                            "color": "#FFD700",
                            "size": "xs",
                            "weight": "bold"
                        },
                        {
                            "type": "text",
                            "text": format!("Order #SO-{}", order_id),
                            "color": "#FFFFFF",
                            "size": "xl",
                            "weight": "bold",
                            "margin": "sm"
                        }
                    ]
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "md",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "horizontal",
                            "backgroundColor": status_color,
                            "cornerRadius": "md",
                            "paddingAll": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": status_text,
                                    "color": "#FFFFFF",
                                    "size": "sm",
                                    "weight": "bold",
                                    "align": "center"
                                }
                            ]
                        },
                        {
                            "type": "box",
                            "layout": "horizontal",
                            "margin": "lg",
                            "contents": [
                                { "type": "text", "text": "Total Price", "size": "sm", "color": "#888888" },
                                { "type": "text", "text": price_text, "size": "sm", "weight": "bold", "align": "end" }
                            ]
                        }
                    ]
                },
                "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "button",
                            "style": "primary",
                            "color": "#004B7E",
                            "action": {
                                "type": "uri",
                                "label": "View Order",
                                "uri": format!("http://localhost:3000/dashboard/orders/{}", order_id)
                            }
                        }
                    ]
                }
            }
        })
    }
}
