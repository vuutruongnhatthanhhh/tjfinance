-- This function seeds default categories for new users
-- Call this after user signup via Supabase trigger or manually

CREATE OR REPLACE FUNCTION create_default_categories_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, type) VALUES
    (p_user_id, 'Ăn uống', 'utensils', '#ef4444', 'expense'),
    (p_user_id, 'Di chuyển', 'car', '#f97316', 'expense'),
    (p_user_id, 'Mua sắm', 'shopping-bag', '#8b5cf6', 'expense'),
    (p_user_id, 'Giải trí', 'gamepad-2', '#ec4899', 'expense'),
    (p_user_id, 'Sức khỏe', 'heart-pulse', '#06b6d4', 'expense'),
    (p_user_id, 'Giáo dục', 'book-open', '#3b82f6', 'expense'),
    (p_user_id, 'Hóa đơn', 'receipt', '#64748b', 'expense'),
    (p_user_id, 'Khác', 'more-horizontal', '#6b7280', 'expense'),
    (p_user_id, 'Lương', 'briefcase', '#2D9A4B', 'income'),
    (p_user_id, 'Đầu tư', 'trending-up', '#059669', 'income'),
    (p_user_id, 'Thưởng', 'gift', '#10b981', 'income'),
    (p_user_id, 'Khác', 'plus-circle', '#34d399', 'income');
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default categories when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_categories_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
