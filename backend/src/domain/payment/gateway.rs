use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentResult {
    pub transaction_id: String,
    pub amount: f64,
    pub currency: String,
    pub status: PaymentStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Successful,
    Failed,
}

#[async_trait]
pub trait PaymentGateway {
    async fn charge(
        &self,
        amount: f64,
        currency: String,
        token: String,
    ) -> Result<PaymentResult, String>;
}
