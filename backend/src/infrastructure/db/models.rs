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
    ReviewPending,
    OfferSent,
    Repairing,
    Completed,
    Cancelled,
    Paid,
}

#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::db::schema::service_orders)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct ServiceOrderModel {
    pub order_id: i32,
    pub bike_id: Option<i32>,
    pub customer_id: i32,
    pub status: ServiceOrderStatusEnum,
    pub total_price: bigdecimal::BigDecimal, // Diesel uses BigDecimal for Numeric
    pub created_by: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub before_picture_url: Option<String>,
    pub after_picture_url: Option<String>,
}

#[derive(Insertable)]
#[diesel(table_name = crate::infrastructure::db::schema::service_orders)]
pub struct NewServiceOrder {
    pub bike_id: Option<i32>,
    pub customer_id: i32,
    pub status: ServiceOrderStatusEnum,
    pub total_price: bigdecimal::BigDecimal,
    pub created_by: i32,
    pub before_picture_url: Option<String>,
    pub after_picture_url: Option<String>,
}
#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::db::schema::motorcycles)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct MotorcycleModel {
    pub bike_id: i32,
    pub brand: String,
    pub model: String,
    pub license_plate: String,
    pub user_id: i32,
}

#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::db::schema::user_line_accounts)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UserLineAccountModel {
    pub id: i32,
    pub user_id: i32,
    pub line_user_id: String,
    pub linked_at: chrono::DateTime<chrono::Utc>,
    pub display_name: Option<String>,
    pub picture_url: Option<String>,
}

#[derive(Insertable)]
#[diesel(table_name = crate::infrastructure::db::schema::user_line_accounts)]
pub struct NewUserLineAccount {
    pub user_id: i32,
    pub line_user_id: String,
    pub display_name: Option<String>,
    pub picture_url: Option<String>,
}

#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::db::schema::service_items)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct ServiceItemModel {
    pub item_id: i32,
    pub order_id: i32,
    pub description: String,
    pub price: bigdecimal::BigDecimal,
}

#[derive(Insertable)]
#[diesel(table_name = crate::infrastructure::db::schema::service_items)]
pub struct NewServiceItem {
    pub order_id: i32,
    pub description: String,
    pub price: bigdecimal::BigDecimal,
}

#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::db::schema::stock_items)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct StockItemModel {
    pub item_id: i32,
    pub name: String,
    pub price: bigdecimal::BigDecimal,
    pub quantity: i32,
}

#[derive(Insertable)]
#[diesel(table_name = crate::infrastructure::db::schema::stock_items)]
pub struct NewStockItem<'a> {
    pub name: &'a str,
    pub price: bigdecimal::BigDecimal,
    pub quantity: i32,
}

#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::db::schema::refresh_tokens)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct RefreshTokenModel {
    pub token_id: i32,
    pub user_id: i32,
    pub token_value: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
    pub is_revoked: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Insertable)]
#[diesel(table_name = crate::infrastructure::db::schema::refresh_tokens)]
pub struct NewRefreshToken {
    pub user_id: i32,
    pub token_value: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

#[derive(DbEnum, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[ExistingTypePath = "crate::infrastructure::db::schema::sql_types::NotificationChannelEnum"]
pub enum NotificationChannelEnum {
    Line,
    Web,
    Sms,
}

#[derive(DbEnum, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[ExistingTypePath = "crate::infrastructure::db::schema::sql_types::NotificationStatusEnum"]
pub enum NotificationStatusEnum {
    Sent,
    Read,
    Failed,
}

#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::db::schema::notifications)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct NotificationModel {
    pub notification_id: i32,
    pub user_id: i32,
    pub order_id: i32,
    pub channel: NotificationChannelEnum,
    pub message: String,
    pub sent_at: chrono::DateTime<chrono::Utc>,
    pub status: NotificationStatusEnum,
}

#[derive(Insertable)]
#[diesel(table_name = crate::infrastructure::db::schema::notifications)]
pub struct NewNotification {
    pub user_id: i32,
    pub order_id: i32,
    pub channel: NotificationChannelEnum,
    pub message: String,
    pub status: NotificationStatusEnum,
}
#[derive(Queryable, Selectable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = crate::infrastructure::db::schema::feedbacks)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct FeedbackModel {
    pub feedback_id: i32,
    pub user_id: Option<i32>,
    pub name: String,
    pub email: String,
    pub phone: String,
    pub message: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Insertable)]
#[diesel(table_name = crate::infrastructure::db::schema::feedbacks)]
pub struct NewFeedback {
    pub user_id: Option<i32>,
    pub name: String,
    pub email: String,
    pub phone: String,
    pub message: String,
}
