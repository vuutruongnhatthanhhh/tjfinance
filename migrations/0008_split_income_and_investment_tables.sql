-- Split income and investment records out of the expenses table.
-- Existing expense rows linked to income/investment categories are migrated.

CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount DECIMAL(15, 0) NOT NULL CHECK (amount > 0),
  description VARCHAR(255) NOT NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount DECIMAL(15, 0) NOT NULL CHECK (amount > 0),
  description VARCHAR(255) NOT NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_category_id ON incomes(category_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date DESC);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_category_id ON investments(category_id);
CREATE INDEX IF NOT EXISTS idx_investments_date ON investments(date DESC);

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own incomes"
  ON incomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incomes"
  ON incomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomes"
  ON incomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomes"
  ON incomes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments"
  ON investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments"
  ON investments FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON incomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

DROP TRIGGER IF EXISTS validate_expenses_category_type ON expenses;
DROP TRIGGER IF EXISTS validate_incomes_category_type ON incomes;
DROP TRIGGER IF EXISTS validate_investments_category_type ON investments;

CREATE TRIGGER validate_expenses_category_type
  BEFORE INSERT OR UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION validate_transaction_category_type();

CREATE TRIGGER validate_incomes_category_type
  BEFORE INSERT OR UPDATE ON incomes
  FOR EACH ROW EXECUTE FUNCTION validate_transaction_category_type();

CREATE TRIGGER validate_investments_category_type
  BEFORE INSERT OR UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION validate_transaction_category_type();

INSERT INTO incomes (id, user_id, category_id, amount, description, note, date, created_at, updated_at)
SELECT e.id, e.user_id, e.category_id, e.amount, e.description, e.note, e.date, e.created_at, e.updated_at
FROM expenses e
JOIN categories c ON c.id = e.category_id
WHERE c.type = 'income'
ON CONFLICT (id) DO NOTHING;

INSERT INTO investments (id, user_id, category_id, amount, description, note, date, created_at, updated_at)
SELECT e.id, e.user_id, e.category_id, e.amount, e.description, e.note, e.date, e.created_at, e.updated_at
FROM expenses e
JOIN categories c ON c.id = e.category_id
WHERE c.type = 'investment'
ON CONFLICT (id) DO NOTHING;

DELETE FROM expenses e
USING categories c
WHERE e.category_id = c.id
  AND c.type IN ('income', 'investment');
