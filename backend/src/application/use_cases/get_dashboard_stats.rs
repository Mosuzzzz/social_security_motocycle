use crate::domain::service::entity::OrderStatus;
use crate::infrastructure::db::repositories::motorcycle::MotorcycleRepository;
use crate::infrastructure::db::repositories::service_order::ServiceOrderRepository;
use crate::infrastructure::db::repositories::user::UserRepository;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Serialize)]
pub struct DashboardStatsResult {
    pub total_revenue: f64,
    pub total_orders: usize,
    pub total_users: usize,
    pub status_distribution: HashMap<String, usize>,
    pub brand_distribution: HashMap<String, usize>,
}

#[derive(Clone)]
pub struct GetDashboardStatsUseCase {
    order_repo: ServiceOrderRepository,
    user_repo: UserRepository,
    motorcycle_repo: MotorcycleRepository,
}

impl GetDashboardStatsUseCase {
    pub fn new(
        order_repo: ServiceOrderRepository,
        user_repo: UserRepository,
        motorcycle_repo: MotorcycleRepository,
    ) -> Self {
        Self {
            order_repo,
            user_repo,
            motorcycle_repo,
        }
    }

    pub async fn execute(&self) -> Result<DashboardStatsResult, String> {
        let orders = self.order_repo.list_orders().await?;
        let users = self.user_repo.list_users().await?;
        let motorcycles = self.motorcycle_repo.find_all().await?;

        let mut total_revenue = 0.0;
        let mut status_distribution = HashMap::new();
        let mut brand_distribution = HashMap::new();

        for order in &orders {
            if order.status == OrderStatus::Paid {
                total_revenue += order.total_price;
            }

            let status_key = format!("{:?}", order.status);
            *status_distribution.entry(status_key).or_insert(0) += 1;
        }

        for bike in motorcycles {
            *brand_distribution.entry(bike.brand).or_insert(0) += 1;
        }

        Ok(DashboardStatsResult {
            total_revenue,
            total_orders: orders.len(),
            total_users: users.len(),
            status_distribution,
            brand_distribution,
        })
    }
}
