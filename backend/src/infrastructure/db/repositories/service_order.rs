use crate::domain::service::entity::{OrderStatus, ServiceOrder};
use crate::infrastructure::db::connection::DbPool;
use crate::infrastructure::db::models::{
    NewServiceOrder, ServiceOrderModel, ServiceOrderStatusEnum,
};
use crate::infrastructure::db::schema::service_orders;
use bigdecimal::{BigDecimal, FromPrimitive};
use diesel::prelude::*;

#[derive(Clone)]
pub struct ServiceOrderRepository {
    pool: DbPool,
}

impl ServiceOrderRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_order(
        &self,
        order: ServiceOrder,
        creator_id: i32,
    ) -> Result<ServiceOrder, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let status_enum = match order.status {
            OrderStatus::Booked => ServiceOrderStatusEnum::Booked,
            OrderStatus::Repairing => ServiceOrderStatusEnum::Repairing,
            OrderStatus::Completed => ServiceOrderStatusEnum::Completed,
            OrderStatus::Cancelled => ServiceOrderStatusEnum::Cancelled,
            OrderStatus::Paid => ServiceOrderStatusEnum::Paid,
        };

        // Convert f64 to BigDecimal for DB
        let total_price = BigDecimal::from_f64(order.total_price).ok_or("Invalid price")?;

        let new_order = NewServiceOrder {
            bike_id: order.bike_id,
            customer_id: order.customer_id,
            status: status_enum,
            total_price,
            created_by: creator_id,
        };

        let result = diesel::insert_into(service_orders::table)
            .values(&new_order)
            .returning(ServiceOrderModel::as_returning())
            .get_result::<ServiceOrderModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(self.map_model_to_entity(result))
    }

    pub async fn find_by_id(&self, order_id: i32) -> Result<Option<ServiceOrder>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let result = service_orders::table
            .find(order_id)
            .select(ServiceOrderModel::as_select())
            .first::<ServiceOrderModel>(&mut conn)
            .optional()
            .map_err(|e| e.to_string())?;

        Ok(result.map(|model| self.map_model_to_entity(model)))
    }

    pub async fn update_order(&self, order: ServiceOrder) -> Result<ServiceOrder, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let order_id = order.id.ok_or("Order ID is required for update")?;

        let status_enum = match order.status {
            OrderStatus::Booked => ServiceOrderStatusEnum::Booked,
            OrderStatus::Repairing => ServiceOrderStatusEnum::Repairing,
            OrderStatus::Completed => ServiceOrderStatusEnum::Completed,
            OrderStatus::Cancelled => ServiceOrderStatusEnum::Cancelled,
            OrderStatus::Paid => ServiceOrderStatusEnum::Paid,
        };

        // Convert f64 to BigDecimal for DB
        let total_price = BigDecimal::from_f64(order.total_price).ok_or("Invalid price")?;

        let target = service_orders::table.find(order_id);

        let result = diesel::update(target)
            .set((
                service_orders::status.eq(status_enum),
                service_orders::total_price.eq(total_price),
                // Bike and Customer usually don't change for an order, but if needed we can add them.
                // Assuming status and price are main updatable fields.
            ))
            .returning(ServiceOrderModel::as_returning())
            .get_result::<ServiceOrderModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(self.map_model_to_entity(result))
    }

    pub async fn list_orders(&self) -> Result<Vec<ServiceOrder>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let results = service_orders::table
            .select(ServiceOrderModel::as_select())
            .load::<ServiceOrderModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(results
            .into_iter()
            .map(|model| self.map_model_to_entity(model))
            .collect())
    }

    pub async fn list_orders_for_customer(
        &self,
        customer_id: i32,
    ) -> Result<Vec<ServiceOrder>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let results = service_orders::table
            .filter(service_orders::customer_id.eq(customer_id))
            .select(ServiceOrderModel::as_select())
            .load::<ServiceOrderModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(results
            .into_iter()
            .map(|model| self.map_model_to_entity(model))
            .collect())
    }

    fn map_model_to_entity(&self, model: ServiceOrderModel) -> ServiceOrder {
        let status = match model.status {
            ServiceOrderStatusEnum::Booked => OrderStatus::Booked,
            ServiceOrderStatusEnum::Repairing => OrderStatus::Repairing,
            ServiceOrderStatusEnum::Completed => OrderStatus::Completed,
            ServiceOrderStatusEnum::Cancelled => OrderStatus::Cancelled,
            ServiceOrderStatusEnum::Paid => OrderStatus::Paid,
        };

        // Convert BigDecimal to f64
        // Handling BigDecimal to f64 conversion safely is tricky, but for now we parse string.
        let total_price = model.total_price.to_string().parse::<f64>().unwrap_or(0.0);

        ServiceOrder {
            id: Some(model.order_id),
            bike_id: model.bike_id,
            customer_id: model.customer_id,
            status,
            total_price,
        }
    }
}
