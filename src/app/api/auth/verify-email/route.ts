import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token không hợp lệ." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Tìm token còn hiệu lực và chưa dùng
  const { data: record, error: findError } = await supabase
    .from("email_verifications")
    .select("*")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (findError || !record) {
    return NextResponse.json(
      { error: "Link xác nhận không hợp lệ hoặc đã hết hạn." },
      { status: 400 }
    );
  }

  // Xác nhận email trong Supabase Auth
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    record.user_id,
    { email_confirm: true }
  );

  if (updateError) {
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi xác nhận email." },
      { status: 500 }
    );
  }

  // Xoá token sau khi đã dùng
  await supabase
    .from("email_verifications")
    .delete()
    .eq("id", record.id);

  return NextResponse.json({ success: true });
}
