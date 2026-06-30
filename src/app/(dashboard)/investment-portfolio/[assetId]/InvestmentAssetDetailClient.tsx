"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  latestValuation?: InvestmentValuation;
  returns: InvestmentReturn[];
  totalInvested: number;
  totalReturned: number;
  currentValue: number;
  profitLossAmount: number;
  profitLossPercent: number;
  valuationPage: number;
  filteredValuationCount: number;
  valuationPageSize: number;
  returnSearchQuery: string;
  returnCategoryFilter: string;
  returnPage: number;
  filteredReturnCount: number;
  returnPageSize: number;
  capitalSearchQuery: string;
  capitalCategoryFilter: string;
  capitalPage: number;
  filteredCapitalCount: number;
  capitalPageSize: number;
  totalReturnTransactionCount: number;
  totalCapitalTransactionCount: number;
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
  investmentCategories,
  valuations,
  latestValuation,
  returns,
  totalInvested,
  totalReturned,
  currentValue,
  profitLossAmount,
  profitLossPercent,
  valuationPage,
  filteredValuationCount,
  valuationPageSize,
  returnSearchQuery,
  returnCategoryFilter,
  returnPage,
  filteredReturnCount,
  returnPageSize,
  capitalSearchQuery,
  capitalCategoryFilter,
  capitalPage,
  filteredCapitalCount,
  capitalPageSize,
  totalReturnTransactionCount,
  totalCapitalTransactionCount,
}: InvestmentAssetDetailClientProps) {
  const onMenuToggle = useSidebarToggle();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const initialCapitalCategoryOptions = investmentCategories.filter(
    (category) =>
      category.type === (asset.is_business ? "business" : "investment"),
  );
  const initialReturnCategoryOptions = investmentCategories.filter(
    (category) => category.type === "investment_return",
  );
  const assetCategoryOptions = investmentCategories.filter(
    (category) => category.type === "investment",
  );
  const [capitalCategories, setCapitalCategories] = useState(
    initialCapitalCategoryOptions,
  );
  const [returnCategories, setReturnCategories] = useState(
    initialReturnCategoryOptions,
  );
  const [assetCategoryId, setAssetCategoryId] = useState(
    asset.category_id ||
      asset.category?.id ||
      assetCategoryOptions[0]?.id ||
      "",
  );
  const defaultCapitalCategoryId = asset.is_business
    ? ""
    : assetCategoryId || capitalCategories[0]?.id || "";
  const [isPending, startTransition] = useTransition();
  const [valuationDate, setValuationDate] = useState(
    latestValuation?.valuation_month || new Date().toISOString().split("T")[0],
  );
  const [valuationAmount, setValuationAmount] = useState(
    latestValuation?.current_value
      ? formatNumberInput(String(latestValuation.current_value))
      : "0",
  );
  const [valuationNote, setValuationNote] = useState(
    latestValuation?.note || "",
  );
  const [editingValuationId, setEditingValuationId] = useState<string | null>(
    null,
  );
  const [valuationModalOpen, setValuationModalOpen] = useState(false);
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
  const [returnSearchDraft, setReturnSearchDraft] = useState(returnSearchQuery);
  const [selectedValuationIds, setSelectedValuationIds] = useState<string[]>(
    [],
  );
  const [selectedReturnIds, setSelectedReturnIds] = useState<string[]>([]);
  const [deletingValuationId, setDeletingValuationId] = useState<string | null>(
    null,
  );
  const [deletingReturnId, setDeletingReturnId] = useState<string | null>(null);
  const [capitalSearchDraft, setCapitalSearchDraft] =
    useState(capitalSearchQuery);
  const [selectedCapitalIds, setSelectedCapitalIds] = useState<string[]>([]);
  const [deletingCapitalId, setDeletingCapitalId] = useState<string | null>(
    null,
  );
  const [assetName, setAssetName] = useState(asset.name);
  const [assetDescription, setAssetDescription] = useState(
    asset.description || "",
  );
  const [error, setError] = useState("");
  const [assetError, setAssetError] = useState("");
  const currentCategoryId = assetCategoryId;
  const defaultReturnCategoryId = returnCategories[0]?.id || "";
  const [returnCategoryId, setReturnCategoryId] = useState(
    defaultReturnCategoryId,
  );
  const totalValuationPages = Math.max(
    1,
    Math.ceil(filteredValuationCount / valuationPageSize),
  );
  const safeValuationPage = Math.min(valuationPage, totalValuationPages);
  const valuationSectionTitleRef = useRef<HTMLParagraphElement | null>(null);
  const shouldScrollValuationPaginationRef = useRef(false);
  const visibleValuations = valuations;
  const valuationDisplayCount =
    safeValuationPage === 1
      ? visibleValuations.length
      : (safeValuationPage - 1) * valuationPageSize + 1;
  const totalReturnPages = Math.max(
    1,
    Math.ceil(filteredReturnCount / returnPageSize),
  );
  const safeReturnPage = Math.min(returnPage, totalReturnPages);
  const returnSectionTitleRef = useRef<HTMLParagraphElement | null>(null);
  const shouldScrollReturnPaginationRef = useRef(false);
  const visibleReturns = returns;
  const returnDisplayCount =
    safeReturnPage === 1
      ? visibleReturns.length
      : (safeReturnPage - 1) * returnPageSize + 1;
  const totalCapitalPages = Math.max(
    1,
    Math.ceil(filteredCapitalCount / capitalPageSize),
  );
  const safeCapitalPage = Math.min(capitalPage, totalCapitalPages);
  const capitalSectionTitleRef = useRef<HTMLParagraphElement | null>(null);
  const shouldScrollCapitalPaginationRef = useRef(false);
  const visibleCapitalInvestments = investments;
  const capitalDisplayCount =
    safeCapitalPage === 1
      ? visibleCapitalInvestments.length
      : (safeCapitalPage - 1) * capitalPageSize + 1;
  const selectedValuations = visibleValuations.filter((item) =>
    selectedValuationIds.includes(item.id),
  );
  const selectedReturns = returns.filter((item) =>
    selectedReturnIds.includes(item.id),
  );
  const selectedCapitals = investments.filter((item) =>
    selectedCapitalIds.includes(item.id),
  );
  const selectedVisibleReturns = visibleReturns.filter((item) =>
    selectedReturnIds.includes(item.id),
  );
  const selectedVisibleCapitals = visibleCapitalInvestments.filter((item) =>
    selectedCapitalIds.includes(item.id),
  );
  const allVisibleValuationsSelected =
    visibleValuations.length > 0 &&
    selectedValuations.length === visibleValuations.length;
  const allVisibleReturnsSelected =
    visibleReturns.length > 0 &&
    selectedVisibleReturns.length === visibleReturns.length;
  const allVisibleCapitalsSelected =
    visibleCapitalInvestments.length > 0 &&
    selectedVisibleCapitals.length === visibleCapitalInvestments.length;
  const showMobileBulkActionBar =
    !valuationModalOpen &&
    !returnModalOpen &&
    !capitalModalOpen &&
    !showNewCapitalCategoryInput &&
    (selectedValuations.length > 0 ||
      selectedReturns.length > 0 ||
      selectedCapitals.length > 0);
  const totalSelectedMobileItems =
    selectedValuations.length +
    selectedReturns.length +
    selectedCapitals.length;

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
    if (!shouldScrollValuationPaginationRef.current) {
      return;
    }
    shouldScrollValuationPaginationRef.current = false;
    valuationSectionTitleRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [valuationPage]);

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

  useEffect(() => {
    setSelectedValuationIds((current) =>
      current.filter((id) => valuations.some((item) => item.id === id)),
    );
  }, [valuations]);

  useEffect(() => {
    setSelectedReturnIds((current) =>
      current.filter((id) => returns.some((item) => item.id === id)),
    );
  }, [returns]);

  useEffect(() => {
    setSelectedCapitalIds((current) =>
      current.filter((id) => investments.some((item) => item.id === id)),
    );
  }, [investments]);

  useEffect(() => {
    setReturnSearchDraft(returnSearchQuery);
  }, [returnSearchQuery]);

  useEffect(() => {
    setCapitalSearchDraft(capitalSearchQuery);
  }, [capitalSearchQuery]);

  const profitLossColor =
    profitLossAmount > 0
      ? "#4ade80"
      : profitLossAmount < 0
        ? "#f87171"
        : undefined;
  const canDeleteAsset =
    totalCapitalTransactionCount === 0 && totalReturnTransactionCount === 0;

  const navigateWithFilters = (
    updates: Record<string, string | number | undefined>,
  ) => {
    const params = new URLSearchParams();
    const nextValuationPage = Number(updates.valuation_page ?? valuationPage);
    const nextReturnSearch = String(
      updates.return_q ?? returnSearchQuery,
    ).trim();
    const nextReturnCategory = String(
      updates.return_category ?? returnCategoryFilter,
    ).trim();
    const nextReturnPage = Number(updates.return_page ?? returnPage);
    const nextCapitalSearch = String(
      updates.capital_q ?? capitalSearchQuery,
    ).trim();
    const nextCapitalCategory = String(
      updates.capital_category ?? capitalCategoryFilter,
    ).trim();
    const nextCapitalPage = Number(updates.capital_page ?? capitalPage);

    if (nextValuationPage > 1) {
      params.set("valuation_page", String(nextValuationPage));
    }

    if (nextReturnSearch) params.set("return_q", nextReturnSearch);
    if (nextReturnCategory && nextReturnCategory !== "all") {
      params.set("return_category", nextReturnCategory);
    }
    if (nextReturnPage > 1) {
      params.set("return_page", String(nextReturnPage));
    }

    if (nextCapitalSearch) params.set("capital_q", nextCapitalSearch);
    if (nextCapitalCategory && nextCapitalCategory !== "all") {
      params.set("capital_category", nextCapitalCategory);
    }
    if (nextCapitalPage > 1) {
      params.set("capital_page", String(nextCapitalPage));
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

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
        category_id: assetCategoryId || null,
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
    const trimmedAmount = valuationAmount.trim();
    const amountNumber = parseFormattedNumber(trimmedAmount);

    if (!trimmedAmount || amountNumber <= 0) {
      setError("Vui lòng nhập giá trị hiện tại.");
      return;
    }

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
    setEditingValuationId(null);
    setValuationDate(new Date().toISOString().split("T")[0]);
    setValuationAmount("0");
    setValuationNote("");
    setValuationModalOpen(false);
    startTransition(() => router.refresh());
  };

  const handleSaveValuation = async (event: React.FormEvent) => {
    if (!editingValuationId) {
      await saveValuation(event);
      return;
    }

    event.preventDefault();
    const trimmedAmount = valuationAmount.trim();
    const amountNumber = parseFormattedNumber(trimmedAmount);

    if (!trimmedAmount || amountNumber <= 0) {
      setError("Vui lòng nhập giá trị hiện tại.");
      return;
    }

    if (amountNumber < 0) {
      setError("Giá trị hiện tại không hợp lệ.");
      return;
    }

    const supabase = createClient();
    const payload = {
      asset_id: asset.id,
      user_id: asset.user_id,
      valuation_month: normalizeMonthDate(valuationDate),
      current_value: amountNumber,
      note: valuationNote || null,
    };

    const { error: dbError } = await supabase
      .from("investment_valuations")
      .update(payload)
      .eq("id", editingValuationId);

    if (dbError) {
      setError("Không thể lưu giá trị tháng. Vui lòng thử lại.");
      return;
    }

    setEditingValuationId(null);
    setValuationDate(new Date().toISOString().split("T")[0]);
    setValuationAmount("0");
    setValuationNote("");
    setValuationModalOpen(false);
    showToast("Chỉnh sửa thành công");
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
      setCapitalError("Vui lòng nhập tên danh mục.");
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
      setCapitalError("Không thể tạo danh mục mới.");
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
      setReturnModalOpen(true);
    } else {
      setCapitalCategoryId(createdCategory.id);
      setCapitalModalOpen(true);
    }
    setNewCapitalCategoryName("");
    setShowNewCapitalCategoryInput(false);
    setNewCapitalCategorySaving(false);
    showToast("Tạo mới thành công");
  };

  const openCreateCategoryModal = (target: "capital" | "return") => {
    setCategoryDialogTarget(target);
    setShowNewCapitalCategoryInput(true);
    setNewCapitalCategoryName("");
    setCapitalError("");
  };

  const closeCreateCategoryModal = () => {
    setShowNewCapitalCategoryInput(false);
    setNewCapitalCategoryName("");
    setCapitalError("");
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

  const openCreateValuationModal = () => {
    setEditingValuationId(null);
    setValuationDate(new Date().toISOString().split("T")[0]);
    setValuationAmount("0");
    setValuationNote("");
    setError("");
    setValuationModalOpen(true);
  };

  const startEditValuation = (item: InvestmentValuation) => {
    setEditingValuationId(item.id);
    setValuationDate(item.valuation_month);
    setValuationAmount(formatNumberInput(String(item.current_value)));
    setValuationNote(item.note || "");
    setError("");
    setValuationModalOpen(true);
  };

  const cancelEditValuation = () => {
    setEditingValuationId(null);
    setValuationDate(new Date().toISOString().split("T")[0]);
    setValuationAmount("0");
    setValuationNote("");
    setError("");
    setValuationModalOpen(false);
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
    navigateWithFilters({
      return_q: returnSearchDraft.trim(),
      return_page: 1,
    });
  };

  const handleReturnSearchDraftChange = (value: string) => {
    setReturnSearchDraft(value);

    if (!value.trim()) {
      navigateWithFilters({
        return_q: "",
        return_page: 1,
      });
    }
  };

  const clearReturnSearch = () => {
    setReturnSearchDraft("");
    navigateWithFilters({
      return_q: "",
      return_page: 1,
    });
  };

  const handleReturnCategoryFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    navigateWithFilters({
      return_category: event.target.value,
      return_page: 1,
    });
  };

  const applyCapitalSearch = () => {
    navigateWithFilters({
      capital_q: capitalSearchDraft.trim(),
      capital_page: 1,
    });
  };

  const handleCapitalSearchDraftChange = (value: string) => {
    setCapitalSearchDraft(value);

    if (!value.trim()) {
      navigateWithFilters({
        capital_q: "",
        capital_page: 1,
      });
    }
  };

  const clearCapitalSearch = () => {
    setCapitalSearchDraft("");
    navigateWithFilters({
      capital_q: "",
      capital_page: 1,
    });
  };

  const handleCapitalCategoryFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    navigateWithFilters({
      capital_category: event.target.value,
      capital_page: 1,
    });
  };

  const toggleSelection = (
    id: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id],
    );
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

    setDeletingCapitalId(item.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("investments")
      .delete()
      .eq("id", item.id);
    if (error) {
      setDeletingCapitalId(null);
      setCapitalError("Không thể xóa lần rót vốn. Vui lòng thử lại.");
      return;
    }

    if (editingCapitalId === item.id) {
      cancelEditCapital();
    }

    showToast("Xóa thành công");
    startTransition(() => router.refresh());
    setDeletingCapitalId(null);
  };

  const deleteReturn = async (item: InvestmentReturn) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${item.description}" không?`)) {
      return;
    }
    setDeletingReturnId(item.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("investment_returns")
      .delete()
      .eq("id", item.id);
    if (error) {
      setDeletingReturnId(null);
      setReturnError("Không thể xóa giao dịch thu tiền. Vui lòng thử lại.");
      return;
    }
    if (editingReturnId === item.id) {
      cancelEditReturn();
    }
    showToast("Xóa thành công");
    startTransition(() => router.refresh());
    setDeletingReturnId(null);
  };

  const deleteValuation = async (valuationId: string, label: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${label}" không?`)) {
      return;
    }
    setDeletingValuationId(valuationId);
    const supabase = createClient();
    const { error } = await supabase
      .from("investment_valuations")
      .delete()
      .eq("id", valuationId);
    if (error) {
      setDeletingValuationId(null);
      return;
    }
    showToast("Xóa thành công");
    startTransition(() => router.refresh());
    setDeletingValuationId(null);
  };

  const handleBulkDeleteValuations = async (items: InvestmentValuation[]) => {
    if (items.length === 0) return;
    const names =
      items.length === 1
        ? `"${formatDate(items[0].valuation_month)}"`
        : `${items.length} mục đã chọn`;
    if (!window.confirm(`Bạn có chắc muốn xóa ${names} không?`)) return;

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("investment_valuations")
      .delete()
      .in(
        "id",
        items.map((item) => item.id),
      );

    if (dbError) {
      setError("Không thể xóa giá trị tháng. Vui lòng thử lại.");
      return;
    }

    setSelectedValuationIds([]);
    showToast("Xóa thành công");
    startTransition(() => router.refresh());
  };

  const handleBulkDeleteReturns = async (items: InvestmentReturn[]) => {
    if (items.length === 0) return;
    const names =
      items.length === 1
        ? `"${items[0].description}"`
        : `${items.length} mục đã chọn`;
    if (!window.confirm(`Bạn có chắc muốn xóa ${names} không?`)) return;

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("investment_returns")
      .delete()
      .in(
        "id",
        items.map((item) => item.id),
      );

    if (dbError) {
      setReturnError("Không thể xóa giao dịch thu tiền. Vui lòng thử lại.");
      return;
    }

    setSelectedReturnIds([]);
    showToast("Xóa thành công");
    startTransition(() => router.refresh());
  };

  const handleBulkDeleteCapitals = async (items: Expense[]) => {
    if (items.length === 0) return;
    const names =
      items.length === 1
        ? `"${items[0].description}"`
        : `${items.length} mục đã chọn`;
    if (!window.confirm(`Bạn có chắc muốn xóa ${names} không?`)) return;

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("investments")
      .delete()
      .in(
        "id",
        items.map((item) => item.id),
      );

    if (dbError) {
      setCapitalError("Không thể xóa lần rót vốn. Vui lòng thử lại.");
      return;
    }

    setSelectedCapitalIds([]);
    showToast("Xóa thành công");
    startTransition(() => router.refresh());
  };

  const handleDeleteAllSelectedMobile = async () => {
    if (totalSelectedMobileItems === 0) return;

    const names =
      totalSelectedMobileItems === 1
        ? "mục đã chọn"
        : `${totalSelectedMobileItems} mục đã chọn`;

    if (!window.confirm(`Bạn có chắc muốn xóa ${names} không?`)) {
      return;
    }

    const supabase = createClient();

    if (selectedValuationIds.length > 0) {
      const { error: valuationError } = await supabase
        .from("investment_valuations")
        .delete()
        .in("id", selectedValuationIds);

      if (valuationError) {
        setError("Không thể xóa giá trị tháng. Vui lòng thử lại.");
        return;
      }
    }

    if (selectedReturnIds.length > 0) {
      const { error: returnDbError } = await supabase
        .from("investment_returns")
        .delete()
        .in("id", selectedReturnIds);

      if (returnDbError) {
        setReturnError("Không thể xóa giao dịch thu tiền. Vui lòng thử lại.");
        return;
      }
    }

    if (selectedCapitalIds.length > 0) {
      const { error: capitalDbError } = await supabase
        .from("investments")
        .delete()
        .in("id", selectedCapitalIds);

      if (capitalDbError) {
        setCapitalError("Không thể xóa lần rót vốn. Vui lòng thử lại.");
        return;
      }
    }

    setSelectedValuationIds([]);
    setSelectedReturnIds([]);
    setSelectedCapitalIds([]);
    showToast("Xóa thành công");
    startTransition(() => router.refresh());
  };

  const deleteAsset = async () => {
    if (!canDeleteAsset) {
      window.alert("Khoản đầu tư này vẫn còn giao dịch nên chưa thể xóa.");
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa "${asset.name}" không?`)) {
      return;
    }

    const supabase = createClient();

    const { error: valuationDeleteError } = await supabase
      .from("investment_valuations")
      .delete()
      .eq("asset_id", asset.id);

    if (valuationDeleteError) {
      setAssetError("Không thể xóa khoản đầu tư. Vui lòng thử lại.");
      return;
    }

    const { error: assetDeleteError } = await supabase
      .from("investment_assets")
      .delete()
      .eq("id", asset.id);

    if (assetDeleteError) {
      setAssetError("Không thể xóa khoản đầu tư. Vui lòng thử lại.");
      return;
    }

    showToast("Xóa khoản đầu tư thành công");
    router.push("/investment-portfolio");
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
        className="flex-1 overflow-y-auto px-4 py-6 pb-28 custom-scrollbar sm:px-6 sm:pb-6"
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

            <div>
              <label
                className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                style={{ color: "rgba(226,255,232,0.5)" }}
              >
                Danh mục đầu tư
              </label>
              <div className="relative">
                <select
                  value={assetCategoryId}
                  onChange={(event) => setAssetCategoryId(event.target.value)}
                  className="w-full appearance-none rounded-xl border px-4 py-3 pr-10 text-sm text-white outline-none"
                  style={{
                    borderColor: "rgba(45,154,75,0.2)",
                    background: "rgba(5,13,8,0.8)",
                  }}
                >
                  {assetCategoryOptions.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                      style={{ background: "#0a1a0f" }}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
                <Pencil
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "rgba(226,255,232,0.35)" }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={deleteAsset}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
              style={{
                borderColor: "rgba(239,68,68,0.25)",
                background: "rgba(239,68,68,0.08)",
                color: "#fca5a5",
              }}
            >
              <Trash2 className="h-4 w-4" />
              Xóa khoản đầu tư
            </button>
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
                <p
                  ref={valuationSectionTitleRef}
                  className="text-lg font-semibold text-white"
                >
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

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={openCreateValuationModal}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm giá trị tháng
                </button>
                {editingValuationId && (
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

              <div className="mb-4 mt-4 flex flex-wrap items-center justify-end gap-2">
                {filteredValuationCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedValuationIds(
                        allVisibleValuationsSelected
                          ? selectedValuationIds.filter(
                              (id) =>
                                !visibleValuations.some(
                                  (item) => item.id === id,
                                ),
                            )
                          : Array.from(
                              new Set([
                                ...selectedValuationIds,
                                ...visibleValuations.map((item) => item.id),
                              ]),
                            ),
                      )
                    }
                    className="rounded-xl border px-4 py-2 text-sm font-semibold"
                    style={{
                      borderColor: "rgba(45,154,75,0.16)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#e2ffe8",
                    }}
                  >
                    {allVisibleValuationsSelected ? "Bỏ chọn" : "Chọn tất cả"}
                  </button>
                )}
                {selectedValuations.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleBulkDeleteValuations(selectedValuations)
                    }
                    className="hidden rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 lg:inline-flex"
                  >
                    Xóa đã chọn ({selectedValuations.length})
                  </button>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {visibleValuations.map((valuation) => (
                  <div
                    key={valuation.id}
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                    style={{
                      borderColor: "rgba(45,154,75,0.1)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleSelection(valuation.id, setSelectedValuationIds)
                      }
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                        selectedValuationIds.includes(valuation.id)
                          ? "border-transparent bg-[#2D9A4B] text-white"
                          : "bg-transparent text-transparent"
                      }`}
                      style={{
                        borderColor: selectedValuationIds.includes(valuation.id)
                          ? "#2D9A4B"
                          : "rgba(226,255,232,0.35)",
                      }}
                      aria-label={`Chọn ${formatDate(valuation.valuation_month)}`}
                    >
                      {selectedValuationIds.includes(valuation.id) ? (
                        <span className="text-[11px] leading-none">✓</span>
                      ) : null}
                    </button>
                    <div className="min-w-0 flex-1">
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
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-sm font-bold text-white">
                        {formatCurrency(valuation.current_value)}
                      </p>
                      <button
                        type="button"
                        onClick={() => startEditValuation(valuation)}
                        className="rounded-xl bg-blue-500/10 p-2 text-blue-400"
                        title="Sửa"
                        aria-label={`Sửa ${formatDate(valuation.valuation_month)}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          deleteValuation(
                            valuation.id,
                            formatDate(valuation.valuation_month),
                          )
                        }
                        disabled={deletingValuationId === valuation.id}
                        className="rounded-xl bg-red-500/10 p-2 text-red-400"
                      >
                        {deletingValuationId === valuation.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/40 border-t-red-400" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className="text-sm"
                  style={{ color: "rgba(226,255,232,0.45)" }}
                >
                  Hiển thị {valuationDisplayCount} / {filteredValuationCount}{" "}
                  mục
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      shouldScrollValuationPaginationRef.current = true;
                      navigateWithFilters({
                        valuation_page: Math.max(1, safeValuationPage - 1),
                      });
                    }}
                    disabled={safeValuationPage <= 1}
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
                    {safeValuationPage} / {totalValuationPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      shouldScrollValuationPaginationRef.current = true;
                      navigateWithFilters({
                        valuation_page: Math.min(
                          totalValuationPages,
                          safeValuationPage + 1,
                        ),
                      });
                    }}
                    disabled={safeValuationPage >= totalValuationPages}
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
                  Dùng cho các khoản business có dòng tiền quay về, ví dụ ký hợp
                  đồng hoặc chia lợi nhuận.
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
                <div className="flex flex-wrap items-start justify-between gap-3">
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
                  <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto">
                    {filteredReturnCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedReturnIds(
                            allVisibleReturnsSelected
                              ? selectedReturnIds.filter(
                                  (id) =>
                                    !visibleReturns.some(
                                      (item) => item.id === id,
                                    ),
                                )
                              : Array.from(
                                  new Set([
                                    ...selectedReturnIds,
                                    ...visibleReturns.map((item) => item.id),
                                  ]),
                                ),
                          )
                        }
                        className="rounded-xl border px-4 py-2 text-sm font-semibold"
                        style={{
                          borderColor: "rgba(45,154,75,0.16)",
                          background: "rgba(255,255,255,0.04)",
                          color: "#e2ffe8",
                        }}
                      >
                        {allVisibleReturnsSelected ? "Bỏ chọn" : "Chọn tất cả"}
                      </button>
                    )}
                    {selectedReturns.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleBulkDeleteReturns(selectedReturns)}
                        className=" rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 lg:inline-flex"
                      >
                        Xóa đã chọn ({selectedReturns.length})
                      </button>
                    )}
                  </div>
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
                        Lọc theo danh mục thu tiền
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

                {filteredReturnCount > 0 ? (
                  <div className="mt-6 space-y-3">
                    {visibleReturns.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 rounded-2xl border px-4 py-3"
                        style={{
                          borderColor: "rgba(45,154,75,0.1)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleSelection(item.id, setSelectedReturnIds)
                          }
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                            selectedReturnIds.includes(item.id)
                              ? "border-transparent bg-[#2D9A4B] text-white"
                              : "bg-transparent text-transparent"
                          }`}
                          style={{
                            borderColor: selectedReturnIds.includes(item.id)
                              ? "#2D9A4B"
                              : "rgba(226,255,232,0.35)",
                          }}
                          aria-label={`Chọn ${item.description}`}
                        >
                          {selectedReturnIds.includes(item.id) ? (
                            <span className="text-[11px] leading-none">✓</span>
                          ) : null}
                        </button>
                        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-semibold text-white"
                              title={item.description}
                            >
                              {item.description}
                            </p>
                            <p
                              className="mt-1 truncate text-xs"
                              style={{ color: "rgba(226,255,232,0.45)" }}
                            >
                              {formatDate(item.date)}
                            </p>
                            {item.category?.name && (
                              <p
                                className="mt-1 truncate text-xs"
                                title={item.category.name}
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
                          <div className="flex items-center justify-between gap-2 sm:shrink-0">
                            <p className="max-w-[120px] truncate text-sm font-bold text-green-400 sm:max-w-none sm:text-right">
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
                              disabled={deletingReturnId === item.id}
                              className="rounded-xl bg-red-500/10 p-2 text-red-400"
                              title="Xóa"
                              aria-label={`Xóa ${item.description}`}
                            >
                              {deletingReturnId === item.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/40 border-t-red-400" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
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
                        Thử xoá bộ lọc hoặc nhập từ khoá khác để xem các lần thu
                        tiền về.
                      </p>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p
                    className="text-sm"
                    style={{ color: "rgba(226,255,232,0.45)" }}
                  >
                    Hiển thị {returnDisplayCount} / {filteredReturnCount} giao
                    dịch
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        shouldScrollReturnPaginationRef.current = true;
                        navigateWithFilters({
                          return_page: Math.max(1, safeReturnPage - 1),
                        });
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
                        navigateWithFilters({
                          return_page: Math.min(
                            totalReturnPages,
                            safeReturnPage + 1,
                          ),
                        });
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
              <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
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
                <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto">
                  {filteredCapitalCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCapitalIds(
                          allVisibleCapitalsSelected
                            ? selectedCapitalIds.filter(
                                (id) =>
                                  !visibleCapitalInvestments.some(
                                    (item) => item.id === id,
                                  ),
                              )
                            : Array.from(
                                new Set([
                                  ...selectedCapitalIds,
                                  ...visibleCapitalInvestments.map(
                                    (item) => item.id,
                                  ),
                                ]),
                              ),
                        )
                      }
                      className="rounded-xl border px-4 py-2 text-sm font-semibold"
                      style={{
                        borderColor: "rgba(45,154,75,0.16)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#e2ffe8",
                      }}
                    >
                      {allVisibleCapitalsSelected ? "Bỏ chọn" : "Chọn tất cả"}
                    </button>
                  )}
                  {selectedCapitals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleBulkDeleteCapitals(selectedCapitals)}
                      className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 lg:inline-flex"
                    >
                      Xóa đã chọn ({selectedCapitals.length})
                    </button>
                  )}
                </div>
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

              {filteredCapitalCount > 0 ? (
                <div className="mt-6 space-y-3">
                  {visibleCapitalInvestments.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 rounded-2xl border px-4 py-3"
                      style={{
                        borderColor: "rgba(45,154,75,0.1)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleSelection(item.id, setSelectedCapitalIds)
                        }
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                          selectedCapitalIds.includes(item.id)
                            ? "border-transparent bg-[#2D9A4B] text-white"
                            : "bg-transparent text-transparent"
                        }`}
                        style={{
                          borderColor: selectedCapitalIds.includes(item.id)
                            ? "#2D9A4B"
                            : "rgba(226,255,232,0.35)",
                        }}
                        aria-label={`Chọn ${item.description}`}
                      >
                        {selectedCapitalIds.includes(item.id) ? (
                          <span className="text-[11px] leading-none">✓</span>
                        ) : null}
                      </button>
                      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm font-semibold text-white"
                            title={item.description}
                          >
                            {item.description}
                          </p>
                          <p
                            className="mt-1 truncate text-xs"
                            style={{ color: "rgba(226,255,232,0.45)" }}
                          >
                            {formatDate(item.date)}
                          </p>
                          {asset.is_business && item.category?.name && (
                            <p
                              className="mt-1 truncate text-xs"
                              title={item.category.name}
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
                        <div className="flex items-center justify-between gap-2 sm:shrink-0">
                          <p className="max-w-[120px] truncate text-sm font-bold text-white sm:max-w-none sm:text-right">
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
                            disabled={deletingCapitalId === item.id}
                            className="rounded-xl bg-red-500/10 p-2 text-red-400"
                            title="Xóa"
                            aria-label={`Xóa ${item.description}`}
                          >
                            {deletingCapitalId === item.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/40 border-t-red-400" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
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
                      Thử xoá bộ lọc hoặc nhập từ khoá khác để xem các lần rót
                      vốn.
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className="text-sm"
                  style={{ color: "rgba(226,255,232,0.45)" }}
                >
                  Hiển thị {capitalDisplayCount} / {filteredCapitalCount} giao
                  dịch
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      shouldScrollCapitalPaginationRef.current = true;
                      navigateWithFilters({
                        capital_page: Math.max(1, safeCapitalPage - 1),
                      });
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
                      navigateWithFilters({
                        capital_page: Math.min(
                          totalCapitalPages,
                          safeCapitalPage + 1,
                        ),
                      });
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
        {valuationModalOpen && (
          <ModalOverlay
            onClose={cancelEditValuation}
            panelClassName="w-[calc(100%-1rem)] sm:w-full sm:max-w-lg max-h-[90dvh] sm:max-h-[calc(100dvh-2rem)] rounded-3xl sm:rounded-2xl flex flex-col overflow-hidden"
            panelStyle={{
              background: "rgba(8,20,12,0.97)",
              border: "1px solid rgba(45,154,75,0.2)",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex justify-center pb-1 pt-3 sm:hidden">
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
                  {editingValuationId
                    ? "Chỉnh sửa giá trị tháng"
                    : "Thêm giá trị tháng"}
                </h2>
              </div>
              <button
                type="button"
                onClick={cancelEditValuation}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
                style={{
                  color: "rgba(226,255,232,0.5)",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveValuation}
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

              <div>
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelEditValuation}
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
                  disabled={isPending}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {editingValuationId ? "Lưu thay đổi" : "Lưu giá trị tháng"}
                </button>
              </div>
            </form>
          </ModalOverlay>
        )}
        {returnModalOpen && (
          <ModalOverlay
            onClose={cancelEditReturn}
            panelClassName="w-[calc(100%-1rem)] sm:w-full sm:max-w-xl max-h-[90dvh] sm:max-h-[calc(100dvh-2rem)] rounded-3xl sm:rounded-2xl flex flex-col overflow-hidden"
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
                  {editingReturnId
                    ? "Chỉnh sửa thu tiền về"
                    : "Thêm thu tiền về"}
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
                      openCreateCategoryModal("return");
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
                  <option disabled value="" style={{ background: "#0a1a0f" }}>
                    {returnCategories.length === 0 ? "" : "Chọn danh mục"}
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
                  <option
                    value="__new__"
                    style={{ background: "#0a1a0f", color: "#bfdbfe" }}
                  >
                    + Tạo danh mục mới
                  </option>
                </select>
                <button
                  type="button"
                  onClick={() => openCreateCategoryModal("return")}
                  className="hidden"
                  style={{
                    borderColor: "rgba(59,130,246,0.28)",
                    background: "rgba(59,130,246,0.08)",
                    color: "#bfdbfe",
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Tạo danh mục mới
                </button>
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
            panelClassName="w-[calc(100%-1rem)] sm:w-full sm:max-w-xl max-h-[90dvh] sm:max-h-[calc(100dvh-2rem)] rounded-3xl sm:rounded-2xl flex flex-col overflow-hidden"
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
                          openCreateCategoryModal("capital");
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
                      <option
                        disabled
                        value=""
                        style={{ background: "#0a1a0f" }}
                      >
                        {capitalCategories.length === 0 ? "" : "Chọn danh mục"}
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
            onClose={closeCreateCategoryModal}
            panelClassName="w-[calc(100%-1rem)] sm:w-full sm:max-w-lg max-h-[90dvh] sm:max-h-[calc(100dvh-2rem)] rounded-3xl sm:rounded-2xl flex flex-col overflow-hidden"
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
                onClick={closeCreateCategoryModal}
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
                  onClick={closeCreateCategoryModal}
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
      {showMobileBulkActionBar && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:hidden">
          <div
            className="pointer-events-auto rounded-3xl border p-3 shadow-2xl backdrop-blur"
            style={{
              borderColor: "rgba(239,68,68,0.22)",
              background: "rgba(8,20,12,0.94)",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.45)",
            }}
          >
            <button
              type="button"
              onClick={handleDeleteAllSelectedMobile}
              className="w-full rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400"
            >
              Xóa đã chọn ({totalSelectedMobileItems})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
