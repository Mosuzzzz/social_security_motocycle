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
    pub daily_stats: Vec<DailyStat>,
}

#[derive(Debug, Serialize)]
pub struct DailyStat {
    pub date: String,
    pub order_count: usize,
    pub revenue: f64,
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

    pub async fn execute(&self, days: Option<i64>) -> Result<DashboardStatsResult, String> {
        let all_orders = self.order_repo.list_orders().await?;

        let cutoff_date = days.map(|d| chrono::Utc::now() - chrono::Duration::days(d));
        let orders: Vec<_> = all_orders
            .into_iter()
            .filter(|o| {
                if let Some(cutoff) = cutoff_date {
                    if let Some(created_at) = o.created_at {
                        created_at >= cutoff
                    } else {
                        true
                    }
                } else {
                    true
                }
            })
            .collect();

        let users = self.user_repo.list_users().await?;
        let motorcycles = self.motorcycle_repo.find_all().await?;

        let mut total_revenue = 0.0;
        let mut status_distribution = HashMap::new();
        let mut brand_distribution = HashMap::new();
        let mut daily_map: HashMap<String, (usize, f64)> = HashMap::new();

        for order in &orders {
            let date_key = order
                .created_at
                .map(|dt| dt.format("%Y-%m-%d").to_string())
                .unwrap_or_else(|| "Unknown".to_string());

            let day_entry = daily_map.entry(date_key).or_insert((0, 0.0));
            day_entry.0 += 1;

            if order.status == OrderStatus::Paid {
                total_revenue += order.total_price;
                day_entry.1 += order.total_price;
            }

            let status_key = format!("{:?}", order.status);
            *status_distribution.entry(status_key).or_insert(0) += 1;
        }

        for bike in motorcycles {
            *brand_distribution.entry(bike.brand).or_insert(0) += 1;
        }

        let mut daily_stats: Vec<DailyStat> = daily_map
            .into_iter()
            .map(|(date, (order_count, revenue))| DailyStat {
                date,
                order_count,
                revenue,
            })
            .collect();

        // Sort by date ascending
        daily_stats.sort_by(|a, b| a.date.cmp(&b.date));

        Ok(DashboardStatsResult {
            total_revenue,
            total_orders: orders.len(),
            total_users: users.len(),
            status_distribution,
            brand_distribution,
            daily_stats,
        })
    }
}
