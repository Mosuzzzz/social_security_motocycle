-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'customer', 'mechanic');
CREATE TYPE service_order_status AS ENUM ('booked', 'repairing', 'completed', 'cancelled');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE notification_channel_enum AS ENUM ('line');
CREATE TYPE notification_status_enum AS ENUM ('sent', 'failed');
-- Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Motorcycles
CREATE TABLE motorcycles (
    bike_id SERIAL PRIMARY KEY,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    license_plate VARCHAR(100) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(user_id)
);
-- ServiceOrder
CREATE TABLE service_orders (
    order_id SERIAL PRIMARY KEY,
    bike_id INTEGER NOT NULL REFERENCES motorcycles(bike_id),
    customer_id INTEGER NOT NULL REFERENCES users(user_id),
    status service_order_status NOT NULL,
    total_price DECIMAL NOT NULL DEFAULT 0,
    created_by INTEGER NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ServiceItems
CREATE TABLE service_items (
    item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES service_orders(order_id),
    description VARCHAR(255) NOT NULL,
    price DECIMAL NOT NULL DEFAULT 0
);
-- RepairLogs
CREATE TABLE repair_logs (
    log_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES service_orders(order_id),
    mechanic_id INTEGER NOT NULL REFERENCES users(user_id),
    note TEXT NOT NULL,
    status service_order_status NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Payment
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES service_orders(order_id),
    amount DECIMAL NOT NULL DEFAULT 0,
    status payment_status_enum NOT NULL,
    transaction_ref VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Notification
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    order_id INTEGER NOT NULL REFERENCES service_orders(order_id),
    channel notification_channel_enum NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status notification_status_enum NOT NULL
);
-- USER_LINE_ACCOUNT
CREATE TABLE user_line_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    line_user_id VARCHAR(255) NOT NULL UNIQUE,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);