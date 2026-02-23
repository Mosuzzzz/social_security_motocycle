ALTER TABLE user_line_accounts
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS picture_url TEXT;