"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Banknote, UserPlus, Mail } from "lucide-react";

type Step = "form" | "sent";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-primary"
            style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)" }}>
            <Banknote className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            TJ<span style={{ color: "#4ade80" }}>Finance</span>
          </h1>
        </div>

        <div className="rounded-2xl p-10 border text-center"
          style={{
            background: "rgba(10, 26, 15, 0.7)",
            borderColor: "rgba(45,154,75,0.3)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(45,154,75,0.12)", border: "2px solid rgba(45,154,75,0.3)", boxShadow: "0 0 20px rgba(45,154,75,0.2)" }}>
            <Mail className="w-8 h-8" style={{ color: "#4ade80" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Kiểm tra hộp thư!</h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(226,255,232,0.55)" }}>
            Chúng tôi đã gửi link xác nhận đến<br />
            <strong style={{ color: "#4ade80" }}>{email}</strong>
          </p>
          <p className="text-xs mt-4" style={{ color: "rgba(226,255,232,0.3)" }}>
            Link có hiệu lực trong 24 giờ.<br />
            Hãy kiểm tra cả mục Spam nếu không thấy email.
          </p>
          <div className="mt-6 pt-5 border-t" style={{ borderColor: "rgba(45,154,75,0.12)" }}>
            <Link href="/login" className="text-sm font-medium hover:underline"
              style={{ color: "#4ade80" }}>
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-primary"
          style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)" }}>
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
      <div className="rounded-2xl p-8 border"
        style={{
          background: "rgba(10, 26, 15, 0.7)",
          borderColor: "rgba(45, 154, 75, 0.2)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(45,154,75,0.1)",
        }}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Tạo tài khoản mới</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(226, 255, 232, 0.5)" }}>
            Hoàn toàn miễn phí · Không cần thẻ tín dụng
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "rgba(226, 255, 232, 0.7)" }}>
              Họ và tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "rgba(226, 255, 232, 0.7)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "rgba(226, 255, 232, 0.7)" }}>
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                required
                style={{ ...inputStyle, paddingRight: "48px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(226, 255, 232, 0.4)" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "rgba(226, 255, 232, 0.7)" }}>
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
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

        <div className="mt-6 text-center text-sm" style={{ color: "rgba(226, 255, 232, 0.4)" }}>
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium hover:underline"
            style={{ color: "#4ade80" }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
