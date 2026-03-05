-- Down
ALTER TABLE service_orders DROP COLUMN IF EXISTS before_picture_url;
ALTER TABLE service_orders DROP COLUMN IF EXISTS after_picture_url;