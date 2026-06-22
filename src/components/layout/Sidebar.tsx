"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Tag,
  LogOut,
  Banknote,
  X,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

  const userInitial = (userName || userEmail || "U")[0].toUpperCase();

  // Mobile full sidebar content
  const mobileSidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 border-b"
        style={{ borderColor: "rgba(45,154,75,0.15)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)", boxShadow: "0 0 15px rgba(45,154,75,0.4)" }}>
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg leading-none dark:text-white">TJ</span>
            <span className="font-bold text-lg leading-none" style={{ color: "#2D9A4B" }}>Finance</span>
          </div>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "rgba(226,255,232,0.5)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-xs font-semibold uppercase tracking-wider mb-3 px-4"
          style={{ color: "rgba(226,255,232,0.3)" }}>
          Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={cn("sidebar-item group", isActive && "active")}>
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t space-y-3" style={{ borderColor: "rgba(45,154,75,0.15)" }}>
        <div className="px-4 py-3 rounded-xl"
          style={{ background: "rgba(45,154,75,0.06)", border: "1px solid rgba(45,154,75,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
              style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)" }}>
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate dark:text-white">{userName || "Người dùng"}</p>
              <p className="text-xs truncate" style={{ color: "rgba(226,255,232,0.4)" }}>{userEmail}</p>
            </div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-red-400 hover:bg-red-500/10">
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - hover to expand */}
      <aside
        className="group/sidebar hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 overflow-hidden w-16 hover:w-64 transition-[width] duration-300 ease-in-out"
        style={{
          background: "rgba(8, 20, 12, 0.95)",
          borderRight: "1px solid rgba(45,154,75,0.12)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center px-3.5 py-5 border-b"
          style={{ borderColor: "rgba(45,154,75,0.15)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)", boxShadow: "0 0 15px rgba(45,154,75,0.4)" }}>
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3 overflow-hidden max-w-0 group-hover/sidebar:max-w-[200px] opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">
            <span className="font-bold text-lg leading-none dark:text-white">TJ</span>
            <span className="font-bold text-lg leading-none" style={{ color: "#2D9A4B" }}>Finance</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="overflow-hidden max-w-0 group-hover/sidebar:max-w-[200px] opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap text-xs font-semibold uppercase tracking-wider mb-3 px-2.5"
            style={{ color: "rgba(226,255,232,0.3)" }}>
            Menu
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center py-2.5 rounded-xl transition-all duration-300 cursor-pointer text-sm font-medium",
                  "px-[14px] group-hover/sidebar:px-3",
                  isActive
                    ? "text-[#4ade80] bg-[rgba(45,154,75,0.2)] shadow-[inset_2px_0_0_#2D9A4B]"
                    : "text-[rgba(226,255,232,0.6)] hover:bg-[rgba(45,154,75,0.1)] hover:text-[#e2ffe8]"
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {/* spacer thay cho gap-3 để không chiếm chỗ khi collapsed */}
                <span className="w-0 group-hover/sidebar:w-3 flex-shrink-0 transition-[width] duration-300" />
                <span className="flex-1 overflow-hidden max-w-0 group-hover/sidebar:max-w-[200px] opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">
                  {item.label}
                </span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover/sidebar:opacity-60 transition-opacity duration-300" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-2 py-4 border-t space-y-2" style={{ borderColor: "rgba(45,154,75,0.15)" }}>
          {/* User info — collapsed: px-[6px] căn giữa avatar 36px trong 48px (64-2*8) */}
          <div className="py-2 rounded-xl overflow-hidden transition-all duration-300 px-[6px] group-hover/sidebar:px-3"
            style={{ background: "rgba(45,154,75,0.06)", border: "1px solid rgba(45,154,75,0.1)" }}>
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)" }}>
                {userInitial}
              </div>
              <span className="w-0 group-hover/sidebar:w-3 flex-shrink-0 transition-[width] duration-300" />
              <div className="flex-1 min-w-0 overflow-hidden max-w-0 group-hover/sidebar:max-w-[200px] opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300">
                <p className="text-sm font-medium truncate whitespace-nowrap dark:text-white">
                  {userName || "Người dùng"}
                </p>
                <p className="text-xs truncate whitespace-nowrap" style={{ color: "rgba(226,255,232,0.4)" }}>
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center py-2.5 rounded-xl text-sm font-medium transition-all duration-300 text-red-400 hover:bg-red-500/10 px-[14px] group-hover/sidebar:px-3"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="w-0 group-hover/sidebar:w-3 flex-shrink-0 transition-[width] duration-300" />
            <span className="overflow-hidden max-w-0 group-hover/sidebar:max-w-[200px] opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">
              Đăng xuất
            </span>
          </button>
        </div>
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
        {mobileSidebarContent}
      </aside>
    </>
  );
}
