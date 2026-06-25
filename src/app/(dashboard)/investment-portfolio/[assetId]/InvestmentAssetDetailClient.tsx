"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  Landmark,
  Pencil,
  Plus,
  Search,
  X,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import DateInput from "@/components/ui/DateInput";
import ModalOverlay from "@/components/ui/ModalOverlay";
import { createClient } from "@/lib/supabase/client";
import {
  formatCurrency,
  formatDate,
  formatNumberInput,
  parseFormattedNumber,
} from "@/lib/utils";
import {
  Category,
  Expense,
  InvestmentAsset,
  InvestmentReturn,
  InvestmentValuation,
} from "@/types";
import { useSidebarToggle, useToast } from "../../DashboardLayoutClient";

interface InvestmentAssetDetailClientProps {
  asset: InvestmentAsset & { category?: Category };
  investments: Expense[];
  investmentCategories: Category[];
  valuations: InvestmentValuation[];
  returns: InvestmentReturn[];
  totalInvested: number;
  totalReturned: number;
  currentValue: number;
  profitLossAmount: number;
  profitLossPercent: number;
}

const CAPITAL_PAGE_SIZE = 10;
const RETURN_PAGE_SIZE = 10;

function normalizeMonthDate(value: string) {
  if (!value) return value;
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

export default function InvestmentAssetDetailClient({
  asset,
  investments,
  investmentCategories,
  valuations,
  returns,
  totalInvested,
  totalReturned,
  currentValue,
  profitLossAmount,
  profitLossPercent,
}: InvestmentAssetDetailClientProps) {
  const onMenuToggle = useSidebarToggle();
  const { showToast } = useToast();
  const router = useRouter();
  const initialCapitalCategoryOptions = investmentCategories.filter(
    (category) =>
      category.type === (asset.is_business ? "business" : "investment"),
  );
  const initialReturnCategoryOptions = investmentCategories.filter(
    (category) => category.type === "investment_return",
  );
  const [capitalCategories, setCapitalCategories] = useState(
    initialCapitalCategoryOptions,
  );
  const [returnCategories, setReturnCategories] = useState(
    initialReturnCategoryOptions,
  );
  const defaultCapitalCategoryId = asset.is_business
    ? capitalCategories[0]?.id || "__new__"
    : asset.category_id ||
      asset.category?.id ||
      capitalCategories[0]?.id ||
      "__new__";
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
  const [returnError, setReturnError] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);
  const [editingReturnId, setEditingReturnId] = useState<string | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnAmount, setReturnAmount] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [returnNote, setReturnNote] = useState("");
  const [capitalAmount, setCapitalAmount] = useState("");
  const [capitalDescription, setCapitalDescription] = useState("");
  const [capitalDate, setCapitalDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [capitalNote, setCapitalNote] = useState("");
  const [capitalError, setCapitalError] = useState("");
  const [capitalLoading, setCapitalLoading] = useState(false);
  const [editingCapitalId, setEditingCapitalId] = useState<string | null>(null);
  const [capitalModalOpen, setCapitalModalOpen] = useState(false);
  const [capitalCategoryId, setCapitalCategoryId] = useState(
    defaultCapitalCategoryId,
  );
  const [showNewCapitalCategoryInput, setShowNewCapitalCategoryInput] =
    useState(false);
  const [categoryDialogTarget, setCategoryDialogTarget] = useState<
    "capital" | "return"
  >("capital");
  const [newCapitalCategoryName, setNewCapitalCategoryName] = useState("");
  const [newCapitalCategorySaving, setNewCapitalCategorySaving] =
    useState(false);
  const [returnSearchDraft, setReturnSearchDraft] = useState("");
  const [returnSearchQuery, setReturnSearchQuery] = useState("");
  const [returnCategoryFilter, setReturnCategoryFilter] = useState("all");
  const [returnPage, setReturnPage] = useState(1);
  const [capitalSearchDraft, setCapitalSearchDraft] = useState("");
  const [capitalSearchQuery, setCapitalSearchQuery] = useState("");
  const [capitalCategoryFilter, setCapitalCategoryFilter] = useState("all");
  const [capitalPage, setCapitalPage] = useState(1);
  const [assetName, setAssetName] = useState(asset.name);
  const [assetDescription, setAssetDescription] = useState(
    asset.description || "",
  );
  const [error, setError] = useState("");
  const [assetError, setAssetError] = useState("");
  const currentCategoryId = asset.category_id || asset.category?.id || "";
  const currentCategoryName = asset.category?.name || "Không danh mục";
  const defaultReturnCategoryId = returnCategories[0]?.id || "__new__";
  const [returnCategoryId, setReturnCategoryId] = useState(
    defaultReturnCategoryId,
  );
  const normalizedReturnSearch = returnSearchQuery.trim().toLowerCase();
  const normalizedReturnCategoryFilter =
    returnCategoryFilter !== "all" ? returnCategoryFilter : "";
  const filteredReturns = returns.filter((item) => {
    const matchesSearch =
      !normalizedReturnSearch ||
      item.description.toLowerCase().includes(normalizedReturnSearch) ||
      (item.note || "").toLowerCase().includes(normalizedReturnSearch);

    const matchesCategory = normalizedReturnCategoryFilter
      ? item.category_id === normalizedReturnCategoryFilter
      : true;

    return matchesSearch && matchesCategory;
  });
  const totalReturnPages = Math.max(
    1,
    Math.ceil(filteredReturns.length / RETURN_PAGE_SIZE),
  );
  const safeReturnPage = Math.min(returnPage, totalReturnPages);
  const returnSectionTitleRef = useRef<HTMLParagraphElement | null>(null);
  const shouldScrollReturnPaginationRef = useRef(false);
  const visibleReturns = filteredReturns.slice(
    (safeReturnPage - 1) * RETURN_PAGE_SIZE,
    safeReturnPage * RETURN_PAGE_SIZE,
  );
  const normalizedCapitalSearch = capitalSearchQuery.trim().toLowerCase();
  const normalizedCapitalCategoryFilter =
    asset.is_business && capitalCategoryFilter !== "all"
      ? capitalCategoryFilter
      : "";
  const filteredCapitalInvestments = investments.filter((item) => {
    const matchesSearch =
      !normalizedCapitalSearch ||
      item.description.toLowerCase().includes(normalizedCapitalSearch) ||
      (item.note || "").toLowerCase().includes(normalizedCapitalSearch);

    const matchesCategory = normalizedCapitalCategoryFilter
      ? item.category_id === normalizedCapitalCategoryFilter
      : true;
    return matchesSearch && matchesCategory;
  });
  const totalCapitalPages = Math.max(
    1,
    Math.ceil(filteredCapitalInvestments.length / CAPITAL_PAGE_SIZE),
  );
  const safeCapitalPage = Math.min(capitalPage, totalCapitalPages);
  const capitalSectionTitleRef = useRef<HTMLParagraphElement | null>(null);
  const shouldScrollCapitalPaginationRef = useRef(false);
  const visibleCapitalInvestments = filteredCapitalInvestments.slice(
    (safeCapitalPage - 1) * CAPITAL_PAGE_SIZE,
    safeCapitalPage * CAPITAL_PAGE_SIZE,
  );

  useLayoutEffect(() => {
    const activeRoot = document.querySelector<HTMLElement>(
      "[data-dashboard-scroll-root]",
    );

    if (activeRoot) {
      activeRoot.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!shouldScrollReturnPaginationRef.current) {
      return;
    }
    shouldScrollReturnPaginationRef.current = false;
    returnSectionTitleRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [returnPage]);

  useEffect(() => {
    if (!shouldScrollCapitalPaginationRef.current) {
      return;
    }
    shouldScrollCapitalPaginationRef.current = false;
    capitalSectionTitleRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [capitalPage]);

  const profitLossColor =
    profitLossAmount > 0
      ? "#4ade80"
      : profitLossAmount < 0
        ? "#f87171"
        : undefined;

  const saveAssetInfo = async (event: React.FormEvent) => {
    event.preventDefault();
    setAssetError("");

    if (!assetName.trim()) {
      setAssetError("Vui lòng nhập tên khoản đầu tư.");
      return;
    }

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("investment_assets")
      .update({
        name: assetName.trim(),
        description: assetDescription.trim() || null,
      })
      .eq("id", asset.id);

    if (dbError) {
      setAssetError("Không thể cập nhật khoản đầu tư. Vui lòng thử lại.");
      return;
    }

    showToast("Chỉnh sửa thành công");
    startTransition(() => router.refresh());
  };

  const saveValuation = async (event: React.FormEvent) => {
    event.preventDefault();
    setReturnError("");
    const amountNumber = parseFormattedNumber(valuationAmount);

    if (amountNumber < 0) {
      setError("Giá trị hiện tại không hợp lệ.");
      return;
    }

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("investment_valuations")
      .upsert(
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

    showToast("Tạo mới thành công");
    startTransition(() => router.refresh());
  };

  const saveReturn = async (event: React.FormEvent) => {
    event.preventDefault();
    setReturnError("");

    const amountNumber = parseFormattedNumber(returnAmount);
    if (!amountNumber || amountNumber <= 0) {
      setReturnError("Số tiền thu về không hợp lệ.");
      return;
    }

    if (!returnDescription.trim()) {
      setReturnError("Vui lòng nhập tên giao dịch thu tiền.");
      return;
    }

    const resolvedCategoryId = returnCategoryId || "";

    if (!resolvedCategoryId) {
      setReturnError("Vui lòng chọn danh mục cho giao dịch thu tiền.");
      return;
    }

    setReturnLoading(true);
    const supabase = createClient();
    const payload = {
      asset_id: asset.id,
      user_id: asset.user_id,
      category_id: resolvedCategoryId,
      amount: amountNumber,
      description: returnDescription.trim(),
      note: returnNote || null,
      date: returnDate,
    };

    const { error: dbError } = editingReturnId
      ? await supabase
          .from("investment_returns")
          .update(payload)
          .eq("id", editingReturnId)
      : await supabase.from("investment_returns").insert(payload);

    if (dbError) {
      setReturnError("Không thể lưu giao dịch thu tiền. Vui lòng thử lại.");
      setReturnLoading(false);
      return;
    }

    setReturnAmount("");
    setReturnDescription("");
    setReturnDate(new Date().toISOString().split("T")[0]);
    setReturnNote("");
    setReturnCategoryId(defaultReturnCategoryId);
    setEditingReturnId(null);
    setReturnLoading(false);
    setReturnModalOpen(false);
    showToast(editingReturnId ? "Chỉnh sửa thành công" : "Tạo mới thành công");
    startTransition(() => router.refresh());
  };

  const addCapitalContribution = async (event: React.FormEvent) => {
    event.preventDefault();
    setCapitalError("");

    if (!currentCategoryId && !asset.is_business) {
      setCapitalError("Khoản đầu tư này chưa có danh mục để gắn giao dịch.");
      return;
    }

    const amountNumber = parseFormattedNumber(capitalAmount);
    if (!amountNumber || amountNumber <= 0) {
      setCapitalError("Số tiền rót vốn không hợp lệ.");
      return;
    }

    if (!capitalDescription.trim()) {
      setCapitalError("Vui lòng nhập tên giao dịch rót vốn.");
      return;
    }

    setCapitalLoading(true);
    const supabase = createClient();
    const resolvedCategoryId = asset.is_business
      ? capitalCategoryId && capitalCategoryId !== "__new__"
        ? capitalCategoryId
        : null
      : currentCategoryId || null;

    if (asset.is_business && !resolvedCategoryId) {
      setCapitalError(
        "Vui lòng chọn hoặc tạo danh mục business trước khi lưu.",
      );
      setCapitalLoading(false);
      return;
    }

    const payload = {
      user_id: asset.user_id,
      category_id: resolvedCategoryId,
      asset_id: asset.id,
      amount: amountNumber,
      description: capitalDescription.trim(),
      note: capitalNote || null,
      date: capitalDate,
    };

    const { error: dbError } = editingCapitalId
      ? await supabase
          .from("investments")
          .update(payload)
          .eq("id", editingCapitalId)
      : await supabase.from("investments").insert(payload);

    if (dbError) {
      setCapitalError("Không thể thêm lần rót vốn. Vui lòng thử lại.");
      setCapitalLoading(false);
      return;
    }

    setCapitalAmount("");
    setCapitalDescription("");
    setCapitalNote("");
    setCapitalDate(new Date().toISOString().split("T")[0]);
    setCapitalCategoryId(defaultCapitalCategoryId);
    setShowNewCapitalCategoryInput(false);
    setNewCapitalCategoryName("");
    setEditingCapitalId(null);
    setCapitalLoading(false);
    setCapitalModalOpen(false);
    showToast(editingCapitalId ? "Chỉnh sửa thành công" : "Tạo mới thành công");
    startTransition(() => router.refresh());
  };

  const createBusinessCapitalCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!asset.is_business) {
      setShowNewCapitalCategoryInput(false);
      return;
    }

    const trimmedName = newCapitalCategoryName.trim();
    if (!trimmedName) {
      setCapitalError("Vui lĂ²ng nháº­p tĂªn danh má»¥c.");
      return;
    }

    setNewCapitalCategorySaving(true);
    const supabase = createClient();
    const { data: createdCategory, error } = await supabase
      .from("categories")
      .insert({
        user_id: asset.user_id,
        name: trimmedName,
        icon: "briefcase",
        color: "#2D9A4B",
        type:
          categoryDialogTarget === "return"
            ? "investment_return"
            : asset.is_business
              ? "business"
              : "investment",
      })
      .select("*")
      .single();

    if (error || !createdCategory) {
      setCapitalError("KhĂ´ng thá»ƒ táº¡o danh má»¥c má»›i.");
      setNewCapitalCategorySaving(false);
      return;
    }

    if (categoryDialogTarget === "return") {
      setReturnCategories((prev) => [...prev, createdCategory as Category]);
    } else {
      setCapitalCategories((prev) => [...prev, createdCategory as Category]);
    }
    if (categoryDialogTarget === "return") {
      setReturnCategoryId(createdCategory.id);
    } else {
      setCapitalCategoryId(createdCategory.id);
    }
    setNewCapitalCategoryName("");
    setShowNewCapitalCategoryInput(false);
    setNewCapitalCategorySaving(false);
    showToast("Tạo mới thành công");
  };

  const openCreateCapitalModal = () => {
    setEditingCapitalId(null);
    setCapitalAmount("");
    setCapitalDescription("");
    setCapitalDate(new Date().toISOString().split("T")[0]);
    setCapitalNote("");
    setCapitalCategoryId(defaultCapitalCategoryId);
    setShowNewCapitalCategoryInput(false);
    setNewCapitalCategoryName("");
    setCapitalError("");
    setCapitalModalOpen(true);
  };

  const openCreateReturnModal = () => {
    setEditingReturnId(null);
    setReturnAmount("");
    setReturnDescription("");
    setReturnDate(new Date().toISOString().split("T")[0]);
    setReturnNote("");
    setReturnCategoryId(defaultReturnCategoryId);
    setReturnError("");
    setReturnModalOpen(true);
  };

  const applyReturnSearch = () => {
    setReturnSearchQuery(returnSearchDraft.trim());
    setReturnPage(1);
  };

  const handleReturnSearchDraftChange = (value: string) => {
    setReturnSearchDraft(value);

    if (!value.trim()) {
      setReturnSearchQuery("");
      setReturnPage(1);
    }
  };

  const clearReturnSearch = () => {
    setReturnSearchDraft("");
    setReturnSearchQuery("");
    setReturnPage(1);
  };

  const handleReturnCategoryFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setReturnCategoryFilter(event.target.value);
    setReturnPage(1);
  };

  const applyCapitalSearch = () => {
    setCapitalSearchQuery(capitalSearchDraft.trim());
    setCapitalPage(1);
  };

  const handleCapitalSearchDraftChange = (value: string) => {
    setCapitalSearchDraft(value);

    if (!value.trim()) {
      setCapitalSearchQuery("");
      setCapitalPage(1);
    }
  };

  const clearCapitalSearch = () => {
    setCapitalSearchDraft("");
    setCapitalSearchQuery("");
    setCapitalPage(1);
  };

  const handleCapitalCategoryFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setCapitalCategoryFilter(event.target.value);
    setCapitalPage(1);
  };

  const startEditReturn = (item: InvestmentReturn) => {
    setEditingReturnId(item.id);
    setReturnAmount(formatNumberInput(String(item.amount)));
    setReturnDescription(item.description);
    setReturnDate(item.date);
    setReturnNote(item.note || "");
    setReturnCategoryId(item.category_id || defaultReturnCategoryId);
    setReturnError("");
    setReturnModalOpen(true);
  };

  const cancelEditReturn = () => {
    setEditingReturnId(null);
    setReturnAmount("");
    setReturnDescription("");
    setReturnDate(new Date().toISOString().split("T")[0]);
    setReturnNote("");
    setReturnCategoryId(defaultReturnCategoryId);
    setReturnError("");
    setReturnModalOpen(false);
  };

  const startEditCapital = (item: Expense) => {
    setEditingCapitalId(item.id);
    setCapitalAmount(formatNumberInput(String(item.amount)));
    setCapitalDescription(item.description);
    setCapitalDate(item.date);
    setCapitalNote(item.note || "");
    setCapitalCategoryId(item.category_id || defaultCapitalCategoryId);
    setShowNewCapitalCategoryInput(false);
    setNewCapitalCategoryName("");
    setCapitalError("");
    setCapitalModalOpen(true);
  };

  const cancelEditCapital = () => {
    setEditingCapitalId(null);
    setCapitalAmount("");
    setCapitalDescription("");
    setCapitalDate(new Date().toISOString().split("T")[0]);
    setCapitalNote("");
    setCapitalCategoryId(defaultCapitalCategoryId);
    setShowNewCapitalCategoryInput(false);
    setNewCapitalCategoryName("");
    setCapitalError("");
    setCapitalModalOpen(false);
  };

  const deleteCapitalContribution = async (item: Expense) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${item.description}" không?`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("investments")
      .delete()
      .eq("id", item.id);
    if (error) {
      setCapitalError("Không thể xóa lần rót vốn. Vui lòng thử lại.");
      return;
    }

    if (editingCapitalId === item.id) {
      cancelEditCapital();
    }

    showToast("Xóa thành công");
    startTransition(() => router.refresh());
  };

  const deleteReturn = async (item: InvestmentReturn) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${item.description}" không?`)) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("investment_returns")
      .delete()
      .eq("id", item.id);
    if (error) {
      setReturnError("Không thể xóa giao dịch thu tiền. Vui lòng thử lại.");
      return;
    }
    if (editingReturnId === item.id) {
      cancelEditReturn();
    }
    showToast("Xóa thành công");
    startTransition(() => router.refresh());
  };

  const deleteValuation = async (valuationId: string, label: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${label}" không?`)) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("investment_valuations")
      .delete()
      .eq("id", valuationId);
    if (error) {
      return;
    }
    showToast("Xóa thành công");
    startTransition(() => router.refresh());
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Header
        onMenuToggle={onMenuToggle}
        title={asset.name}
        subtitle={asset.category?.name || "Khoản đầu tư"}
      />

      <div
        data-dashboard-scroll-root
        className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar sm:px-6"
      >
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

        <form
          onSubmit={saveAssetInfo}
          className="mb-6 rounded-3xl border p-5"
          style={{
            background: "rgba(10,20,13,0.72)",
            borderColor: "rgba(45,154,75,0.12)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#aaf0be]">
                Thông tin khoản đầu tư
              </p>
              <p
                className="mt-1 text-sm"
                style={{ color: "rgba(226,255,232,0.45)" }}
              >
                Đổi tên hoặc cập nhật mô tả ngay tại đây.
              </p>
            </div>
          </div>

          {assetError && (
            <div
              className="mt-4 rounded-2xl px-4 py-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#fca5a5",
              }}
            >
              {assetError}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-3">
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
                className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                maxLength={80}
                style={{
                  borderColor: "rgba(45,154,75,0.2)",
                  background: "rgba(5,13,8,0.8)",
                }}
              />
            </div>

            <div>
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
                className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                maxLength={120}
                style={{
                  borderColor: "rgba(45,154,75,0.2)",
                  background: "rgba(5,13,8,0.8)",
                }}
                placeholder="Mô tả ngắn..."
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Lưu thay đổi
            </button>
          </div>
        </form>

        <div
          className={`mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 ${
            asset.is_business ? "xl:grid-cols-3" : "xl:grid-cols-3"
          }`}
        >
          <StatCard
            title="Vốn đầu tư"
            value={formatCurrency(totalInvested)}
            subtitle="Tổng các giao dịch vốn"
            icon={<Landmark className="h-6 w-6" />}
            color="blue"
          />
          {!asset.is_business && (
            <StatCard
              title="Giá trị hiện tại"
              value={formatCurrency(currentValue)}
              subtitle="Theo lần cập nhật mới nhất"
              icon={<CalendarRange className="h-6 w-6" />}
              color="green"
            />
          )}
          {asset.is_business && (
            <StatCard
              title="Đã thu về"
              value={formatCurrency(totalReturned)}
              subtitle="Tiền quay về từ khoản đầu tư"
              icon={<TrendingUp className="h-6 w-6" />}
              color="purple"
            />
          )}
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

        <div
          className={`grid grid-cols-1 gap-4 ${
            asset.is_business ? "" : "xl:grid-cols-[1.15fr_0.85fr]"
          }`}
        >
          {!asset.is_business && (
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
                  Mỗi tháng anh nhập tổng giá trị hiện tại của khoản đầu tư này,
                  hệ thống sẽ tự tính lời lỗ.
                </p>
              </div>

              <form
                onSubmit={saveValuation}
                className="grid gap-3 sm:grid-cols-2"
              >
                <div>
                  <label
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "rgba(226,255,232,0.5)" }}
                  >
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
                  <label
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "rgba(226,255,232,0.5)" }}
                  >
                    Giá trị hiện tại
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={valuationAmount}
                    onChange={(event) =>
                      setValuationAmount(formatNumberInput(event.target.value))
                    }
                    maxLength={15}
                    className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                    style={{
                      borderColor: "rgba(45,154,75,0.2)",
                      background: "rgba(5,13,8,0.8)",
                    }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "rgba(226,255,232,0.5)" }}
                  >
                    Ghi chú
                  </label>
                  <input
                    type="text"
                    value={valuationNote}
                    onChange={(event) => setValuationNote(event.target.value)}
                    maxLength={200}
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
                        onClick={() =>
                          deleteValuation(
                            valuation.id,
                            formatDate(valuation.valuation_month),
                          )
                        }
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

          <div className="space-y-4">
            {asset.is_business && (
              <div
                className="rounded-3xl border p-5"
                style={{
                  background: "rgba(10,20,13,0.72)",
                  borderColor: "rgba(45,154,75,0.12)",
                }}
              >
                <p
                  ref={returnSectionTitleRef}
                  className="text-lg font-semibold text-white"
                >
                  Thu tiền về từ khoản đầu tư
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "rgba(226,255,232,0.45)" }}
                >
                  Dùng cho các khoản business có dòng tiền quay về, ví dụ ký hợp đồng hoặc chia lợi nhuận.
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={openCreateReturnModal}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm thu tiền về
                  </button>
                </div>
                <div className="flex items-start justify-between gap-3">
                  {editingReturnId && (
                    <span
                      className="rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        borderColor: "rgba(45,154,75,0.18)",
                        background: "rgba(45,154,75,0.08)",
                        color: "#aaf0be",
                      }}
                    >
                      Đang chỉnh sửa
                    </span>
                  )}
                </div>
                <form
                  className="mt-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    applyReturnSearch();
                  }}
                >
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                      <label
                        className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "rgba(226,255,232,0.5)" }}
                      >
                        Tìm kiếm thu tiền về
                      </label>
                      <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1">
                          <input
                            type="text"
                            value={returnSearchDraft}
                            onChange={(event) =>
                              handleReturnSearchDraftChange(event.target.value)
                            }
                            placeholder="Tìm theo tên giao dịch..."
                            maxLength={100}
                            className="min-w-0 w-full rounded-xl border py-3 pl-5 pr-14 text-sm text-white outline-none"
                            style={{
                              borderColor: "rgba(45,154,75,0.2)",
                              background: "rgba(5,13,8,0.8)",
                            }}
                          />
                          {returnSearchDraft && (
                            <button
                              type="button"
                              onClick={clearReturnSearch}
                              className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                              aria-label="Xóa tìm kiếm"
                              title="Xóa"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <button
                          type="submit"
                          className="btn-primary inline-flex items-center gap-2 px-4"
                          aria-label="Tìm kiếm thu tiền về"
                          title="Tìm kiếm"
                        >
                          <Search className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label
                        className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "rgba(226,255,232,0.5)" }}
                      >
                        L?c theo danh m?c thu ti?n
                      </label>
                      <select
                        value={returnCategoryFilter}
                        onChange={handleReturnCategoryFilterChange}
                        className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                        style={{
                          borderColor: "rgba(45,154,75,0.2)",
                          background: "rgba(5,13,8,0.8)",
                        }}
                      >
                        <option value="all" style={{ background: "#0a1a0f" }}>
                          Tất cả danh mục
                        </option>
                        {returnCategories.map((category) => (
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
                </form>

                {filteredReturns.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {visibleReturns.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                        style={{
                          borderColor: "rgba(45,154,75,0.1)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">
                            {item.description}
                          </p>
                          <p
                            className="mt-1 text-xs"
                            style={{ color: "rgba(226,255,232,0.45)" }}
                          >
                            {formatDate(item.date)}
                          </p>
                          {item.category?.name && (
                            <p
                              className="mt-1 text-xs"
                              style={{ color: "#aaf0be" }}
                            >
                              {item.category.name}
                            </p>
                          )}
                          {item.note && (
                            <p
                              className="mt-1 line-clamp-1 text-xs"
                              style={{ color: "rgba(226,255,232,0.55)" }}
                              title={item.note}
                            >
                              {item.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-green-400">
                            +{formatCurrency(item.amount)}
                          </p>
                          <button
                            type="button"
                            onClick={() => startEditReturn(item)}
                            className="rounded-xl bg-blue-500/10 p-2 text-blue-400"
                            title="Sửa"
                            aria-label={`Sửa ${item.description}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteReturn(item)}
                            className="rounded-xl bg-red-500/10 p-2 text-red-400"
                            title="Xóa"
                            aria-label={`Xóa ${item.description}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="mt-6 flex min-h-[220px] items-center justify-center rounded-2xl border px-6 py-10 text-center"
                    style={{
                      borderColor: "rgba(45,154,75,0.12)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div>
                      <p className="text-base font-semibold text-white">
                        Không tìm thấy dữ liệu nào
                      </p>
                      <p
                        className="mt-2 text-sm"
                        style={{ color: "rgba(226,255,232,0.45)" }}
                      >
                        Thử xoá bộ lọc hoặc nhập từ khoá khác để xem các lần thu tiền về.
                      </p>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p
                    className="text-sm"
                    style={{ color: "rgba(226,255,232,0.45)" }}
                  >
                    Hiển thị {visibleReturns.length} / {filteredReturns.length} giao dịch
                  </p>
                  <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      shouldScrollReturnPaginationRef.current = true;
                      setReturnPage((page) => Math.max(1, page - 1));
                    }}
                      disabled={safeReturnPage <= 1}
                      className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        borderColor: "rgba(45,154,75,0.16)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#e2ffe8",
                      }}
                    >
                      Trước
                    </button>
                    <span
                      className="rounded-xl border px-4 py-2 text-sm font-semibold"
                      style={{
                        borderColor: "rgba(45,154,75,0.16)",
                        background: "rgba(45,154,75,0.08)",
                        color: "#aaf0be",
                      }}
                    >
                      {safeReturnPage} / {totalReturnPages}
                    </span>
                  <button
                    type="button"
                    onClick={() => {
                      shouldScrollReturnPaginationRef.current = true;
                      setReturnPage((page) =>
                        Math.min(totalReturnPages, page + 1),
                      );
                    }}
                      disabled={safeReturnPage >= totalReturnPages}
                      className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        borderColor: "rgba(45,154,75,0.16)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#e2ffe8",
                      }}
                    >
                      Sau
                    </button>
                  </div>
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
              <p
                ref={capitalSectionTitleRef}
                className="text-lg font-semibold text-white"
              >
                Các lần rót vốn
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={openCreateCapitalModal}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm rót vốn
                </button>
              </div>
              <div className="flex items-start justify-between gap-3">
                {editingCapitalId && (
                  <span
                    className="rounded-full border px-3 py-1 text-xs font-medium"
                    style={{
                      borderColor: "rgba(45,154,75,0.18)",
                      background: "rgba(45,154,75,0.08)",
                      color: "#aaf0be",
                    }}
                  >
                    Đang chỉnh sửa
                  </span>
                )}
              </div>
              <form
                className="mt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  applyCapitalSearch();
                }}
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    <label
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "rgba(226,255,232,0.5)" }}
                    >
                      Tìm kiếm rót vốn
                    </label>
                    <div className="flex gap-2">
                      <div className="relative min-w-0 flex-1">
                        <input
                          type="text"
                          value={capitalSearchDraft}
                          onChange={(event) =>
                            handleCapitalSearchDraftChange(event.target.value)
                          }
                          placeholder="Tìm theo tên giao dịch..."
                          maxLength={100}
                          className="min-w-0 w-full rounded-xl border py-3 pl-5 pr-14 text-sm text-white outline-none"
                          style={{
                            borderColor: "rgba(45,154,75,0.2)",
                            background: "rgba(5,13,8,0.8)",
                          }}
                        />
                        {capitalSearchDraft && (
                          <button
                            type="button"
                            onClick={clearCapitalSearch}
                            className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                            aria-label="Xóa tìm kiếm"
                            title="Xóa"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="btn-primary inline-flex items-center gap-2 px-4"
                        aria-label="Tìm kiếm rót vốn"
                        title="Tìm kiếm"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {asset.is_business && (
                    <div>
                      <label
                        className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "rgba(226,255,232,0.5)" }}
                      >
                        Lọc theo danh mục business
                      </label>
                      <select
                        value={capitalCategoryFilter}
                        onChange={handleCapitalCategoryFilterChange}
                        className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                        style={{
                          borderColor: "rgba(45,154,75,0.2)",
                          background: "rgba(5,13,8,0.8)",
                        }}
                      >
                        <option value="all" style={{ background: "#0a1a0f" }}>
                          Tất cả danh mục
                        </option>
                        {capitalCategories.map((category) => (
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
                  )}
                </div>
              </form>
              <form
                onSubmit={addCapitalContribution}
                className="hidden mt-4 space-y-3"
              >
                <div
                  className="rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: "rgba(45,154,75,0.12)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="mb-3">
                    <label
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "rgba(226,255,232,0.5)" }}
                    >
                      Tìm kiếm rót vốn
                    </label>
                    <input
                      type="text"
                      value={capitalSearchDraft}
                      onChange={(event) =>
                        setCapitalSearchDraft(event.target.value)
                      }
                      placeholder="Tìm theo tên, số tiền hoặc ngày..."
                      maxLength={100}
                      className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                      style={{
                        borderColor: "rgba(45,154,75,0.2)",
                        background: "rgba(5,13,8,0.8)",
                      }}
                    />
                  </div>
                </div>
                {capitalError && (
                  <div
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      color: "#fca5a5",
                    }}
                  >
                    {capitalError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "rgba(226,255,232,0.5)" }}
                    >
                      Số tiền rót vốn
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={capitalAmount}
                      onChange={(event) =>
                        setCapitalAmount(formatNumberInput(event.target.value))
                      }
                      placeholder="0"
                      maxLength={15}
                      className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                      style={{
                        borderColor: "rgba(45,154,75,0.2)",
                        background: "rgba(5,13,8,0.8)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "rgba(226,255,232,0.5)" }}
                    >
                      Ngày
                    </label>
                    <DateInput
                      value={capitalDate}
                      onChange={setCapitalDate}
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
                    value={capitalDescription}
                    onChange={(event) =>
                      setCapitalDescription(event.target.value)
                    }
                    placeholder="Ví dụ: Rót vốn mua thêm..."
                    maxLength={120}
                    className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                    style={{
                      borderColor: "rgba(45,154,75,0.2)",
                      background: "rgba(5,13,8,0.8)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "rgba(226,255,232,0.5)" }}
                  >
                    Ghi chú
                  </label>
                  <textarea
                    value={capitalNote}
                    onChange={(event) => setCapitalNote(event.target.value)}
                    placeholder="Ghi chú thêm..."
                    maxLength={200}
                    rows={5}
                    className="w-full resize-none rounded-xl border px-4 py-3 text-sm text-white outline-none"
                    style={{
                      borderColor: "rgba(45,154,75,0.2)",
                      background: "rgba(5,13,8,0.8)",
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  {editingCapitalId && (
                    <button
                      type="button"
                      onClick={cancelEditCapital}
                      className="rounded-xl border px-4 py-3 text-sm font-semibold"
                      style={{
                        borderColor: "rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(226,255,232,0.7)",
                      }}
                    >
                      Hủy sửa
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={capitalLoading}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    {capitalLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Thêm rót vốn
                  </button>
                </div>
              </form>

              {filteredCapitalInvestments.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {visibleCapitalInvestments.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                      style={{
                        borderColor: "rgba(45,154,75,0.1)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">
                          {item.description}
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: "rgba(226,255,232,0.45)" }}
                        >
                          {formatDate(item.date)}
                        </p>
                        {asset.is_business && item.category?.name && (
                          <p
                            className="mt-1 text-xs"
                            style={{ color: "#aaf0be" }}
                          >
                            {item.category.name}
                          </p>
                        )}
                        {item.note && (
                          <p
                            className="mt-1 line-clamp-1 text-xs"
                            style={{ color: "rgba(226,255,232,0.55)" }}
                            title={item.note}
                          >
                            {item.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">
                          {formatCurrency(item.amount)}
                        </p>
                        <button
                          type="button"
                          onClick={() => startEditCapital(item)}
                          className="rounded-xl bg-blue-500/10 p-2 text-blue-400"
                          title="Sửa"
                          aria-label={`Sửa ${item.description}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCapitalContribution(item)}
                          className="rounded-xl bg-red-500/10 p-2 text-red-400"
                          title="Xóa"
                          aria-label={`Xóa ${item.description}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="mt-6 flex min-h-[220px] items-center justify-center rounded-2xl border px-6 py-10 text-center"
                  style={{
                    borderColor: "rgba(45,154,75,0.12)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div>
                    <p className="text-base font-semibold text-white">
                      Không tìm thấy dữ liệu nào
                    </p>
                    <p
                      className="mt-2 text-sm"
                      style={{ color: "rgba(226,255,232,0.45)" }}
                    >
                      Thử xoá bộ lọc hoặc nhập từ khoá khác để xem các lần rót vốn.
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className="text-sm"
                  style={{ color: "rgba(226,255,232,0.45)" }}
                >
                  Hiển thị {visibleCapitalInvestments.length} /{" "}
                  {filteredCapitalInvestments.length} giao dịch
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      shouldScrollCapitalPaginationRef.current = true;
                      setCapitalPage((page) => Math.max(1, page - 1));
                    }}
                    disabled={safeCapitalPage <= 1}
                    className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      borderColor: "rgba(45,154,75,0.16)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#e2ffe8",
                    }}
                  >
                    Trước
                  </button>
                  <span
                    className="rounded-xl border px-4 py-2 text-sm font-semibold"
                    style={{
                      borderColor: "rgba(45,154,75,0.16)",
                      background: "rgba(45,154,75,0.08)",
                      color: "#aaf0be",
                    }}
                  >
                    {safeCapitalPage} / {totalCapitalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      shouldScrollCapitalPaginationRef.current = true;
                      setCapitalPage((page) =>
                        Math.min(totalCapitalPages, page + 1),
                      );
                    }}
                    disabled={safeCapitalPage >= totalCapitalPages}
                    className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      borderColor: "rgba(45,154,75,0.16)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#e2ffe8",
                    }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {returnModalOpen && (
          <ModalOverlay
            onClose={cancelEditReturn}
            panelClassName="w-full sm:max-w-lg max-h-[90dvh] sm:max-h-[calc(100dvh-2rem)] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden"
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
                  {editingReturnId ? "Chỉnh sửa thu tiền về" : "Thêm thu tiền về"}
                </h2>
              </div>
              <button
                onClick={cancelEditReturn}
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
              onSubmit={saveReturn}
              className="flex-1 space-y-4 overflow-y-auto p-6 custom-scrollbar"
            >
              {returnError && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#fca5a5",
                  }}
                >
                  {returnError}
                </div>
              )}

              <div>
                <label
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "rgba(226,255,232,0.5)" }}
                >
                  Số tiền thu về
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={returnAmount}
                  onChange={(event) =>
                    setReturnAmount(formatNumberInput(event.target.value))
                  }
                  placeholder="0"
                  maxLength={15}
                  className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                  style={{
                    borderColor: "rgba(45,154,75,0.2)",
                    background: "rgba(5,13,8,0.8)",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "rgba(226,255,232,0.5)" }}
                  >
                    Ngày
                  </label>
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
                <div>
                  <label
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "rgba(226,255,232,0.5)" }}
                  >
                    Tên giao dịch
                  </label>
                  <input
                    type="text"
                    value={returnDescription}
                    onChange={(event) =>
                      setReturnDescription(event.target.value)
                    }
                    placeholder="Ví dụ: Chia lợi nhuận tháng 06..."
                    maxLength={120}
                    className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                    style={{
                      borderColor: "rgba(45,154,75,0.2)",
                      background: "rgba(5,13,8,0.8)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "rgba(226,255,232,0.5)" }}
                >
                  Danh mục
                </label>
                <select
                  value={returnCategoryId}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (nextValue === "__new__") {
                      setCategoryDialogTarget("return");
                      setShowNewCapitalCategoryInput(true);
                      return;
                    }
                    setReturnCategoryId(nextValue);
                    setShowNewCapitalCategoryInput(false);
                  }}
                  className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                  style={{
                    borderColor: "rgba(45,154,75,0.2)",
                    background: "rgba(5,13,8,0.8)",
                  }}
                >
                  {returnCategories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                      style={{ background: "#0a1a0f" }}
                    >
                      {category.name}
                    </option>
                  ))}
                  <option
                    value="__new__"
                    style={{ background: "#0a1a0f", color: "#bfdbfe" }}
                  >
                    + Tạo danh mục mới
                  </option>
                </select>
              </div>

              <div>
                <label
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "rgba(226,255,232,0.5)" }}
                >
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={returnNote}
                  onChange={(event) => setReturnNote(event.target.value)}
                  placeholder="Ghi chú thêm..."
                  maxLength={200}
                  className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                  style={{
                    borderColor: "rgba(45,154,75,0.2)",
                    background: "rgba(5,13,8,0.8)",
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelEditReturn}
                  className="rounded-xl border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor: "rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(226,255,232,0.7)",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={returnLoading}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {returnLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingReturnId ? "Lưu thay đổi" : "Thêm thu tiền về"}
                </button>
              </div>
            </form>
          </ModalOverlay>
        )}
        {capitalModalOpen && (
          <ModalOverlay
            onClose={cancelEditCapital}
            panelClassName="w-full sm:max-w-lg max-h-[90dvh] sm:max-h-[calc(100dvh-2rem)] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden"
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
                  {editingCapitalId ? "Chỉnh sửa rót vốn" : "Thêm rót vốn"}
                </h2>
              </div>
              <button
                onClick={cancelEditCapital}
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
              onSubmit={addCapitalContribution}
              className="flex-1 space-y-4 overflow-y-auto p-6 custom-scrollbar"
            >
              {capitalError && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#fca5a5",
                  }}
                >
                  {capitalError}
                </div>
              )}

              <div>
                <label
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "rgba(226,255,232,0.5)" }}
                >
                  Số tiền rót vốn
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={capitalAmount}
                  onChange={(event) =>
                    setCapitalAmount(formatNumberInput(event.target.value))
                  }
                  placeholder="0"
                  maxLength={15}
                  className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                  style={{
                    borderColor: "rgba(45,154,75,0.2)",
                    background: "rgba(5,13,8,0.8)",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "rgba(226,255,232,0.5)" }}
                  >
                    Ngày
                  </label>
                  <DateInput
                    value={capitalDate}
                    onChange={setCapitalDate}
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
                  <label
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "rgba(226,255,232,0.5)" }}
                  >
                    Tên giao dịch
                  </label>
                  <input
                    type="text"
                    value={capitalDescription}
                    onChange={(event) =>
                      setCapitalDescription(event.target.value)
                    }
                    placeholder="Ví dụ: Rót vốn mua thêm..."
                    maxLength={120}
                    className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                    style={{
                      borderColor: "rgba(45,154,75,0.2)",
                      background: "rgba(5,13,8,0.8)",
                    }}
                  />
                </div>
              </div>

              {asset.is_business && (
                <>
                  <div>
                    <label
                      className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "rgba(226,255,232,0.5)" }}
                    >
                      Danh mục
                    </label>
                    <select
                      value={capitalCategoryId}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        if (nextValue === "__new__") {
                          setCategoryDialogTarget("capital");
                          setShowNewCapitalCategoryInput(true);
                          setCapitalCategoryId(defaultCapitalCategoryId);
                          return;
                        }
                        setCapitalCategoryId(nextValue);
                        setShowNewCapitalCategoryInput(false);
                      }}
                      className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                      style={{
                        borderColor: "rgba(45,154,75,0.2)",
                        background: "rgba(5,13,8,0.8)",
                      }}
                    >
                      {capitalCategories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                          style={{ background: "#0a1a0f" }}
                        >
                          {category.name}
                        </option>
                      ))}
                      <option
                        value="__new__"
                        style={{ background: "#0a1a0f", color: "#bfdbfe" }}
                      >
                        + Tạo danh mục mới
                      </option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "rgba(226,255,232,0.5)" }}
                >
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={capitalNote}
                  onChange={(event) => setCapitalNote(event.target.value)}
                  placeholder="Ghi chú thêm..."
                  maxLength={200}
                  className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                  style={{
                    borderColor: "rgba(45,154,75,0.2)",
                    background: "rgba(5,13,8,0.8)",
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelEditCapital}
                  className="rounded-xl border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor: "rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(226,255,232,0.7)",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={capitalLoading}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {capitalLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingCapitalId ? "Lưu thay đổi" : "Thêm rót vốn"}
                </button>
              </div>
            </form>
          </ModalOverlay>
        )}
        {showNewCapitalCategoryInput && (
          <ModalOverlay
            onClose={() => {
              setShowNewCapitalCategoryInput(false);
              setNewCapitalCategoryName("");
              setCapitalError("");
            }}
            panelClassName="w-full sm:max-w-md max-h-[90dvh] sm:max-h-[calc(100dvh-2rem)] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden"
            panelStyle={{
              background: "rgba(8,20,12,0.97)",
              border: "1px solid rgba(59,130,246,0.28)",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div
                className="h-1 w-10 rounded-full"
                style={{ background: "rgba(59,130,246,0.35)" }}
              />
            </div>

            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{ borderColor: "rgba(59,130,246,0.18)" }}
            >
              <div>
                <h2 className="text-lg font-bold text-white">
                  Tạo danh mục mới
                </h2>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: "rgba(191,219,254,0.75)" }}
                >
                  Danh mục này sẽ dùng riêng cho phần business.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewCapitalCategoryInput(false);
                  setNewCapitalCategoryName("");
                  setCapitalError("");
                }}
                className="h-8 w-8 rounded-xl flex items-center justify-center transition-colors"
                style={{
                  color: "rgba(191,219,254,0.8)",
                  background: "rgba(59,130,246,0.08)",
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={createBusinessCapitalCategory}
              className="flex-1 space-y-4 overflow-y-auto p-6 custom-scrollbar"
            >
              {capitalError && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#fca5a5",
                  }}
                >
                  {capitalError}
                </div>
              )}

              <div>
                <label
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "#bfdbfe" }}
                >
                  Tên danh mục mới
                </label>
                <input
                  type="text"
                  value={newCapitalCategoryName}
                  onChange={(event) =>
                    setNewCapitalCategoryName(event.target.value)
                  }
                  placeholder="Ví dụ: Kinh doanh, Dự án A..."
                  maxLength={50}
                  className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none"
                  style={{
                    borderColor: "rgba(59,130,246,0.28)",
                    background: "rgba(5,13,8,0.8)",
                  }}
                />
                <p
                  className="mt-2 text-xs"
                  style={{ color: "rgba(191,219,254,0.85)" }}
                >
                  Danh mục này sẽ được tạo riêng cho phần business.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCapitalCategoryInput(false);
                    setNewCapitalCategoryName("");
                    setCapitalError("");
                  }}
                  className="rounded-xl border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor: "rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(226,255,232,0.7)",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={newCapitalCategorySaving}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {newCapitalCategorySaving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Lưu danh mục
                </button>
              </div>
            </form>
          </ModalOverlay>
        )}
      </div>
    </div>
  );
}

