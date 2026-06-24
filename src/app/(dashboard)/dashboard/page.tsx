import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

type DashboardSearchParams = {
  month?: string | string[];
  year?: string | string[];
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: DashboardSearchParams | Promise<DashboardSearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const resolvedSearchParams = await Promise.resolve(searchParams);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const selectedMonth = Math.min(
    12,
    Math.max(1, Number.parseInt(firstParam(resolvedSearchParams?.month), 10) || currentMonth),
  );
  const selectedYear =
    Number.parseInt(firstParam(resolvedSearchParams?.year), 10) || currentYear;

  const firstDay = new Date(selectedYear, selectedMonth - 1, 1)
    .toISOString()
    .split("T")[0];
  const lastDay = new Date(selectedYear, selectedMonth, 0)
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
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      totalExpense={totalExpense}
      totalIncome={totalIncome}
      totalInvestment={totalInvestment}
      recentExpenses={expenses?.slice(0, 8) || []}
      expensesByCategory={byCategory}
    />
  );
}
