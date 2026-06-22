-- Bảng lưu token xác nhận email khi đăng ký
-- Dùng flow tự gửi email thay vì Supabase built-in

CREATE TABLE IF NOT EXISTS email_verifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token   ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);

-- Chỉ service role được phép thao tác (API routes dùng service key)
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only"
  ON email_verifications
  USING (auth.role() = 'service_role');
