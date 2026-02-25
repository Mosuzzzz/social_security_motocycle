use crate::domain::notification::gateway::{NotificationGateway, NotificationMessage};
use crate::domain::service::entity::{OrderStatus, ServiceOrder};
use crate::infrastructure::db::repositories::motorcycle::MotorcycleRepository;
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use crate::infrastructure::db::repositories::user::UserRepository;
use crate::infrastructure::db::repositories::user_line_account::UserLineAccountRepository;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Deserialize)]
pub struct CreateServiceOrderCommand {
    pub bike_id: Option<i32>,
    pub brand: Option<String>,
    pub model: Option<String>,
    pub license_plate: Option<String>,
    pub customer_id: Option<i32>,
    pub problem_description: Option<String>,
    pub walk_in_date: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateServiceOrderResult {
    pub order_id: i32,
    pub status: OrderStatus,
    pub total_price: f64,
}

#[derive(Clone)]
pub struct CreateServiceOrderUseCase {
    order_repository: ServiceOrderRepository,
    bike_repository: MotorcycleRepository,
    line_repo: UserLineAccountRepository,
    user_repo: UserRepository,
    notification_gateway: Arc<dyn NotificationGateway + Send + Sync>,
}

impl CreateServiceOrderUseCase {
    pub fn new(
        order_repository: ServiceOrderRepository,
        bike_repository: MotorcycleRepository,
        line_repo: UserLineAccountRepository,
        user_repo: UserRepository,
        notification_gateway: Arc<dyn NotificationGateway + Send + Sync>,
    ) -> Self {
        Self {
            order_repository,
            bike_repository,
            line_repo,
            user_repo,
            notification_gateway,
        }
    }

    pub async fn execute(
        &self,
        command: CreateServiceOrderCommand,
        creator_id: i32,
    ) -> Result<CreateServiceOrderResult, String> {
        // 1. Determine Customer ID
        let customer_id = command.customer_id.unwrap_or(creator_id);

        // 2. Determine or Create Bike ID
        let bike_id = if let Some(id) = command.bike_id {
            Some(id)
        } else if command.brand.is_some()
            && command.model.is_some()
            && command.license_plate.is_some()
        {
            let brand = command.brand.unwrap();
            let model = command.model.unwrap();
            let license = command.license_plate.unwrap();

            // Try to find existing bike for this user with same license
            let existing_bike = self
                .bike_repository
                .find_by_license_and_user(&license, customer_id)
                .await?;

            if let Some(bike) = existing_bike {
                Some(bike.bike_id)
            } else {
                let bike = self
                    .bike_repository
                    .create_motorcycle(brand, model, license, customer_id)
                    .await?;
                Some(bike.bike_id)
            }
        } else {
            None
        };

        // 3. Create Service Order
        let order = ServiceOrder {
            id: None,
            bike_id,
            customer_id,
            status: OrderStatus::Booked,
            total_price: 0.0,
            items: Vec::new(),
        };

        let created_order = self
            .order_repository
            .create_order(order, creator_id)
            .await?;

        // 4. Notify Admins and Mechanics
        let order_id = created_order.id.unwrap_or(0);
        let problem = command
            .problem_description
            .unwrap_or_else(|| "No description provided".to_string());

        let walk_in_info = command
            .walk_in_date
            .map(|d| format!(" (Walk-in: {})", d))
            .unwrap_or_default();

        // Notify Admins
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
                            order_id: Some(order_id),
                            recipient: admin_line_id,
                            title: format!("🔔 จองคิวซ่อมใหม่ | #SO-{}", order_id),
                            body: format!("Customer booked{}. Issue: {}", walk_in_info, problem),
                            custom_payload: Some(serde_json::json!({
                                "type": "flex",
                                "altText": format!("🔔 มีการจองใหม่! ออเดอร์ #SO-{} ปัญหา: {} กรุณาตรวจสอบและดำเนินการ", order_id, problem),
                                "contents": {
                                    "type": "bubble",
                                    "styles": {
                                        "header": { "backgroundColor": "#004B7E" }
                                    },
                                    "header": {
                                        "type": "box",
                                        "layout": "horizontal",
                                        "contents": [
                                            {
                                                "type": "box",
                                                "layout": "vertical",
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
                                                        "weight": "bold"
                                                    }
                                                ]
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
                                                "contents": [
                                                    { "type": "text", "text": "🔧 ปัญหา", "size": "sm", "color": "#888888", "flex": 2 },
                                                    { "type": "text", "text": problem.clone(), "size": "sm", "flex": 3, "wrap": true }
                                                ]
                                            },
                                            {
                                                "type": "box",
                                                "layout": "horizontal",
                                                "contents": [
                                                    { "type": "text", "text": "📅 นัดหมาย", "size": "sm", "color": "#888888", "flex": 2 },
                                                    { "type": "text", "text": if walk_in_info.is_empty() { "ไม่ระบุ".to_string() } else { walk_in_info.clone() }, "size": "sm", "flex": 3, "wrap": true }
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
                                                    "label": "ดูรายละเอียดคำสั่งซ่อม",
                                                    "uri": format!("https://localhost:3000/dashboard/orders/{}", order_id)
                                                }
                                            }
                                        ]
                                    }
                                }
                            })),
                        })
                        .await;
                }
            }
        }

        // Notify Mechanics
        if let Ok(mechanics) = self.user_repo.find_mechanics().await {
            for mechanic in mechanics {
                if let Some(mech_id) = mechanic.id {
                    let mech_line_id = self
                        .line_repo
                        .find_by_user_id(mech_id)
                        .await
                        .ok()
                        .flatten()
                        .map(|l| l.line_user_id)
                        .unwrap_or_default();

                    let _ = self
                        .notification_gateway
                        .send_notification(NotificationMessage {
                            user_id: mech_id,
                            order_id: Some(order_id),
                            recipient: mech_line_id,
                            title: format!("🔧 งานซ่อมใหม่ | #SO-{}", order_id),
                            body: format!("New order{}. Problem: {}", walk_in_info, problem),
                            custom_payload: Some(serde_json::json!({
                                "type": "flex",
                                "altText": format!("🔧 มีงานซ่อมใหม่สำหรับคุณ! ออเดอร์ #SO-{} ปัญหา: {} กรุณาตรวจสอบและเริ่มดำเนินการ", order_id, problem),
                                "contents": {
                                    "type": "bubble",
                                    "styles": {
                                        "header": { "backgroundColor": "#1a1a2e" }
                                    },
                                    "header": {
                                        "type": "box",
                                        "layout": "vertical",
                                        "contents": [
                                            { "type": "text", "text": "Pragunการซ่อม", "color": "#FFD700", "size": "xs", "weight": "bold" },
                                            { "type": "text", "text": format!("#SO-{}", order_id), "color": "#FFFFFF", "size": "xl", "weight": "bold" }
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
                                                "contents": [
                                                    { "type": "text", "text": "🔩 ปัญหา", "size": "sm", "color": "#888888", "flex": 2 },
                                                    { "type": "text", "text": problem.clone(), "size": "sm", "flex": 3, "wrap": true }
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
                                                    "label": "เปิดงานซ่อม",
                                                    "uri": format!("https://localhost:3000/dashboard/orders/{}", order_id)
                                                }
                                            }
                                        ]
                                    }
                                }
                            })),
                        })
                        .await;
                }
            }
        }

        // Notify Customer
        let customer_line_id = self
            .line_repo
            .find_by_user_id(customer_id)
            .await
            .ok()
            .flatten()
            .map(|l| l.line_user_id)
            .unwrap_or_default();

        let _ = self
            .notification_gateway
            .send_notification(NotificationMessage {
                user_id: customer_id,
                order_id: Some(order_id),
                recipient: customer_line_id,
                title: "📋 จองสำเร็จ | Pragunการซ่อม".to_string(),
                body: format!("ออเดอร์ #{} ของคุณถูกเปิดแล้ว", order_id),
                custom_payload: Some(serde_json::json!({
                    "type": "flex",
                    "altText": format!("Booking confirmed: #SO-{}", order_id),
                    "contents": {
                        "type": "bubble",
                        "header": {
                            "type": "box",
                            "layout": "vertical",
                            "backgroundColor": "#004B7E",
                            "contents": [
                                { "type": "text", "text": "✅ BOOKING SUCCESSFUL", "color": "#FFD700", "size": "xs", "weight": "bold" },
                                { "type": "text", "text": format!("#SO-{}", order_id), "color": "#FFFFFF", "size": "xl", "weight": "bold" }
                            ]
                        },
                        "body": {
                            "type": "box",
                            "layout": "vertical",
                            "spacing": "md",
                            "contents": [
                                { "type": "text", "text": "Thank you for choosing us! 🙏", "weight": "bold", "size": "md", "wrap": true },
                                { "type": "text", "text": "Our team will review your order and update you shortly.", "size": "sm", "color": "#666666", "wrap": true },
                                { "type": "box", "layout": "horizontal", "margin": "lg", "contents": [
                                    { "type": "text", "text": "Status", "size": "sm", "color": "#888888" },
                                    { "type": "text", "text": "📋 Booked", "size": "sm", "weight": "bold" }
                                ]}
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
                                    "action": { "type": "uri", "label": "View Order", "uri": format!("http://localhost:3000/dashboard/orders/{}", order_id) }
                                }
                            ]
                        }
                    }
                })),
            })
            .await;

        Ok(CreateServiceOrderResult {
            order_id,
            status: created_order.status,
            total_price: created_order.total_price,
        })
    }
}
