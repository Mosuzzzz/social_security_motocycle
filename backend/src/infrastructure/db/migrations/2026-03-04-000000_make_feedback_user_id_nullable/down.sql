-- Make user_id NOT NULL in feedbacks
ALTER TABLE feedbacks
ALTER COLUMN user_id
SET NOT NULL;