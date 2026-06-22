-- Update create_default_categories_for_user to include investment defaults
-- Depends on migration 0006 (investment type in constraint)

DROP FUNCTION IF EXISTS public.create_default_categories_for_user(UUID);

CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    -- Chi tiêu
    (p_user_id, 'Ăn uống',       'utensils',       '#ef4444', 'expense'),
    (p_user_id, 'Di chuyển',     'car',             '#f97316', 'expense'),
    (p_user_id, 'Mua sắm',       'shopping-bag',    '#8b5cf6', 'expense'),
    (p_user_id, 'Giải trí',      'gamepad-2',       '#ec4899', 'expense'),
    (p_user_id, 'Sức khỏe',      'heart-pulse',     '#06b6d4', 'expense'),
    (p_user_id, 'Giáo dục',      'book-open',       '#3b82f6', 'expense'),
    (p_user_id, 'Hóa đơn',       'receipt',         '#64748b', 'expense'),
    (p_user_id, 'Khác',          'more-horizontal', '#6b7280', 'expense'),
    -- Thu nhập
    (p_user_id, 'Lương',         'briefcase',       '#2D9A4B', 'income'),
    (p_user_id, 'Thưởng',        'gift',            '#10b981', 'income'),
    (p_user_id, 'Thu nhập khác', 'plus-circle',     '#34d399', 'income'),
    -- Đầu tư
    (p_user_id, 'Tiết kiệm',     'bank',            '#3b82f6', 'investment'),
    (p_user_id, 'Vàng',          'star',            '#eab308', 'investment'),
    (p_user_id, 'Cổ phiếu',      'trending-up',     '#2D9A4B', 'investment');
END;
$$;

-- Backfill investment defaults for existing users who have no investment categories yet
INSERT INTO public.categories (user_id, name, icon, color, type)
SELECT u.id, v.name, v.icon, v.color, 'investment'
FROM auth.users u
CROSS JOIN (VALUES
  ('Tiết kiệm', 'bank',        '#3b82f6'),
  ('Vàng',      'star',        '#eab308'),
  ('Cổ phiếu',  'trending-up', '#2D9A4B')
) AS v(name, icon, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c
  WHERE c.user_id = u.id AND c.type = 'investment'
);
