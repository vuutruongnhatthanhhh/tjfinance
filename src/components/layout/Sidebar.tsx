"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Tag,
  LogOut,
  Leaf,
  X,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/expenses", label: "Chi tiêu", icon: <CreditCard className="w-5 h-5" /> },
  { href: "/categories", label: "Danh mục", icon: <Tag className="w-5 h-5" /> },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export default function Sidebar({ isOpen, onClose, userEmail, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b"
        style={{ borderColor: "rgba(45,154,75,0.15)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)", boxShadow: "0 0 15px rgba(45,154,75,0.4)" }}>
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg leading-none dark:text-white text-gray-900">TJ</span>
            <span className="font-bold text-lg leading-none" style={{ color: "#2D9A4B" }}>Finance</span>
          </div>
        </div>
        {/* Close button - only on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "rgba(226,255,232,0.5)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-xs font-semibold uppercase tracking-wider mb-3 px-4"
          style={{ color: "rgba(226,255,232,0.3)" }}>
          Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn("sidebar-item group", isActive && "active")}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t space-y-3"
        style={{ borderColor: "rgba(45,154,75,0.15)" }}>
        {/* Theme toggle */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm" style={{ color: "rgba(226,255,232,0.5)" }}>Giao diện</span>
          <ThemeToggle />
        </div>

        {/* User info */}
        <div className="px-4 py-3 rounded-xl"
          style={{ background: "rgba(45,154,75,0.06)", border: "1px solid rgba(45,154,75,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
              style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)" }}>
              {(userName || userEmail || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate dark:text-white text-gray-900">
                {userName || "Người dùng"}
              </p>
              <p className="text-xs truncate" style={{ color: "rgba(226,255,232,0.4)" }}>
                {userEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 h-screen sticky top-0 flex-shrink-0"
        style={{
          background: "rgba(8, 20, 12, 0.95)",
          borderRight: "1px solid rgba(45,154,75,0.12)",
          backdropFilter: "blur(20px)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(5,13,9,0.7)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "rgba(8, 20, 12, 0.98)",
          borderRight: "1px solid rgba(45,154,75,0.15)",
          backdropFilter: "blur(20px)",
          boxShadow: "20px 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
