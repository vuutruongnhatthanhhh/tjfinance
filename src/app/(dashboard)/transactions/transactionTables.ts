export type TransactionType = "expense" | "income" | "investment";
export type TransactionTable = "expenses" | "incomes" | "investments";

export function getTransactionTableName(
  transactionType: TransactionType,
): TransactionTable {
  if (transactionType === "income") return "incomes";
  if (transactionType === "investment") return "investments";
  return "expenses";
}
