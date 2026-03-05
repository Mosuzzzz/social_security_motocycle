ALTER TABLE service_items
ADD COLUMN stock_item_id INTEGER REFERENCES stock_items(item_id);
ALTER TABLE service_items
ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;