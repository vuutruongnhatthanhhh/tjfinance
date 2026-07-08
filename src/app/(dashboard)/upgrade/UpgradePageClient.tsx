"use client";

import { useMemo, useState } from "react";
import { Check, Crown, Loader2, Menu, ShieldCheck, Sparkles, Star } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSidebarToggle, useToast } from "../DashboardLayoutClient";

type Plan = "free" | "plus";
type Cycle = "monthly" | "yearly";

const freeFeatures = [
  "Quản lý thu chi, thu nhập và đầu tư cơ bản",
  "Dashboard tổng quan tài chính",
  "Quản lý danh mục và dữ liệu cá nhân",
];

const plusFeatures = [
  "Upload hóa đơn, phiếu chi, hợp đồng, chứng từ bằng Supabase Storage và cho phép nhiều file",
  "OCR đọc nội dung hóa đơn và tự điền vào input phù hợp",
  "Import Excel nâng cao",
  "Xuất Excel mẫu kế toán",
  "Xuất PDF báo cáo đẹp cho sếp",
  "Gửi báo cáo tự động mỗi tuần/tháng",
];

const prices = {
  free: {
    monthly: 0,
    yearly: 0,
  },
  plus: {
    monthly: 50000,
    yearly: 500000,
  },
} as const;

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full"
        style={{ background: "rgba(45,154,75,0.16)" }}
      >
        <Check className="h-3.5 w-3.5 text-[#6ee7a1]" />
      </span>
      <span className="text-sm leading-6 text-[rgba(226,255,232,0.72)]">
        {children}
      </span>
    </li>
  );
}

export default function UpgradePageClient({
  currentPlan,
  currentCycle,
  expiresAt,
  rawPlan,
}: {
  currentPlan: Plan;
  currentCycle: Cycle;
  expiresAt: string | null;
  rawPlan: Plan;
}) {
  const onMenuToggle = useSidebarToggle();
  const { showToast } = useToast();
  const [billingCycle, setBillingCycle] = useState<Cycle>(
    currentPlan === "plus" ? currentCycle : "monthly",
  );
  const [loadingCycle, setLoadingCycle] = useState<Cycle | null>(null);

  const plusPrice = useMemo(
    () => formatCurrency(prices.plus[billingCycle]),
    [billingCycle],
  );

  const isCurrentPlusCycle =
    currentPlan === "plus" && currentCycle === billingCycle;
  const isDowngradeCycle =
    currentPlan === "plus" &&
    currentCycle === "yearly" &&
    billingCycle === "monthly";

  const handleCheckout = async () => {
    if (loadingCycle || isCurrentPlusCycle) {
      return;
    }

    setLoadingCycle(billingCycle);

    try {
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "plus",
          cycle: billingCycle,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "CREATE_CHECKOUT_FAILED");
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("[upgrade] create checkout failed", error);
      showToast("Không thể tạo link thanh toán PayOS.", "error");
      setLoadingCycle(null);
    }
  };

  const currentPlanLabel =
    rawPlan === "plus" && currentPlan === "free"
      ? "Plus đã hết hạn"
      : currentPlan === "plus"
        ? "Plus"
        : "Free";

  return (
    <div
      className="flex-1 overflow-y-auto px-4 pb-10 pt-4 sm:px-6 lg:px-8"
      data-dashboard-scroll-root
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border text-white"
            style={{
              background: "rgba(8,20,12,0.82)",
              borderColor: "rgba(45,154,75,0.16)",
            }}
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[rgba(226,255,232,0.4)]">
              Gói tài khoản
            </p>
            <h1 className="text-xl font-bold text-white">Nâng cấp tài khoản</h1>
          </div>
        </div>

        <section
          className="overflow-hidden rounded-[32px] border p-6 sm:p-8"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(45,154,75,0.18), transparent 35%), linear-gradient(180deg, rgba(8,20,12,0.98), rgba(6,15,9,0.98))",
            borderColor: "rgba(45,154,75,0.14)",
            boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-[#9cf0b8]"
                style={{
                  borderColor: "rgba(45,154,75,0.18)",
                  background: "rgba(45,154,75,0.08)",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                PAYOS BILLING
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Mở khóa toàn bộ tính năng Plus cho TJFinance
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(226,255,232,0.72)] sm:text-base">
                Free vẫn đủ để quản lý tài chính cơ bản. Plus dành cho nhu cầu
                vận hành thực tế hơn: chứng từ, OCR, import/export và báo cáo
                định kỳ.
              </p>
            </div>

            <div
              className="rounded-3xl border px-5 py-4"
              style={{
                borderColor: "rgba(45,154,75,0.16)",
                background: "rgba(45,154,75,0.06)",
              }}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[rgba(226,255,232,0.42)]">
                Gói hiện tại
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    background:
                      currentPlan === "plus"
                        ? "linear-gradient(135deg, #2D9A4B, #1d7236)"
                        : "rgba(226,255,232,0.08)",
                  }}
                >
                  {currentPlan === "plus" ? (
                    <Crown className="h-5 w-5 text-white" />
                  ) : (
                    <Star className="h-5 w-5 text-white" />
                  )}
                </span>
                <div>
                  <p className="text-lg font-bold text-white">{currentPlanLabel}</p>
                  <p className="text-sm text-[rgba(226,255,232,0.52)]">
                    {currentPlan === "plus" && expiresAt
                      ? `Hiệu lực đến ${formatDate(expiresAt)}`
                      : "Đang dùng miễn phí"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex justify-center">
          <div
            className="inline-flex rounded-2xl border p-1"
            style={{
              borderColor: "rgba(45,154,75,0.16)",
              background: "rgba(8,20,12,0.8)",
            }}
          >
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className="rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all"
              style={{
                background:
                  billingCycle === "monthly"
                    ? "linear-gradient(135deg, #2D9A4B, #1d7236)"
                    : "transparent",
                color: "#fff",
              }}
            >
              Tháng
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className="rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all"
              style={{
                background:
                  billingCycle === "yearly"
                    ? "linear-gradient(135deg, #2D9A4B, #1d7236)"
                    : "transparent",
                color: "#fff",
              }}
            >
              Năm
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <article
            className="rounded-[28px] border p-6"
            style={{
              background: "rgba(8,20,12,0.86)",
              borderColor: "rgba(45,154,75,0.12)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(226,255,232,0.08)" }}
                >
                  <ShieldCheck className="h-5 w-5 text-white" />
                </span>
                <div>
                  <p className="text-xl font-bold text-white">Free</p>
                  <p className="text-sm text-[rgba(226,255,232,0.5)]">
                    Dùng để bắt đầu
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white">0đ</p>
                <p className="text-sm text-[rgba(226,255,232,0.5)]">/ mãi mãi</p>
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              {freeFeatures.map((feature) => (
                <FeatureItem key={feature}>{feature}</FeatureItem>
              ))}
            </ul>
          </article>

          <article
            className="relative overflow-hidden rounded-[28px] border p-6"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(45,154,75,0.16), transparent 38%), rgba(8,20,12,0.96)",
              borderColor: "rgba(45,154,75,0.22)",
              boxShadow: "0 20px 60px rgba(45,154,75,0.14)",
            }}
          >
            <div
              className="absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white"
              style={{ background: "linear-gradient(135deg, #2D9A4B, #1d7236)" }}
            >
              Plus
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, #2D9A4B, #1d7236)",
                  }}
                >
                  <Crown className="h-5 w-5 text-white" />
                </span>
                <div>
                  <p className="text-xl font-bold text-white">Plus</p>
                  <p className="text-sm text-[rgba(226,255,232,0.5)]">
                    Dành cho nhu cầu vận hành thực tế
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white">{plusPrice}</p>
                <p className="text-sm text-[rgba(226,255,232,0.5)]">
                  / {billingCycle === "yearly" ? "năm" : "tháng"}
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              {plusFeatures.map((feature) => (
                <FeatureItem key={feature}>{feature}</FeatureItem>
              ))}
            </ul>

            <div
              className="mt-6 rounded-2xl border px-4 py-4"
              style={{
                borderColor: "rgba(45,154,75,0.14)",
                background: "rgba(45,154,75,0.05)",
              }}
            >
              <p className="text-sm font-semibold text-white">Giá gói Plus</p>
              <p className="mt-2 text-sm leading-6 text-[rgba(226,255,232,0.68)]">
                Theo tháng: {formatCurrency(prices.plus.monthly)}. Theo năm:{" "}
                {formatCurrency(prices.plus.yearly)}.
              </p>
            </div>

            <div className="mt-6">
              {isCurrentPlusCycle ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white/80"
                  style={{
                    background: "rgba(226,255,232,0.08)",
                  }}
                >
                  Anh đang dùng gói này
                </button>
              ) : isDowngradeCycle ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white/50"
                  style={{
                    background: "rgba(226,255,232,0.06)",
                  }}
                >
                  Không hỗ trợ chuyển từ năm xuống tháng khi gói còn hiệu lực
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loadingCycle !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.99]"
                  style={{
                    background: "linear-gradient(135deg, #2D9A4B, #1d7236)",
                    boxShadow: "0 14px 30px rgba(45,154,75,0.25)",
                  }}
                >
                  {loadingCycle ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tạo link thanh toán
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4" />
                      {currentPlan === "plus" &&
                      currentCycle === "monthly" &&
                      billingCycle === "yearly"
                        ? "Nâng cấp lên Plus năm"
                        : "Thanh toán với PayOS"}
                    </>
                  )}
                </button>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
