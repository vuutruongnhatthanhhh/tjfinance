ALTER TABLE investment_returns
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

UPDATE investment_returns ir
SET category_id = COALESCE(
  (
    SELECT c.id
    FROM investment_assets ia
    JOIN categories c
      ON c.user_id = ir.user_id
    WHERE ia.id = ir.asset_id
      AND (
        (ia.is_business = TRUE AND c.type = 'business')
        OR (ia.is_business = FALSE AND c.type = 'income')
      )
    ORDER BY c.created_at ASC
    LIMIT 1
  )
)
WHERE ir.category_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_investment_returns_category_id
ON investment_returns(category_id);

CREATE OR REPLACE FUNCTION validate_investment_return_category_type()
RETURNS TRIGGER AS $$
DECLARE
  category_type VARCHAR(20);
  asset_is_business BOOLEAN;
BEGIN
  IF NEW.category_id IS NULL THEN
    RAISE EXCEPTION 'Investment return category is required';
  END IF;

  SELECT type
  INTO category_type
  FROM categories
  WHERE id = NEW.category_id;

  SELECT is_business
  INTO asset_is_business
  FROM investment_assets
  WHERE id = NEW.asset_id;

  IF category_type IS NULL OR asset_is_business IS NULL THEN
    RETURN NEW;
  END IF;

  IF asset_is_business AND category_type <> 'business' THEN
    RAISE EXCEPTION 'Category type % does not match business investment returns', category_type;
  END IF;

  IF NOT asset_is_business AND category_type <> 'income' THEN
    RAISE EXCEPTION 'Category type % does not match investment returns', category_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_investment_returns_category_type ON investment_returns;

CREATE TRIGGER validate_investment_returns_category_type
  BEFORE INSERT OR UPDATE ON investment_returns
  FOR EACH ROW EXECUTE FUNCTION validate_investment_return_category_type();
