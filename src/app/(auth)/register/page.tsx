"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Banknote, UserPlus, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Step = "form" | "sent";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path fill="#4285F4" d="M21.6 12.23c0-.67-.06-1.3-.18-1.92H12v3.63h5.36a4.59 4.59 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 3.01-4.28 3.01-7.23Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.44l-3.22-2.5c-.9.61-2.05.98-3.41.98-2.61 0-4.82-1.76-5.61-4.13H3.08v2.58A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.91A6.01 6.01 0 0 1 6.06 12c0-.66.11-1.3.33-1.91V7.51H3.08A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.49l3.31-2.58Z" />
      <path fill="#EA4335" d="M12 5.97c1.47 0 2.79.51 3.83 1.52l2.87-2.87A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.92 5.51l3.31 2.58C7.18 7.73 9.39 5.97 12 5.97Z" />
    </svg>
  );
}

export default function RegisterPage() {
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState<Step>("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra. Vui lòng thử lại.");
        return;
      }

      setStep("sent");
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError("");

    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/dashboard`,
      },
    });

    if (authError) {
      setError("Không thể đăng ký bằng Google. Vui lòng thử lại.");
      setGoogleLoading(false);
      return;
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(45, 154, 75, 0.25)",
    background: "rgba(5, 15, 8, 0.8)",
    color: "#e2ffe8",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  if (step === "sent") {
    return (
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-primary"
            style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)" }}
          >
            <Banknote className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            TJ<span style={{ color: "#4ade80" }}>Finance</span>
          </h1>
        </div>

        <div
          className="rounded-2xl p-10 border text-center"
          style={{
            background: "rgba(10, 26, 15, 0.7)",
            borderColor: "rgba(45,154,75,0.3)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: "rgba(45,154,75,0.12)",
              border: "2px solid rgba(45,154,75,0.3)",
              boxShadow: "0 0 20px rgba(45,154,75,0.2)",
            }}
          >
            <Mail className="w-8 h-8" style={{ color: "#4ade80" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">
            Kiểm tra hộp thư!
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "rgba(226,255,232,0.55)" }}
          >
            Chúng tôi đã gửi link xác nhận đến
            <br />
            <strong style={{ color: "#4ade80" }}>{email}</strong>
          </p>
          <p
            className="text-xs mt-4"
            style={{ color: "rgba(226,255,232,0.3)" }}
          >
            Link có hiệu lực trong 24 giờ.
            <br />
            Hãy kiểm tra cả mục Spam nếu không thấy email.
          </p>
          <div
            className="mt-6 pt-5 border-t"
            style={{ borderColor: "rgba(45,154,75,0.12)" }}
          >
            <Link
              href="/login"
              className="text-sm font-medium hover:underline"
              style={{ color: "#4ade80" }}
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-primary"
          style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)" }}
        >
          <Banknote className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">
          TJ<span style={{ color: "#4ade80" }}>Finance</span>
        </h1>
        <p className="text-sm" style={{ color: "rgba(226, 255, 232, 0.5)" }}>
          Bắt đầu hành trình tài chính của bạn
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-8 border"
        style={{
          background: "rgba(10, 26, 15, 0.7)",
          borderColor: "rgba(45, 154, 75, 0.2)",
          backdropFilter: "blur(20px)",
          boxShadow:
            "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(45,154,75,0.1)",
        }}
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">
            Tạo tài khoản mới
          </h2>
        </div>

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={loading || googleLoading}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(45,154,75,0.18)",
            color: "#e2ffe8",
          }}
        >
          {googleLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <GoogleIcon />
          )}
          Đăng ký bằng Google
        </button>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "rgba(226, 255, 232, 0.7)" }}
            >
              Họ và tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
              maxLength={50}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "rgba(226, 255, 232, 0.7)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              maxLength={254}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "rgba(226, 255, 232, 0.7)" }}
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                required
                maxLength={128}
                style={{ ...inputStyle, paddingRight: "48px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(226, 255, 232, 0.4)" }}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "rgba(226, 255, 232, 0.7)" }}
            >
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              maxLength={128}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Tạo tài khoản
              </>
            )}
          </button>
        </form>

        <div
          className="mt-6 text-center text-sm"
          style={{ color: "rgba(226, 255, 232, 0.4)" }}
        >
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-medium hover:underline"
            style={{ color: "#4ade80" }}
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
