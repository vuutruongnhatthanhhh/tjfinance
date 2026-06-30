import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Category, Expense, InvestmentAsset, InvestmentReturn, InvestmentValuation } from "@/types";
import InvestmentPortfolioClient from "./InvestmentPortfolioClient";

export interface InvestmentAssetSummary {
  asset: InvestmentAsset & { category?: Category };
  totalInvested: number;
  totalReturned: number;
  currentValue: number;
  profitLossAmount: number;
  profitLossPercent: number;
  latestValuation?: InvestmentValuation;
  canDelete: boolean;
}

export default async function InvestmentPortfolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: assets }, { data: investments }, { data: valuations }, { data: returns }] =
    await Promise.all([
      supabase
        .from("investment_assets")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false }),
      supabase
        .from("investments")
        .select("*")
        .eq("user_id", user.id)
        .not("asset_id", "is", null)
        .order("date", { ascending: false }),
      supabase
        .from("investment_valuations")
        .select("*")
        .eq("user_id", user.id)
        .order("valuation_month", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("investment_returns")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
    ]);

  const latestValuations = new Map<string, InvestmentValuation>();
  (valuations || []).forEach((item) => {
    if (!latestValuations.has(item.asset_id)) {
      latestValuations.set(item.asset_id, item as InvestmentValuation);
    }
  });

  const summaries: InvestmentAssetSummary[] = (assets || []).map((asset) => {
    const assetInvestments = (investments || []).filter(
      (item) => item.asset_id === asset.id,
    ) as (Expense & { asset_id?: string | null })[];
    const assetReturns = (returns || []).filter(
      (item) => item.asset_id === asset.id,
    ) as InvestmentReturn[];
    const latestValuation = latestValuations.get(asset.id);
    const totalInvested = assetInvestments.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const totalReturned = assetReturns.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const currentValue = latestValuation
      ? Number(latestValuation.current_value)
      : totalInvested;
    const profitLossAmount = asset.is_business
      ? totalReturned - totalInvested
      : currentValue - totalInvested;
    const profitLossPercent =
      totalInvested > 0 ? (profitLossAmount / totalInvested) * 100 : 0;

    return {
      asset: asset as InvestmentAsset & { category?: Category },
      totalInvested,
      totalReturned,
      currentValue,
      profitLossAmount,
      profitLossPercent,
      latestValuation,
      canDelete: assetInvestments.length === 0 && assetReturns.length === 0,
    };
  });

  const nonBusinessSummaries = summaries.filter((item) => !item.asset.is_business);
  const businessSummaries = summaries.filter((item) => item.asset.is_business);

  const investmentOnlyOverallInvested = nonBusinessSummaries.reduce(
    (sum, item) => sum + item.totalInvested,
    0,
  );
  const investmentOnlyOverallCurrent = nonBusinessSummaries.reduce(
    (sum, item) => sum + item.currentValue,
    0,
  );
  const businessOnlyOverallReturned = businessSummaries.reduce(
    (sum, item) => sum + item.totalReturned,
    0,
  );

  return (
    <InvestmentPortfolioClient
      summaries={summaries}
      overallInvested={investmentOnlyOverallInvested}
      overallCurrent={investmentOnlyOverallCurrent}
      overallReturned={businessOnlyOverallReturned}
    />
  );
}
