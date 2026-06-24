"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Banknote, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!document.referrer) return;

    try {
      const referrerPath = new URL(document.referrer).pathname;

      if (referrerPath.startsWith("/reset-password")) {
        void supabase.auth.signOut();
      }
    } catch {
      return;
    }
  }, [supabase.auth]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

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

  const handleGoogleLogin = async () => {
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
      setError("Không thể đăng nhập bằng Google. Vui lòng thử lại.");
      setGoogleLoading(false);
      return;
    }
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
          TJ<span className="text-glow" style={{ color: "#4ade80" }}>Finance</span>
        </h1>
        <p className="text-sm" style={{ color: "rgba(226,255,232,0.5)" }}>
          Quản lý tài chính thông minh
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
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Chào mừng trở lại</h2>
          <p className="mt-1 text-sm" style={{ color: "rgba(226,255,232,0.5)" }}>
            Đăng nhập để tiếp tục hành trình
          </p>
        </div>

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

        <button
          type="button"
          onClick={handleGoogleLogin}
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
          Đăng nhập bằng Google
        </button>

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "rgba(226,255,232,0.7)" }}
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                maxLength={128}
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
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(226, 255, 232, 0.4)" }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-medium transition-colors hover:underline"
              style={{ color: "#4ade80" }}
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 flex w-full items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm" style={{ color: "rgba(226,255,232,0.4)" }}>
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-medium transition-colors hover:text-green-400"
            style={{ color: "#4ade80" }}
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
