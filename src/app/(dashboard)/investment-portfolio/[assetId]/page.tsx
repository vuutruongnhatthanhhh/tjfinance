import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Category, Expense, InvestmentAsset, InvestmentReturn, InvestmentValuation } from "@/types";
import InvestmentAssetDetailClient from "./InvestmentAssetDetailClient";

export default async function InvestmentAssetDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }> | { assetId: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const assetId = resolvedParams.assetId;

  const [{ data: asset }, { data: investments }, { data: valuations }, { data: returns }, { data: investmentCategories }] =
    await Promise.all([
      supabase
        .from("investment_assets")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .eq("id", assetId)
        .single(),
      supabase
        .from("investments")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .eq("asset_id", assetId)
        .order("date", { ascending: false }),
      supabase
        .from("investment_valuations")
        .select("*")
        .eq("user_id", user.id)
        .eq("asset_id", assetId)
        .order("valuation_month", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("investment_returns")
        .select("*")
        .eq("user_id", user.id)
        .eq("asset_id", assetId)
        .order("date", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .in("type", ["investment", "business"])
        .order("name", { ascending: true }),
    ]);

  if (!asset) notFound();

  const totalInvested = (investments || []).reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const totalReturned = (returns || []).reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const latestValuation = (valuations || [])[0] as InvestmentValuation | undefined;
  const currentValue = latestValuation ? Number(latestValuation.current_value) : totalInvested;
  const profitLossAmount = currentValue + totalReturned - totalInvested;
  const profitLossPercent =
    totalInvested > 0 ? (profitLossAmount / totalInvested) * 100 : 0;

  return (
    <InvestmentAssetDetailClient
      asset={asset as InvestmentAsset & { category?: Category }}
      investments={(investments || []) as Expense[]}
      investmentCategories={(investmentCategories || []) as Category[]}
      valuations={(valuations || []) as InvestmentValuation[]}
      returns={(returns || []) as InvestmentReturn[]}
      totalInvested={totalInvested}
      totalReturned={totalReturned}
      currentValue={currentValue}
      profitLossAmount={profitLossAmount}
      profitLossPercent={profitLossPercent}
    />
  );
}
