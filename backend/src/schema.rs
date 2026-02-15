// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "notification_channel_enum"))]
    pub struct NotificationChannelEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "notification_status_enum"))]
    pub struct NotificationStatusEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "payment_status_enum"))]
    pub struct PaymentStatusEnum;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "service_order_status"))]
    pub struct ServiceOrderStatus;

    #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "user_role"))]
    pub struct UserRole;
}

diesel::table! {
    motorcycles (bike_id) {
        bike_id -> Int4,
        #[max_length = 255]
        brand -> Varchar,
        #[max_length = 255]
        model -> Varchar,
        #[max_length = 100]
        license_plate -> Varchar,
        user_id -> Int4,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::NotificationChannelEnum;
    use super::sql_types::NotificationStatusEnum;

    notifications (notification_id) {
        notification_id -> Int4,
        user_id -> Int4,
        order_id -> Int4,
        channel -> NotificationChannelEnum,
        message -> Text,
        sent_at -> Timestamptz,
        status -> NotificationStatusEnum,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::PaymentStatusEnum;

    payments (payment_id) {
        payment_id -> Int4,
        order_id -> Int4,
        amount -> Numeric,
        status -> PaymentStatusEnum,
        #[max_length = 255]
        transaction_ref -> Varchar,
        #[max_length = 255]
        provider -> Varchar,
        paid_at -> Timestamptz,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::ServiceOrderStatus;

    repair_logs (log_id) {
        log_id -> Int4,
        order_id -> Int4,
        mechanic_id -> Int4,
        note -> Text,
        status -> ServiceOrderStatus,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    service_items (item_id) {
        item_id -> Int4,
        order_id -> Int4,
        #[max_length = 255]
        description -> Varchar,
        price -> Numeric,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::ServiceOrderStatus;

    service_orders (order_id) {
        order_id -> Int4,
        bike_id -> Int4,
        customer_id -> Int4,
        status -> ServiceOrderStatus,
        total_price -> Numeric,
        created_by -> Int4,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    user_line_accounts (id) {
        id -> Int4,
        user_id -> Int4,
        #[max_length = 255]
        line_user_id -> Varchar,
        linked_at -> Timestamptz,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::UserRole;

    users (user_id) {
        user_id -> Int4,
        #[max_length = 255]
        username -> Varchar,
        #[max_length = 255]
        password_hash -> Varchar,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 255]
        phone -> Varchar,
        role -> UserRole,
        created_at -> Timestamptz,
    }
}

diesel::joinable!(motorcycles -> users (user_id));
diesel::joinable!(notifications -> service_orders (order_id));
diesel::joinable!(notifications -> users (user_id));
diesel::joinable!(payments -> service_orders (order_id));
diesel::joinable!(repair_logs -> service_orders (order_id));
diesel::joinable!(repair_logs -> users (mechanic_id));
diesel::joinable!(service_items -> service_orders (order_id));
diesel::joinable!(service_orders -> motorcycles (bike_id));
diesel::joinable!(user_line_accounts -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    motorcycles,
    notifications,
    payments,
    repair_logs,
    service_items,
    service_orders,
    user_line_accounts,
    users,
);
