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
                OrderStatus::Booked => "📋 รอการตรวจสอบ",
                OrderStatus::ReviewPending => "🔍 ช่างกำลังตรวจสอบ",
                OrderStatus::OfferSent => "💰 มีใบเสนอราคา รอยืนยัน",
                OrderStatus::Repairing => "🔧 อยู่ระหว่างซ่อม",
                OrderStatus::Completed => "✅ ซ่อมเสร็จ พร้อมรับรถ",
                OrderStatus::Cancelled => "❌ ยกเลิกแล้ว",
                OrderStatus::Paid => "💳 ชำระเงินแล้ว",
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

            let (customer_title, customer_body, _customer_alt) = match updated_order.status {
                OrderStatus::Completed => (
                    format!("✅ รถซ่อมเสร็จแล้ว! | #SO-{}", updated_order.id.unwrap()),
                    format!(
                        "รถของคุณสำหรับออเดอร์ #SO-{} ซ่อมเสร็จเรียบร้อยแล้ว!\nสามารถมารับรถได้เลยครับ 🛵",
                        updated_order.id.unwrap()
                    ),
                    format!(
                        "✅ ซ่อมเสร็จ! ออเดอร์ #SO-{}\nรถของคุณพร้อมรับแล้ว มารับได้เลยครับ!",
                        updated_order.id.unwrap()
                    ),
                ),
                OrderStatus::Repairing => (
                    format!("🔧 เริ่มซ่อมรถแล้ว | #SO-{}", updated_order.id.unwrap()),
                    format!(
                        "ออเดอร์ #SO-{} เริ่มดำเนินการซ่อมโดยช่างแล้วครับ\nเราจะแจ้งเมื่อซ่อมเสร็จ",
                        updated_order.id.unwrap()
                    ),
                    format!(
                        "🔧 ออเดอร์ #SO-{} เริ่มซ่อมแล้ว!\nช่างของเราเริ่มดำเนินการแล้ว จะแจ้งเมื่อเสร็จครับ",
                        updated_order.id.unwrap()
                    ),
                ),
                OrderStatus::OfferSent => (
                    format!("💰 ใบเสนอราคา | #SO-{}", updated_order.id.unwrap()),
                    format!(
                        "ออเดอร์ #SO-{} มีใบเสนอราคามาแล้ว ฿{}\nกรุณาตรวจสอบและยืนยันเพื่อเริ่มการซ่อมครับ",
                        updated_order.id.unwrap(),
                        updated_order.total_price
                    ),
                    format!(
                        "💰 มีใบเสนอราคา! ออเดอร์ #SO-{}\nราคาค่าซ่อม: ฿{}\nกรุณาตรวจสอบและยืนยันครับ",
                        updated_order.id.unwrap(),
                        updated_order.total_price
                    ),
                ),
                OrderStatus::ReviewPending => (
                    format!("🔍 ช่างกำลังตรวจสอบ | #SO-{}", updated_order.id.unwrap()),
                    format!(
                        "ออเดอร์ #SO-{} อยู่ในระหว่างการตรวจสอบสภาพโดยช่าง\nเราจะแจ้งราคาค่าซ่อมให้ทราบเร็ว ๆ นี้ครับ",
                        updated_order.id.unwrap()
                    ),
                    format!(
                        "🔍 ช่างกำลังตรวจสอบรถ! ออเดอร์ #SO-{}\nรอใบเสนอราคา เราจะแจ้งให้ทราบเร็ว ๆ นี้ครับ",
                        updated_order.id.unwrap()
                    ),
                ),
                OrderStatus::Cancelled => (
                    format!("❌ ยกเลิกออเดอร์ | #SO-{}", updated_order.id.unwrap()),
                    format!(
                        "ออเดอร์ #SO-{} ของคุณถูกยกเลิกแล้ว\nหากมีข้อสงสัยกรุณาติดต่อเจ้าหน้าที่ครับ",
                        updated_order.id.unwrap()
                    ),
                    format!(
                        "❌ ยกเลิกออเดอร์ #SO-{}\nหากมีปัญหา กรุณาติดต่อเจ้าหน้าที่ครับ",
                        updated_order.id.unwrap()
                    ),
                ),
                _ => (
                    format!("📋 อัพเดตสถานะ | #SO-{}", updated_order.id.unwrap()),
                    format!(
                        "ออเดอร์ #SO-{} อัพเดตสถานะเป็น: {}",
                        updated_order.id.unwrap(),
                        status_text
                    ),
                    format!(
                        "ออเดอร์ #SO-{} เปลี่ยนสถานะ: {}",
                        updated_order.id.unwrap(),
                        status_text
                    ),
                ),
            };

            let _ = self
                .notification_gateway
                .send_notification(NotificationMessage {
                    user_id: updated_order.customer_id,
                    order_id: updated_order.id,
                    recipient: customer_line_id,
                    title: customer_title,
                    body: customer_body,
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

                        let admin_body = match updated_order.status {
                            OrderStatus::ReviewPending => format!(
                                "⚠️ ออเดอร์ #SO-{} รอการตรวจสอบ\nกรุณาตรวจสอบรายการและส่งใบเสนอราคาครับ",
                                updated_order.id.unwrap()
                            ),
                            OrderStatus::Completed => format!(
                                "✅ ออเดอร์ #SO-{} ซ่อมเสร็จสมบูรณ์\nราคา: ฿{}",
                                updated_order.id.unwrap(),
                                updated_order.total_price
                            ),
                            OrderStatus::Cancelled => {
                                format!("❌ ออเดอร์ #SO-{} ถูกยกเลิกแล้ว", updated_order.id.unwrap())
                            }
                            _ => format!(
                                "📋 ออเดอร์ #SO-{} อัพเดตสถานะ: {}\nราคา: ฿{}",
                                updated_order.id.unwrap(),
                                status_text,
                                updated_order.total_price
                            ),
                        };

                        let _ = self
                            .notification_gateway
                            .send_notification(NotificationMessage {
                                user_id: admin_id,
                                order_id: updated_order.id,
                                recipient: admin_line_id,
                                title: format!(
                                    "🔔 อัพเดตออเดอร์ | #SO-{}",
                                    updated_order.id.unwrap()
                                ),
                                body: admin_body,
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

                        let mech_body = match updated_order.status {
                            OrderStatus::Repairing => format!(
                                "🔧 ออเดอร์ #SO-{} ลูกค้ายืนยันซ่อมแล้ว!\nสามารถเริ่มดำเนินการซ่อมได้เลยครับ",
                                updated_order.id.unwrap()
                            ),
                            OrderStatus::Cancelled => {
                                format!("❌ ออเดอร์ #SO-{} ถูกยกเลิกแล้ว", updated_order.id.unwrap())
                            }
                            _ => format!(
                                "📋 ออเดอร์ #SO-{} อัพเดตสถานะ: {}",
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
                                    "🔧 อัพเดตงานซ่อม | #SO-{}",
                                    updated_order.id.unwrap()
                                ),
                                body: mech_body,
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
                            "text": "Pragunการซ่อม",
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
