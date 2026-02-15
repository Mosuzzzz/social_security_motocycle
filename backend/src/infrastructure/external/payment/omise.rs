use crate::domain::payment::gateway::{PaymentGateway, PaymentResult, PaymentStatus};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;

pub struct OmiseGateway {
    client: Client,
    secret_key: String,
    base_url: String,
}

#[derive(Serialize)]
struct OmiseChargeRequest {
    amount: i64,
    currency: String,
    card: String,
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct OmiseChargeResponse {
    id: String,
    status: String,
    paid: bool,
    amount: i64,
    currency: String,
    failure_message: Option<String>,
}

impl OmiseGateway {
    pub fn new() -> Self {
        let secret_key = env::var("OMISE_SECRET_KEY").expect("OMISE_SECRET_KEY must be set");
        let base_url =
            env::var("OMISE_BASE_URL").unwrap_or_else(|_| "https://api.omise.co".to_string());

        Self {
            client: Client::new(),
            secret_key,
            base_url,
        }
    }
}

#[async_trait]
impl PaymentGateway for OmiseGateway {
    async fn charge(
        &self,
        amount: f64,
        currency: String,
        token: String,
    ) -> Result<PaymentResult, String> {
        // Omise expects amount in cents (integer)
        let amount_cents = (amount * 100.0) as i64;

        let request = OmiseChargeRequest {
            amount: amount_cents,
            currency: currency.clone(),
            card: token,
        };

        let response = self
            .client
            .post(&format!("{}/charges", self.base_url))
            .basic_auth(&self.secret_key, Some(""))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Omise API error: {} - {}", status, error_text));
        }

        let charge_data: OmiseChargeResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let status = match charge_data.status.as_str() {
            "successful" => PaymentStatus::Successful,
            "failed" => PaymentStatus::Failed,
            "pending" => PaymentStatus::Pending,
            _ => PaymentStatus::Pending, // Default fallback
        };

        // Convert cents back to main currency unit
        let amount_float = (charge_data.amount as f64) / 100.0;

        Ok(PaymentResult {
            transaction_id: charge_data.id,
            amount: amount_float,
            currency: charge_data.currency,
            status,
        })
    }
}
