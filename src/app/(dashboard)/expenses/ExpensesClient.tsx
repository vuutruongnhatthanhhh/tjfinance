"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  ChevronDown,
  Filter,
  HelpCircle,
  Menu,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
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
import { Category, Expense, InvestmentAsset } from "@/types";
import {
  getTransactionTableName,
  TransactionType,
} from "../transactions/transactionTables";
import { useSidebarToggle, useToast } from "../DashboardLayoutClient";

interface ExpensesClientProps {
  initialExpenses: (Expense & { category?: Category })[];
  categories: Category[];
  investmentAssets?: InvestmentAsset[];
  userId: string;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  searchQuery: string;
  filterCategory: string;
  filterDateFrom: string;
  filterDateTo: string;
  transactionType?: TransactionType;
}

const ICON_MAP: Record<string, string> = {
  utensils: "🍽️",
  pizza: "🍕",
  burger: "🍔",
  coffee: "☕",
  boba: "🧋",
  noodle: "🍜",
  sushi: "🍱",
  cake: "🍰",
  salad: "🥗",
  beer: "🍺",
  car: "🚗",
  motorbike: "🏍️",
  bus: "🚌",
  taxi: "🚕",
  plane: "✈️",
  train: "🚂",
  ship: "🚢",
  fuel: "⛽",
  "shopping-bag": "🛍️",
  cart: "🛒",
  clothes: "👗",
  shoes: "👟",
  cosmetic: "💄",
  ring: "💍",
  "heart-pulse": "❤️‍🔥",
  pill: "💊",
  hospital: "🏥",
  gym: "🏋️",
  yoga: "🧘",
  dental: "🦷",
  "book-open": "📚",
  graduation: "🎓",
  pencil: "✏️",
  laptop: "💻",
  phone: "📱",
  "gamepad-2": "🎮",
  movie: "🎬",
  music: "🎵",
  sport: "⚽",
  travel: "🏖️",
  camping: "🏕️",
  reading: "📖",
  home: "🏠",
  furniture: "🛋️",
  repair: "🔧",
  electric: "💡",
  water: "💧",
  cleaning: "🧹",
  receipt: "🧾",
  "trending-up": "📈",
  money: "💰",
  card: "💳",
  bank: "🏦",
  tax: "📋",
  briefcase: "💼",
  gift: "🎁",
  birthday: "🎂",
  family: "👨‍👩‍👧",
  pet: "🐾",
  charity: "❤️",
  star: "⭐",
  key: "🔑",
  map: "🗺️",
  "plus-circle": "➕",
  "more-horizontal": "⋯",
  circle: "⚪",
};

const EXPENSE_DESCRIPTION_MAX_LENGTH = 80;
const INVESTMENT_ASSET_NAME_MAX_LENGTH = 80;
const INVESTMENT_ASSET_DESCRIPTION_MAX_LENGTH = 120;
const EXPENSE_NOTE_MAX_LENGTH = 200;
const SEARCH_INPUT_MAX_LENGTH = 100;
const RETURN_DESCRIPTION_MAX_LENGTH = 120;
const RETURN_NOTE_MAX_LENGTH = 200;

const TRANSACTION_CONFIG: Record<
  TransactionType,
  {
    amountColor: string;
    amountPrefix: string;
    categoryFallback: string;
    emptyDescription: string;
    emptyTitle: string;
    itemLabel: string;
    itemLabelPlural: string;
    modalCreateTitle: string;
    modalEditTitle: string;
    modalCreateSubtitle: string;
    modalEditSubtitle: string;
    notePlaceholder: string;
    saveCreateLabel: string;
    searchPlaceholder: string;
    totalLabel: string;
    addButtonLabel: string;
    addFirstLabel: string;
    tableColumnLabel: string;
    mobileFabLabel: string;
  }
> = {
  expense: {
    amountColor: "#ef4444",
    amountPrefix: "-",
    categoryFallback: "Không danh mục",
    emptyDescription: "Bắt đầu ghi lại các khoản chi tiêu của bạn",
    emptyTitle: "Chưa có chi tiêu nào",
    itemLabel: "chi tiêu",
    itemLabelPlural: "giao dịch",
    modalCreateTitle: "Thêm chi tiêu",
    modalEditTitle: "Chỉnh sửa chi tiêu",
    modalCreateSubtitle: "Ghi lại khoản chi tiêu mới",
    modalEditSubtitle: "Cập nhật khoản chi tiêu",
    notePlaceholder: "Thêm ghi chú...",
    saveCreateLabel: "Lưu chi tiêu",
    searchPlaceholder: "Tìm kiếm theo tên chi tiêu hoặc ghi chú...",
    totalLabel: "Tổng chi tiêu",
    addButtonLabel: "Thêm",
    addFirstLabel: "Thêm chi tiêu đầu tiên",
    tableColumnLabel: "Khoản chi",
    mobileFabLabel: "Thêm chi tiêu",
  },
  income: {
    amountColor: "#4ade80",
    amountPrefix: "+",
    categoryFallback: "Không danh mục",
    emptyDescription: "Bắt đầu ghi lại các khoản thu nhập của bạn",
    emptyTitle: "Chưa có thu nhập nào",
    itemLabel: "thu nhập",
    itemLabelPlural: "giao dịch",
    modalCreateTitle: "Thêm thu nhập",
    modalEditTitle: "Chỉnh sửa thu nhập",
    modalCreateSubtitle: "Ghi lại khoản thu nhập mới",
    modalEditSubtitle: "Cập nhật khoản thu nhập",
    notePlaceholder: "Thêm ghi chú...",
    saveCreateLabel: "Lưu thu nhập",
    searchPlaceholder: "Tìm kiếm theo tên thu nhập hoặc ghi chú...",
    totalLabel: "Tổng thu nhập",
    addButtonLabel: "Thêm",
    addFirstLabel: "Thêm thu nhập đầu tiên",
    tableColumnLabel: "Khoản thu",
    mobileFabLabel: "Thêm thu nhập",
  },
  investment: {
    amountColor: "#60a5fa",
    amountPrefix: "",
    categoryFallback: "Không danh mục",
    emptyDescription: "Bắt đầu ghi lại các khoản đầu tư của bạn",
    emptyTitle: "Chưa có đầu tư nào",
    itemLabel: "đầu tư",
    itemLabelPlural: "giao dịch",
    modalCreateTitle: "Thêm đầu tư",
    modalEditTitle: "Chỉnh sửa đầu tư",
    modalCreateSubtitle: "Ghi lại khoản đầu tư mới",
    modalEditSubtitle: "Cập nhật khoản đầu tư",
    notePlaceholder: "Thêm ghi chú...",
    saveCreateLabel: "Lưu đầu tư",
    searchPlaceholder: "Tìm kiếm theo tên đầu tư hoặc ghi chú...",
    totalLabel: "Tổng đầu tư",
    addButtonLabel: "Thêm",
    addFirstLabel: "Thêm đầu tư đầu tiên",
    tableColumnLabel: "Khoản đầu tư",
    mobileFabLabel: "Thêm đầu tư",
  },
};

function CategoryIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <div
      className="h-10 w-10 flex-shrink-0 rounded-2xl flex items-center justify-center text-base sm:h-11 sm:w-11 sm:text-lg"
      style={{ background: `${color}22`, border: `1px solid ${color}33` }}
    >
      {ICON_MAP[icon] || "💰"}
    </div>
  );
}

function AddExpenseModal({
  categories,
  investmentAssets = [],
  userId,
  expense,
  transactionType,
  onClose,
  onSuccess,
}: {
  categories: Category[];
  investmentAssets?: InvestmentAsset[];
  userId: string;
  expense?: Expense & { asset?: InvestmentAsset; asset_id?: string | null };
  transactionType: TransactionType;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const config = TRANSACTION_CONFIG[transactionType];
  const tableName = getTransactionTableName(transactionType);
  const isInvestment = transactionType === "investment";
  const isEdit = Boolean(expense);
  const { showToast } = useToast();
  const transactionCategories = categories.filter(
    (category) => category.type === transactionType,
  );
  const [amount, setAmount] = useState(
    expense ? formatNumberInput(String(expense.amount)) : "",
  );
  const [description, setDescription] = useState(expense?.description || "");
  const [categoryId, setCategoryId] = useState(
    expense?.category_id || transactionCategories[0]?.id || "",
  );
  const [selectedAssetId, setSelectedAssetId] = useState(
    expense?.asset_id || "__new__",
  );
  const [assetName, setAssetName] = useState(expense?.asset?.name || "");
  const [assetDescription, setAssetDescription] = useState(
    expense?.asset?.description || "",
  );
  const [isBusiness, setIsBusiness] = useState(
    expense?.asset?.is_business || false,
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
    let assetId = expense?.asset_id || null;

    if (isInvestment) {
      if (selectedAssetId === "__new__") {
        if (!assetName.trim()) {
          setError("Vui lòng nhập tên khoản đầu tư.");
          setLoading(false);
          return;
        }

        if (expense?.asset_id) {
          const { error: assetUpdateError } = await supabase
            .from("investment_assets")
            .update({
              name: assetName.trim(),
              description: assetDescription.trim() || null,
              category_id: categoryId || null,
              is_business: isBusiness,
              started_at: date,
            })
            .eq("id", expense.asset_id);

          if (assetUpdateError) {
            setError("Không thể cập nhật khoản đầu tư. Vui lòng thử lại.");
            setLoading(false);
            return;
          }

          assetId = expense.asset_id;
        } else {
          const { data: createdAsset, error: assetInsertError } = await supabase
            .from("investment_assets")
            .insert({
              user_id: userId,
              category_id: categoryId || null,
              name: assetName.trim(),
              description: assetDescription.trim() || null,
              is_business: isBusiness,
              started_at: date,
            })
            .select("id")
            .single();

          if (assetInsertError || !createdAsset) {
            setError("Không thể tạo khoản đầu tư. Vui lòng thử lại.");
            setLoading(false);
            return;
          }

          assetId = createdAsset.id;
        }
      } else {
        const { error: assetUpdateError } = await supabase
          .from("investment_assets")
          .update({
            category_id: categoryId || null,
            description: assetDescription.trim() || null,
            is_business: isBusiness,
          })
          .eq("id", selectedAssetId);

        if (assetUpdateError) {
          setError("Không thể cập nhật khoản đầu tư. Vui lòng thử lại.");
          setLoading(false);
          return;
        }

        assetId = selectedAssetId;
      }
    }

    const payload = {
      user_id: userId,
      category_id: categoryId || null,
      amount: amountNumber,
      description,
      note: note || null,
      date,
      ...(isInvestment ? { asset_id: assetId } : {}),
    };

    const { error: dbError } = isEdit
      ? await supabase.from(tableName).update(payload).eq("id", expense!.id)
      : await supabase.from(tableName).insert(payload);

    if (dbError) {
      setError("CÓ lỗi xảy ra. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    showToast(isEdit ? "Chỉnh sửa thành công" : "Tạo mới thành công");
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
          className="h-1 w-10 rounded-full"
          style={{ background: "rgba(45,154,75,0.3)" }}
        />
      </div>

      <div
        className="flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: "rgba(45,154,75,0.12)" }}
      >
        <div>
          <h2 className="text-lg font-bold text-white">
            {isEdit ? config.modalEditTitle : config.modalCreateTitle}
          </h2>
          <p
            className="mt-0.5 text-xs"
            style={{ color: "rgba(226,255,232,0.4)" }}
          >
            {isEdit ? config.modalEditSubtitle : config.modalCreateSubtitle}
          </p>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-xl flex items-center justify-center transition-colors"
          style={{
            color: "rgba(226,255,232,0.5)",
            background: "rgba(255,255,255,0.05)",
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 space-y-4 overflow-y-auto p-6 custom-scrollbar"
      >
        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
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
            className="mb-2 block text-xs font-semibold uppercase tracking-wide"
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
              maxLength={15}
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
            className="mb-2 block text-xs font-semibold uppercase tracking-wide"
            style={{ color: "rgba(226,255,232,0.5)" }}
          >
            Tên giao dịch
          </label>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ví dụ: ăn trưa, lương tháng, mua quỹ..."
            required
            maxLength={EXPENSE_DESCRIPTION_MAX_LENGTH}
            style={inputStyle}
          />
        </div>

        {isInvestment && (
          <section
            className="rounded-2xl border p-4 space-y-4"
            style={{
              borderColor: "rgba(45,154,75,0.18)",
              background: "rgba(10,20,13,0.45)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <label
                className="block text-xs font-semibold uppercase tracking-wide"
                style={{ color: "rgba(226,255,232,0.5)" }}
              >
                Khoản đầu tư
              </label>
              <button
                type="button"
                title="Hướng dẫn sử dụng"
                aria-label="Hướng dẫn sử dụng"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
                style={{
                  borderColor: "rgba(45,154,75,0.22)",
                  color: "#e2ffe8",
                  background: "rgba(45,154,75,0.08)",
                }}
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="relative">
                  <select
                    value={selectedAssetId}
                    onChange={(event) => {
                      const nextAssetId = event.target.value;
                      setSelectedAssetId(nextAssetId);

                      if (nextAssetId === "__new__") {
                        setAssetName("");
                        setAssetDescription("");
                        setIsBusiness(false);
                        return;
                      }

                      const selectedAsset = investmentAssets.find(
                        (item) => item.id === nextAssetId,
                      );

                      if (selectedAsset) {
                        setAssetName(selectedAsset.name);
                        setAssetDescription(selectedAsset.description || "");
                        setIsBusiness(selectedAsset.is_business);
                        if (selectedAsset.category_id) {
                          setCategoryId(selectedAsset.category_id);
                        }
                      }
                    }}
                    style={{
                      ...inputStyle,
                      paddingRight: "36px",
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="__new__" style={{ background: "#0a1a0f" }}>
                      Tạo khoản đầu tư mới
                    </option>
                    {investmentAssets.map((asset) => (
                      <option
                        key={asset.id}
                        value={asset.id}
                        style={{ background: "#0a1a0f" }}
                      >
                        {asset.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "rgba(226,255,232,0.4)" }}
                  />
                </div>
              </div>

              <div className="flex items-end">
                <label
                  className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: "rgba(45,154,75,0.18)",
                    background: "rgba(10,20,13,0.65)",
                    color: "#e2ffe8",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isBusiness}
                    onChange={(event) => setIsBusiness(event.target.checked)}
                    className="h-4 w-4 rounded border-primary/40 bg-transparent text-primary focus:ring-primary/20"
                  />
                  Business
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {selectedAssetId === "__new__" && (
                <div>
                  <label
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "rgba(226,255,232,0.5)" }}
                  >
                    Tên khoản đầu tư
                  </label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={(event) => setAssetName(event.target.value)}
                    placeholder="Ví dụ: Công ty ABC, Vàng SJC..."
                    maxLength={INVESTMENT_ASSET_NAME_MAX_LENGTH}
                    style={inputStyle}
                  />
                </div>
              )}

              <div
                className={selectedAssetId === "__new__" ? "" : "sm:col-span-2"}
              >
                <label
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "rgba(226,255,232,0.5)" }}
                >
                  Mô tả khoản đầu tư
                </label>
                <input
                  type="text"
                  value={assetDescription}
                  onChange={(event) => setAssetDescription(event.target.value)}
                  placeholder="Mô tả ngắn..."
                  maxLength={INVESTMENT_ASSET_DESCRIPTION_MAX_LENGTH}
                  style={inputStyle}
                />
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wide"
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
                {transactionCategories.map((category) => (
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
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "rgba(226,255,232,0.4)" }}
              />
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-semibold uppercase tracking-wide"
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
            className="mb-2 block text-xs font-semibold uppercase tracking-wide"
            style={{ color: "rgba(226,255,232,0.5)" }}
          >
            Ghi chú{" "}
            <span style={{ color: "rgba(226,255,232,0.3)" }}>(tùy chọn)</span>
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={config.notePlaceholder}
            rows={2}
            maxLength={EXPENSE_NOTE_MAX_LENGTH}
            style={{ ...inputStyle, resize: "none" }}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl py-3 text-sm font-semibold transition-colors"
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
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {isEdit ? "Lưu thay đổi" : config.saveCreateLabel}
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
  onDelete: (expense: Expense) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onEdit(expense)}
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
          "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
        )}
        aria-label="Chỉnh sửa"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => onDelete(expense)}
        disabled={deleting}
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
          "bg-red-500/10 text-red-400 hover:bg-red-500/20",
        )}
        aria-label="Xóa"
      >
        {deleting ? (
          <div className="h-4 w-4 animate-spin rounded-full border border-red-400/50 border-t-red-400" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function ExpenseMobileCard({
  expense,
  deleting,
  selected,
  amountColor,
  amountPrefix,
  categoryFallback,
  onEdit,
  onToggleSelect,
  onDelete,
}: {
  expense: Expense & { category?: Category };
  deleting: boolean;
  selected: boolean;
  amountColor: string;
  amountPrefix: string;
  categoryFallback: string;
  onEdit: (expense: Expense & { category?: Category }) => void;
  onToggleSelect: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "rgba(10,20,13,0.62)",
        borderColor: "rgba(45,154,75,0.08)",
      }}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onToggleSelect(expense)}
          className={cn(
            "mt-0.5 h-8 w-8 shrink-0 rounded-xl border flex items-center justify-center transition-colors",
            selected ? "bg-primary/20" : "bg-white/5",
          )}
          style={{
            borderColor: selected ? "#2D9A4B" : "rgba(45,154,75,0.15)",
          }}
          aria-label={selected ? "Bỏ chọn" : "Chọn"}
        >
          <div
            className="h-3.5 w-3.5 rounded-sm border"
            style={{
              borderColor: selected ? "#2D9A4B" : "rgba(226,255,232,0.4)",
              background: selected ? "#2D9A4B" : "transparent",
            }}
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <CategoryIcon
              icon={expense.category?.icon || "circle"}
              color={expense.category?.color || "#2D9A4B"}
            />

            <div className="min-w-0 flex-1">
              <p
                className="break-words text-sm font-semibold leading-snug text-white"
                style={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 3,
                  overflow: "hidden",
                }}
              >
                {expense.description}
              </p>

              <div className="mt-1 flex items-center justify-between gap-3">
                <span
                  className="whitespace-nowrap text-base font-bold"
                  style={{ color: amountColor }}
                >
                  {amountPrefix}
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {expense.category ? (
              <span
                className="inline-block max-w-full truncate whitespace-nowrap rounded-full px-2.5 py-1 text-xs"
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
                {categoryFallback}
              </span>
            )}

            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "rgba(226,255,232,0.32)" }}
            >
              <CalendarRange className="h-3 w-3" />
              {formatDate(expense.date)}
            </span>
          </div>

          {expense.note && (
            <p
              className="mt-2 break-words text-xs italic"
              style={{ color: "rgba(226,255,232,0.38)" }}
            >
              {expense.note}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end">
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

function ExpenseTableRow({
  expense,
  deleting,
  selected,
  amountColor,
  amountPrefix,
  categoryFallback,
  onEdit,
  onToggleSelect,
  onDelete,
  isLast,
}: {
  expense: Expense & { category?: Category };
  deleting: boolean;
  selected: boolean;
  amountColor: string;
  amountPrefix: string;
  categoryFallback: string;
  onEdit: (expense: Expense & { category?: Category }) => void;
  onToggleSelect: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  isLast?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-[44px_2.2fr_1fr_1.1fr_0.9fr_0.6fr] items-center gap-3 px-4 py-2.5"
      style={{
        borderBottom: isLast ? "none" : "1px solid rgba(45,154,75,0.06)",
      }}
    >
      <button
        type="button"
        onClick={() => onToggleSelect(expense)}
        className={cn(
          "h-8 w-8 rounded-xl border flex items-center justify-center transition-colors",
          selected ? "bg-primary/20" : "bg-white/5",
        )}
        style={{
          borderColor: selected ? "#2D9A4B" : "rgba(45,154,75,0.15)",
        }}
        aria-label={selected ? "Bỏ chọn" : "Chọn"}
      >
        <div
          className="h-3.5 w-3.5 rounded-sm border"
          style={{
            borderColor: selected ? "#2D9A4B" : "rgba(226,255,232,0.4)",
            background: selected ? "#2D9A4B" : "transparent",
          }}
        />
      </button>

      <div className="flex min-w-0 items-start gap-4">
        <CategoryIcon
          icon={expense.category?.icon || "circle"}
          color={expense.category?.color || "#2D9A4B"}
        />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-snug text-white">
            {expense.description}
          </p>
          {expense.note && (
            <p
              className="mt-1 truncate text-xs italic"
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
            className="inline-block max-w-full truncate whitespace-nowrap rounded-full px-2 py-0.5 text-[11px]"
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
            {categoryFallback}
          </span>
        )}
      </div>

      <div
        className="flex items-center gap-1 text-xs"
        style={{ color: "rgba(226,255,232,0.42)" }}
      >
        <CalendarRange className="h-3.5 w-3.5" />
        {formatDate(expense.date)}
      </div>

      <div
        className="text-right text-xs font-bold whitespace-nowrap"
        style={{ color: amountColor }}
      >
        {amountPrefix}
        {formatCurrency(expense.amount)}
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
  investmentAssets = [],
  userId,
  currentPage,
  pageSize,
  totalCount,
  searchQuery,
  filterCategory,
  filterDateFrom,
  filterDateTo,
  transactionType = "expense",
}: ExpensesClientProps) {
  const config = TRANSACTION_CONFIG[transactionType];
  const tableName = getTransactionTableName(transactionType);
  const onMenuToggle = useSidebarToggle();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const desktopTableRef = useRef<HTMLDivElement | null>(null);
  const desktopTableScrollRef = useRef<HTMLDivElement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<
    | (Expense & {
        category?: Category;
        asset?: InvestmentAsset;
        asset_id?: string | null;
      })
    | undefined
  >();
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(
    filterCategory || "all",
  );
  const [selectedDateFrom, setSelectedDateFrom] = useState(filterDateFrom);
  const [selectedDateTo, setSelectedDateTo] = useState(filterDateTo);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
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

  useEffect(() => {
    setSelectedExpenseIds((current) =>
      current.filter((id) =>
        initialExpenses.some((expense) => expense.id === id),
      ),
    );
  }, [initialExpenses]);

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

  const toggleExpenseSelection = (expense: Expense) => {
    setSelectedExpenseIds((current) =>
      current.includes(expense.id)
        ? current.filter((id) => id !== expense.id)
        : [...current, expense.id],
    );
  };

  const clearExpenseSelection = () => {
    setSelectedExpenseIds([]);
  };

  const handleBulkDelete = async (expensesToDelete: Expense[]) => {
    if (expensesToDelete.length === 0) return;

    const names =
      expensesToDelete.length === 1
        ? `"${expensesToDelete[0].description}"`
        : `${expensesToDelete.length} mục đã chọn`;

    if (!window.confirm(`Bạn có chắc muốn xóa ${names} không?`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from(tableName)
      .delete()
      .in(
        "id",
        expensesToDelete.map((expense) => expense.id),
      );

    if (error) {
      return;
    }

    clearExpenseSelection();
    showToast("Xóa thành công");
    startTransition(() => router.refresh());
  };

  const handleDelete = async (expense: Expense) => {
    if (
      !window.confirm(`Bạn có chắc muốn xóa "${expense.description}" không?`)
    ) {
      return;
    }
    setDeleteId(expense.id);
    const supabase = createClient();
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", expense.id);
    if (error) {
      setDeleteId(null);
      return;
    }
    showToast("Xóa thành công");
    startTransition(() => router.refresh());
    setDeleteId(null);
  };

  const currentExpenses = initialExpenses;
  const selectedExpenses = currentExpenses.filter((expense) =>
    selectedExpenseIds.includes(expense.id),
  );
  const allSelected =
    currentExpenses.length > 0 &&
    selectedExpenses.length === currentExpenses.length;
  const hasSelectedExpenses = selectedExpenses.length > 0;

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
  const showTotalAmount = hasActiveFilters && !isPending;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentCategories = categories.filter(
    (category) => category.type === transactionType,
  );

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
    listScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    desktopTableScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
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

  const EmptyIcon =
    transactionType === "expense"
      ? TrendingDown
      : transactionType === "income"
        ? TrendingUp
        : Wallet;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <button
        type="button"
        onClick={onMenuToggle}
        className="fixed left-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors lg:hidden"
        style={{
          background: "rgba(45,154,75,0.12)",
          borderColor: "rgba(45,154,75,0.18)",
          color: "rgba(226,255,232,0.85)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.25)",
        }}
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div
        ref={listScrollRef}
        data-dashboard-scroll-root
        className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar md:overflow-hidden sm:px-6"
      >
        <div className="flex min-h-full flex-col md:h-full">
          <div className="mb-3 flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={onMenuToggle}
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition-colors"
              style={{
                background: "rgba(45,154,75,0.08)",
                borderColor: "rgba(45,154,75,0.15)",
                color: "rgba(226,255,232,0.7)",
              }}
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {transactionType === "investment"
                  ? "Đầu tư"
                  : transactionType === "income"
                    ? "Thu nhập"
                    : "Chi tiêu"}
              </p>
            </div>
          </div>

          <div className="mb-3 shrink-0 space-y-2.5">
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
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{ color: "rgba(226,255,232,0.3)" }}
                      />
                      <input
                        type="text"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder={config.searchPlaceholder}
                        maxLength={SEARCH_INPUT_MAX_LENGTH}
                        style={filterInputStyle}
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex h-[40px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(45,154,75,0.24), rgba(45,154,75,0.12))",
                        borderColor: "rgba(45,154,75,0.28)",
                        color: "#e2ffe8",
                      }}
                    >
                      <Search className="h-4 w-4" />
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
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
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
                      {currentCategories.map((category) => (
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
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
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
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
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
                <p
                  className="text-xs"
                  style={{ color: "rgba(226,255,232,0.45)" }}
                >
                  {totalCount} {config.itemLabelPlural}
                </p>

                {showTotalAmount && (
                  <p
                    className="text-xs font-medium"
                    style={{ color: config.amountColor }}
                  >
                    {config.totalLabel}: {config.amountPrefix}
                    {formatCurrency(
                      currentExpenses.reduce(
                        (sum, expense) => sum + Number(expense.amount),
                        0,
                      ),
                    )}
                  </p>
                )}
              </div>

              <div className="flex self-start items-center gap-2 sm:self-auto">
                {hasSelectedExpenses && (
                  <button
                    type="button"
                    onClick={() => handleBulkDelete(selectedExpenses)}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      borderColor: "rgba(239,68,68,0.24)",
                      color: "#fecaca",
                    }}
                  >
                    Xóa đã chọn ({selectedExpenses.length})
                  </button>
                )}

                {transactionType === "investment" && (
                  <Link
                    href="/investment-portfolio"
                    className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      background: "rgba(59,130,246,0.08)",
                      borderColor: "rgba(59,130,246,0.2)",
                      color: "#bfdbfe",
                    }}
                  >
                    Danh mục đầu tư
                  </Link>
                )}

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(45,154,75,0.14)",
                      color: "#e2ffe8",
                    }}
                  >
                    <X className="h-4 w-4" />
                    Xóa bộ lọc
                  </button>
                )}

                <button
                  onClick={() => {
                    setEditExpense(undefined);
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: "linear-gradient(135deg, #2D9A4B, #237c3d)",
                    borderColor: "rgba(45,154,75,0.45)",
                    color: "#ffffff",
                    boxShadow: "0 8px 18px rgba(45,154,75,0.22)",
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {config.addButtonLabel}
                </button>
              </div>
            </div>
          </div>

          {currentExpenses.length > 0 ? (
            <>
              <div
                className="mb-3 flex items-center justify-between rounded-2xl border px-4 py-3 md:hidden"
                style={{
                  background: "rgba(10,20,13,0.58)",
                  borderColor: "rgba(45,154,75,0.08)",
                }}
              >
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "rgba(226,255,232,0.5)" }}
                  >
                    Trang {currentPage} / {totalPages}
                  </p>
                </div>
              </div>

              <div className="space-y-3 md:hidden">
                {currentExpenses.map((expense) => (
                  <ExpenseMobileCard
                    key={expense.id}
                    expense={expense}
                    deleting={deleteId === expense.id}
                    selected={selectedExpenseIds.includes(expense.id)}
                    amountColor={config.amountColor}
                    amountPrefix={config.amountPrefix}
                    categoryFallback={config.categoryFallback}
                    onEdit={handleEdit}
                    onToggleSelect={toggleExpenseSelection}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              <div
                ref={desktopTableRef}
                className="hidden overflow-hidden rounded-2xl border md:flex md:min-h-0 md:flex-1 md:flex-col"
                style={{
                  background: "rgba(10,20,13,0.62)",
                  borderColor: "rgba(45,154,75,0.06)",
                }}
              >
                <div
                  className="flex shrink-0 flex-col gap-2 border-b px-4 py-2 sm:flex-row sm:items-center sm:justify-between"
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
                      className="rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
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
                      className="rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
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
                    className="sticky top-0 z-10 grid grid-cols-[44px_2.2fr_1fr_1.1fr_0.9fr_0.6fr] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{
                      color: "rgba(226,255,232,0.32)",
                      background: "rgba(10,20,13,0.96)",
                      borderBottom: "1px solid rgba(45,154,75,0.08)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedExpenseIds(
                          allSelected
                            ? []
                            : currentExpenses.map((expense) => expense.id),
                        )
                      }
                      className="h-8 w-8 rounded-xl border flex items-center justify-center transition-colors"
                      style={{
                        borderColor: allSelected
                          ? "#2D9A4B"
                          : "rgba(45,154,75,0.15)",
                        background: allSelected
                          ? "rgba(45,154,75,0.18)"
                          : "rgba(255,255,255,0.04)",
                      }}
                      aria-label={
                        allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"
                      }
                    >
                      <div
                        className="h-3.5 w-3.5 rounded-sm border"
                        style={{
                          borderColor: allSelected
                            ? "#2D9A4B"
                            : "rgba(226,255,232,0.4)",
                          background: allSelected ? "#2D9A4B" : "transparent",
                        }}
                      />
                    </button>
                    <div>{config.tableColumnLabel}</div>
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
                      selected={selectedExpenseIds.includes(expense.id)}
                      amountColor={config.amountColor}
                      amountPrefix={config.amountPrefix}
                      categoryFallback={config.categoryFallback}
                      isLast={
                        currentExpenses[currentExpenses.length - 1]?.id ===
                        expense.id
                      }
                      onEdit={handleEdit}
                      onToggleSelect={toggleExpenseSelection}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center md:flex-1">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: "rgba(45,154,75,0.1)",
                  border: "1px solid rgba(45,154,75,0.15)",
                }}
              >
                <EmptyIcon className="h-8 w-8" style={{ color: "#2D9A4B" }} />
              </div>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {hasActiveFilters
                  ? "Không tìm thấy giao dịch phù hợp"
                  : config.emptyTitle}
              </p>
              <p
                className="mt-2 text-sm"
                style={{ color: "rgba(226,255,232,0.4)" }}
              >
                {hasActiveFilters
                  ? "Thử đổi từ khóa, danh mục hoặc khoảng ngày"
                  : config.emptyDescription}
              </p>
              {!hasActiveFilters && (
                <button
                  onClick={() => {
                    setEditExpense(undefined);
                    setShowModal(true);
                  }}
                  className="btn-primary mt-4 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {config.addFirstLabel}
                </button>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div
              className="mt-3 flex flex-col items-start gap-3 rounded-2xl border px-4 py-3 md:hidden sm:flex-row sm:items-center sm:justify-between"
              style={{
                background: "rgba(10,20,13,0.58)",
                borderColor: "rgba(45,154,75,0.08)",
              }}
            >
              <div className="min-w-0">
                <p
                  className="text-xs"
                  style={{ color: "rgba(226,255,232,0.45)" }}
                >
                  Trang {currentPage} / {totalPages}
                </p>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <button
                  type="button"
                  onClick={() =>
                    navigate({ page: Math.max(1, currentPage - 1) })
                  }
                  disabled={currentPage <= 1}
                  className="rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
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
                    navigate({ page: Math.min(totalPages, currentPage + 1) })
                  }
                  disabled={currentPage >= totalPages}
                  className="rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
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
          )}
        </div>
      </div>

      <button
        onClick={() => {
          setEditExpense(undefined);
          setShowModal(true);
        }}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl lg:hidden"
        style={{
          background: "linear-gradient(135deg, #2D9A4B, #1a7a35)",
          boxShadow: "0 8px 25px rgba(45,154,75,0.5)",
        }}
        aria-label={config.mobileFabLabel}
      >
        <Plus className="h-6 w-6 text-white" />
      </button>

      {hasSelectedExpenses && (
        <button
          type="button"
          onClick={() => handleBulkDelete(selectedExpenses)}
          className="fixed bottom-6 left-6 z-30 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 shadow-2xl lg:hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(239,68,68,0.95), rgba(127,29,29,0.95))",
            borderColor: "rgba(239,68,68,0.45)",
            color: "#fff1f2",
            boxShadow: "0 8px 25px rgba(239,68,68,0.28)",
          }}
          aria-label={`Xóa ${selectedExpenses.length} mục đã chọn`}
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-xs font-semibold">
            Xóa ({selectedExpenses.length})
          </span>
        </button>
      )}

      {showModal && (
        <AddExpenseModal
          categories={categories}
          investmentAssets={investmentAssets}
          userId={userId}
          expense={editExpense}
          transactionType={transactionType}
          onClose={() => setShowModal(false)}
          onSuccess={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
