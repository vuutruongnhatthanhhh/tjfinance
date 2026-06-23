-- Add investment assets, monthly valuations, and business returns.
-- This supports portfolio tracking on top of raw investment transactions.

CREATE TABLE IF NOT EXISTS investment_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_business BOOLEAN NOT NULL DEFAULT FALSE,
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE investments
ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES investment_assets(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS investment_valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES investment_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valuation_month DATE NOT NULL,
  current_value DECIMAL(15, 0) NOT NULL CHECK (current_value >= 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT investment_valuations_asset_month_unique UNIQUE (asset_id, valuation_month)
);

CREATE TABLE IF NOT EXISTS investment_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES investment_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 0) NOT NULL CHECK (amount > 0),
  description VARCHAR(255) NOT NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investment_assets_user_id ON investment_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_assets_category_id ON investment_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_investments_asset_id ON investments(asset_id);
CREATE INDEX IF NOT EXISTS idx_investment_valuations_user_id ON investment_valuations(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_valuations_asset_id ON investment_valuations(asset_id);
CREATE INDEX IF NOT EXISTS idx_investment_valuations_month ON investment_valuations(valuation_month DESC);
CREATE INDEX IF NOT EXISTS idx_investment_returns_user_id ON investment_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_returns_asset_id ON investment_returns(asset_id);
CREATE INDEX IF NOT EXISTS idx_investment_returns_date ON investment_returns(date DESC);

ALTER TABLE investment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investment assets"
  ON investment_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment assets"
  ON investment_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investment assets"
  ON investment_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment assets"
  ON investment_assets FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own investment valuations"
  ON investment_valuations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment valuations"
  ON investment_valuations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investment valuations"
  ON investment_valuations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment valuations"
  ON investment_valuations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own investment returns"
  ON investment_returns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment returns"
  ON investment_returns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investment returns"
  ON investment_returns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment returns"
  ON investment_returns FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_investment_assets_updated_at ON investment_assets;
DROP TRIGGER IF EXISTS update_investment_valuations_updated_at ON investment_valuations;
DROP TRIGGER IF EXISTS update_investment_returns_updated_at ON investment_returns;

CREATE TRIGGER update_investment_assets_updated_at
  BEFORE UPDATE ON investment_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_valuations_updated_at
  BEFORE UPDATE ON investment_valuations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_returns_updated_at
  BEFORE UPDATE ON investment_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION validate_investment_asset_category_type()
RETURNS TRIGGER AS $$
DECLARE
  category_type VARCHAR(20);
BEGIN
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

  IF category_type <> 'investment' THEN
    RAISE EXCEPTION 'Category type % does not match investment assets', category_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_investment_assets_category_type ON investment_assets;

CREATE TRIGGER validate_investment_assets_category_type
  BEFORE INSERT OR UPDATE ON investment_assets
  FOR EACH ROW EXECUTE FUNCTION validate_investment_asset_category_type();

INSERT INTO investment_assets (
  id,
  user_id,
  category_id,
  name,
  description,
  is_business,
  started_at,
  created_at,
  updated_at
)
SELECT
  i.id,
  i.user_id,
  i.category_id,
  i.description,
  i.note,
  FALSE,
  i.date,
  i.created_at,
  i.updated_at
FROM investments i
WHERE i.asset_id IS NULL
ON CONFLICT (id) DO NOTHING;

UPDATE investments
SET asset_id = id
WHERE asset_id IS NULL;
