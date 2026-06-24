-- Add dedicated business categories for business investment transactions.
-- Business capital contributions stay in the investments table but use category type 'business'.

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE categories ADD CONSTRAINT categories_type_check
  CHECK (type IN ('expense', 'income', 'investment', 'business'));

CREATE OR REPLACE FUNCTION validate_transaction_category_type()
RETURNS TRIGGER AS $$
DECLARE
  expected_type VARCHAR(20);
  category_type VARCHAR(20);
  is_business_asset BOOLEAN := FALSE;
BEGIN
  IF TG_TABLE_NAME = 'expenses' THEN
    expected_type := 'expense';
  ELSIF TG_TABLE_NAME = 'incomes' THEN
    expected_type := 'income';
  ELSIF TG_TABLE_NAME = 'investments' THEN
    expected_type := 'investment';

    IF NEW.asset_id IS NOT NULL THEN
      SELECT COALESCE(is_business, FALSE)
      INTO is_business_asset
      FROM investment_assets
      WHERE id = NEW.asset_id;

      IF is_business_asset THEN
        expected_type := 'business';
      END IF;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  IF NEW.category_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT type
  INTO category_type
  FROM categories
  WHERE id = NEW.category_id;

  IF category_type IS NULL THEN
    RETURN NEW;
  END IF;

  IF category_type <> expected_type THEN
    RAISE EXCEPTION 'Category type % does not match table %', category_type, TG_TABLE_NAME;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
