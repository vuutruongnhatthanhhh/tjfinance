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
  type: "expense" | "income" | "investment";
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

export type Transaction = Expense;
export type Income = Transaction;
export type Investment = Transaction;

export interface InvestmentAsset {
  id: string;
  user_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  is_business: boolean;
  started_at: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface InvestmentValuation {
  id: string;
  asset_id: string;
  user_id: string;
  valuation_month: string;
  current_value: number;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentReturn {
  id: string;
  asset_id: string;
  user_id: string;
  amount: number;
  description: string;
  note?: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalExpenseThisMonth: number;
  totalIncomeThisMonth: number;
  balance: number;
  expensesByCategory: { category: Category; total: number }[];
  recentExpenses: Expense[];
}

export type Theme = "light" | "dark";
