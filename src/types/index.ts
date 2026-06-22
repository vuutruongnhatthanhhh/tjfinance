export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income";
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description: string;
  note?: string;
  date: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface DashboardStats {
  totalExpenseThisMonth: number;
  totalIncomeThisMonth: number;
  balance: number;
  expensesByCategory: { category: Category; total: number }[];
  recentExpenses: Expense[];
}

export type Theme = "light" | "dark";
