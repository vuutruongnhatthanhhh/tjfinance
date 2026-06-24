"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowRight,
  Calendar,
  Landmark,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Category, Expense } from "@/types";
import { useSidebarToggle } from "../DashboardLayoutClient";

interface DashboardClientProps {
  userName?: string;
  selectedMonth: number;
  selectedYear: number;
  totalExpense: number;
  totalIncome: number;
  totalInvestment: number;
  recentExpenses: (Expense & { category?: Category })[];
  expensesByCategory: { category: Category; total: number }[];
}

const CATEGORY_COLORS = [
  "#2D9A4B",
  "#4ade80",
  "#86efac",
  "#ef4444",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#3b82f6",
  "#eab308",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function formatMonthYear(month: number, year: number) {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export default function DashboardClient({
  userName,
  selectedMonth,
  selectedYear,
  totalExpense,
  totalIncome,
  totalInvestment,
  recentExpenses,
  expensesByCategory,
}: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const onMenuToggle = useSidebarToggle();
  const estimatedBalance = totalIncome - totalExpense - totalInvestment;
  const estimatedBalanceColor =
    estimatedBalance > 0
      ? "#4ade80"
      : estimatedBalance < 0
        ? "#f87171"
        : undefined;

  const pieData = expensesByCategory.slice(0, 6).map((item, index) => ({
    name: item.category.name,
    value: item.total,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        value: index + 1,
        label: new Intl.DateTimeFormat("vi-VN", { month: "long" }).format(
          new Date(2024, index, 1),
        ),
      })),
    [],
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, index) => currentYear - 3 + index);
  }, []);

  const updatePeriod = (month: number, year: number) => {
    const params = new URLSearchParams();
    params.set("month", String(month));
    params.set("year", String(year));

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Header
        onMenuToggle={onMenuToggle}
        title="Tổng quan"
        subtitle={formatMonthYear(selectedMonth, selectedYear)}
      />

      <div
        data-dashboard-scroll-root
        className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar sm:px-6"
      >
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getGreeting()},{" "}
            <span style={{ color: "#2D9A4B" }}>
              {userName?.split(" ").pop() || "bạn"}
            </span>
          </h2>
          <p className="mt-1 text-sm" style={{ color: "rgba(226,255,232,0.4)" }}>
            Đây là tổng quan tài chính theo tháng bạn chọn
          </p>
        </div>

        <div
          className="mb-6 rounded-2xl border p-4"
          style={{
            background: "rgba(10,20,13,0.7)",
            borderColor: "rgba(45,154,75,0.12)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "rgba(226,255,232,0.45)" }}
                >
                  Tháng
                </label>
                <select
                  value={selectedMonth}
                  onChange={(event) =>
                    updatePeriod(Number(event.target.value), selectedYear)
                  }
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                  style={{
                    background: "rgba(5,15,8,0.8)",
                    borderColor: "rgba(45,154,75,0.18)",
                    color: "#e2ffe8",
                  }}
                >
                  {monthOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      style={{ background: "#0a1a0f" }}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "rgba(226,255,232,0.45)" }}
                >
                  Năm
                </label>
                <select
                  value={selectedYear}
                  onChange={(event) =>
                    updatePeriod(selectedMonth, Number(event.target.value))
                  }
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                  style={{
                    background: "rgba(5,15,8,0.8)",
                    borderColor: "rgba(45,154,75,0.18)",
                    color: "#e2ffe8",
                  }}
                >
                  {yearOptions.map((year) => (
                    <option
                      key={year}
                      value={year}
                      style={{ background: "#0a1a0f" }}
                    >
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const now = new Date();
                updatePeriod(now.getMonth() + 1, now.getFullYear());
              }}
              className="rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(45,154,75,0.14)",
                color: "#e2ffe8",
              }}
              disabled={isPending}
            >
              Tháng hiện tại
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Thu nhập tháng này"
            value={formatCurrency(totalIncome)}
            subtitle="Tổng thu nhập"
            icon={<TrendingUp className="h-6 w-6" />}
            color="green"
          />
          <StatCard
            title="Chi tiêu tháng này"
            value={formatCurrency(totalExpense)}
            subtitle="Tổng chi tiêu"
            icon={<TrendingDown className="h-6 w-6" />}
            color="red"
          />
          <StatCard
            title="Đầu tư tháng này"
            value={formatCurrency(totalInvestment)}
            subtitle="Tổng đầu tư"
            icon={<Landmark className="h-6 w-6" />}
            color="blue"
          />
          <StatCard
            title="Số dư ước tính"
            value={formatCurrency(estimatedBalance)}
            valueColor={estimatedBalanceColor}
            subtitle="Thu nhập - Chi tiêu - Đầu tư"
            icon={<Wallet className="h-6 w-6" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div
            className="rounded-2xl border p-5 lg:col-span-2"
            style={{
              background: "rgba(10,20,13,0.7)",
              borderColor: "rgba(45,154,75,0.12)",
              backdropFilter: "blur(10px)",
            }}
          >
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Chi tiêu theo danh mục
            </h3>

            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        background: "rgba(10,20,13,0.95)",
                        border: "1px solid rgba(45,154,75,0.3)",
                        borderRadius: "12px",
                        color: "#e2ffe8",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-3 space-y-2">
                  {pieData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ background: item.color }}
                        />
                        <span
                          className="max-w-[120px] truncate"
                          style={{ color: "rgba(226,255,232,0.7)" }}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span className="ml-2 flex-shrink-0 font-medium text-gray-900 dark:text-white">
                        {totalExpense > 0
                          ? Math.round((item.value / totalExpense) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "rgba(45,154,75,0.1)" }}
                >
                  <TrendingDown className="h-6 w-6" style={{ color: "#2D9A4B" }} />
                </div>
                <p className="text-sm" style={{ color: "rgba(226,255,232,0.4)" }}>
                  Chưa có chi tiêu nào
                </p>
                <Link
                  href="/expenses"
                  className="mt-2 text-xs font-medium hover:underline"
                  style={{ color: "#2D9A4B" }}
                >
                  Thêm chi tiêu đầu tiên
                </Link>
              </div>
            )}
          </div>

          <div
            className="rounded-2xl border p-5 lg:col-span-3"
            style={{
              background: "rgba(10,20,13,0.7)",
              borderColor: "rgba(45,154,75,0.12)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Chi tiêu gần đây
              </h3>
              <Link
                href="/expenses"
                className="flex items-center gap-1 text-xs transition-colors hover:underline"
                style={{ color: "#2D9A4B" }}
              >
                Xem tất cả <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentExpenses.length > 0 ? (
              <div className="space-y-2">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                      style={{
                        background: `${expense.category?.color || "#2D9A4B"}20`,
                        color: expense.category?.color || "#2D9A4B",
                      }}
                    >
                      {expense.category?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {expense.description}
                      </p>
                      <div className="mt-1 space-y-0.5">
                        <span
                          className="block truncate text-xs"
                          style={{ color: "rgba(226,255,232,0.4)" }}
                        >
                          {expense.category?.name}
                        </span>
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "rgba(226,255,232,0.3)" }}
                        >
                          <Calendar className="h-3 w-3" />
                          {formatDate(expense.date)}
                        </span>
                      </div>
                    </div>
                    <span
                      className="flex-shrink-0 text-sm font-semibold"
                      style={{ color: "#ef4444" }}
                    >
                      -{formatCurrency(expense.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-center">
                <p className="text-sm" style={{ color: "rgba(226,255,232,0.4)" }}>
                  Chưa có giao dịch nào trong tháng này
                </p>
                <Link
                  href="/expenses"
                  className="mt-3 rounded-xl px-4 py-2 text-xs font-medium text-white transition-all"
                  style={{
                    background: "rgba(45,154,75,0.2)",
                    border: "1px solid rgba(45,154,75,0.3)",
                  }}
                >
                  + Thêm chi tiêu
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
