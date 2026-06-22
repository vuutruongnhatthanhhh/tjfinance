"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect } from "react";

interface ModalOverlayProps {
  children: ReactNode;
  onClose: () => void;
  panelClassName?: string;
  panelStyle?: CSSProperties;
}

export default function ModalOverlay({
  children,
  onClose,
  panelClassName,
  panelStyle,
}: ModalOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: "rgba(5,13,9,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className={panelClassName}
        style={panelStyle}
      >
        {children}
      </div>
    </div>
  );
}
