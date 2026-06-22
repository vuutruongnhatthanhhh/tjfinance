-- used_at không còn cần thiết vì token được xoá ngay sau khi xác nhận
ALTER TABLE email_verifications DROP COLUMN IF EXISTS used_at;
