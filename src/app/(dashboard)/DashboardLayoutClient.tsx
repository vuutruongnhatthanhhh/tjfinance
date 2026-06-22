"use client";

import { useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
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
      />

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Pass setSidebarOpen to children via context or prop drilling workaround */}
        <SidebarToggleProvider onToggle={() => setSidebarOpen(true)}>
          {children}
        </SidebarToggleProvider>
      </main>
    </div>
  );
}

import { createContext, useContext } from "react";

const SidebarToggleContext = createContext<() => void>(() => {});
export const useSidebarToggle = () => useContext(SidebarToggleContext);

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
