-- Add missing values to service_order_status
ALTER TYPE service_order_status
ADD VALUE IF NOT EXISTS 'review_pending';
ALTER TYPE service_order_status
ADD VALUE IF NOT EXISTS 'offer_sent';
ALTER TYPE service_order_status
ADD VALUE IF NOT EXISTS 'paid';
-- Add missing values to notification_channel_enum
ALTER TYPE notification_channel_enum
ADD VALUE IF NOT EXISTS 'web';
ALTER TYPE notification_channel_enum
ADD VALUE IF NOT EXISTS 'sms';
-- Add missing values to notification_status_enum
ALTER TYPE notification_status_enum
ADD VALUE IF NOT EXISTS 'read';