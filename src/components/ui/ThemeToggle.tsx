"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved ? saved === "dark" : true;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <button
      onClick={toggle}
      className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #1a3a22, #0f2318)"
          : "linear-gradient(135deg, #bbf7d0, #86efac)",
        border: isDark ? "1px solid rgba(45,154,75,0.4)" : "1px solid rgba(45,154,75,0.3)",
        boxShadow: isDark ? "0 0 10px rgba(45,154,75,0.3)" : "none",
      }}
      aria-label="Toggle theme"
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          left: isDark ? "calc(100% - 22px)" : "2px",
          background: isDark ? "#2D9A4B" : "#ffffff",
          boxShadow: isDark ? "0 0 8px rgba(45,154,75,0.6)" : "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        {isDark ? (
          <Moon className="w-3 h-3 text-white" />
        ) : (
          <Sun className="w-3 h-3 text-amber-500" />
        )}
      </div>
    </button>
  );
}
