"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Banknote, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-primary"
          style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)" }}>
          <Banknote className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white font-display mb-1">
          TJ<span className="text-glow" style={{ color: "#4ade80" }}>Finance</span>
        </h1>
        <p className="text-sm" style={{ color: "rgba(226, 255, 232, 0.5)" }}>
          Quản lý tài chính thông minh
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
          <h2 className="text-xl font-semibold text-white">Chào mừng trở lại</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(226, 255, 232, 0.5)" }}>
            Đăng nhập để tiếp tục hành trình
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", border: "1px solid", color: "#fca5a5" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
              className="input-mystic dark:input-mystic"
              style={{
                background: "rgba(5, 15, 8, 0.8)",
                borderColor: "rgba(45, 154, 75, 0.25)",
                color: "#e2ffe8",
              }}
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
                placeholder="••••••••"
                required
                className="input-mystic pr-12"
                style={{
                  background: "rgba(5, 15, 8, 0.8)",
                  borderColor: "rgba(45, 154, 75, 0.25)",
                  color: "#e2ffe8",
                  width: "100%",
                  padding: "12px 48px 12px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(45, 154, 75, 0.25)",
                  outline: "none",
                  fontSize: "14px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(226, 255, 232, 0.4)" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
                <LogIn className="w-4 h-4" />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm" style={{ color: "rgba(226, 255, 232, 0.4)" }}>
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium transition-colors hover:text-green-400"
            style={{ color: "#4ade80" }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
