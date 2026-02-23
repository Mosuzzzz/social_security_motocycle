use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockItem {
    pub id: Option<i32>,
    pub name: String,
    pub price: f64,
    pub quantity: i32,
}
