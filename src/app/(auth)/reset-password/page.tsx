"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_MAX_LENGTH = 128;

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    const initializeRecovery = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );
      const tokenHash =
        queryParams.get("token_hash") || hashParams.get("token_hash");
      const accessToken = hashParams.get("access_token");
      const type =
        queryParams.get("type") || hashParams.get("type") || "recovery";
      const redirectTo =
        queryParams.get("redirect_to") || hashParams.get("redirect_to");

      if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: (type === "recovery" ? "recovery" : type || "recovery") as
            | "recovery"
            | "email",
        });

        if (!isMounted) return;

        if (verifyError) {
          setError(
            "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
          );
          setCheckingSession(false);
          return;
        }

        setCanReset(true);
        setCheckingSession(false);
        if (redirectTo || window.location.hash) {
          window.history.replaceState({}, "", "/reset-password");
        }
        return;
      }

      if (accessToken) {
        const {
          data: { session: recoverySession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError || !recoverySession) {
          setError(
            "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
          );
          setCheckingSession(false);
          return;
        }

        setCanReset(true);
        setCheckingSession(false);
        if (window.location.hash) {
          window.history.replaceState({}, "", "/reset-password");
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setCanReset(Boolean(session));
      setCheckingSession(false);
    };

    void initializeRecovery();

    return () => {
      isMounted = false;
    };
  }, [supabase.auth]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setLoading(false);
      setError("Không thể cập nhật mật khẩu. Vui lòng thử lại.");
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    setSuccess(
      "Đổi mật khẩu thành công. Hệ thống sẽ chuyển về trang đăng nhập.",
    );
    window.setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 1600);
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-10 text-center">
        <div
          className="glow-primary mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "linear-gradient(135deg, #2D9A4B, #1a7a35)" }}
        >
          <KeyRound className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-1 text-3xl font-bold text-white font-display">
          Đặt lại mật khẩu
        </h1>
        <p className="text-sm" style={{ color: "rgba(226,255,232,0.5)" }}>
          Nhập mật khẩu mới sau khi xác nhận qua email.
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
        {checkingSession ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p
              className="mt-4 text-sm"
              style={{ color: "rgba(226,255,232,0.5)" }}
            >
              Đang kiểm tra liên kết đặt lại mật khẩu...
            </p>
          </div>
        ) : !canReset ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-white">
              Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: "#4ade80" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#fca5a5",
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "rgba(45,154,75,0.12)",
                  border: "1px solid rgba(45,154,75,0.24)",
                  color: "#bbf7d0",
                }}
              >
                {success}
              </div>
            )}

            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: "rgba(226,255,232,0.7)" }}
              >
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError("");
                  }}
                  maxLength={PASSWORD_MAX_LENGTH}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full rounded-xl border px-4 py-3 pr-12 text-sm text-white outline-none"
                  style={{
                    background: "rgba(5,15,8,0.8)",
                    borderColor: "rgba(45,154,75,0.25)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(226,255,232,0.4)" }}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: "rgba(226,255,232,0.7)" }}
              >
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (error) setError("");
                  }}
                  maxLength={PASSWORD_MAX_LENGTH}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-xl border px-4 py-3 pr-12 text-sm text-white outline-none"
                  style={{
                    background: "rgba(5,15,8,0.8)",
                    borderColor: "rgba(45,154,75,0.25)",
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(226,255,232,0.4)" }}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 w-full"
            >
              {loading ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
