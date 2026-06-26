import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { renderFeedbackEmailHTML } from "@/lib/emailTemplates";
import { createClient } from "@/lib/supabase/server";

const PHONE_MAX_LENGTH = 20;
const MESSAGE_MAX_LENGTH = 1000;

export async function POST(req: NextRequest) {
  const receiverEmail = process.env.FEEDBACK_RECEIVER_EMAIL;

  if (!receiverEmail) {
    return NextResponse.json(
      { error: "Hòm thư nhận góp ý chưa được cấu hình." },
      { status: 500 },
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ." },
        { status: 401 },
      );
    }

    const body = (await req.json()) as {
      phone?: string;
      message?: string;
    };

    const phone = body.phone?.trim() || "";
    const message = body.message?.trim() || "";

    if (!phone) {
      return NextResponse.json(
        { error: "Vui lòng nhập số điện thoại." },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung góp ý." },
        { status: 400 },
      );
    }

    if (phone.length > PHONE_MAX_LENGTH) {
      return NextResponse.json(
        { error: "Số điện thoại không hợp lệ." },
        { status: 400 },
      );
    }

    if (message.length > MESSAGE_MAX_LENGTH) {
      return NextResponse.json(
        { error: "Nội dung góp ý quá dài." },
        { status: 400 },
      );
    }

    await sendMail({
      to: receiverEmail,
      subject: `Góp ý mới từ ${user.email}`,
      html: renderFeedbackEmailHTML({
        accountEmail: user.email,
        fullName: user.user_metadata?.full_name || "",
        phone,
        message,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[feedback] unexpected error:", error);
    return NextResponse.json(
      { error: "Không thể gửi góp ý lúc này. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
