"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  ExternalLink,
  Link2,
  LoaderCircle,
  Menu,
  Trash2,
} from "lucide-react";
import { useSidebarToggle, useToast } from "../DashboardLayoutClient";

interface TelegramSettingsState {
  telegramEnabled: boolean;
  telegramChatId: string | null;
  telegramUsername: string | null;
  telegramConnectedAt: string | null;
  telegramLinkToken: string | null;
  telegramLinkTokenExpiresAt: string | null;
  deepLink: string | null;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function TelegramSettingsClient({
  botUsername,
  initialIntegration,
}: {
  botUsername: string;
  initialIntegration: TelegramSettingsState;
}) {
  const router = useRouter();
  const openSidebar = useSidebarToggle();
  const { showToast } = useToast();
  const [integration, setIntegration] = useState(initialIntegration);
  const [isPending, startTransition] = useTransition();

  const handleGenerateLink = () => {
    startTransition(async () => {
      const response = await fetch("/api/telegram/link", {
        method: "POST",
      });
      const result = (await response.json()) as {
        error?: string;
        token?: string;
        expiresAt?: string;
        deepLink?: string;
      };

      if (!response.ok || !result.token || !result.expiresAt || !result.deepLink) {
        showToast(result.error || "Không thể tạo link Telegram.", "error");
        return;
      }

      setIntegration((current) => ({
        ...current,
        telegramEnabled: false,
        telegramLinkToken: result.token || null,
        telegramLinkTokenExpiresAt: result.expiresAt || null,
        deepLink: result.deepLink || null,
      }));
      router.refresh();
      showToast("Đã tạo link Telegram");
    });
  };

  const handleDisconnect = () => {
    startTransition(async () => {
      const response = await fetch("/api/telegram/link", {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        showToast(result.error || "Không thể ngắt kết nối Telegram.", "error");
        return;
      }

      setIntegration({
        telegramEnabled: false,
        telegramChatId: null,
        telegramUsername: null,
        telegramConnectedAt: null,
        telegramLinkToken: null,
        telegramLinkTokenExpiresAt: null,
        deepLink: null,
      });
      router.refresh();
      showToast("Đã ngắt kết nối Telegram");
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className="sticky top-0 z-10 border-b px-4 py-4 backdrop-blur-xl sm:px-6"
        style={{
          background: "rgba(8,20,12,0.86)",
          borderColor: "rgba(45,154,75,0.12)",
        }}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={openSidebar}
            className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border lg:hidden"
            style={{
              borderColor: "rgba(45,154,75,0.2)",
              background: "rgba(45,154,75,0.08)",
              color: "#e2ffe8",
            }}
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: "rgba(45,154,75,0.18)",
                  background:
                    "linear-gradient(135deg, rgba(45,154,75,0.24), rgba(10,20,13,0.94))",
                }}
              >
                <Bot className="h-6 w-6" style={{ color: "#4ade80" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  Telegram Bot
                </h1>
                <p className="text-sm" style={{ color: "rgba(226,255,232,0.58)" }}>
                  Kết nối bot để thêm nhanh giao dịch trong Telegram
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <section
            className="rounded-3xl border p-5 sm:p-6"
            style={{
              borderColor: "rgba(45,154,75,0.14)",
              background:
                "linear-gradient(135deg, rgba(45,154,75,0.10), rgba(8,20,12,0.94))",
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <span
                  className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  style={{
                    borderColor: integration.telegramEnabled
                      ? "rgba(74,222,128,0.35)"
                      : "rgba(45,154,75,0.22)",
                    background: integration.telegramEnabled
                      ? "rgba(74,222,128,0.12)"
                      : "rgba(45,154,75,0.08)",
                    color: integration.telegramEnabled ? "#86efac" : "#d9fbe3",
                  }}
                >
                  {integration.telegramEnabled ? "Đã liên kết" : "Chưa liên kết"}
                </span>
                <div>
                  <p className="text-sm" style={{ color: "rgba(226,255,232,0.6)" }}>
                    Bot username
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    @{botUsername.replace(/^@/, "")}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: "rgba(45,154,75,0.12)",
                      background: "rgba(5,13,8,0.55)",
                    }}
                  >
                    <p
                      className="text-xs uppercase tracking-wide"
                      style={{ color: "rgba(226,255,232,0.45)" }}
                    >
                      Telegram username
                    </p>
                    <p className="mt-2 text-sm text-white">
                      {integration.telegramUsername || "Chưa có"}
                    </p>
                  </div>
                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: "rgba(45,154,75,0.12)",
                      background: "rgba(5,13,8,0.55)",
                    }}
                  >
                    <p
                      className="text-xs uppercase tracking-wide"
                      style={{ color: "rgba(226,255,232,0.45)" }}
                    >
                      Thời gian liên kết
                    </p>
                    <p className="mt-2 text-sm text-white">
                      {formatDateTime(integration.telegramConnectedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:min-w-[280px]">
                <button
                  type="button"
                  onClick={handleGenerateLink}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #2D9A4B, #1f7f3c)",
                    boxShadow: "0 14px 30px rgba(45,154,75,0.25)",
                  }}
                >
                  {isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {integration.telegramEnabled ? "Tạo lại link liên kết" : "Tạo link liên kết"}
                </button>

                {integration.deepLink ? (
                  <a
                    href={integration.deepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold"
                    style={{
                      borderColor: "rgba(45,154,75,0.22)",
                      background: "rgba(45,154,75,0.08)",
                      color: "#d9fbe3",
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Mở bot Telegram
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: "rgba(248,113,113,0.18)",
                    background: "rgba(127,29,29,0.15)",
                    color: "#fca5a5",
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Ngắt kết nối
                </button>
              </div>
            </div>

            {integration.telegramLinkToken ? (
              <div
                className="mt-5 rounded-2xl border p-4"
                style={{
                  borderColor: "rgba(45,154,75,0.16)",
                  background: "rgba(5,13,8,0.58)",
                }}
              >
                <p className="text-sm font-semibold text-white">
                  Token liên kết đang hoạt động
                </p>
                <p className="mt-2 break-all text-sm" style={{ color: "rgba(226,255,232,0.75)" }}>
                  {integration.telegramLinkToken}
                </p>
                <p className="mt-2 text-xs" style={{ color: "rgba(226,255,232,0.5)" }}>
                  Hết hạn lúc: {formatDateTime(integration.telegramLinkTokenExpiresAt)}
                </p>
              </div>
            ) : null}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div
              className="rounded-3xl border p-5 sm:p-6"
              style={{
                borderColor: "rgba(45,154,75,0.14)",
                background: "rgba(8,20,12,0.9)",
              }}
            >
              <h2 className="text-lg font-bold text-white">Cách liên kết</h2>
              <ol
                className="mt-4 space-y-3 text-sm"
                style={{ color: "rgba(226,255,232,0.72)" }}
              >
                <li>1. Nhấn Tạo link liên kết.</li>
                <li>2. Mở bot Telegram bằng nút Mở bot Telegram.</li>
                <li>3. Gửi `/start &lt;token&gt;` hoặc mở deep link để bot tự điền token.</li>
                <li>4. Khi bot báo liên kết thành công là có thể dùng lệnh ngay.</li>
              </ol>
            </div>

            <div
              className="rounded-3xl border p-5 sm:p-6"
              style={{
                borderColor: "rgba(45,154,75,0.14)",
                background: "rgba(8,20,12,0.9)",
              }}
            >
              <h2 className="text-lg font-bold text-white">Lệnh hỗ trợ</h2>
              <div
                className="mt-4 space-y-3 text-sm"
                style={{ color: "rgba(226,255,232,0.72)" }}
              >
                <p>/expense dd/mm/yyyy so_tien | danh_muc | ten_giao_dich | ghi_chu</p>
                <p>/income dd/mm/yyyy so_tien | danh_muc | ten_giao_dich | ghi_chu</p>
                <p>/investment dd/mm/yyyy so_tien | ten_khoan_dau_tu | danh_muc | ten_giao_dich | ghi_chu</p>
                <p>/list all month hoặc /list expense week</p>
                <p>/categories all</p>
                <p>/categories expense</p>
                <p>/categories income</p>
                <p>/categories investment</p>
                <p>/categories asset</p>
              </div>
            </div>
          </section>

          <section
            className="rounded-3xl border p-5 sm:p-6"
            style={{
              borderColor: "rgba(45,154,75,0.14)",
              background: "rgba(8,20,12,0.9)",
            }}
          >
            <h2 className="text-lg font-bold text-white">Ví dụ nhanh</h2>
            <div
              className="mt-4 space-y-3 rounded-2xl border p-4 text-sm"
              style={{
                borderColor: "rgba(45,154,75,0.12)",
                background: "rgba(5,13,8,0.56)",
                color: "#d9fbe3",
              }}
            >
              <p>/expense 07/07/2026 45000 | Ăn uống | Cà phê sáng | gặp khách</p>
              <p>/income 07/07/2026 15000000 | Lương | Lương tháng 7</p>
              <p>/investment 07/07/2026 2000000 | Quỹ VCBF | Cổ phiếu | Mua thêm tháng 7</p>
              <p>/list all month</p>
              <p>/categories all</p>
              <p>/categories expense</p>
              <p>/categories income</p>
              <p>/categories investment</p>
              <p>/categories asset</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
