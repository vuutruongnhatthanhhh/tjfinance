"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Landmark,
  PiggyBank,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSidebarToggle, useToast } from "../DashboardLayoutClient";
import type { InvestmentAssetSummary } from "./page";

interface InvestmentPortfolioClientProps {
  summaries: InvestmentAssetSummary[];
  overallInvested: number;
  overallCurrent: number;
  overallReturned: number;
}

export default function InvestmentPortfolioClient({
  summaries,
  overallInvested,
  overallCurrent,
  overallReturned,
}: InvestmentPortfolioClientProps) {
  const onMenuToggle = useSidebarToggle();
  const { showToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const overallProfitLoss = summaries.reduce(
    (sum, summary) =>
      summary.asset.is_business ? sum : sum + summary.profitLossAmount,
    0,
  );
  const overallProfitLossPercent =
    overallInvested > 0 ? (overallProfitLoss / overallInvested) * 100 : 0;
  const overallProfitLossColor =
    overallProfitLoss > 0
      ? "#4ade80"
      : overallProfitLoss < 0
        ? "#f87171"
        : undefined;
  const selectedSummaries = summaries.filter((summary) =>
    selectedAssetIds.includes(summary.asset.id),
  );

  useEffect(() => {
    router.prefetch("/investments");
  }, [router]);

  useEffect(() => {
    setSelectedAssetIds((current) =>
      current.filter((id) => summaries.some((summary) => summary.asset.id === id)),
    );
  }, [summaries]);

  const toggleSelection = (assetId: string) => {
    setSelectedAssetIds((current) =>
      current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId],
    );
  };

  const deleteAsset = async (summary: InvestmentAssetSummary) => {
    if (!summary.canDelete) {
      window.alert("Khoản đầu tư này vẫn còn giao dịch nên chưa thể xóa.");
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa "${summary.asset.name}" không?`)) {
      return;
    }

    setDeletingAssetId(summary.asset.id);
    const supabase = createClient();

    const { error: valuationDeleteError } = await supabase
      .from("investment_valuations")
      .delete()
      .eq("asset_id", summary.asset.id);

    if (valuationDeleteError) {
      showToast("Không thể xóa khoản đầu tư. Vui lòng thử lại.");
      setDeletingAssetId(null);
      return;
    }

    const { error: assetDeleteError } = await supabase
      .from("investment_assets")
      .delete()
      .eq("id", summary.asset.id);

    if (assetDeleteError) {
      showToast("Không thể xóa khoản đầu tư. Vui lòng thử lại.");
      setDeletingAssetId(null);
      return;
    }

    showToast("Xóa khoản đầu tư thành công");
    setDeletingAssetId(null);
    startTransition(() => router.refresh());
  };

  const handleBulkDelete = async () => {
    if (selectedSummaries.length === 0) return;

    if (selectedSummaries.some((summary) => !summary.canDelete)) {
      window.alert(
        "Có khoản đầu tư vẫn còn giao dịch nên chưa thể xóa hàng loạt.",
      );
      return;
    }

    const names =
      selectedSummaries.length === 1
        ? `"${selectedSummaries[0].asset.name}"`
        : `${selectedSummaries.length} khoản đầu tư đã chọn`;

    if (!window.confirm(`Bạn có chắc muốn xóa ${names} không?`)) {
      return;
    }

    const assetIds = selectedSummaries.map((summary) => summary.asset.id);
    setDeletingAssetId("__bulk__");
    const supabase = createClient();

    const { error: valuationDeleteError } = await supabase
      .from("investment_valuations")
      .delete()
      .in("asset_id", assetIds);

    if (valuationDeleteError) {
      showToast("Không thể xóa khoản đầu tư. Vui lòng thử lại.");
      setDeletingAssetId(null);
      return;
    }

    const { error: assetDeleteError } = await supabase
      .from("investment_assets")
      .delete()
      .in("id", assetIds);

    if (assetDeleteError) {
      showToast("Không thể xóa khoản đầu tư. Vui lòng thử lại.");
      setDeletingAssetId(null);
      return;
    }

    setSelectedAssetIds([]);
    showToast("Xóa khoản đầu tư thành công");
    setDeletingAssetId(null);
    startTransition(() => router.refresh());
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Header
        onMenuToggle={onMenuToggle}
        title="Danh mục đầu tư"
        subtitle={`${summaries.length} khoản đầu tư`}
      />

      <div
        data-dashboard-scroll-root
        className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar sm:px-6"
      >
        <div className="mb-4">
          <Link
            href="/investments"
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(45,154,75,0.14)",
              color: "#e2ffe8",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại giao dịch đầu tư
          </Link>
        </div>

        {selectedSummaries.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedAssetIds([])}
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
              style={{
                borderColor: "rgba(45,154,75,0.16)",
                background: "rgba(255,255,255,0.04)",
                color: "#e2ffe8",
              }}
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isPending || deletingAssetId === "__bulk__"}
              className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 disabled:opacity-60"
            >
              {deletingAssetId === "__bulk__"
                ? "Đang xóa..."
                : `Xóa đã chọn (${selectedSummaries.length})`}
            </button>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Tổng vốn đầu tư"
            value={formatCurrency(overallInvested)}
            subtitle="Tổng tiền đã bỏ vào"
            icon={<PiggyBank className="h-6 w-6" />}
            color="blue"
          />
          <StatCard
            title="Tổng giá trị hiện tại"
            value={formatCurrency(overallCurrent)}
            subtitle="Theo cập nhật mới nhất"
            icon={<Wallet className="h-6 w-6" />}
            color="green"
          />
          <StatCard
            title="Tiền đã thu về"
            value={formatCurrency(overallReturned)}
            subtitle="Dành cho khoản business"
            icon={<Landmark className="h-6 w-6" />}
            color="purple"
          />
          <StatCard
            title="Lời / lỗ tạm tính"
            value={formatCurrency(overallProfitLoss)}
            valueColor={overallProfitLossColor}
            subtitle={`${overallProfitLossPercent.toFixed(2)}% so với vốn`}
            icon={
              overallProfitLoss >= 0 ? (
                <TrendingUp className="h-6 w-6" />
              ) : (
                <TrendingDown className="h-6 w-6" />
              )
            }
            color={overallProfitLoss >= 0 ? "green" : "red"}
          />
        </div>

        {summaries.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {summaries.map((summary) => {
              const isPositive = summary.profitLossAmount >= 0;
              const selected = selectedAssetIds.includes(summary.asset.id);

              return (
                <div
                  key={summary.asset.id}
                  className="rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "rgba(10,20,13,0.72)",
                    borderColor: "rgba(45,154,75,0.12)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                  }}
                >
                  <div className="mb-4 flex">
                    <button
                      type="button"
                      onClick={() => toggleSelection(summary.asset.id)}
                      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                        selected
                          ? "border-transparent bg-[#2D9A4B] text-white"
                          : "bg-white/5 text-transparent"
                      }`}
                      style={{
                        borderColor: selected
                          ? "#2D9A4B"
                          : "rgba(45,154,75,0.18)",
                      }}
                      aria-label={`Chọn ${summary.asset.name}`}
                    >
                      <div
                        className="absolute h-4 w-4 rounded border"
                        style={{
                          borderColor: selected
                            ? "rgba(255,255,255,0.72)"
                            : "rgba(226,255,232,0.45)",
                          background: "transparent",
                        }}
                      />
                      {selected ? (
                        <span className="text-sm leading-none">✓</span>
                      ) : null}
                    </button>
                  </div>

                  <Link
                    href={`/investment-portfolio/${summary.asset.id}`}
                    className="block"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {summary.asset.name}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {summary.asset.category && (
                            <span
                              className="rounded-full px-2.5 py-1 text-xs"
                              style={{
                                background: `${summary.asset.category.color}18`,
                                color: summary.asset.category.color,
                                border: `1px solid ${summary.asset.category.color}30`,
                              }}
                            >
                              {summary.asset.category.name}
                            </span>
                          )}
                          {summary.asset.is_business && (
                            <span
                              className="rounded-full border px-2.5 py-1 text-xs"
                              style={{
                                borderColor: "rgba(59,130,246,0.28)",
                                background: "rgba(59,130,246,0.12)",
                                color: "#bfdbfe",
                              }}
                            >
                              Business
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className="rounded-2xl px-3 py-2 text-right"
                        style={{
                          background: isPositive
                            ? "rgba(34,197,94,0.12)"
                            : "rgba(239,68,68,0.12)",
                        }}
                      >
                        <p
                          className="text-sm font-semibold"
                          style={{ color: isPositive ? "#4ade80" : "#f87171" }}
                        >
                          {summary.profitLossPercent.toFixed(2)}%
                        </p>
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: isPositive ? "#86efac" : "#fca5a5" }}
                        >
                          {summary.profitLossAmount >= 0 ? "+" : ""}
                          {formatCurrency(summary.profitLossAmount)}
                        </p>
                      </div>
                    </div>

                    {summary.asset.description && (
                      <p
                        className="mt-3 line-clamp-2 text-sm"
                        style={{ color: "rgba(226,255,232,0.52)" }}
                      >
                        {summary.asset.description}
                      </p>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div>
                        <p
                          className="text-[11px] uppercase tracking-[0.16em]"
                          style={{ color: "rgba(226,255,232,0.32)" }}
                        >
                          Vốn đầu tư
                        </p>
                        <p className="mt-1 text-base font-semibold text-white">
                          {formatCurrency(summary.totalInvested)}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-[11px] uppercase tracking-[0.16em]"
                          style={{ color: "rgba(226,255,232,0.32)" }}
                        >
                          Giá trị hiện tại
                        </p>
                        <p className="mt-1 text-base font-semibold text-white">
                          {formatCurrency(summary.currentValue)}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-[11px] uppercase tracking-[0.16em]"
                          style={{ color: "rgba(226,255,232,0.32)" }}
                        >
                          Tiền thu về
                        </p>
                        <p className="mt-1 text-base font-semibold text-white">
                          {formatCurrency(summary.totalReturned)}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-[11px] uppercase tracking-[0.16em]"
                          style={{ color: "rgba(226,255,232,0.32)" }}
                        >
                          Cập nhật gần nhất
                        </p>
                        <p className="mt-1 text-sm font-medium text-white">
                          {summary.latestValuation
                            ? formatDate(summary.latestValuation.valuation_month)
                            : "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteAsset(summary)}
                      disabled={isPending || deletingAssetId === summary.asset.id}
                      className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
                      style={{
                        borderColor: "rgba(239,68,68,0.25)",
                        background: "rgba(239,68,68,0.08)",
                        color: "#fca5a5",
                        opacity:
                          isPending || deletingAssetId === summary.asset.id
                            ? 0.7
                            : 1,
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingAssetId === summary.asset.id
                        ? "Đang xóa..."
                        : "Xóa"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border text-center"
            style={{
              background: "rgba(10,20,13,0.72)",
              borderColor: "rgba(45,154,75,0.12)",
            }}
          >
            <Landmark className="h-12 w-12" style={{ color: "#2D9A4B" }} />
            <p className="mt-4 text-base font-semibold text-white">
              Chưa có khoản đầu tư nào
            </p>
            <p
              className="mt-2 max-w-md text-sm"
              style={{ color: "rgba(226,255,232,0.48)" }}
            >
              Tạo giao dịch đầu tư trước, sau đó hệ thống sẽ gom lại thành từng
              khoản để theo dõi vốn, giá trị hiện tại và lời lỗ.
            </p>
            <Link
              href="/investments"
              className="mt-5 rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{
                background: "linear-gradient(135deg, #2D9A4B, #1a7a35)",
              }}
            >
              Đi tới giao dịch đầu tư
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
