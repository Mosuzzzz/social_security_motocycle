-- Up
ALTER TABLE service_orders
ADD COLUMN before_picture_url TEXT;
ALTER TABLE service_orders
ADD COLUMN after_picture_url TEXT;