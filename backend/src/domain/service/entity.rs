use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderStatus {
    Booked,
    ReviewPending,
    OfferSent,
    Repairing,
    Completed,
    Cancelled,
    Paid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceItem {
    pub id: Option<i32>,
    pub order_id: i32,
    pub description: String,
    pub price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceOrder {
    pub id: Option<i32>,
    pub bike_id: i32,
    pub customer_id: i32,
    pub status: OrderStatus,
    pub total_price: f64,
    pub items: Vec<ServiceItem>,
}

impl ServiceOrder {
    pub fn new_booking(bike_id: i32, customer_id: i32) -> Self {
        Self {
            id: None,
            bike_id,
            customer_id,
            status: OrderStatus::Booked,
            total_price: 0.0,
            items: Vec::new(),
        }
    }

    pub fn start_repair(&mut self) -> Result<(), &'static str> {
        if self.status != OrderStatus::Booked {
            return Err("Order must be booked to start repair");
        }
        self.status = OrderStatus::Repairing;
        Ok(())
    }

    pub fn complete_repair(&mut self) -> Result<(), &'static str> {
        if self.status != OrderStatus::Repairing {
            return Err("Order must be repairing to complete");
        }
        // Additional check: Ensure payment is made? Or maybe payment is handled separately
        self.status = OrderStatus::Completed;
        Ok(())
    }

    pub fn cancel(&mut self) -> Result<(), &'static str> {
        if self.status == OrderStatus::Completed {
            return Err("Cannot cancel completed order");
        }
        self.status = OrderStatus::Cancelled;
        Ok(())
    }
}
