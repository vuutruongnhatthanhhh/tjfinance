"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Trash2, Calendar, Filter,
  TrendingDown, X, ChevronDown,
} from "lucide-react";
import { formatCurrency, formatDate, formatNumberInput, parseFormattedNumber, cn } from "@/lib/utils";
import DateInput from "@/components/ui/DateInput";
import { createClient } from "@/lib/supabase/client";
import { Expense, Category } from "@/types";
import Header from "@/components/layout/Header";
import { useSidebarToggle } from "../DashboardLayoutClient";

interface ExpensesClientProps {
  initialExpenses: (Expense & { category?: Category })[];
  categories: Category[];
  userId: string;
}

const ICON_MAP: Record<string, string> = {
  utensils: "🍽️", car: "🚗", "shopping-bag": "🛍️", "gamepad-2": "🎮",
  "heart-pulse": "❤️‍🔥", "book-open": "📚", receipt: "🧾",
  "more-horizontal": "⋯", briefcase: "💼", "trending-up": "📈",
  gift: "🎁", "plus-circle": "➕", circle: "⚪",
};

function CategoryIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
      style={{ background: `${color}22`, border: `1px solid ${color}33` }}
    >
      {ICON_MAP[icon] || "💰"}
    </div>
  );
}

function AddExpenseModal({
  categories,
  userId,
  onClose,
  onSuccess,
}: {
  categories: Category[];
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amountNum = parseFormattedNumber(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: dbError } = await supabase.from("expenses").insert({
      user_id: userId,
      category_id: categoryId || null,
      amount: amountNum,
      description,
      note: note || null,
      date,
    });

    if (dbError) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    onSuccess();
    onClose();
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(45,154,75,0.2)",
    background: "rgba(5,13,8,0.8)",
    color: "#e2ffe8",
    outline: "none",
    fontSize: "14px",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,13,9,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl"
        style={{
          background: "rgba(8,20,12,0.97)",
          border: "1px solid rgba(45,154,75,0.2)",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Handle bar for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(45,154,75,0.3)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "rgba(45,154,75,0.12)" }}>
          <div>
            <h2 className="text-lg font-bold text-white">Thêm chi tiêu</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(226,255,232,0.4)" }}>
              Ghi lại khoản chi tiêu mới
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: "rgba(226,255,232,0.5)", background: "rgba(255,255,255,0.05)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}>
              Số tiền
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatNumberInput(e.target.value))}
                placeholder="0"
                required
                style={{ ...inputStyle, paddingRight: "50px", fontSize: "20px", fontWeight: "bold" }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                style={{ color: "rgba(226,255,232,0.4)" }}>
                VNĐ
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}>
              Mô tả
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ăn trưa, đi taxi, mua sắm..."
              required
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "rgba(226,255,232,0.5)" }}>
                Danh mục
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingRight: "36px",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  {expenseCategories.map((cat) => (
                    <option key={cat.id} value={cat.id} style={{ background: "#0a1a0f" }}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "rgba(226,255,232,0.4)" }} />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "rgba(226,255,232,0.5)" }}>
                Ngày
              </label>
              <DateInput
                value={date}
                onChange={setDate}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}>
              Ghi chú <span style={{ color: "rgba(226,255,232,0.3)" }}>(tuỳ chọn)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thêm ghi chú..."
              rows={2}
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(226,255,232,0.6)",
              }}
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Lưu chi tiêu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExpensesClient({
  initialExpenses,
  categories,
  userId,
}: ExpensesClientProps) {
  const router = useRouter();
  const onMenuToggle = useSidebarToggle();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    const supabase = createClient();
    await supabase.from("expenses").delete().eq("id", id);
    startTransition(() => router.refresh());
    setDeleteId(null);
  };

  const filtered = initialExpenses.filter((e) => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || e.category_id === filterCategory;
    return matchSearch && matchCat;
  });

  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        onMenuToggle={onMenuToggle}
        title="Chi tiêu cá nhân"
        subtitle={`${filtered.length} giao dịch`}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4">
        {/* Summary bar */}
        <div
          className="rounded-2xl p-4 mb-4 flex items-center justify-between gap-4 border"
          style={{
            background: "rgba(239,68,68,0.05)",
            borderColor: "rgba(239,68,68,0.15)",
          }}
        >
          <div>
            <p className="text-xs" style={{ color: "rgba(226,255,232,0.5)" }}>Tổng chi tiêu hiển thị</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: "#ef4444" }}>
              -{formatCurrency(totalFiltered)}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 text-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm chi tiêu</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "rgba(226,255,232,0.3)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm chi tiêu..."
              style={{
                width: "100%",
                padding: "10px 16px 10px 40px",
                borderRadius: "12px",
                border: "1px solid rgba(45,154,75,0.15)",
                background: "rgba(10,20,13,0.7)",
                color: "#e2ffe8",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "rgba(226,255,232,0.3)" }} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                padding: "10px 32px 10px 36px",
                borderRadius: "12px",
                border: "1px solid rgba(45,154,75,0.15)",
                background: "rgba(10,20,13,0.9)",
                color: "#e2ffe8",
                outline: "none",
                fontSize: "14px",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">Tất cả</option>
              {categories
                .filter((c) => c.type === "expense")
                .map((cat) => (
                  <option key={cat.id} value={cat.id} style={{ background: "#0a1a0f" }}>
                    {cat.name}
                  </option>
                ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
              style={{ color: "rgba(226,255,232,0.4)" }} />
          </div>
        </div>

        {/* Expense list */}
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((expense) => (
              <div
                key={expense.id}
                className="group flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 hover:border-primary/20"
                style={{
                  background: "rgba(10,20,13,0.6)",
                  borderColor: "rgba(45,154,75,0.08)",
                }}
              >
                <CategoryIcon
                  icon={expense.category?.icon || "circle"}
                  color={expense.category?.color || "#2D9A4B"}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium dark:text-white text-gray-900 truncate">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {expense.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${expense.category.color}18`,
                          color: expense.category.color,
                          border: `1px solid ${expense.category.color}30`,
                        }}
                      >
                        {expense.category.name}
                      </span>
                    )}
                    <span className="text-xs flex items-center gap-1"
                      style={{ color: "rgba(226,255,232,0.3)" }}>
                      <Calendar className="w-3 h-3" />
                      {formatDate(expense.date)}
                    </span>
                  </div>
                  {expense.note && (
                    <p className="text-xs mt-1 italic truncate"
                      style={{ color: "rgba(226,255,232,0.3)" }}>
                      {expense.note}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: "#ef4444" }}>
                    -{formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={deleteId === expense.id}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all",
                      "hover:bg-red-500/20 text-red-400"
                    )}
                    aria-label="Xoá"
                  >
                    {deleteId === expense.id ? (
                      <div className="w-3 h-3 border border-red-400/50 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(45,154,75,0.1)", border: "1px solid rgba(45,154,75,0.15)" }}>
              <TrendingDown className="w-8 h-8" style={{ color: "#2D9A4B" }} />
            </div>
            <p className="text-base font-medium dark:text-white text-gray-900">
              {search || filterCategory !== "all" ? "Không tìm thấy kết quả" : "Chưa có chi tiêu nào"}
            </p>
            <p className="text-sm mt-2" style={{ color: "rgba(226,255,232,0.4)" }}>
              {search || filterCategory !== "all"
                ? "Thử thay đổi từ khoá tìm kiếm"
                : "Bắt đầu ghi lại chi tiêu của bạn"}
            </p>
            {!search && filterCategory === "all" && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary mt-4 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm chi tiêu đầu tiên
              </button>
            )}
          </div>
        )}
      </div>

      {/* FAB for mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl lg:hidden flex items-center justify-center shadow-2xl z-20"
        style={{
          background: "linear-gradient(135deg, #2D9A4B, #1a7a35)",
          boxShadow: "0 8px 25px rgba(45,154,75,0.5)",
        }}
        aria-label="Thêm chi tiêu"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {showModal && (
        <AddExpenseModal
          categories={categories}
          userId={userId}
          onClose={() => setShowModal(false)}
          onSuccess={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
