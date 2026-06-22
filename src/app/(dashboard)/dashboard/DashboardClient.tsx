"use client";

import { useSidebarToggle } from "../DashboardLayoutClient";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Expense, Category } from "@/types";

interface DashboardClientProps {
  userName?: string;
  totalExpense: number;
  recentExpenses: (Expense & { category?: Category })[];
  expensesByCategory: { category: Category; total: number }[];
}

const CATEGORY_COLORS = [
  "#2D9A4B", "#4ade80", "#86efac", "#ef4444", "#f97316",
  "#8b5cf6", "#ec4899", "#06b6d4", "#3b82f6", "#eab308",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function getMonthLabel() {
  return new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date());
}

export default function DashboardClient({
  userName,
  totalExpense,
  recentExpenses,
  expensesByCategory,
}: DashboardClientProps) {
  const onMenuToggle = useSidebarToggle();

  const pieData = expensesByCategory.slice(0, 6).map((item, i) => ({
    name: item.category.name,
    value: item.total,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        onMenuToggle={onMenuToggle}
        title="Tổng quan"
        subtitle={getMonthLabel()}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-6">
        {/* Greeting */}
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold dark:text-white text-gray-900">
            {getGreeting()},{" "}
            <span style={{ color: "#2D9A4B" }}>{userName?.split(" ").pop() || "bạn"}</span> 👋
          </h2>
          <p className="text-sm mt-1" style={{ color: "rgba(226,255,232,0.4)" }}>
            Đây là tổng quan tài chính tháng này của bạn
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Chi tiêu tháng này"
            value={formatCurrency(totalExpense)}
            subtitle="Tổng chi tiêu"
            icon={<TrendingDown className="w-6 h-6" />}
            color="red"
          />
          <StatCard
            title="Thu nhập tháng này"
            value={formatCurrency(0)}
            subtitle="Chưa ghi nhận"
            icon={<TrendingUp className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Số dư ước tính"
            value={formatCurrency(0)}
            subtitle="Thu nhập - Chi tiêu"
            icon={<Wallet className="w-6 h-6" />}
            color="blue"
          />
        </div>

        {/* Charts & Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Pie chart */}
          <div
            className="lg:col-span-2 rounded-2xl p-5 border"
            style={{
              background: "rgba(10,20,13,0.7)",
              borderColor: "rgba(45,154,75,0.12)",
              backdropFilter: "blur(10px)",
            }}
          >
            <h3 className="text-sm font-semibold mb-4 dark:text-white text-gray-900">
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

                <div className="space-y-2 mt-3">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span style={{ color: "rgba(226,255,232,0.7)" }} className="truncate max-w-[120px]">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-medium dark:text-white text-gray-900 ml-2 flex-shrink-0">
                        {totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ background: "rgba(45,154,75,0.1)" }}>
                  <TrendingDown className="w-6 h-6" style={{ color: "#2D9A4B" }} />
                </div>
                <p className="text-sm" style={{ color: "rgba(226,255,232,0.4)" }}>
                  Chưa có chi tiêu nào
                </p>
                <Link href="/expenses" className="text-xs mt-2 font-medium hover:underline"
                  style={{ color: "#2D9A4B" }}>
                  Thêm chi tiêu đầu tiên
                </Link>
              </div>
            )}
          </div>

          {/* Recent expenses */}
          <div
            className="lg:col-span-3 rounded-2xl p-5 border"
            style={{
              background: "rgba(10,20,13,0.7)",
              borderColor: "rgba(45,154,75,0.12)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold dark:text-white text-gray-900">
                Chi tiêu gần đây
              </h3>
              <Link
                href="/expenses"
                className="text-xs flex items-center gap-1 hover:underline transition-colors"
                style={{ color: "#2D9A4B" }}
              >
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentExpenses.length > 0 ? (
              <div className="space-y-2">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/5"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{
                        background: `${expense.category?.color || "#2D9A4B"}20`,
                        color: expense.category?.color || "#2D9A4B",
                      }}
                    >
                      {expense.category?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium dark:text-white text-gray-900 truncate">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: "rgba(226,255,232,0.4)" }}>
                          {expense.category?.name}
                        </span>
                        <span className="w-1 h-1 rounded-full" style={{ background: "rgba(226,255,232,0.2)" }} />
                        <span className="text-xs flex items-center gap-1" style={{ color: "rgba(226,255,232,0.3)" }}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(expense.date)}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold flex-shrink-0" style={{ color: "#ef4444" }}>
                      -{formatCurrency(expense.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-sm" style={{ color: "rgba(226,255,232,0.4)" }}>
                  Chưa có giao dịch nào trong tháng này
                </p>
                <Link
                  href="/expenses"
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-medium text-white transition-all"
                  style={{ background: "rgba(45,154,75,0.2)", border: "1px solid rgba(45,154,75,0.3)" }}
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
