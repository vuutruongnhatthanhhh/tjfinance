"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, ChevronUp, XCircle } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
}

export default function DashboardLayoutClient({
  children,
  userEmail,
  userName,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: "success" | "error" }[]
  >([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2800);
  };

  const toastApi = useMemo(() => ({ showToast }), []);

  useEffect(() => {
    const updateVisibility = () => {
      const roots = Array.from(
        document.querySelectorAll<HTMLElement>("[data-dashboard-scroll-root]"),
      ).filter((element) => element.scrollHeight > element.clientHeight);

      setShowBackToTop(
        roots.some((element) => element.scrollTop > 160) ||
          window.scrollY > 160,
      );
    };

    updateVisibility();

    document.addEventListener("scroll", updateVisibility, true);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility, { passive: true });

    return () => {
      document.removeEventListener("scroll", updateVisibility, true);
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [pathname]);

  const scrollToTop = () => {
    const roots = Array.from(
      document.querySelectorAll<HTMLElement>("[data-dashboard-scroll-root]"),
    ).filter((element) => element.scrollHeight > element.clientHeight);

    const activeRoot =
      roots.find((element) => element.scrollTop > 0) ||
      roots[0] ||
      null;

    if (activeRoot) {
      activeRoot.scrollTo({ top: 0, behavior: "smooth" });
      setShowBackToTop(false);
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    setShowBackToTop(false);
  };

  return (
    <ToastContext.Provider value={toastApi}>
      <div className="flex h-screen overflow-hidden dark:bg-mystic-dark bg-mystic-light">
        {/* Background ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-[-15%] right-[10%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
            style={{ background: "radial-gradient(circle, #2D9A4B, transparent 70%)" }}
          />
          <div
            className="absolute bottom-[-10%] left-[5%] w-[400px] h-[400px] rounded-full opacity-8 blur-3xl"
            style={{ background: "radial-gradient(circle, #1a7a35, transparent 70%)" }}
          />
        </div>

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userEmail={userEmail}
          userName={userName}
          showToast={showToast}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative z-10">
          {/* Pass setSidebarOpen to children via context or prop drilling workaround */}
          <SidebarToggleProvider onToggle={() => setSidebarOpen(true)}>
            {children}
          </SidebarToggleProvider>
        </main>
        <div className="fixed right-4 top-4 z-[80] flex w-[min(92vw,360px)] flex-col gap-2">
          {toasts.map((toast) => {
            const isSuccess = toast.type === "success";
            const Icon = isSuccess ? CheckCircle2 : XCircle;
            return (
              <div
                key={toast.id}
                className="flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl"
                style={{
                  animation: "tj-toast-in 220ms ease-out, tj-toast-out 220ms ease-in 2400ms forwards",
                  background: isSuccess
                    ? "linear-gradient(135deg, rgba(45,154,75,0.22), rgba(6,16,9,0.96))"
                    : "linear-gradient(135deg, rgba(45,154,75,0.14), rgba(6,16,9,0.96))",
                  borderColor: isSuccess ? "rgba(45,154,75,0.65)" : "rgba(45,154,75,0.35)",
                  color: "#e2ffe8",
                }}
              >
                <Icon
                  className="mt-0.5 h-5 w-5 flex-shrink-0"
                  style={{ color: isSuccess ? "#2D9A4B" : "#86efac" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{toast.message}</p>
                </div>
              </div>
            );
          })}
        </div>
        {showBackToTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="fixed bottom-6 left-3 z-[70] flex h-12 w-12 items-center justify-center rounded-2xl border shadow-2xl lg:hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(45,154,75,0.96), rgba(26,122,53,0.96))",
              borderColor: "rgba(45,154,75,0.45)",
              boxShadow: "0 8px 25px rgba(45,154,75,0.35)",
            }}
            aria-label="Quay về đầu trang"
          >
            <ChevronUp className="h-5 w-5 text-white" />
          </button>
        )}
        <style jsx>{`
          @keyframes tj-toast-in {
            from {
              opacity: 0;
              transform: translate3d(24px, -12px, 0) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }

          @keyframes tj-toast-out {
            from {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
            to {
              opacity: 0;
              transform: translate3d(24px, -12px, 0) scale(0.98);
            }
          }
        `}</style>
      </div>
    </ToastContext.Provider>
  );
}

const SidebarToggleContext = createContext<() => void>(() => {});
export const useSidebarToggle = () => useContext(SidebarToggleContext);

const ToastContext = createContext<{ showToast: (message: string, type?: "success" | "error") => void } | null>(null);
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => {},
    };
  }
  return context;
};

function SidebarToggleProvider({
  children,
  onToggle,
}: {
  children: React.ReactNode;
  onToggle: () => void;
}) {
  return (
    <SidebarToggleContext.Provider value={onToggle}>
      {children}
    </SidebarToggleContext.Provider>
  );
}
