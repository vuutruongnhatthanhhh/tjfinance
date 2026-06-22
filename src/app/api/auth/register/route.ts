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
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Thiếu thông tin đăng ký." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Tạo user với email_confirm: false — user chưa thể đăng nhập cho đến khi xác nhận
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      // Email đã tồn tại
      if (createError.message.toLowerCase().includes("already") || createError.message.toLowerCase().includes("exists")) {
        return NextResponse.json(
          { error: "Email này đã được đăng ký. Vui lòng đăng nhập." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    const userId = userData.user.id;

    // Sinh token xác nhận (48 bytes = 96 hex chars)
    const token = randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Lưu token vào DB
    const { error: tokenError } = await supabase
      .from("email_verifications")
      .insert({ user_id: userId, token, expires_at: expiresAt });

    if (tokenError) {
      // Rollback: xoá user vừa tạo nếu không lưu được token
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Có lỗi xảy ra. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    // Gửi email xác nhận
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const verificationUrl = `${siteUrl}/verify-email?token=${token}`;

    await sendMail({
      to: email,
      subject: "Xác nhận email đăng ký TJ Finance",
      html: renderVerificationEmailHTML({ fullName, verificationUrl }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register] error:", err);
    return NextResponse.json(
      { error: "Có lỗi xảy ra. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
