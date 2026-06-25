DROP FUNCTION IF EXISTS public.create_default_categories_for_user(UUID);

CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (p_user_id, 'Ăn uống', 'utensils', '#ef4444', 'expense'),
    (p_user_id, 'Di chuyển', 'car', '#f97316', 'expense'),
    (p_user_id, 'Mua sắm', 'shopping-bag', '#8b5cf6', 'expense'),
    (p_user_id, 'Giải trí', 'gamepad-2', '#ec4899', 'expense'),
    (p_user_id, 'Sức khỏe', 'heart-pulse', '#06b6d4', 'expense'),
    (p_user_id, 'Giáo dục', 'book-open', '#3b82f6', 'expense'),
    (p_user_id, 'Hóa đơn', 'receipt', '#64748b', 'expense'),
    (p_user_id, 'Khác', 'more-horizontal', '#6b7280', 'expense'),
    (p_user_id, 'Lương', 'briefcase', '#2D9A4B', 'income'),
    (p_user_id, 'Thưởng', 'gift', '#10b981', 'income'),
    (p_user_id, 'Thu nhập khác', 'plus-circle', '#34d399', 'income'),
    (p_user_id, 'Tiết kiệm', 'bank', '#3b82f6', 'investment'),
    (p_user_id, 'Vàng', 'star', '#eab308', 'investment'),
    (p_user_id, 'Cổ phiếu', 'trending-up', '#2D9A4B', 'investment');
END;
$$;

DELETE FROM categories c
WHERE c.type = 'investment_return'
  AND c.name IN ('Thu hồi vốn', 'Lợi nhuận đầu tư')
  AND NOT EXISTS (
    SELECT 1
    FROM investment_returns ir
    WHERE ir.category_id = c.id
  );
