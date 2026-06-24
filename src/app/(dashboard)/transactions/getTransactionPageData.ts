import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Category, Expense, InvestmentAsset } from "@/types";
import { getTransactionTableName, TransactionType } from "./transactionTables";

export type TransactionSearchParams = {
  page?: string | string[];
  q?: string | string[];
  category?: string | string[];
  from?: string | string[];
  to?: string | string[];
};

export interface TransactionPageData {
  categories: Category[];
  currentPage: number;
  filterCategory: string;
  filterDateFrom: string;
  filterDateTo: string;
  initialExpenses: (Expense & {
    category?: Category;
    asset?: InvestmentAsset;
    asset_id?: string | null;
  })[];
  pageSize: number;
  searchQuery: string;
  totalCount: number;
  userId: string;
}

export const PAGE_SIZE = 50;

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function escapeSearchValue(value: string): string {
  return value.replaceAll(",", "\\,");
}

export async function getTransactionPageData(
  searchParams:
    | TransactionSearchParams
    | Promise<TransactionSearchParams>
    | undefined,
  transactionType: TransactionType,
): Promise<TransactionPageData> {
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

  const tableName = getTransactionTableName(transactionType);

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", transactionType)
    .order("name");

  const allowedCategoryIds = (categories || []).map((item) => item.id);
  const normalizedCategory =
    category && category !== "all" && allowedCategoryIds.includes(category)
      ? category
      : "all";

  if (allowedCategoryIds.length === 0) {
    return {
      categories: categories || [],
      currentPage: page,
      filterCategory: normalizedCategory,
      filterDateFrom: from,
      filterDateTo: to,
      initialExpenses: [],
      pageSize: PAGE_SIZE,
      searchQuery: search,
      totalCount: 0,
      userId: user.id,
    };
  }

  let expensesQuery = supabase
    .from(tableName)
    .select("*, category:categories(*)", { count: "exact" })
    .eq("user_id", user.id)
    .in("category_id", allowedCategoryIds);

  if (search) {
    const escapedSearch = escapeSearchValue(search);
    expensesQuery = expensesQuery.or(
      `description.ilike.%${escapedSearch}%,note.ilike.%${escapedSearch}%`,
    );
  }

  if (normalizedCategory !== "all") {
    expensesQuery = expensesQuery.eq("category_id", normalizedCategory);
  }

  if (from) {
    expensesQuery = expensesQuery.gte("date", from);
  }

  if (to) {
    expensesQuery = expensesQuery.lte("date", to);
  }

  const { data: expenses, count } = await expensesQuery
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  return {
    categories: categories || [],
    currentPage: page,
    filterCategory: normalizedCategory,
    filterDateFrom: from,
    filterDateTo: to,
    initialExpenses: expenses || [],
    pageSize: PAGE_SIZE,
    searchQuery: search,
    totalCount: count || 0,
    userId: user.id,
  };
}
