import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [{ data: expenses }, { data: categories }] = await Promise.all([
    supabase
      .from("expenses")
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

  const totalExpense = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);

  const byCategory = categories?.map((cat) => ({
    category: cat,
    total: (expenses || [])
      .filter((e) => e.category_id === cat.id)
      .reduce((s, e) => s + Number(e.amount), 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total) || [];

  return (
    <DashboardClient
      userName={user.user_metadata?.full_name}
      totalExpense={totalExpense}
      recentExpenses={expenses?.slice(0, 8) || []}
      expensesByCategory={byCategory}
    />
  );
}
