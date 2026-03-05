use crate::infrastructure::db::connection::DbPool;
use crate::infrastructure::db::models::{NewServiceItem, ServiceOrderModel, StockItemModel};
use crate::infrastructure::db::schema::{service_items, service_orders, stock_items};
use bigdecimal::{BigDecimal, FromPrimitive};
use diesel::prelude::*;

#[derive(Clone)]
pub struct InventoryRepository {
    pool: DbPool,
}

impl InventoryRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn use_stock_item(
        &self,
        order_id: i32,
        stock_item_id: i32,
        quantity: i32,
    ) -> Result<(), String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        conn.transaction::<_, diesel::result::Error, _>(|conn| {
            // 1. Get stock item and check availability (FOR UPDATE to lock the row)
            let stock_item = stock_items::table
                .find(stock_item_id)
                .for_update()
                .first::<StockItemModel>(conn)?;

            if stock_item.quantity < quantity {
                return Err(diesel::result::Error::RollbackTransaction);
            }

            // 2. Decrease stock quantity
            diesel::update(stock_items::table.find(stock_item_id))
                .set(stock_items::quantity.eq(stock_items::quantity - quantity))
                .execute(conn)?;

            // 3. Calculate price
            let item_price_f64 = stock_item.price.to_string().parse::<f64>().unwrap_or(0.0);
            let total_item_price_f64 = item_price_f64 * (quantity as f64);
            let total_item_price_bd =
                BigDecimal::from_f64(total_item_price_f64).unwrap_or_else(|| BigDecimal::from(0));

            // 4. Add service item to the order
            let new_service_item = NewServiceItem {
                order_id,
                description: format!("{} (x{})", stock_item.name, quantity),
                price: total_item_price_bd.clone(),
                stock_item_id: Some(stock_item_id),
                quantity,
            };

            diesel::insert_into(service_items::table)
                .values(&new_service_item)
                .execute(conn)?;

            // 5. Update order total price
            let order = service_orders::table
                .find(order_id)
                .first::<ServiceOrderModel>(conn)?;

            diesel::update(service_orders::table.find(order_id))
                .set(service_orders::total_price.eq(order.total_price + total_item_price_bd))
                .execute(conn)?;

            Ok(())
        })
        .map_err(|e| match e {
            diesel::result::Error::RollbackTransaction => "Not enough items in stock".to_string(),
            _ => e.to_string(),
        })?;

        Ok(())
    }

    pub async fn remove_service_item(&self, item_id: i32) -> Result<(), String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        conn.transaction::<_, diesel::result::Error, _>(|conn| {
            // 1. Get the service item
            let item = service_items::table
                .find(item_id)
                .first::<crate::infrastructure::db::models::ServiceItemModel>(conn)?;

            // 2. If it has a stock_item_id, refund the stock
            if let Some(stock_id) = item.stock_item_id {
                diesel::update(stock_items::table.find(stock_id))
                    .set(stock_items::quantity.eq(stock_items::quantity + item.quantity))
                    .execute(conn)?;
            }

            // 3. Update order total price
            let order = service_orders::table
                .find(item.order_id)
                .first::<ServiceOrderModel>(conn)?;

            diesel::update(service_orders::table.find(item.order_id))
                .set(service_orders::total_price.eq(order.total_price - item.price))
                .execute(conn)?;

            // 4. Delete the service item
            diesel::delete(service_items::table.find(item_id)).execute(conn)?;

            Ok(())
        })
        .map_err(|e| e.to_string())?;

        Ok(())
    }
}
