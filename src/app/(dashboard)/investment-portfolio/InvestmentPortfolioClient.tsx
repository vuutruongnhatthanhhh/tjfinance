"use client";

import Link from "next/link";
import { Landmark, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSidebarToggle } from "../DashboardLayoutClient";
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
  const overallProfitLoss = overallCurrent + overallReturned - overallInvested;
  const overallProfitLossColor =
    overallProfitLoss > 0 ? "#4ade80" : overallProfitLoss < 0 ? "#f87171" : undefined;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Header
        onMenuToggle={onMenuToggle}
        title="Danh mục đầu tư"
        subtitle={`${summaries.length} khoản đầu tư`}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar sm:px-6">
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
            subtitle="Giá trị hiện tại + thu về - vốn"
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
              return (
                <Link
                  key={summary.asset.id}
                  href={`/investment-portfolio/${summary.asset.id}`}
                  className="rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "rgba(10,20,13,0.72)",
                    borderColor: "rgba(45,154,75,0.12)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                  }}
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
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border text-center"
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
