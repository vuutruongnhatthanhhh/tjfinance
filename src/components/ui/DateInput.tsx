"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface DateInputProps {
  value: string; // yyyy-mm-dd
  onChange: (value: string) => void;
  style?: React.CSSProperties;
  required?: boolean;
}

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function parseIso(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toDisplay(iso: string): string {
  const d = parseIso(iso);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function buildWeeks(year: number, month: number): (number | null)[][] {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const total = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let day = 1 - firstDow;
  while (day <= total) {
    const week: (number | null)[] = [];
    for (let i = 0; i < 7; i++, day++) {
      week.push(day >= 1 && day <= total ? day : null);
    }
    weeks.push(week);
  }
  return weeks;
}

export default function DateInput({ value, onChange, style, required }: DateInputProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const d = parseIso(value);
    return d ? d.getFullYear() : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseIso(value);
    return d ? d.getMonth() : new Date().getMonth();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync view when value changes externally
  useEffect(() => {
    const d = parseIso(value);
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
  }, [value]);

  // Close on outside click / touch
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [open]);

  const selected = parseIso(value);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    onChange(toIso(viewYear, viewMonth, day));
    setOpen(false);
  };

  const weeks = buildWeeks(viewYear, viewMonth);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger input */}
      <input
        type="text"
        readOnly
        value={toDisplay(value)}
        onMouseDown={() => setOpen(o => !o)}
        onTouchEnd={(e) => { e.preventDefault(); setOpen(o => !o); }}
        placeholder="dd/mm/yyyy"
        required={required}
        style={{ ...style, cursor: "pointer", paddingRight: "40px" }}
      />
      <CalendarDays
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: "rgba(226,255,232,0.4)" }}
      />

      {/* Calendar dropdown */}
      {open && (
        <div
          className="absolute z-[60] mt-2 rounded-2xl overflow-hidden select-none"
          style={{
            background: "rgba(6,16,9,0.98)",
            border: "1px solid rgba(45,154,75,0.25)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
            width: "288px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {/* Month / year navigation */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "rgba(45,154,75,0.15)" }}
          >
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); prevMonth(); }}
              onTouchEnd={(e) => { e.preventDefault(); prevMonth(); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ color: "rgba(226,255,232,0.6)" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); nextMonth(); }}
              onTouchEnd={(e) => { e.preventDefault(); nextMonth(); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ color: "rgba(226,255,232,0.6)" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold py-1"
                style={{ color: "rgba(226,255,232,0.35)" }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="px-3 pb-3 space-y-0.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => {
                  if (!day) return <div key={di} />;
                  const thisDate = new Date(viewYear, viewMonth, day);
                  const isSelected =
                    selected && thisDate.toDateString() === selected.toDateString();
                  const isToday = thisDate.toDateString() === today.toDateString();

                  return (
                    <button
                      key={di}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); selectDay(day); }}
                      onTouchEnd={(e) => { e.preventDefault(); selectDay(day); }}
                      className="flex items-center justify-center h-9 text-sm rounded-xl transition-all"
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg,#2D9A4B,#1a7a35)"
                          : isToday
                          ? "rgba(45,154,75,0.15)"
                          : "transparent",
                        color: isSelected
                          ? "#fff"
                          : isToday
                          ? "#4ade80"
                          : "rgba(226,255,232,0.75)",
                        fontWeight: isSelected || isToday ? "600" : "400",
                        boxShadow: isSelected ? "0 0 12px rgba(45,154,75,0.45)" : "none",
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Today shortcut */}
          <div
            className="flex justify-center pb-3"
            style={{ borderTop: "1px solid rgba(45,154,75,0.1)", paddingTop: "10px" }}
          >
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                const t = new Date();
                onChange(toIso(t.getFullYear(), t.getMonth(), t.getDate()));
                setOpen(false);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                const t = new Date();
                onChange(toIso(t.getFullYear(), t.getMonth(), t.getDate()));
                setOpen(false);
              }}
              className="text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
              style={{ color: "#4ade80", background: "rgba(45,154,75,0.1)" }}
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
