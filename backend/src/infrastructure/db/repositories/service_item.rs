use crate::domain::service::entity::ServiceItem;
use crate::infrastructure::db::connection::DbPool;
use crate::infrastructure::db::models::{NewServiceItem, ServiceItemModel};
use crate::infrastructure::db::schema::service_items;
use bigdecimal::{BigDecimal, FromPrimitive};
use diesel::prelude::*;

#[derive(Clone)]
pub struct ServiceItemRepository {
    pool: DbPool,
}

impl ServiceItemRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn add_item(&self, item: ServiceItem) -> Result<ServiceItem, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let price = BigDecimal::from_f64(item.price).ok_or("Invalid price")?;

        let new_item = NewServiceItem {
            order_id: item.order_id,
            description: item.description,
            price,
            stock_item_id: item.stock_item_id,
            quantity: item.quantity,
        };

        let result = diesel::insert_into(service_items::table)
            .values(&new_item)
            .returning(ServiceItemModel::as_returning())
            .get_result::<ServiceItemModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(self.map_model_to_entity(result))
    }

    pub async fn list_items_for_order(
        &self,
        order_id_val: i32,
    ) -> Result<Vec<ServiceItem>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let results = service_items::table
            .filter(service_items::order_id.eq(order_id_val))
            .select(ServiceItemModel::as_select())
            .load::<ServiceItemModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(results
            .into_iter()
            .map(|model| self.map_model_to_entity(model))
            .collect())
    }

    fn map_model_to_entity(&self, model: ServiceItemModel) -> ServiceItem {
        let price = model.price.to_string().parse::<f64>().unwrap_or(0.0);

        ServiceItem {
            id: Some(model.item_id),
            order_id: model.order_id,
            description: model.description,
            price,
            stock_item_id: model.stock_item_id,
            quantity: model.quantity,
        }
    }
}
