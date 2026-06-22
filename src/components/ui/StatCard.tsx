"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: "green" | "red" | "blue" | "purple";
  className?: string;
}

const colorMap = {
  green: {
    icon: "rgba(45,154,75,0.15)",
    iconColor: "#2D9A4B",
    glow: "rgba(45,154,75,0.2)",
    trend: "#2D9A4B",
  },
  red: {
    icon: "rgba(239,68,68,0.15)",
    iconColor: "#ef4444",
    glow: "rgba(239,68,68,0.1)",
    trend: "#ef4444",
  },
  blue: {
    icon: "rgba(59,130,246,0.15)",
    iconColor: "#3b82f6",
    glow: "rgba(59,130,246,0.1)",
    trend: "#3b82f6",
  },
  purple: {
    icon: "rgba(139,92,246,0.15)",
    iconColor: "#8b5cf6",
    glow: "rgba(139,92,246,0.1)",
    trend: "#8b5cf6",
  },
};

export default function StatCard({ title, value, subtitle, icon, trend, color = "green", className }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn("rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02]", className)}
      style={{
        background: "rgba(10, 20, 13, 0.7)",
        borderColor: "rgba(45,154,75,0.12)",
        backdropFilter: "blur(10px)",
        boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1" style={{ color: "rgba(226,255,232,0.5)" }}>
            {title}
          </p>
          <p className="text-2xl font-bold dark:text-white text-gray-900 leading-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: "rgba(226,255,232,0.4)" }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs font-medium" style={{ color: colors.trend }}>
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </span>
              <span className="text-xs" style={{ color: "rgba(226,255,232,0.3)" }}>
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
          style={{
            background: colors.icon,
            color: colors.iconColor,
            boxShadow: `0 0 20px ${colors.glow}`,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
