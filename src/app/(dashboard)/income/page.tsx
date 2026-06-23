import ExpensesClient from "../expenses/ExpensesClient";
import {
  getTransactionPageData,
  TransactionSearchParams,
} from "../transactions/getTransactionPageData";

export default async function IncomePage({
  searchParams,
}: {
  searchParams?: TransactionSearchParams | Promise<TransactionSearchParams>;
}) {
  const data = await getTransactionPageData(searchParams, "income");

  return (
    <ExpensesClient
      initialExpenses={data.initialExpenses}
      categories={data.categories}
      userId={data.userId}
      currentPage={data.currentPage}
      pageSize={data.pageSize}
      totalCount={data.totalCount}
      searchQuery={data.searchQuery}
      filterCategory={data.filterCategory}
      filterDateFrom={data.filterDateFrom}
      filterDateTo={data.filterDateTo}
      transactionType="income"
    />
  );
}
