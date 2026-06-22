-- Fix: trigger thiếu SET search_path = public khiến không tìm thấy bảng categories
-- Supabase chạy trigger trên auth.users trong context auth schema,
-- nên cần khai báo rõ search_path và dùng tên đầy đủ public.categories

-- Xoá trigger cũ trước
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Xoá 2 function cũ
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_default_categories_for_user(UUID);

-- Tạo lại function seed categories với đầy đủ schema path
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (p_user_id, 'Ăn uống',   'utensils',        '#ef4444', 'expense'),
    (p_user_id, 'Di chuyển', 'car',              '#f97316', 'expense'),
    (p_user_id, 'Mua sắm',   'shopping-bag',     '#8b5cf6', 'expense'),
    (p_user_id, 'Giải trí',  'gamepad-2',        '#ec4899', 'expense'),
    (p_user_id, 'Sức khỏe',  'heart-pulse',      '#06b6d4', 'expense'),
    (p_user_id, 'Giáo dục',  'book-open',        '#3b82f6', 'expense'),
    (p_user_id, 'Hóa đơn',   'receipt',          '#64748b', 'expense'),
    (p_user_id, 'Khác',      'more-horizontal',  '#6b7280', 'expense'),
    (p_user_id, 'Lương',     'briefcase',        '#2D9A4B', 'income'),
    (p_user_id, 'Đầu tư',    'trending-up',      '#059669', 'income'),
    (p_user_id, 'Thưởng',    'gift',             '#10b981', 'income'),
    (p_user_id, 'Thu nhập khác', 'plus-circle',  '#34d399', 'income');
END;
$$;

-- Tạo lại trigger function với EXCEPTION handler để không block đăng ký nếu lỗi
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_default_categories_for_user(NEW.id);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log lỗi nhưng không block việc tạo user
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Tạo lại trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
