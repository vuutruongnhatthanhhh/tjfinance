"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Banknote, CheckCircle, XCircle, Loader } from "lucide-react";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Link xác nhận không hợp lệ.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setTimeout(() => router.push("/login"), 3000);
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Link xác nhận không hợp lệ hoặc đã hết hạn.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Có lỗi xảy ra. Vui lòng thử lại.");
      });
  }, [token, router]);

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Logo */}
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
          borderColor: status === "success"
            ? "rgba(45,154,75,0.3)"
            : status === "error"
            ? "rgba(239,68,68,0.3)"
            : "rgba(45,154,75,0.15)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}>

        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(45,154,75,0.12)", border: "2px solid rgba(45,154,75,0.3)" }}>
              <Loader className="w-8 h-8 animate-spin" style={{ color: "#2D9A4B" }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Đang xác nhận...</h2>
            <p className="text-sm" style={{ color: "rgba(226,255,232,0.4)" }}>
              Vui lòng chờ trong giây lát
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(45,154,75,0.15)", border: "2px solid rgba(45,154,75,0.4)", boxShadow: "0 0 20px rgba(45,154,75,0.3)" }}>
              <CheckCircle className="w-8 h-8" style={{ color: "#4ade80" }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Email đã xác nhận!</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(226,255,232,0.5)" }}>
              Tài khoản của bạn đã được kích hoạt thành công.<br />
              Đang chuyển về trang đăng nhập...
            </p>
            <Link href="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
              Đăng nhập ngay
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)" }}>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Xác nhận thất bại</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(226,255,232,0.5)" }}>
              {errorMsg}
            </p>
            <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
              Đăng ký lại
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(45,154,75,0.12)", border: "2px solid rgba(45,154,75,0.3)" }}>
          <Loader className="w-8 h-8 animate-spin" style={{ color: "#2D9A4B" }} />
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
