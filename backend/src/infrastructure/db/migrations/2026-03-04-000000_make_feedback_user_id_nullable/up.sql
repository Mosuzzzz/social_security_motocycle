-- Make user_id nullable in feedbacks
ALTER TABLE feedbacks
ALTER COLUMN user_id DROP NOT NULL;