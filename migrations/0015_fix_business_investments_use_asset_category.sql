CREATE OR REPLACE FUNCTION validate_transaction_category_type()
RETURNS TRIGGER AS $$
DECLARE
  expected_type VARCHAR(20);
  category_type VARCHAR(20);
BEGIN
  IF TG_TABLE_NAME = 'expenses' THEN
    expected_type := 'expense';
  ELSIF TG_TABLE_NAME = 'incomes' THEN
    expected_type := 'income';
  ELSIF TG_TABLE_NAME = 'investments' THEN
    expected_type := 'investment';
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

UPDATE investments i
SET category_id = ia.category_id
FROM investment_assets ia,
     categories current_category
WHERE ia.id = i.asset_id
  AND current_category.id = i.category_id
  AND ia.category_id IS NOT NULL
  AND current_category.type = 'business';
