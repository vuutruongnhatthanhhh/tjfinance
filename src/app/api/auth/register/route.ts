import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { sendMail } from "@/lib/mailer";
import { renderVerificationEmailHTML } from "@/lib/emailTemplates";

// Dùng service role key để tạo user (server-side only)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  // Kiểm tra env vars bắt buộc
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[register] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.json({ error: "[Config] SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình." }, { status: 500 });
  }
  if (!process.env.GMAIL_OAUTH_USER || !process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_REFRESH_TOKEN) {
    console.error("[register] Gmail OAuth2 env vars are not set");
    return NextResponse.json({ error: "[Config] Gmail OAuth2 chưa được cấu hình." }, { status: 500 });
  }

  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Thiếu thông tin đăng ký." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Bước 1: Tạo user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      console.error("[register] createUser error:", createError.message);
      const isDuplicate = createError.message.toLowerCase().includes("already") ||
        createError.message.toLowerCase().includes("exists");
      return NextResponse.json(
        { error: isDuplicate ? "Email này đã được đăng ký. Vui lòng đăng nhập." : `[Supabase] ${createError.message}` },
        { status: isDuplicate ? 409 : 500 }
      );
    }

    const userId = userData.user.id;

    // Bước 2: Lưu token xác nhận
    const token = randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: tokenError } = await supabase
      .from("email_verifications")
      .insert({ user_id: userId, token, expires_at: expiresAt });

    if (tokenError) {
      console.error("[register] insert token error:", tokenError.message);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `[DB] ${tokenError.message}` },
        { status: 500 }
      );
    }

    // Bước 3: Gửi email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const verificationUrl = `${siteUrl}/verify-email?token=${token}`;

    try {
      await sendMail({
        to: email,
        subject: "Xác nhận email đăng ký TJ Finance",
        html: renderVerificationEmailHTML({ fullName, verificationUrl }),
      });
    } catch (mailErr) {
      console.error("[register] sendMail error:", mailErr);
      // Rollback user và token nếu gửi mail thất bại
      await supabase.from("email_verifications").delete().eq("user_id", userId);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `[Mail] Gửi email thất bại: ${(mailErr as Error).message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register] unexpected error:", err);
    return NextResponse.json(
      { error: `[Server] ${(err as Error).message ?? "Lỗi không xác định."}` },
      { status: 500 }
    );
  }
}
