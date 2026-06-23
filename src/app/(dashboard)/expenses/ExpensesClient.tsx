"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  ChevronDown,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";
import {
  cn,
  formatCurrency,
  formatDate,
  formatNumberInput,
  parseFormattedNumber,
} from "@/lib/utils";
import DateInput from "@/components/ui/DateInput";
import ModalOverlay from "@/components/ui/ModalOverlay";
import { createClient } from "@/lib/supabase/client";
import { Category, Expense } from "@/types";
import { useSidebarToggle } from "../DashboardLayoutClient";

interface ExpensesClientProps {
  initialExpenses: (Expense & { category?: Category })[];
  categories: Category[];
  userId: string;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  searchQuery: string;
  filterCategory: string;
  filterDateFrom: string;
  filterDateTo: string;
}

const ICON_MAP: Record<string, string> = {
  utensils: "🍽️",
  car: "🚗",
  "shopping-bag": "🛍️",
  "gamepad-2": "🎮",
  "heart-pulse": "❤️‍🔥",
  "book-open": "📚",
  receipt: "🧾",
  "more-horizontal": "⋯",
  briefcase: "💼",
  "trending-up": "📈",
  gift: "🎁",
  "plus-circle": "➕",
  circle: "⚪",
};

function CategoryIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <div
      className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-base sm:text-lg flex-shrink-0"
      style={{ background: `${color}22`, border: `1px solid ${color}33` }}
    >
      {ICON_MAP[icon] || "💰"}
    </div>
  );
}

function AddExpenseModal({
  categories,
  userId,
  expense,
  onClose,
  onSuccess,
}: {
  categories: Category[];
  userId: string;
  expense?: Expense;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(expense);
  const expenseCategories = categories.filter(
    (category) => category.type === "expense",
  );
  const [amount, setAmount] = useState(
    expense ? formatNumberInput(String(expense.amount)) : "",
  );
  const [description, setDescription] = useState(expense?.description || "");
  const [categoryId, setCategoryId] = useState(
    expense?.category_id || expenseCategories[0]?.id || "",
  );
  const [date, setDate] = useState(
    expense?.date || new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState(expense?.note || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const amountNumber = parseFormattedNumber(amount);
    if (!amountNumber || amountNumber <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      user_id: userId,
      category_id: categoryId || null,
      amount: amountNumber,
      description,
      note: note || null,
      date,
    };

    const { error: dbError } = isEdit
      ? await supabase.from("expenses").update(payload).eq("id", expense!.id)
      : await supabase.from("expenses").insert(payload);

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
    <ModalOverlay
      onClose={onClose}
      panelClassName="w-full sm:max-w-md max-h-[90dvh] sm:max-h-[calc(100dvh-2rem)] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden"
      panelStyle={{
        background: "rgba(8,20,12,0.97)",
        border: "1px solid rgba(45,154,75,0.2)",
        boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex justify-center pt-3 pb-1 sm:hidden">
        <div
          className="w-10 h-1 rounded-full"
          style={{ background: "rgba(45,154,75,0.3)" }}
        />
      </div>

      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(45,154,75,0.12)" }}
      >
        <div>
          <h2 className="text-lg font-bold text-white">
            {isEdit ? "Chỉnh sửa chi tiêu" : "Thêm chi tiêu"}
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: "rgba(226,255,232,0.4)" }}
          >
            {isEdit ? "Cập nhật khoản chi tiêu" : "Ghi lại khoản chi tiêu mới"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{
            color: "rgba(226,255,232,0.5)",
            background: "rgba(255,255,255,0.05)",
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar"
      >
        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: "rgba(226,255,232,0.5)" }}
          >
            Số tiền
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(event) =>
                setAmount(formatNumberInput(event.target.value))
              }
              placeholder="0"
              required
              style={{
                ...inputStyle,
                paddingRight: "50px",
                fontSize: "20px",
                fontWeight: "bold",
              }}
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
              style={{ color: "rgba(226,255,232,0.4)" }}
            >
              VNĐ
            </span>
          </div>
        </div>

        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: "rgba(226,255,232,0.5)" }}
          >
            Mô tả
          </label>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ăn trưa, đi taxi, mua sắm..."
            required
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}
            >
              Danh mục
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                style={{
                  ...inputStyle,
                  paddingRight: "36px",
                  appearance: "none",
                  cursor: "pointer",
                }}
              >
                {expenseCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    style={{ background: "#0a1a0f" }}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "rgba(226,255,232,0.4)" }}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}
            >
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

        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: "rgba(226,255,232,0.5)" }}
          >
            Ghi chú{" "}
            <span style={{ color: "rgba(226,255,232,0.3)" }}>(tùy chọn)</span>
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Thêm ghi chú..."
            rows={2}
            style={{ ...inputStyle, resize: "none" }}
          />
        </div>

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
            Hủy
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
                {isEdit ? "Lưu thay đổi" : "Lưu chi tiêu"}
              </>
            )}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

function ExpenseActionButtons({
  expense,
  deleting,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  deleting: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onEdit(expense)}
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
          "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
        )}
        aria-label="Chỉnh sửa"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(expense.id)}
        disabled={deleting}
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
          "bg-red-500/10 text-red-400 hover:bg-red-500/20",
        )}
        aria-label="Xóa"
      >
        {deleting ? (
          <div className="w-4 h-4 border border-red-400/50 border-t-red-400 rounded-full animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

function ExpenseMobileCard({
  expense,
  deleting,
  onEdit,
  onDelete,
}: {
  expense: Expense & { category?: Category };
  deleting: boolean;
  onEdit: (expense: Expense & { category?: Category }) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "rgba(10,20,13,0.62)",
        borderColor: "rgba(45,154,75,0.08)",
      }}
    >
      <div className="flex items-start gap-4">
        <CategoryIcon
          icon={expense.category?.icon || "circle"}
          color={expense.category?.color || "#2D9A4B"}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white break-words leading-snug">
                {expense.description}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {expense.category ? (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: `${expense.category.color}18`,
                      color: expense.category.color,
                      border: `1px solid ${expense.category.color}30`,
                    }}
                  >
                    {expense.category.name}
                  </span>
                ) : (
                  <span
                    className="text-xs"
                    style={{ color: "rgba(226,255,232,0.38)" }}
                  >
                    Không danh mục
                  </span>
                )}

                <span
                  className="text-xs flex items-center gap-1"
                  style={{ color: "rgba(226,255,232,0.32)" }}
                >
                  <CalendarRange className="w-3 h-3" />
                  {formatDate(expense.date)}
                </span>
              </div>
            </div>

            <span
              className="text-sm font-bold whitespace-nowrap"
              style={{ color: "#ef4444" }}
            >
              -{formatCurrency(expense.amount)}
            </span>
          </div>

          {expense.note && (
            <p
              className="text-xs mt-3 italic break-words"
              style={{ color: "rgba(226,255,232,0.38)" }}
            >
              {expense.note}
            </p>
          )}

          <div className="mt-4 flex items-center justify-end">
            <ExpenseActionButtons
              expense={expense}
              deleting={deleting}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpenseTableRow({
  expense,
  deleting,
  onEdit,
  onDelete,
  isLast,
}: {
  expense: Expense & { category?: Category };
  deleting: boolean;
  onEdit: (expense: Expense & { category?: Category }) => void;
  onDelete: (id: string) => void;
  isLast?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-[2.2fr_1fr_1.1fr_0.9fr_0.6fr] gap-3 px-4 py-2.5 items-center"
      style={{
        borderBottom: isLast ? "none" : "1px solid rgba(45,154,75,0.06)",
      }}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <CategoryIcon
          icon={expense.category?.icon || "circle"}
          color={expense.category?.color || "#2D9A4B"}
        />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-white break-words leading-snug">
            {expense.description}
          </p>
          {expense.note && (
            <p
              className="text-xs mt-1 italic truncate"
              style={{ color: "rgba(226,255,232,0.34)" }}
            >
              {expense.note}
            </p>
          )}
        </div>
      </div>

      <div className="min-w-0">
        {expense.category ? (
          <span
            className="inline-flex text-[11px] px-2 py-0.5 rounded-full"
            style={{
              background: `${expense.category.color}18`,
              color: expense.category.color,
              border: `1px solid ${expense.category.color}30`,
            }}
          >
            {expense.category.name}
          </span>
        ) : (
          <span className="text-xs" style={{ color: "rgba(226,255,232,0.32)" }}>
            Không danh mục
          </span>
        )}
      </div>

      <div
        className="text-xs flex items-center gap-1"
        style={{ color: "rgba(226,255,232,0.42)" }}
      >
        <CalendarRange className="w-3.5 h-3.5" />
        {formatDate(expense.date)}
      </div>

      <div
        className="text-right text-xs font-bold whitespace-nowrap"
        style={{ color: "#ef4444" }}
      >
        -{formatCurrency(expense.amount)}
      </div>

      <div className="flex justify-end">
        <ExpenseActionButtons
          expense={expense}
          deleting={deleting}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export default function ExpensesClient({
  initialExpenses,
  categories,
  userId,
  currentPage,
  pageSize,
  totalCount,
  searchQuery,
  filterCategory,
  filterDateFrom,
  filterDateTo,
}: ExpensesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const onMenuToggle = useSidebarToggle();
  const desktopTableRef = useRef<HTMLDivElement | null>(null);
  const desktopTableScrollRef = useRef<HTMLDivElement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<
    (Expense & { category?: Category }) | undefined
  >();
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(
    filterCategory || "all",
  );
  const [selectedDateFrom, setSelectedDateFrom] = useState(filterDateFrom);
  const [selectedDateTo, setSelectedDateTo] = useState(filterDateTo);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedCategory(filterCategory || "all");
  }, [filterCategory]);

  useEffect(() => {
    setSelectedDateFrom(filterDateFrom);
  }, [filterDateFrom]);

  useEffect(() => {
    setSelectedDateTo(filterDateTo);
  }, [filterDateTo]);

  const buildUrl = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const nextSearch = String(updates.q ?? searchInput);
    const nextCategory = String(updates.category ?? selectedCategory);
    const nextFrom = String(updates.from ?? selectedDateFrom);
    const nextTo = String(updates.to ?? selectedDateTo);
    const nextPage = updates.page ?? currentPage;

    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    if (nextCategory && nextCategory !== "all") {
      params.set("category", String(nextCategory));
    }
    if (nextFrom) params.set("from", String(nextFrom));
    if (nextTo) params.set("to", String(nextTo));
    if (Number(nextPage) > 1) params.set("page", String(nextPage));

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const navigate = (updates: Record<string, string | number | undefined>) => {
    startTransition(() => {
      router.replace(buildUrl(updates));
    });
  };

  const handleEdit = (expense: Expense & { category?: Category }) => {
    setEditExpense(expense);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    const supabase = createClient();
    await supabase.from("expenses").delete().eq("id", id);
    startTransition(() => router.refresh());
    setDeleteId(null);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSelectedCategory("all");
    setSelectedDateFrom("");
    setSelectedDateTo("");
    navigate({ q: "", category: "all", from: "", to: "", page: 1 });
  };

  const activeFilterCount =
    Number(Boolean(searchQuery.trim())) +
    Number(selectedCategory !== "all") +
    Number(Boolean(selectedDateFrom)) +
    Number(Boolean(selectedDateTo));
  const hasActiveFilters = activeFilterCount > 0;
  const showTotalExpense = hasActiveFilters && !isPending;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentExpenses = initialExpenses;

  useEffect(() => {
    if (currentPage > totalPages) {
      navigate({ page: totalPages });
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    desktopTableRef.current?.scrollIntoView({
      block: "start",
      behavior: "auto",
    });
    if (desktopTableScrollRef.current) {
      desktopTableScrollRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [currentPage, searchQuery, filterCategory, filterDateFrom, filterDateTo]);

  const filterInputStyle = {
    width: "100%",
    padding: "9px 14px 9px 38px",
    borderRadius: "12px",
    border: "1px solid rgba(45,154,75,0.15)",
    background: "rgba(10,20,13,0.7)",
    color: "#e2ffe8",
    outline: "none",
    fontSize: "14px",
  };

  const selectStyle = {
    width: "100%",
    padding: "9px 14px 9px 38px",
    borderRadius: "12px",
    border: "1px solid rgba(45,154,75,0.15)",
    background: "rgba(10,20,13,0.9)",
    color: "#e2ffe8",
    outline: "none",
    fontSize: "14px",
    appearance: "none" as const,
    cursor: "pointer",
  };

  const dateFilterStyle = {
    width: "100%",
    padding: "9px 14px 9px 38px",
    borderRadius: "12px",
    border: "1px solid rgba(45,154,75,0.15)",
    background: "rgba(10,20,13,0.7)",
    color: "#e2ffe8",
    outline: "none",
    fontSize: "14px",
  };

  const submitSearch = () => {
    navigate({ q: searchInput.trim(), page: 1 });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      <div className="flex-1 overflow-y-auto md:overflow-hidden custom-scrollbar px-4 sm:px-6 py-4">
        <div className="flex min-h-full flex-col md:h-full">
          <div className="space-y-2.5 mb-3 shrink-0">
            <div
              className="rounded-2xl border p-2.5"
              style={{
                background: "rgba(10,20,13,0.5)",
                borderColor: "rgba(45,154,75,0.08)",
              }}
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch();
                }}
                className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(0,1.55fr)_0.9fr_0.95fr_0.95fr] xl:items-end"
              >
                <div className="space-y-1">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "rgba(226,255,232,0.32)" }}
                  >
                    Tìm kiếm
                  </p>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: "rgba(226,255,232,0.3)" }}
                      />
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Tìm kiếm tên chi tiêu hoặc ghi chú..."
                        style={filterInputStyle}
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex h-[40px] items-center justify-center gap-2 px-4 rounded-xl text-sm font-medium border transition-colors"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(45,154,75,0.24), rgba(45,154,75,0.12))",
                        borderColor: "rgba(45,154,75,0.28)",
                        color: "#e2ffe8",
                      }}
                    >
                      <Search className="w-4 h-4" />
                      Tìm
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "rgba(226,255,232,0.32)" }}
                  >
                    Danh mục
                  </p>
                  <div className="relative">
                    <Filter
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: "rgba(226,255,232,0.3)" }}
                    />
                    <select
                      value={selectedCategory}
                      onChange={(event) => {
                        const next = event.target.value;
                        setSelectedCategory(next);
                        navigate({ category: next, page: 1 });
                      }}
                      style={selectStyle}
                    >
                      <option value="all">Tất cả</option>
                      {categories
                        .filter((category) => category.type === "expense")
                        .map((category) => (
                          <option
                            key={category.id}
                            value={category.id}
                            style={{ background: "#0a1a0f" }}
                          >
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "rgba(226,255,232,0.32)" }}
                  >
                    Từ ngày
                  </p>
                  <div className="relative">
                    <CalendarRange
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: "rgba(226,255,232,0.3)" }}
                    />
                    <DateInput
                      value={selectedDateFrom}
                      onChange={(value) => {
                        setSelectedDateFrom(value);
                        navigate({ from: value, page: 1 });
                      }}
                      style={dateFilterStyle}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "rgba(226,255,232,0.32)" }}
                  >
                    Đến ngày
                  </p>
                  <div className="relative">
                    <CalendarRange
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: "rgba(226,255,232,0.3)" }}
                    />
                    <DateInput
                      value={selectedDateTo}
                      onChange={(value) => {
                        setSelectedDateTo(value);
                        navigate({ to: value, page: 1 });
                      }}
                      style={dateFilterStyle}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <p className="text-xs" style={{ color: "rgba(226,255,232,0.45)" }}>
                  {totalCount} giao dịch
                </p>

                {showTotalExpense && (
                  <p className="text-xs font-medium text-red-400">
                    Tổng chi tiêu: -
                    {formatCurrency(
                      currentExpenses.reduce(
                        (sum, expense) => sum + Number(expense.amount),
                        0,
                      ),
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(45,154,75,0.14)",
                      color: "#e2ffe8",
                    }}
                  >
                    <X className="w-4 h-4" />
                    Xóa bộ lọc
                  </button>
                )}

                <button
                  onClick={() => {
                    setEditExpense(undefined);
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors"
                  style={{
                    background: "linear-gradient(135deg, #2D9A4B, #237c3d)",
                    borderColor: "rgba(45,154,75,0.45)",
                    color: "#ffffff",
                    boxShadow: "0 8px 18px rgba(45,154,75,0.22)",
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm
                </button>
              </div>
            </div>
          </div>

          {currentExpenses.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {currentExpenses.map((expense) => (
                  <ExpenseMobileCard
                    key={expense.id}
                    expense={expense}
                    deleting={deleteId === expense.id}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              <div
                ref={desktopTableRef}
                className="hidden md:flex md:min-h-0 md:flex-1 md:flex-col rounded-2xl border overflow-hidden"
                style={{
                  background: "rgba(10,20,13,0.62)",
                  borderColor: "rgba(45,154,75,0.06)",
                }}
              >
                <div
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-2 border-b shrink-0"
                  style={{
                    background: "rgba(10,20,13,0.72)",
                    borderColor: "rgba(45,154,75,0.08)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <p
                    className="text-xs sm:text-sm"
                    style={{ color: "rgba(226,255,232,0.45)" }}
                  >
                    Trang {currentPage} / {totalPages}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate({ page: Math.max(1, currentPage - 1) })
                      }
                      disabled={currentPage <= 1}
                      className="px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderColor: "rgba(45,154,75,0.14)",
                        color: "#e2ffe8",
                      }}
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          page: Math.min(totalPages, currentPage + 1),
                        })
                      }
                      disabled={currentPage >= totalPages}
                      className="px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderColor: "rgba(45,154,75,0.14)",
                        color: "#e2ffe8",
                      }}
                    >
                      Sau
                    </button>
                  </div>
                </div>

                <div
                  ref={desktopTableScrollRef}
                  className="min-h-0 flex-1 overflow-y-auto custom-scrollbar"
                >
                  <div
                    className="sticky top-0 z-10 grid grid-cols-[2.2fr_1fr_1.1fr_0.9fr_0.6fr] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{
                      color: "rgba(226,255,232,0.32)",
                      background: "rgba(10,20,13,0.96)",
                      borderBottom: "1px solid rgba(45,154,75,0.08)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <div>Khoản chi</div>
                    <div>Danh mục</div>
                    <div>Ngày</div>
                    <div className="text-right">Số tiền</div>
                    <div className="text-right">Thao tác</div>
                  </div>

                  {currentExpenses.map((expense) => (
                    <ExpenseTableRow
                      key={expense.id}
                      expense={expense}
                      deleting={deleteId === expense.id}
                      isLast={
                        currentExpenses[currentExpenses.length - 1]?.id ===
                        expense.id
                      }
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center md:flex-1">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "rgba(45,154,75,0.1)",
                  border: "1px solid rgba(45,154,75,0.15)",
                }}
              >
                <TrendingDown
                  className="w-8 h-8"
                  style={{ color: "#2D9A4B" }}
                />
              </div>
              <p className="text-base font-medium dark:text-white text-gray-900">
                {hasActiveFilters
                  ? "Không tìm thấy giao dịch phù hợp"
                  : "Chưa có chi tiêu nào"}
              </p>
              <p
                className="text-sm mt-2"
                style={{ color: "rgba(226,255,232,0.4)" }}
              >
                {hasActiveFilters
                  ? "Thử đổi từ khóa, danh mục hoặc khoảng ngày"
                  : "Bắt đầu ghi lại các khoản chi tiêu của bạn"}
              </p>
              {!hasActiveFilters && (
                <button
                  onClick={() => {
                    setEditExpense(undefined);
                    setShowModal(true);
                  }}
                  className="btn-primary mt-4 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm chi tiêu đầu tiên
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          setEditExpense(undefined);
          setShowModal(true);
        }}
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
          expense={editExpense}
          onClose={() => setShowModal(false)}
          onSuccess={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
