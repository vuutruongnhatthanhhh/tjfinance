"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  ChevronRight,
  Landmark,
  LayoutDashboard,
  LogOut,
  Mailbox,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import AccountSettingsModal from "./AccountSettingsModal";
import FeedbackModal from "./FeedbackModal";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/expenses",
    label: "Chi tiêu",
    icon: <ArrowDownCircle className="h-5 w-5" />,
  },
  {
    href: "/income",
    label: "Thu nhập",
    icon: <ArrowUpCircle className="h-5 w-5" />,
  },
  {
    href: "/investments",
    label: "Đầu tư",
    icon: <Landmark className="h-5 w-5" />,
  },
  {
    href: "/investment-portfolio",
    label: "Danh mục đầu tư",
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    href: "/categories",
    label: "Danh mục",
    icon: <Tag className="h-5 w-5" />,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  showToast: (message: string, type?: "success" | "error") => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  userEmail,
  userName,
  showToast,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname && isOpen) {
      onClose();
    }
    previousPathnameRef.current = pathname;
  }, [isOpen, onClose, pathname]);

  const openFeedbackModal = () => {
    setShowFeedbackModal(true);
    onClose();
  };

  useEffect(() => {
    router.prefetch("/investments");
    router.prefetch("/investment-portfolio");
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleMobileNavigate = (href: string) => {
    if (pathname === href) {
      onClose();
      return;
    }

    router.push(href);
  };

  const userInitial = (userName || userEmail || "U")[0].toUpperCase();

  const mobileSidebarContent = (
    <div className="flex h-full flex-col">
      <div
        className="flex items-center justify-between border-b px-6 py-5"
        style={{ borderColor: "rgba(45,154,75,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 flex-shrink-0 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #2D9A4B, #1a7a35)",
              boxShadow: "0 0 15px rgba(45,154,75,0.4)",
            }}
          >
            <Banknote className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold leading-none text-white">
              TJ
            </span>
            <span
              className="text-lg font-bold leading-none"
              style={{ color: "#2D9A4B" }}
            >
              Finance
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "rgba(226,255,232,0.5)" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                handleMobileNavigate(item.href);
              }}
              className={cn("sidebar-item group", isActive && "active")}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div
        className="space-y-3 border-t px-3 py-4"
        style={{ borderColor: "rgba(45,154,75,0.15)" }}
      >
        <div
          className="rounded-xl px-4 py-3"
          role="button"
          tabIndex={0}
          onClick={() => setShowAccountModal(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setShowAccountModal(true);
            }
          }}
          style={{
            background: "rgba(45,154,75,0.06)",
            border: "1px solid rgba(45,154,75,0.1)",
            cursor: "pointer",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #2D9A4B, #1a7a35)",
              }}
            >
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {userName || "Người dùng"}
              </p>
              <p
                className="truncate text-xs"
                style={{ color: "rgba(226,255,232,0.4)" }}
              >
                {userEmail}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={openFeedbackModal}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-[rgba(45,154,75,0.1)]"
          style={{
            background: "rgba(45,154,75,0.04)",
            color: "rgba(226,255,232,0.78)",
          }}
        >
          <Mailbox className="h-5 w-5" />
          Hòm thư góp ý
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10"
        >
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className="group/sidebar sticky top-0 hidden h-screen flex-shrink-0 overflow-hidden border-r bg-[rgba(8,20,12,0.95)] backdrop-blur-[20px] transition-[width] duration-300 ease-in-out lg:flex lg:w-16 hover:w-64"
        style={{ borderColor: "rgba(45,154,75,0.12)" }}
      >
        <div className="flex w-full flex-col">
          <div
            className="flex items-center border-b px-3.5 py-5"
            style={{ borderColor: "rgba(45,154,75,0.15)" }}
          >
            <div
              className="h-9 w-9 flex-shrink-0 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #2D9A4B, #1a7a35)",
                boxShadow: "0 0 15px rgba(45,154,75,0.4)",
              }}
            >
              <Banknote className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3 max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100">
              <span className="text-lg font-bold leading-none text-white">
                TJ
              </span>
              <span
                className="text-lg font-bold leading-none"
                style={{ color: "#2D9A4B" }}
              >
                Finance
              </span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-2 py-4 custom-scrollbar">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex cursor-pointer items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-300",
                    "px-[14px] group-hover/sidebar:px-3",
                    isActive
                      ? "bg-[rgba(45,154,75,0.2)] text-[#4ade80] shadow-[inset_2px_0_0_#2D9A4B]"
                      : "text-[rgba(226,255,232,0.6)] hover:bg-[rgba(45,154,75,0.1)] hover:text-[#e2ffe8]",
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="w-0 flex-shrink-0 transition-[width] duration-300 group-hover/sidebar:w-3" />
                  <span className="max-w-0 flex-1 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100">
                    {item.label}
                  </span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-60" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div
            className="space-y-2 border-t px-2 py-4"
            style={{ borderColor: "rgba(45,154,75,0.15)" }}
          >
            <div
              className="overflow-hidden rounded-xl"
              role="button"
              tabIndex={0}
              onClick={() => setShowAccountModal(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setShowAccountModal(true);
                }
              }}
              style={{
                background: "rgba(45,154,75,0.06)",
                border: "1px solid rgba(45,154,75,0.1)",
                cursor: "pointer",
              }}
            >
              <div className="flex justify-center py-2 group-hover/sidebar:hidden">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #2D9A4B, #1a7a35)",
                  }}
                >
                  {userInitial}
                </div>
              </div>
              <div className="hidden items-center gap-3 px-3 py-2 group-hover/sidebar:flex">
                <div
                  className="h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #2D9A4B, #1a7a35)",
                  }}
                >
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {userName || "Người dùng"}
                  </p>
                  <p
                    className="truncate text-xs"
                    style={{ color: "rgba(226,255,232,0.4)" }}
                  >
                    {userEmail}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openFeedbackModal}
              className="flex w-full items-center rounded-xl px-[14px] py-2.5 text-sm font-medium transition-all duration-300 hover:bg-[rgba(45,154,75,0.1)] group-hover/sidebar:px-3"
              style={{
                color: "rgba(226,255,232,0.78)",
                background: "rgba(45,154,75,0.04)",
              }}
            >
              <Mailbox className="h-5 w-5 flex-shrink-0" />
              <span className="w-0 flex-shrink-0 transition-[width] duration-300 group-hover/sidebar:w-3" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100">
                Hòm thư góp ý
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="flex w-full items-center rounded-xl px-[14px] py-2.5 text-sm font-medium text-red-400 transition-all duration-300 hover:bg-red-500/10 group-hover/sidebar:px-3"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="w-0 flex-shrink-0 transition-[width] duration-300 group-hover/sidebar:w-3" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover/sidebar:max-w-[200px] group-hover/sidebar:opacity-100">
                Đăng xuất
              </span>
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{
            background: "rgba(5,13,9,0.7)",
            backdropFilter: "blur(4px)",
          }}
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r backdrop-blur-[20px] transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          background: "rgba(8, 20, 12, 0.98)",
          borderColor: "rgba(45,154,75,0.15)",
          boxShadow: "20px 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {mobileSidebarContent}
      </aside>

      {showAccountModal && (
        <AccountSettingsModal
          userEmail={userEmail}
          userName={userName}
          showToast={showToast}
          onSaved={() => router.refresh()}
          onClose={() => setShowAccountModal(false)}
        />
      )}

      {showFeedbackModal && (
        <FeedbackModal
          userEmail={userEmail}
          showToast={showToast}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </>
  );
}
