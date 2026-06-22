"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Tag, X, ChevronDown, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Category } from "@/types";
import Header from "@/components/layout/Header";
import { useSidebarToggle } from "../DashboardLayoutClient";
import { cn } from "@/lib/utils";

interface CategoriesClientProps {
  initialCategories: Category[];
  expenseCounts: Record<string, number>;
  userId: string;
}

const PRESET_COLORS = [
  "#2D9A4B", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b",
];

const ICONS = [
  { id: "utensils", emoji: "🍽️", label: "Ăn uống" },
  { id: "car", emoji: "🚗", label: "Di chuyển" },
  { id: "shopping-bag", emoji: "🛍️", label: "Mua sắm" },
  { id: "gamepad-2", emoji: "🎮", label: "Giải trí" },
  { id: "heart-pulse", emoji: "❤️‍🔥", label: "Sức khỏe" },
  { id: "book-open", emoji: "📚", label: "Giáo dục" },
  { id: "receipt", emoji: "🧾", label: "Hóa đơn" },
  { id: "briefcase", emoji: "💼", label: "Công việc" },
  { id: "trending-up", emoji: "📈", label: "Đầu tư" },
  { id: "gift", emoji: "🎁", label: "Quà tặng" },
  { id: "more-horizontal", emoji: "⋯", label: "Khác" },
  { id: "plus-circle", emoji: "➕", label: "Thêm" },
];

const ICON_MAP: Record<string, string> = Object.fromEntries(
  ICONS.map(({ id, emoji }) => [id, emoji])
);

interface CategoryModalProps {
  userId: string;
  category?: Category;
  onClose: () => void;
  onSuccess: () => void;
}

function CategoryModal({ userId, category, onClose, onSuccess }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || "");
  const [icon, setIcon] = useState(category?.icon || "more-horizontal");
  const [color, setColor] = useState(category?.color || "#2D9A4B");
  const [type, setType] = useState<"expense" | "income">(category?.type || "expense");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Vui lòng nhập tên danh mục."); return; }

    setLoading(true);
    setError("");
    const supabase = createClient();

    const payload = { name: name.trim(), icon, color, type };

    const { error: dbError } = isEdit
      ? await supabase.from("categories").update(payload).eq("id", category!.id)
      : await supabase.from("categories").insert({ ...payload, user_id: userId });

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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
            <div className="grid grid-cols-2 gap-2">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: type === t
                      ? t === "expense" ? "rgba(239,68,68,0.2)" : "rgba(45,154,75,0.2)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${type === t ? (t === "expense" ? "rgba(239,68,68,0.4)" : "rgba(45,154,75,0.4)") : "rgba(255,255,255,0.08)"}`,
                    color: type === t ? (t === "expense" ? "#fca5a5" : "#4ade80") : "rgba(226,255,232,0.4)",
                  }}
                >
                  {t === "expense" ? "Chi tiêu" : "Thu nhập"}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}>Tên danh mục</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Ăn uống, Du lịch..."
              required
              style={inputStyle}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}>Màu sắc</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-xl transition-all"
                  style={{
                    background: c,
                    boxShadow: color === c ? `0 0 0 3px rgba(255,255,255,0.2), 0 0 10px ${c}80` : "none",
                    transform: color === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: "rgba(226,255,232,0.5)" }}>Biểu tượng</label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((ic) => (
                <button
                  key={ic.id}
                  type="button"
                  onClick={() => setIcon(ic.id)}
                  className="h-10 rounded-xl flex items-center justify-center text-lg transition-all"
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
                {type === "expense" ? "Chi tiêu" : "Thu nhập"}
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
      </div>
    </div>
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
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
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

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl"
          style={{ background: "rgba(10,20,13,0.7)", border: "1px solid rgba(45,154,75,0.1)" }}>
          {(["expense", "income"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab
                  ? tab === "expense" ? "rgba(239,68,68,0.15)" : "rgba(45,154,75,0.15)"
                  : "transparent",
                color: activeTab === tab
                  ? tab === "expense" ? "#fca5a5" : "#4ade80"
                  : "rgba(226,255,232,0.4)",
                border: activeTab === tab
                  ? `1px solid ${tab === "expense" ? "rgba(239,68,68,0.3)" : "rgba(45,154,75,0.3)"}`
                  : "1px solid transparent",
              }}
            >
              {tab === "expense" ? "Chi tiêu" : "Thu nhập"}
              <span className="ml-2 text-xs opacity-70">
                ({initialCategories.filter(c => c.type === tab).length})
              </span>
            </button>
          ))}
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
          Thêm danh mục {activeTab === "expense" ? "chi tiêu" : "thu nhập"}
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
              Chưa có danh mục {activeTab === "expense" ? "chi tiêu" : "thu nhập"}
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
          onClose={() => setShowModal(false)}
          onSuccess={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  );
}
