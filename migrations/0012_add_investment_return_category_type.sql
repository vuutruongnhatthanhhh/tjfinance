ALTER TABLE categories
ALTER COLUMN type TYPE VARCHAR(30);

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE categories ADD CONSTRAINT categories_type_check
  CHECK (type IN ('expense', 'income', 'investment', 'business', 'investment_return'));

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
    (p_user_id, 'Cổ phiếu', 'trending-up', '#2D9A4B', 'investment'),
    (p_user_id, 'Thu hồi vốn', 'bank', '#2D9A4B', 'investment_return'),
    (p_user_id, 'Lợi nhuận đầu tư', 'gift', '#10b981', 'investment_return');
END;
$$;

INSERT INTO public.categories (user_id, name, icon, color, type)
SELECT u.id, v.name, v.icon, v.color, 'investment_return'
FROM auth.users u
CROSS JOIN (
  VALUES
    ('Thu hồi vốn', 'bank', '#2D9A4B'),
    ('Lợi nhuận đầu tư', 'gift', '#10b981')
) AS v(name, icon, color)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categories c
  WHERE c.user_id = u.id
    AND c.type = 'investment_return'
);

UPDATE investment_returns ir
SET category_id = replacement.id
FROM LATERAL (
  SELECT c.id
  FROM categories c
  WHERE c.user_id = ir.user_id
    AND c.type = 'investment_return'
  ORDER BY c.created_at ASC, c.name ASC
  LIMIT 1
) AS replacement
WHERE ir.category_id IS NULL
   OR EXISTS (
     SELECT 1
     FROM categories current_category
     WHERE current_category.id = ir.category_id
       AND current_category.type <> 'investment_return'
   );

CREATE OR REPLACE FUNCTION validate_investment_return_category_type()
RETURNS TRIGGER AS $$
DECLARE
  category_type VARCHAR(30);
BEGIN
  IF NEW.category_id IS NULL THEN
    RAISE EXCEPTION 'Investment return category is required';
  END IF;

  SELECT type
  INTO category_type
  FROM categories
  WHERE id = NEW.category_id;

  IF category_type IS NULL THEN
    RETURN NEW;
  END IF;

  IF category_type <> 'investment_return' THEN
    RAISE EXCEPTION 'Category type % does not match investment returns', category_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
