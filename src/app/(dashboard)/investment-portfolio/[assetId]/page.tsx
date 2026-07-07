import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Category,
  Expense,
  InvestmentAsset,
  InvestmentReturn,
  InvestmentValuation,
} from "@/types";
import InvestmentAssetDetailClient from "./InvestmentAssetDetailClient";

const CAPITAL_PAGE_SIZE = 10;
const RETURN_PAGE_SIZE = 10;
const VALUATION_PAGE_SIZE = 10;

type DetailSearchParams = {
  valuation_q?: string | string[];
  valuation_page?: string | string[];
  return_q?: string | string[];
  return_category?: string | string[];
  return_page?: string | string[];
  capital_q?: string | string[];
  capital_category?: string | string[];
  capital_page?: string | string[];
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function escapeSearchValue(value: string) {
  return value.replaceAll(",", "\\,");
}

export default async function InvestmentAssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ assetId: string }> | { assetId: string };
  searchParams?: DetailSearchParams | Promise<DetailSearchParams>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const assetId = resolvedParams.assetId;
  const valuationSearchQuery = firstParam(
    resolvedSearchParams?.valuation_q,
  ).trim();
  const valuationPage = Math.max(
    1,
    Number.parseInt(firstParam(resolvedSearchParams?.valuation_page), 10) || 1,
  );
  const returnSearchQuery = firstParam(resolvedSearchParams?.return_q).trim();
  const returnCategoryFilter =
    firstParam(resolvedSearchParams?.return_category).trim() || "all";
  const returnPage = Math.max(
    1,
    Number.parseInt(firstParam(resolvedSearchParams?.return_page), 10) || 1,
  );
  const capitalSearchQuery = firstParam(resolvedSearchParams?.capital_q).trim();
  const capitalCategoryFilter =
    firstParam(resolvedSearchParams?.capital_category).trim() || "all";
  const capitalPage = Math.max(
    1,
    Number.parseInt(firstParam(resolvedSearchParams?.capital_page), 10) || 1,
  );

  const [
    { data: asset },
    { data: latestValuation },
    { data: investmentCategories },
  ] =
    await Promise.all([
      supabase
        .from("investment_assets")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .eq("id", assetId)
        .single(),
      supabase
        .from("investment_valuations")
        .select("*")
        .eq("user_id", user.id)
        .eq("asset_id", assetId)
        .order("valuation_month", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .in("type", ["investment", "business", "investment_return"])
        .order("name", { ascending: true }),
    ]);

  if (!asset) notFound();

  const initialCapitalCategoryOptions = (investmentCategories || []).filter(
    (category) =>
      category.type === (asset.is_business ? "business" : "investment"),
  );
  const initialReturnCategoryOptions = (investmentCategories || []).filter(
    (category) => category.type === "investment_return",
  );

  const normalizedReturnCategoryFilter =
    returnCategoryFilter !== "all" &&
    initialReturnCategoryOptions.some(
      (category) => category.id === returnCategoryFilter,
    )
      ? returnCategoryFilter
      : "all";
  const normalizedCapitalCategoryFilter =
    asset.is_business &&
    capitalCategoryFilter !== "all" &&
    initialCapitalCategoryOptions.some(
      (category) => category.id === capitalCategoryFilter,
    )
      ? capitalCategoryFilter
      : "all";

  let returnsQuery = supabase
    .from("investment_returns")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("user_id", user.id)
    .eq("asset_id", assetId);

  if (returnSearchQuery) {
    const escapedSearch = escapeSearchValue(returnSearchQuery);
    returnsQuery = returnsQuery.or(
      `description.ilike.%${escapedSearch}%,note.ilike.%${escapedSearch}%`,
    );
  }

  if (normalizedReturnCategoryFilter !== "all") {
    returnsQuery = returnsQuery.eq("category_id", normalizedReturnCategoryFilter);
  }

  let capitalQuery = supabase
    .from("investments")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("user_id", user.id)
    .eq("asset_id", assetId);

  if (capitalSearchQuery) {
    const escapedSearch = escapeSearchValue(capitalSearchQuery);
    capitalQuery = capitalQuery.or(
      `description.ilike.%${escapedSearch}%,note.ilike.%${escapedSearch}%`,
    );
  }

  if (normalizedCapitalCategoryFilter !== "all") {
    capitalQuery = capitalQuery.eq("category_id", normalizedCapitalCategoryFilter);
  }

  const [
    { data: paginatedValuations, count: filteredValuationCount },
    { data: paginatedReturns, count: filteredReturnCount },
    { data: paginatedInvestments, count: filteredCapitalCount },
    { data: allReturns },
    { data: allInvestments },
  ] = await Promise.all([
    (() => {
      let valuationsQuery = supabase
        .from("investment_valuations")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .eq("asset_id", assetId);

      if (valuationSearchQuery) {
        const escapedSearch = escapeSearchValue(valuationSearchQuery);
        valuationsQuery = valuationsQuery.ilike("note", `%${escapedSearch}%`);
      }

      return valuationsQuery
        .order("valuation_month", { ascending: false })
        .order("created_at", { ascending: false })
        .range(
          (valuationPage - 1) * VALUATION_PAGE_SIZE,
          valuationPage * VALUATION_PAGE_SIZE - 1,
        );
    })(),
    returnsQuery
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(
        (returnPage - 1) * RETURN_PAGE_SIZE,
        returnPage * RETURN_PAGE_SIZE - 1,
      ),
    capitalQuery
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(
        (capitalPage - 1) * CAPITAL_PAGE_SIZE,
        capitalPage * CAPITAL_PAGE_SIZE - 1,
      ),
    supabase
      .from("investment_returns")
      .select("id, amount")
      .eq("user_id", user.id)
      .eq("asset_id", assetId),
    supabase
      .from("investments")
      .select("id, amount")
      .eq("user_id", user.id)
      .eq("asset_id", assetId),
  ]);

  const totalInvested = (allInvestments || []).reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const totalReturned = (allReturns || []).reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  return (
    <InvestmentAssetDetailClient
      asset={asset as InvestmentAsset & { category?: Category }}
      investments={(paginatedInvestments || []) as Expense[]}
      investmentCategories={(investmentCategories || []) as Category[]}
      valuations={(paginatedValuations || []) as InvestmentValuation[]}
      latestValuation={latestValuation as InvestmentValuation | undefined}
      returns={(paginatedReturns || []) as InvestmentReturn[]}
      totalInvested={totalInvested}
      totalReturned={totalReturned}
      valuationSearchQuery={valuationSearchQuery}
      valuationPage={valuationPage}
      filteredValuationCount={filteredValuationCount || 0}
      valuationPageSize={VALUATION_PAGE_SIZE}
      returnSearchQuery={returnSearchQuery}
      returnCategoryFilter={normalizedReturnCategoryFilter}
      returnPage={returnPage}
      filteredReturnCount={filteredReturnCount || 0}
      returnPageSize={RETURN_PAGE_SIZE}
      capitalSearchQuery={capitalSearchQuery}
      capitalCategoryFilter={normalizedCapitalCategoryFilter}
      capitalPage={capitalPage}
      filteredCapitalCount={filteredCapitalCount || 0}
      capitalPageSize={CAPITAL_PAGE_SIZE}
      totalReturnTransactionCount={(allReturns || []).length}
      totalCapitalTransactionCount={(allInvestments || []).length}
    />
  );
}
