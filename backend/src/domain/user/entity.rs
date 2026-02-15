use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Role {
    Admin,
    Customer,
    Mechanic,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Option<i32>,
    pub username: String,
    pub password_hash: String, // This should be a ValueObject later
    pub name: String,
    pub phone: String,
    pub role: Role,
}

impl User {
    pub fn new_customer(
        username: String,
        password_hash: String,
        name: String,
        phone: String,
    ) -> Self {
        Self {
            id: None,
            username,
            password_hash,
            name,
            phone,
            role: Role::Customer,
        }
    }

    pub fn is_admin(&self) -> bool {
        matches!(self.role, Role::Admin)
    }

    pub fn is_mechanic(&self) -> bool {
        matches!(self.role, Role::Mechanic)
    }
}
