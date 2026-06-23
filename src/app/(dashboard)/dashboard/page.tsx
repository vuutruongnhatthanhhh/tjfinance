import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [
    { data: expenses },
    { data: incomes },
    { data: investments },
    { data: categories },
  ] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .gte("date", firstDay)
        .lte("date", lastDay)
        .order("date", { ascending: false }),
      supabase
        .from("incomes")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .gte("date", firstDay)
        .lte("date", lastDay)
        .order("date", { ascending: false }),
      supabase
        .from("investments")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .gte("date", firstDay)
        .lte("date", lastDay)
        .order("date", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "expense"),
    ]);

  const totalExpense = (expenses || []).reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const totalIncome = (incomes || []).reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const totalInvestment = (investments || []).reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );

  const byCategory =
    categories
      ?.map((category) => ({
        category,
        total: (expenses || [])
          .filter((item) => item.category_id === category.id)
          .reduce((sum, item) => sum + Number(item.amount), 0),
      }))
      .filter((item) => item.total > 0)
      .sort((left, right) => right.total - left.total) || [];

  return (
    <DashboardClient
      userName={user.user_metadata?.full_name}
      totalExpense={totalExpense}
      totalIncome={totalIncome}
      totalInvestment={totalInvestment}
      recentExpenses={expenses?.slice(0, 8) || []}
      expensesByCategory={byCategory}
    />
  );
}
