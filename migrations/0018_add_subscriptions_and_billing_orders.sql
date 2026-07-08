CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'plus')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
  renewal_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (renewal_cycle IN ('monthly', 'yearly')),
  expires_at TIMESTAMPTZ,
  last_payment_order_code BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code BIGINT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'plus')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  renewal_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (renewal_cycle IN ('monthly', 'yearly')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status_expires_at
  ON subscriptions(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_billing_orders_user_id_created_at
  ON billing_orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_orders_status_created_at
  ON billing_orders(status, created_at DESC);

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_orders_updated_at ON billing_orders;
CREATE TRIGGER update_billing_orders_updated_at
  BEFORE UPDATE ON billing_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own billing orders" ON billing_orders;
CREATE POLICY "Users can view own billing orders"
  ON billing_orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own billing orders" ON billing_orders;
CREATE POLICY "Users can insert own billing orders"
  ON billing_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);
