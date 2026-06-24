"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Tag, X, ChevronDown, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ModalOverlay from "@/components/ui/ModalOverlay";
import { Category } from "@/types";
import Header from "@/components/layout/Header";
import { useSidebarToggle, useToast } from "../DashboardLayoutClient";
import { cn } from "@/lib/utils";

interface CategoriesClientProps {
  initialCategories: Category[];
  expenseCounts: Record<string, number>;
  userId: string;
}

const PRESET_COLORS = [
  // Greens
  "#2D9A4B", "#22c55e", "#16a34a", "#4ade80", "#86efac",
  // Reds & Pinks
  "#ef4444", "#dc2626", "#f43f5e", "#ec4899", "#db2777",
  // Oranges & Yellows
  "#f97316", "#ea580c", "#fb923c", "#eab308", "#ca8a04",
  // Blues
  "#3b82f6", "#2563eb", "#06b6d4", "#0891b2", "#60a5fa",
  // Purples & Violets
  "#8b5cf6", "#7c3aed", "#a855f7", "#6366f1", "#818cf8",
  // Teals & Cyans
  "#14b8a6", "#0d9488", "#22d3ee", "#67e8f9", "#2dd4bf",
  // Neutrals & Browns
  "#64748b", "#475569", "#a78bfa", "#f59e0b", "#d97706",
];

const ICONS = [
  // Ăn uống
  { id: "utensils", emoji: "🍽️", label: "Ăn uống" },
  { id: "pizza", emoji: "🍕", label: "Pizza" },
  { id: "burger", emoji: "🍔", label: "Burger" },
  { id: "coffee", emoji: "☕", label: "Cà phê" },
  { id: "boba", emoji: "🧋", label: "Trà sữa" },
  { id: "noodle", emoji: "🍜", label: "Mì" },
  { id: "sushi", emoji: "🍱", label: "Cơm hộp" },
  { id: "cake", emoji: "🍰", label: "Bánh" },
  { id: "salad", emoji: "🥗", label: "Salad" },
  { id: "beer", emoji: "🍺", label: "Đồ uống" },
  // Di chuyển
  { id: "car", emoji: "🚗", label: "Xe hơi" },
  { id: "motorbike", emoji: "🛵", label: "Xe máy" },
  { id: "bus", emoji: "🚌", label: "Xe buýt" },
  { id: "taxi", emoji: "🚕", label: "Taxi" },
  { id: "plane", emoji: "✈️", label: "Máy bay" },
  { id: "train", emoji: "🚂", label: "Tàu hỏa" },
  { id: "ship", emoji: "🚢", label: "Tàu biển" },
  { id: "fuel", emoji: "⛽", label: "Xăng dầu" },
  // Mua sắm
  { id: "shopping-bag", emoji: "🛍️", label: "Mua sắm" },
  { id: "cart", emoji: "🛒", label: "Siêu thị" },
  { id: "clothes", emoji: "👗", label: "Quần áo" },
  { id: "shoes", emoji: "👟", label: "Giày dép" },
  { id: "cosmetic", emoji: "💄", label: "Mỹ phẩm" },
  { id: "ring", emoji: "💍", label: "Trang sức" },
  // Sức khỏe
  { id: "heart-pulse", emoji: "❤️‍🔥", label: "Sức khỏe" },
  { id: "pill", emoji: "💊", label: "Thuốc" },
  { id: "hospital", emoji: "🏥", label: "Bệnh viện" },
  { id: "gym", emoji: "🏋️", label: "Gym" },
  { id: "yoga", emoji: "🧘", label: "Yoga" },
  { id: "dental", emoji: "🦷", label: "Nha khoa" },
  // Giáo dục
  { id: "book-open", emoji: "📚", label: "Sách" },
  { id: "graduation", emoji: "🎓", label: "Học phí" },
  { id: "pencil", emoji: "✏️", label: "Văn phòng phẩm" },
  { id: "laptop", emoji: "💻", label: "Laptop" },
  { id: "phone", emoji: "📱", label: "Điện thoại" },
  // Giải trí
  { id: "gamepad-2", emoji: "🎮", label: "Game" },
  { id: "movie", emoji: "🎬", label: "Phim ảnh" },
  { id: "music", emoji: "🎵", label: "Âm nhạc" },
  { id: "sport", emoji: "⚽", label: "Thể thao" },
  { id: "travel", emoji: "🏖️", label: "Du lịch" },
  { id: "camping", emoji: "🏕️", label: "Cắm trại" },
  { id: "reading", emoji: "📖", label: "Đọc sách" },
  // Nhà cửa
  { id: "home", emoji: "🏠", label: "Nhà ở" },
  { id: "furniture", emoji: "🛋️", label: "Nội thất" },
  { id: "repair", emoji: "🔧", label: "Sửa chữa" },
  { id: "electric", emoji: "💡", label: "Điện" },
  { id: "water", emoji: "💧", label: "Nước" },
  { id: "cleaning", emoji: "🧹", label: "Vệ sinh" },
  // Tài chính
  { id: "receipt", emoji: "🧾", label: "Hóa đơn" },
  { id: "trending-up", emoji: "📈", label: "Đầu tư" },
  { id: "money", emoji: "💰", label: "Tiền mặt" },
  { id: "card", emoji: "💳", label: "Thẻ" },
  { id: "bank", emoji: "🏦", label: "Ngân hàng" },
  { id: "tax", emoji: "📋", label: "Thuế" },
  // Công việc & Xã hội
  { id: "briefcase", emoji: "💼", label: "Công việc" },
  { id: "gift", emoji: "🎁", label: "Quà tặng" },
  { id: "birthday", emoji: "🎂", label: "Sinh nhật" },
  { id: "family", emoji: "👨‍👩‍👧", label: "Gia đình" },
  { id: "pet", emoji: "🐾", label: "Thú cưng" },
  { id: "charity", emoji: "❤️", label: "Từ thiện" },
  // Khác
  { id: "star", emoji: "⭐", label: "Yêu thích" },
  { id: "key", emoji: "🔑", label: "Chìa khóa" },
  { id: "map", emoji: "🗺️", label: "Bản đồ" },
  { id: "more-horizontal", emoji: "⋯", label: "Khác" },
];

const ICON_MAP: Record<string, string> = Object.fromEntries(
  ICONS.map(({ id, emoji }) => [id, emoji])
);

const CATEGORY_NAME_MAX_LENGTH = 50;

interface CategoryModalProps {
  userId: string;
  category?: Category;
  initialType: "expense" | "income" | "investment";
  onClose: () => void;
  onSuccess: () => void;
}

function CategoryModal({
  userId,
  category,
  initialType,
  onClose,
  onSuccess,
}: CategoryModalProps) {
  const [name, setName] = useState(category?.name || "");
  const [icon, setIcon] = useState(category?.icon || "more-horizontal");
  const [color, setColor] = useState(category?.color || "#2D9A4B");
  const [type, setType] = useState<"expense" | "income" | "investment">(
    category?.type && category.type !== "business" ? category.type : initialType,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!category;
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Vui lòng nhập tên danh mục.");
      return;
    }

    if (trimmedName.length > CATEGORY_NAME_MAX_LENGTH) {
      setError(`Tên danh mục không được vượt quá ${CATEGORY_NAME_MAX_LENGTH} ký tự.`);
      return;
    }

    setLoading(true);
    setError("");
    const supabase = createClient();

    const payload = { name: trimmedName, icon, color, type };

    const { error: dbError } = isEdit
      ? await supabase.from("categories").update(payload).eq("id", category!.id)
      : await supabase.from("categories").insert({ ...payload, user_id: userId });

    if (dbError) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
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
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(45,154,75,0.3)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "rgba(45,154,75,0.12)" }}>
          <h2 className="text-lg font-bold text-white">
            {isEdit ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ color: "rgba(226,255,232,0.5)", background: "rgba(255,255,255,0.05)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar"
        >
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}>Loại</label>
            <div className="grid grid-cols-3 gap-2">
              {(["expense", "income", "investment"] as const).map((t) => {
                const cfg = {
                  expense:    { label: "Chi tiêu",  bg: "rgba(239,68,68,0.2)",   border: "rgba(239,68,68,0.4)",   text: "#fca5a5" },
                  income:     { label: "Thu nhập",  bg: "rgba(45,154,75,0.2)",   border: "rgba(45,154,75,0.4)",   text: "#4ade80" },
                  investment: { label: "Đầu tư",    bg: "rgba(59,130,246,0.2)",  border: "rgba(59,130,246,0.4)",  text: "#93c5fd" },
                }[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: type === t ? cfg.bg : "rgba(255,255,255,0.04)",
                      border: `1px solid ${type === t ? cfg.border : "rgba(255,255,255,0.08)"}`,
                      color: type === t ? cfg.text : "rgba(226,255,232,0.4)",
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}>Tên danh mục</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="Ví dụ: Ăn uống, Du lịch..."
              required
              maxLength={CATEGORY_NAME_MAX_LENGTH}
              style={inputStyle}
            />
            <div className="mt-2 flex items-center justify-between text-xs" style={{ color: "rgba(226,255,232,0.38)" }}>
              <span>Tối đa {CATEGORY_NAME_MAX_LENGTH} ký tự</span>
              <span>{name.trim().length}/{CATEGORY_NAME_MAX_LENGTH}</span>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}>Màu sắc</label>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(28px,1fr))] gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-lg transition-all"
                  style={{
                    background: c,
                    boxShadow: color === c ? `0 0 0 2px rgba(255,255,255,0.25), 0 0 8px ${c}80` : "none",
                    transform: color === c ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}>Biểu tượng</label>
            <div className="grid grid-cols-8 gap-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
              {ICONS.map((ic) => (
                <button
                  key={ic.id}
                  type="button"
                  onClick={() => setIcon(ic.id)}
                  className="h-9 rounded-lg flex items-center justify-center text-base transition-all"
                  style={{
                    background: icon === ic.id ? `${color}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${icon === ic.id ? `${color}50` : "rgba(255,255,255,0.06)"}`,
                    boxShadow: icon === ic.id ? `0 0 8px ${color}40` : "none",
                  }}
                  title={ic.label}
                >
                  {ic.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "rgba(45,154,75,0.05)", border: "1px solid rgba(45,154,75,0.1)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
              {ICON_MAP[icon] || "⚪"}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{name || "Tên danh mục"}</p>
              <p className="text-xs" style={{ color: "rgba(226,255,232,0.4)" }}>
                {type === "expense" ? "Chi tiêu" : type === "income" ? "Thu nhập" : "Đầu tư"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(226,255,232,0.6)" }}>
              Huỷ
            </button>
            <button type="submit" disabled={loading} className="flex-[2] btn-primary flex items-center justify-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>{isEdit ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {isEdit ? "Lưu thay đổi" : "Tạo danh mục"}</>
              }
            </button>
          </div>
        </form>
    </ModalOverlay>
  );
}

export default function CategoriesClient({
  initialCategories,
  expenseCounts,
  userId,
}: CategoriesClientProps) {
  const router = useRouter();
  const onMenuToggle = useSidebarToggle();
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | undefined>();
  const [activeTab, setActiveTab] = useState<"expense" | "income" | "investment">("expense");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = async (id: string) => {
    if (expenseCounts[id] > 0) {
      alert("Không thể xoá danh mục đang có chi tiêu. Vui lòng xoá chi tiêu liên quan trước.");
      return;
    }
    setDeleteId(id);
    const supabase = createClient();
    await supabase.from("categories").delete().eq("id", id);
    startTransition(() => router.refresh());
    setDeleteId(null);
  };

  const filtered = initialCategories.filter((c) => c.type === activeTab);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        onMenuToggle={onMenuToggle}
        title="Danh mục"
        subtitle={`${initialCategories.length} danh mục`}
      />

      <div
        data-dashboard-scroll-root
        className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4"
      >
        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl"
          style={{ background: "rgba(10,20,13,0.7)", border: "1px solid rgba(45,154,75,0.1)" }}>
          {(["expense", "income", "investment"] as const).map((tab) => {
            const cfg = {
              expense:    { label: "Chi tiêu", bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.3)",  text: "#fca5a5" },
              income:     { label: "Thu nhập", bg: "rgba(45,154,75,0.15)",  border: "rgba(45,154,75,0.3)",  text: "#4ade80" },
              investment: { label: "Đầu tư",   bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.3)", text: "#93c5fd" },
            }[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: activeTab === tab ? cfg.bg : "transparent",
                  color: activeTab === tab ? cfg.text : "rgba(226,255,232,0.4)",
                  border: activeTab === tab ? `1px solid ${cfg.border}` : "1px solid transparent",
                }}
              >
                {cfg.label}
                <span className="ml-1.5 text-xs opacity-70">
                  ({initialCategories.filter(c => c.type === tab).length})
                </span>
              </button>
            );
          })}
        </div>

        {/* Add button */}
        <button
          onClick={() => { setEditCategory(undefined); setShowModal(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-dashed border-2 text-sm font-medium mb-4 transition-all hover:border-primary/40 hover:bg-primary/5"
          style={{
            borderColor: "rgba(45,154,75,0.2)",
            color: "rgba(226,255,232,0.4)",
          }}
        >
          <Plus className="w-4 h-4" />
          Thêm danh mục {activeTab === "expense" ? "chi tiêu" : activeTab === "income" ? "thu nhập" : "đầu tư"}
        </button>

        {/* Category grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((category) => (
              <div
                key={category.id}
                className="group flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200"
                style={{
                  background: "rgba(10,20,13,0.7)",
                  borderColor: "rgba(45,154,75,0.08)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    background: `${category.color}18`,
                    border: `1px solid ${category.color}30`,
                    boxShadow: `0 0 12px ${category.color}20`,
                  }}
                >
                  {ICON_MAP[category.icon] || "⚪"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm dark:text-white text-gray-900 truncate">
                    {category.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: category.color }} />
                    <p className="text-xs" style={{ color: "rgba(226,255,232,0.4)" }}>
                      {expenseCounts[category.id] || 0} giao dịch
                    </p>
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditCategory(category); setShowModal(true); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-500/15"
                    style={{ color: "rgba(226,255,232,0.4)" }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    disabled={deleteId === category.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/15"
                    style={{ color: "rgba(226,255,232,0.4)" }}
                  >
                    {deleteId === category.id
                      ? <div className="w-3 h-3 border border-red-400/50 border-t-red-400 rounded-full animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(45,154,75,0.1)", border: "1px solid rgba(45,154,75,0.15)" }}>
              <Tag className="w-7 h-7" style={{ color: "#2D9A4B" }} />
            </div>
            <p className="text-sm font-medium dark:text-white text-gray-900">
              Chưa có danh mục {activeTab === "expense" ? "chi tiêu" : activeTab === "income" ? "thu nhập" : "đầu tư"}
            </p>
            <p className="text-xs mt-2" style={{ color: "rgba(226,255,232,0.4)" }}>
              Tạo danh mục để phân loại giao dịch của bạn
            </p>
          </div>
        )}
      </div>

      {/* FAB mobile */}
      <button
        onClick={() => { setEditCategory(undefined); setShowModal(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl lg:hidden flex items-center justify-center shadow-2xl z-20"
        style={{
          background: "linear-gradient(135deg, #2D9A4B, #1a7a35)",
          boxShadow: "0 8px 25px rgba(45,154,75,0.5)",
        }}
        aria-label="Thêm danh mục"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {showModal && (
        <CategoryModal
          userId={userId}
          category={editCategory}
          initialType={activeTab}
          onClose={() => setShowModal(false)}
          onSuccess={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
