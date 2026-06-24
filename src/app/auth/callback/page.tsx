"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [message, setMessage] = useState("Đang xác thực tài khoản...");

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/dashboard";

      if (!code) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.replace("/login?error=oauth");
        return;
      }

      setMessage("Đăng nhập thành công, đang chuyển hướng...");
      router.replace(next);
      router.refresh();
    };

    void run();
  }, [router, searchParams, supabase.auth]);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] w-full items-center justify-center px-4 py-8 text-center">
      <div className="flex w-full max-w-md flex-col items-center justify-center animate-fade-in">
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(45,154,75,0.12)",
            border: "1px solid rgba(45,154,75,0.2)",
            boxShadow: "0 0 24px rgba(45,154,75,0.18)",
          }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Đang xử lý đăng nhập</h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(226,255,232,0.45)" }}>
          {message}
        </p>
      </div>
    </div>
  );
}
