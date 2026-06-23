import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExpensesClient from "./ExpensesClient";

const PAGE_SIZE = 50;

type ExpensesSearchParams = {
  page?: string | string[];
  q?: string | string[];
  category?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function escapeSearchValue(value: string): string {
  return value.replaceAll(",", "\\,");
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams?: ExpensesSearchParams | Promise<ExpensesSearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const resolvedSearchParams = await Promise.resolve(searchParams);

  const page = Math.max(
    1,
    Number.parseInt(firstParam(resolvedSearchParams?.page), 10) || 1,
  );
  const search = firstParam(resolvedSearchParams?.q).trim();
  const category = firstParam(resolvedSearchParams?.category).trim();
  const from = firstParam(resolvedSearchParams?.from).trim();
  const to = firstParam(resolvedSearchParams?.to).trim();

  let expensesQuery = supabase
    .from("expenses")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("user_id", user.id);

  if (search) {
    const escapedSearch = escapeSearchValue(search);
    expensesQuery = expensesQuery.or(
      `description.ilike.%${escapedSearch}%,note.ilike.%${escapedSearch}%`,
    );
  }

  if (category && category !== "all") {
    expensesQuery = expensesQuery.eq("category_id", category);
  }

  if (from) {
    expensesQuery = expensesQuery.gte("date", from);
  }

  if (to) {
    expensesQuery = expensesQuery.lte("date", to);
  }

  const [{ data: expenses, count }, { data: categories }] = await Promise.all([
    expensesQuery
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
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
      currentPage={page}
      pageSize={PAGE_SIZE}
      totalCount={count || 0}
      searchQuery={search}
      filterCategory={category || "all"}
      filterDateFrom={from}
      filterDateTo={to}
    />
  );
}
