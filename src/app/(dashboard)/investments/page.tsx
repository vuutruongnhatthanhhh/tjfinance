import ExpensesClient from "../expenses/ExpensesClient";
import {
  getTransactionPageData,
  TransactionSearchParams,
} from "../transactions/getTransactionPageData";
import { createClient } from "@/lib/supabase/server";

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams?: TransactionSearchParams | Promise<TransactionSearchParams>;
}) {
  const data = await getTransactionPageData(searchParams, "investment");
  const supabase = await createClient();
  const { data: investmentAssets } = await supabase
    .from("investment_assets")
    .select("*, category:categories(*)")
    .eq("user_id", data.userId)
    .order("started_at", { ascending: false });
  const assetMap = new Map((investmentAssets || []).map((item) => [item.id, item]));
  const initialExpenses = data.initialExpenses.map((item) => ({
    ...item,
    asset:
      "asset_id" in item && item.asset_id ? assetMap.get(item.asset_id) : undefined,
  }));

  return (
    <ExpensesClient
      initialExpenses={initialExpenses}
      categories={data.categories}
      userId={data.userId}
      currentPage={data.currentPage}
      pageSize={data.pageSize}
      totalCount={data.totalCount}
      searchQuery={data.searchQuery}
      filterCategory={data.filterCategory}
      filterDateFrom={data.filterDateFrom}
      filterDateTo={data.filterDateTo}
      transactionType="investment"
      investmentAssets={investmentAssets || []}
    />
  );
}
