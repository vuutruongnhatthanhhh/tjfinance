import { redirect } from "next/navigation";
import ExpensesClient from "../expenses/ExpensesClient";
import {
  PAGE_SIZE,
  TransactionSearchParams,
} from "../transactions/getTransactionPageData";
import { createClient } from "@/lib/supabase/server";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function escapeSearchValue(value: string): string {
  return value.replaceAll(",", "\\,");
}

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams?: TransactionSearchParams | Promise<TransactionSearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const resolvedSearchParams = await Promise.resolve(searchParams);
  const currentPage = Math.max(
    1,
    Number.parseInt(firstParam(resolvedSearchParams?.page), 10) || 1,
  );
  const searchQuery = firstParam(resolvedSearchParams?.q).trim();
  const rawCategory = firstParam(resolvedSearchParams?.category).trim();
  const filterDateFrom = firstParam(resolvedSearchParams?.from).trim();
  const filterDateTo = firstParam(resolvedSearchParams?.to).trim();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .in("type", ["investment", "business"])
    .order("name");

  const investmentCategories = (categories || []).filter(
    (category) => category.type === "investment",
  );
  const allowedCategoryIds = investmentCategories.map((category) => category.id);
  const filterCategory =
    rawCategory && rawCategory !== "all" && allowedCategoryIds.includes(rawCategory)
      ? rawCategory
      : "all";

  let assetIdsForCategory: string[] | null = null;

  if (filterCategory !== "all") {
    const { data: matchingAssets } = await supabase
      .from("investment_assets")
      .select("id")
      .eq("user_id", user.id)
      .eq("category_id", filterCategory);

    assetIdsForCategory = (matchingAssets || []).map((item) => item.id);

    if (assetIdsForCategory.length === 0) {
      const { data: investmentAssets } = await supabase
        .from("investment_assets")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      return (
        <ExpensesClient
          initialExpenses={[]}
          categories={categories || []}
          userId={user.id}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          totalCount={0}
          searchQuery={searchQuery}
          filterCategory={filterCategory}
          filterDateFrom={filterDateFrom}
          filterDateTo={filterDateTo}
          transactionType="investment"
          investmentAssets={investmentAssets || []}
        />
      );
    }
  }

  let investmentsQuery = supabase
    .from("investments")
    .select(
      "*, category:categories(*), asset:investment_assets(*, category:categories(*))",
      { count: "exact" },
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (searchQuery) {
    const escapedSearch = escapeSearchValue(searchQuery);
    investmentsQuery = investmentsQuery.or(
      `description.ilike.%${escapedSearch}%,note.ilike.%${escapedSearch}%`,
    );
  }

  if (filterDateFrom) {
    investmentsQuery = investmentsQuery.gte("date", filterDateFrom);
  }

  if (filterDateTo) {
    investmentsQuery = investmentsQuery.lte("date", filterDateTo);
  }

  if (assetIdsForCategory) {
    investmentsQuery = investmentsQuery.in("asset_id", assetIdsForCategory);
  }

  const { data: paginatedInvestments, count } = await investmentsQuery.range(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE - 1,
  );

  const { data: investmentAssets } = await supabase
    .from("investment_assets")
    .select("*, category:categories(*)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  return (
    <ExpensesClient
      initialExpenses={paginatedInvestments || []}
      categories={categories || []}
      userId={user.id}
      currentPage={currentPage}
      pageSize={PAGE_SIZE}
      totalCount={count || 0}
      searchQuery={searchQuery}
      filterCategory={filterCategory}
      filterDateFrom={filterDateFrom}
      filterDateTo={filterDateTo}
      transactionType="investment"
      investmentAssets={investmentAssets || []}
    />
  );
}
