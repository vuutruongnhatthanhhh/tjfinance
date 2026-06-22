"use client";

import { Menu, Bell } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
  title: string;
  subtitle?: string;
}

export default function Header({ onMenuToggle, title, subtitle }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 px-4 sm:px-6 py-4 flex items-center gap-4"
      style={{
        background: "rgba(5, 13, 9, 0.85)",
        borderBottom: "1px solid rgba(45,154,75,0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        style={{
          background: "rgba(45,154,75,0.08)",
          border: "1px solid rgba(45,154,75,0.15)",
          color: "rgba(226,255,232,0.7)",
        }}
        aria-label="Mở menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold dark:text-white text-gray-900 leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(226,255,232,0.4)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative"
          style={{
            background: "rgba(45,154,75,0.08)",
            border: "1px solid rgba(45,154,75,0.15)",
            color: "rgba(226,255,232,0.7)",
          }}
          aria-label="Thông báo"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
