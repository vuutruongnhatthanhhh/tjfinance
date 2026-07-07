CREATE TABLE IF NOT EXISTS telegram_integrations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  telegram_chat_id TEXT UNIQUE,
  telegram_username TEXT,
  telegram_connected_at TIMESTAMPTZ,
  telegram_link_token TEXT UNIQUE,
  telegram_link_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_integrations_chat_id
  ON telegram_integrations(telegram_chat_id);

CREATE INDEX IF NOT EXISTS idx_telegram_integrations_link_token
  ON telegram_integrations(telegram_link_token);

ALTER TABLE telegram_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own telegram integration"
  ON telegram_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram integration"
  ON telegram_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram integration"
  ON telegram_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram integration"
  ON telegram_integrations FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_telegram_integrations_updated_at
  ON telegram_integrations;

CREATE TRIGGER update_telegram_integrations_updated_at
  BEFORE UPDATE ON telegram_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
