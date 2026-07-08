"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";

type SyncState = "idle" | "loading" | "paid" | "canceled" | "pending" | "error";

function BillingResultContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode") || "";
  const status = (searchParams.get("status") || "").toLowerCase();
  const [syncState, setSyncState] = useState<SyncState>(
    status === "cancel" ? "canceled" : "idle",
  );

  useEffect(() => {
    if (!orderCode || status === "cancel") {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setSyncState("loading");

      try {
        const response = await fetch("/api/billing/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderCode }),
        });

        const data = (await response.json().catch(() => ({}))) as {
          status?: SyncState;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setSyncState("error");
          return;
        }

        if (data.status === "paid") {
          setSyncState("paid");
          return;
        }

        if (data.status === "canceled") {
          setSyncState("canceled");
          return;
        }

        setSyncState("pending");
      } catch {
        if (!cancelled) {
          setSyncState("error");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [orderCode, status]);

  const view = useMemo(() => {
    if (syncState === "paid") {
      return {
        title: "Thanh toán thành công",
        description:
          "Gói Plus đã được kích hoạt. Quay lại dashboard để xem trạng thái mới trong side menu.",
        icon: <CheckCircle2 className="h-14 w-14 text-[#4ade80]" />,
      };
    }

    if (syncState === "canceled") {
      return {
        title: "Thanh toán đã bị hủy",
        description:
          "Anh chưa bị trừ tiền. Có thể quay lại trang nâng cấp để thanh toán lại.",
        icon: <XCircle className="h-14 w-14 text-rose-400" />,
      };
    }

    if (syncState === "pending") {
      return {
        title: "Thanh toán đang được xử lý",
        description:
          "Hệ thống đang chờ PayOS xác nhận. Nếu vừa thanh toán xong, anh thử tải lại sau vài giây.",
        icon: <Clock3 className="h-14 w-14 text-amber-300" />,
      };
    }

    if (syncState === "error") {
      return {
        title: "Chưa đồng bộ được thanh toán",
        description:
          "Nếu PayOS đã báo thành công, webhook có thể vẫn đang cập nhật. Anh thử mở lại trang sau ít phút.",
        icon: <XCircle className="h-14 w-14 text-rose-400" />,
      };
    }

    return {
      title: "Đang kiểm tra thanh toán",
      description: "Hệ thống đang đối chiếu kết quả đơn hàng từ PayOS.",
      icon: <Loader2 className="h-14 w-14 animate-spin text-white" />,
    };
  }, [syncState]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div
        className="w-full max-w-lg rounded-[28px] border p-7 shadow-2xl"
        style={{
          background: "linear-gradient(180deg, rgba(8,20,12,0.98), rgba(7,16,10,0.96))",
          borderColor: "rgba(45,154,75,0.16)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-5 flex h-24 w-24 items-center justify-center rounded-full"
            style={{
              background: "rgba(45,154,75,0.12)",
              border: "1px solid rgba(45,154,75,0.16)",
            }}
          >
            {view.icon}
          </div>

          <h1 className="text-2xl font-bold text-white">{view.title}</h1>
          <p className="mt-3 text-sm leading-6 text-[rgba(226,255,232,0.68)]">
            {view.description}
          </p>

          <div
            className="mt-5 w-full rounded-2xl border px-4 py-3 text-left"
            style={{
              background: "rgba(45,154,75,0.05)",
              borderColor: "rgba(45,154,75,0.14)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[rgba(226,255,232,0.4)]">
              Mã đơn hàng
            </p>
            <p className="mt-2 break-all text-base font-semibold text-white">
              {orderCode || "Không có"}
            </p>
          </div>

          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #2D9A4B, #1f7b3a)",
              }}
            >
              Về dashboard
            </Link>
            <Link
              href="/upgrade"
              className="inline-flex flex-1 items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold text-[rgba(226,255,232,0.88)]"
              style={{
                borderColor: "rgba(45,154,75,0.18)",
                background: "rgba(45,154,75,0.06)",
              }}
            >
              Quay lại trang gói
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingResultPage() {
  return (
    <Suspense fallback={null}>
      <BillingResultContent />
    </Suspense>
  );
}
