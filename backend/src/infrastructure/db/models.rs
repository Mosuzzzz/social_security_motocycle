use diesel::prelude::*;
use diesel_derive_enum::DbEnum;
use serde::{Deserialize, Serialize};

#[derive(DbEnum, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[ExistingTypePath = "crate::infrastructure::db::schema::sql_types::UserRole"]
pub enum UserRoleEnum {
    Admin,
    Customer,
    Mechanic,
}

#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::db::schema::users)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UserModel {
    pub user_id: i32,
    pub username: String,
    pub password_hash: String,
    pub name: String,
    pub phone: String,
    pub role: UserRoleEnum,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Insertable)]
#[diesel(table_name = crate::infrastructure::db::schema::users)]
pub struct NewUser<'a> {
    pub username: &'a str,
    pub password_hash: &'a str,
    pub name: &'a str,
    pub phone: &'a str,
    pub role: UserRoleEnum,
}

#[derive(DbEnum, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[ExistingTypePath = "crate::infrastructure::db::schema::sql_types::ServiceOrderStatus"]
pub enum ServiceOrderStatusEnum {
    Booked,
    Repairing,
    Completed,
    Cancelled,
}

#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::db::schema::service_orders)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct ServiceOrderModel {
    pub order_id: i32,
    pub bike_id: i32,
    pub customer_id: i32,
    pub status: ServiceOrderStatusEnum,
    pub total_price: bigdecimal::BigDecimal, // Diesel uses BigDecimal for Numeric
    pub created_by: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Insertable)]
#[diesel(table_name = crate::infrastructure::db::schema::service_orders)]
pub struct NewServiceOrder {
    pub bike_id: i32,
    pub customer_id: i32,
    pub status: ServiceOrderStatusEnum,
    pub total_price: bigdecimal::BigDecimal,
    pub created_by: i32,
}
