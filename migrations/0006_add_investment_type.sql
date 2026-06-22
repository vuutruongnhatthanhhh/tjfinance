-- Add 'investment' to categories type constraint
-- Drop old constraint and recreate with new value
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE categories ALTER COLUMN type TYPE VARCHAR(20);
ALTER TABLE categories ADD CONSTRAINT categories_type_check
  CHECK (type IN ('expense', 'income', 'investment'));
