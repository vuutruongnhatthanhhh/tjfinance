import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: expenses }, { data: categories }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, category:categories(*)")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name"),
  ]);

  return (
    <ExpensesClient
      initialExpenses={expenses || []}
      categories={categories || []}
      userId={user.id}
    />
  );
}
