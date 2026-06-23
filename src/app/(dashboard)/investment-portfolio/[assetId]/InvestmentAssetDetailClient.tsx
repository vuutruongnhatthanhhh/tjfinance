"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarRange, Landmark, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import DateInput from "@/components/ui/DateInput";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, formatNumberInput, parseFormattedNumber } from "@/lib/utils";
import { Category, Expense, InvestmentAsset, InvestmentReturn, InvestmentValuation } from "@/types";
import { useSidebarToggle } from "../../DashboardLayoutClient";

interface InvestmentAssetDetailClientProps {
  asset: InvestmentAsset & { category?: Category };
  investments: Expense[];
  valuations: InvestmentValuation[];
  returns: InvestmentReturn[];
  totalInvested: number;
  totalReturned: number;
  currentValue: number;
  profitLossAmount: number;
  profitLossPercent: number;
}

function normalizeMonthDate(value: string) {
  if (!value) return value;
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

export default function InvestmentAssetDetailClient({
  asset,
  investments,
  valuations,
  returns,
  totalInvested,
  totalReturned,
  currentValue,
  profitLossAmount,
  profitLossPercent,
}: InvestmentAssetDetailClientProps) {
  const onMenuToggle = useSidebarToggle();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [valuationDate, setValuationDate] = useState(
    valuations[0]?.valuation_month || new Date().toISOString().split("T")[0],
  );
  const [valuationAmount, setValuationAmount] = useState(
    valuations[0]?.current_value
      ? formatNumberInput(String(valuations[0].current_value))
      : "",
  );
  const [valuationNote, setValuationNote] = useState(valuations[0]?.note || "");
  const [returnAmount, setReturnAmount] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [returnNote, setReturnNote] = useState("");
  const [error, setError] = useState("");

  const profitLossColor =
    profitLossAmount > 0 ? "#4ade80" : profitLossAmount < 0 ? "#f87171" : undefined;

  const saveValuation = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const amountNumber = parseFormattedNumber(valuationAmount);

    if (amountNumber < 0) {
      setError("Giá trị hiện tại không hợp lệ.");
      return;
    }

    const supabase = createClient();
    const { error: dbError } = await supabase.from("investment_valuations").upsert(
      {
        asset_id: asset.id,
        user_id: asset.user_id,
        valuation_month: normalizeMonthDate(valuationDate),
        current_value: amountNumber,
        note: valuationNote || null,
      },
      { onConflict: "asset_id,valuation_month" },
    );

    if (dbError) {
      setError("Không thể lưu giá trị tháng. Vui lòng thử lại.");
      return;
    }

    startTransition(() => router.refresh());
  };

  const addReturn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const amountNumber = parseFormattedNumber(returnAmount);

    if (!amountNumber || amountNumber <= 0) {
      setError("Số tiền thu về không hợp lệ.");
      return;
    }

    const supabase = createClient();
    const { error: dbError } = await supabase.from("investment_returns").insert({
      asset_id: asset.id,
      user_id: asset.user_id,
      amount: amountNumber,
      description: returnDescription.trim() || "Thu tiền về",
      note: returnNote || null,
      date: returnDate,
    });

    if (dbError) {
      setError("Không thể thêm giao dịch thu tiền về.");
      return;
    }

    setReturnAmount("");
    setReturnDescription("");
    setReturnNote("");
    setReturnDate(new Date().toISOString().split("T")[0]);
    startTransition(() => router.refresh());
  };

  const deleteReturn = async (returnId: string) => {
    const supabase = createClient();
    await supabase.from("investment_returns").delete().eq("id", returnId);
    startTransition(() => router.refresh());
  };

  const deleteValuation = async (valuationId: string) => {
    const supabase = createClient();
    await supabase.from("investment_valuations").delete().eq("id", valuationId);
    startTransition(() => router.refresh());
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Header
        onMenuToggle={onMenuToggle}
        title={asset.name}
        subtitle={asset.category?.name || "Khoản đầu tư"}
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/investment-portfolio"
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(45,154,75,0.14)",
              color: "#e2ffe8",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh mục đầu tư
          </Link>

          {asset.is_business && (
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium"
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

        {error && (
          <div
            className="mb-4 rounded-2xl px-4 py-3 text-sm"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Vốn đầu tư"
            value={formatCurrency(totalInvested)}
            subtitle="Tổng các giao dịch vốn"
            icon={<Landmark className="h-6 w-6" />}
            color="blue"
          />
          <StatCard
            title="Giá trị hiện tại"
            value={formatCurrency(currentValue)}
            subtitle="Theo lần cập nhật mới nhất"
            icon={<CalendarRange className="h-6 w-6" />}
            color="green"
          />
          <StatCard
            title="Đã thu về"
            value={formatCurrency(totalReturned)}
            subtitle="Tiền quay về từ khoản đầu tư"
            icon={<TrendingUp className="h-6 w-6" />}
            color="purple"
          />
          <StatCard
            title="Lời / lỗ"
            value={`${profitLossAmount >= 0 ? "+" : ""}${formatCurrency(profitLossAmount)}`}
            valueColor={profitLossColor}
            subtitle={`${profitLossPercent.toFixed(2)}% so với vốn`}
            icon={
              profitLossAmount >= 0 ? (
                <TrendingUp className="h-6 w-6" />
              ) : (
                <TrendingDown className="h-6 w-6" />
              )
            }
            color={profitLossAmount >= 0 ? "green" : "red"}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div
            className="rounded-3xl border p-5"
            style={{
              background: "rgba(10,20,13,0.72)",
              borderColor: "rgba(45,154,75,0.12)",
            }}
          >
            <div className="mb-4">
              <p className="text-lg font-semibold text-white">
                Cập nhật giá trị hàng tháng
              </p>
              <p
                className="mt-1 text-sm"
                style={{ color: "rgba(226,255,232,0.45)" }}
              >
                Mỗi tháng anh nhập tổng giá trị hiện tại của khoản đầu tư này, hệ
                thống sẽ tự tính lời lỗ.
              </p>
            </div>

            <form onSubmit={saveValuation} className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "rgba(226,255,232,0.5)" }}>
                  Tháng ghi nhận
                </label>
                <DateInput
                  value={valuationDate}
                  onChange={setValuationDate}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid rgba(45,154,75,0.2)",
                    background: "rgba(5,13,8,0.8)",
                    color: "#e2ffe8",
                    outline: "none",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "rgba(226,255,232,0.5)" }}>
                  Giá trị hiện tại
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={valuationAmount}
                  onChange={(event) =>
                    setValuationAmount(formatNumberInput(event.target.value))
                  }
                  className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                  style={{
                    borderColor: "rgba(45,154,75,0.2)",
                    background: "rgba(5,13,8,0.8)",
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "rgba(226,255,232,0.5)" }}>
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={valuationNote}
                  onChange={(event) => setValuationNote(event.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                  style={{
                    borderColor: "rgba(45,154,75,0.2)",
                    background: "rgba(5,13,8,0.8)",
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Lưu giá trị tháng
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {valuations.map((valuation) => (
                <div
                  key={valuation.id}
                  className="flex items-center justify-between rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: "rgba(45,154,75,0.1)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {formatDate(valuation.valuation_month)}
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "rgba(226,255,232,0.45)" }}
                    >
                      {valuation.note || "Không có ghi chú"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-white">
                      {formatCurrency(valuation.current_value)}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteValuation(valuation.id)}
                      className="rounded-xl bg-red-500/10 p-2 text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {asset.is_business && (
              <div
                className="rounded-3xl border p-5"
                style={{
                  background: "rgba(10,20,13,0.72)",
                  borderColor: "rgba(45,154,75,0.12)",
                }}
              >
                <p className="text-lg font-semibold text-white">
                  Thu tiền về từ khoản đầu tư
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "rgba(226,255,232,0.45)" }}
                >
                  Dùng cho các khoản business có dòng tiền quay về, ví dụ ký hợp
                  đồng hoặc chia lợi nhuận.
                </p>

                <form onSubmit={addReturn} className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Nội dung thu tiền"
                    value={returnDescription}
                    onChange={(event) => setReturnDescription(event.target.value)}
                    className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                    style={{
                      borderColor: "rgba(45,154,75,0.2)",
                      background: "rgba(5,13,8,0.8)",
                    }}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Số tiền"
                      value={returnAmount}
                      onChange={(event) =>
                        setReturnAmount(formatNumberInput(event.target.value))
                      }
                      className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                      style={{
                        borderColor: "rgba(45,154,75,0.2)",
                        background: "rgba(5,13,8,0.8)",
                      }}
                    />
                    <DateInput
                      value={returnDate}
                      onChange={setReturnDate}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: "1px solid rgba(45,154,75,0.2)",
                        background: "rgba(5,13,8,0.8)",
                        color: "#e2ffe8",
                        outline: "none",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Ghi chú"
                    value={returnNote}
                    onChange={(event) => setReturnNote(event.target.value)}
                    className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                    style={{
                      borderColor: "rgba(45,154,75,0.2)",
                      background: "rgba(5,13,8,0.8)",
                    }}
                  />
                  <button type="submit" className="btn-primary inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm giao dịch thu tiền
                  </button>
                </form>

                <div className="mt-5 space-y-3">
                  {returns.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border px-4 py-3"
                      style={{
                        borderColor: "rgba(45,154,75,0.1)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.description}
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: "rgba(226,255,232,0.45)" }}
                        >
                          {formatDate(item.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-green-400">
                          +{formatCurrency(item.amount)}
                        </p>
                        <button
                          type="button"
                          onClick={() => deleteReturn(item.id)}
                          className="rounded-xl bg-red-500/10 p-2 text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className="rounded-3xl border p-5"
              style={{
                background: "rgba(10,20,13,0.72)",
                borderColor: "rgba(45,154,75,0.12)",
              }}
            >
              <p className="text-lg font-semibold text-white">Các lần rót vốn</p>
              <div className="mt-4 space-y-3">
                {investments.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border px-4 py-3"
                    style={{
                      borderColor: "rgba(45,154,75,0.1)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.description}
                      </p>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "rgba(226,255,232,0.45)" }}
                      >
                        {formatDate(item.date)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-white">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
