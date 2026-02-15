use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Price(f64);

impl Price {
    pub fn new(amount: f64) -> Result<Self, &'static str> {
        if amount < 0.0 {
            return Err("Price cannot be negative");
        }
        Ok(Self(amount))
    }

    pub fn amount(&self) -> f64 {
        self.0
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LicensePlate(String);

impl LicensePlate {
    pub fn new(plate: String) -> Result<Self, &'static str> {
        if plate.is_empty() {
            return Err("License plate cannot be empty");
        }
        // Add more validation rules as needed (e.g., regex for format)
        Ok(Self(plate))
    }

    pub fn value(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PasswordHash(String);

impl PasswordHash {
    pub fn new(hash: String) -> Self {
        Self(hash)
    }

    pub fn value(&self) -> &str {
        &self.0
    }
}
