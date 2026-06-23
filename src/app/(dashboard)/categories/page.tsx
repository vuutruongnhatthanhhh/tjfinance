import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: categories }, { data: expenseCounts }, { data: incomeCounts }, { data: investmentCounts }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("type")
      .order("name"),
    supabase
      .from("expenses")
      .select("category_id")
      .eq("user_id", user.id),
    supabase
      .from("incomes")
      .select("category_id")
      .eq("user_id", user.id),
    supabase
      .from("investments")
      .select("category_id")
      .eq("user_id", user.id),
  ]);

  const counts: Record<string, number> = {};
  [...(expenseCounts || []), ...(incomeCounts || []), ...(investmentCounts || [])]
    .forEach((item) => {
      if (item.category_id) counts[item.category_id] = (counts[item.category_id] || 0) + 1;
    });

  return (
    <CategoriesClient
      initialCategories={categories || []}
      expenseCounts={counts}
      userId={user.id}
    />
  );
}
