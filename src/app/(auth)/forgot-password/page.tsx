"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Vui lòng nhập email để nhận link đặt lại mật khẩu.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    const result = (await response.json()) as { error?: string };

    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Không thể gửi email quên mật khẩu. Vui lòng thử lại.");
      return;
    }

    setSuccess("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-10 text-center">
        <div
          className="glow-primary mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)" }}
        >
          <Banknote className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-1 text-3xl font-bold text-white font-display">
          Quên mật khẩu
        </h1>
        <p className="text-sm" style={{ color: "rgba(226,255,232,0.5)" }}>
          Nhập email để nhận link đặt lại mật khẩu.
        </p>
      </div>

      <div
        className="rounded-2xl border p-8"
        style={{
          background: "rgba(10, 26, 15, 0.7)",
          borderColor: "rgba(45, 154, 75, 0.2)",
          backdropFilter: "blur(20px)",
          boxShadow:
            "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(45,154,75,0.1)",
        }}
      >
        {error && (
          <div
            className="mb-4 rounded-xl border px-4 py-3 text-sm"
            style={{
              background: "rgba(239,68,68,0.1)",
              borderColor: "rgba(239,68,68,0.3)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mb-4 rounded-xl border px-4 py-3 text-sm"
            style={{
              background: "rgba(45,154,75,0.12)",
              borderColor: "rgba(45,154,75,0.24)",
              color: "#bbf7d0",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "rgba(226,255,232,0.7)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
              required
              maxLength={254}
              className="input-mystic dark:input-mystic"
              style={{
                background: "rgba(5, 15, 8, 0.8)",
                borderColor: "rgba(45, 154, 75, 0.25)",
                color: "#e2ffe8",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Gửi email đặt lại mật khẩu
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:underline"
            style={{ color: "#4ade80" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
