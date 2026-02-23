use crate::domain::service::stock_entity::StockItem;
use crate::infrastructure::db::connection::DbPool;
use crate::infrastructure::db::models::{NewStockItem, StockItemModel};
use crate::infrastructure::db::schema::stock_items;
use bigdecimal::{BigDecimal, FromPrimitive};
use diesel::prelude::*;

#[derive(Clone)]
pub struct StockItemRepository {
    pool: DbPool,
}

impl StockItemRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn create_stock_item(&self, item: StockItem) -> Result<StockItem, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let price = BigDecimal::from_f64(item.price).ok_or("Invalid price")?;

        let new_item = NewStockItem {
            name: &item.name,
            price,
            quantity: item.quantity,
        };

        let result = diesel::insert_into(stock_items::table)
            .values(&new_item)
            .returning(StockItemModel::as_returning())
            .get_result::<StockItemModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(self.map_model_to_entity(result))
    }

    pub async fn list_stock_items(&self) -> Result<Vec<StockItem>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let results = stock_items::table
            .select(StockItemModel::as_select())
            .load::<StockItemModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(results
            .into_iter()
            .map(|model| self.map_model_to_entity(model))
            .collect())
    }

    pub async fn find_by_id(&self, item_id_val: i32) -> Result<Option<StockItem>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let result = stock_items::table
            .find(item_id_val)
            .select(StockItemModel::as_select())
            .first::<StockItemModel>(&mut conn)
            .optional()
            .map_err(|e| e.to_string())?;

        Ok(result.map(|model| self.map_model_to_entity(model)))
    }

    pub async fn update_quantity(&self, item_id_val: i32, change: i32) -> Result<(), String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        diesel::update(stock_items::table.find(item_id_val))
            .set(stock_items::quantity.eq(stock_items::quantity + change))
            .execute(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn update_stock_item(&self, item: StockItem) -> Result<StockItem, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;
        let item_id = item.id.ok_or("Item ID required for update")?;
        let price = BigDecimal::from_f64(item.price).ok_or("Invalid price")?;

        let result = diesel::update(stock_items::table.find(item_id))
            .set((
                stock_items::name.eq(item.name),
                stock_items::price.eq(price),
                stock_items::quantity.eq(item.quantity),
            ))
            .returning(StockItemModel::as_returning())
            .get_result::<StockItemModel>(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(self.map_model_to_entity(result))
    }

    pub async fn delete_stock_item(&self, item_id_val: i32) -> Result<(), String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        diesel::delete(stock_items::table.find(item_id_val))
            .execute(&mut conn)
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    fn map_model_to_entity(&self, model: StockItemModel) -> StockItem {
        StockItem {
            id: Some(model.item_id),
            name: model.name,
            price: model.price.to_string().parse::<f64>().unwrap_or(0.0),
            quantity: model.quantity,
        }
    }
}
