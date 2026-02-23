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
            id
        } else {
            let brand = command.brand.ok_or("Brand is required for new bike")?;
            let model = command.model.ok_or("Model is required for new bike")?;
            let license = command
                .license_plate
                .ok_or("License plate is required for new bike")?;

            let bike = self
                .bike_repository
                .create_motorcycle(brand, model, license, customer_id)
                .await?;
            bike.bike_id
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
                            title: format!("New Booking 📝 #{}", order_id),
                            body: format!(
                                "New order booked by customer{}. Issue: {}",
                                walk_in_info, problem
                            ),
                            custom_payload: None,
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
                            title: format!("New Service Task #{}", order_id),
                            body: format!(
                                "A new order has been created{}. Problem: {}",
                                walk_in_info, problem
                            ),
                            custom_payload: None,
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
                title: "Booking Confirmed 📝".to_string(),
                body: format!(
                    "📝 [จองสำเร็จ] ขอบคุณที่ใช้บริการ! ออเดอร์ #{} ของคุณถูกเปิดแล้ว ระบบจะแจ้งให้ทราบเมื่อช่างเริ่มตรวจสอบรถครับ",
                    order_id
                ),
                custom_payload: None,
            })
            .await;

        Ok(CreateServiceOrderResult {
            order_id,
            status: created_order.status,
            total_price: created_order.total_price,
        })
    }
}
