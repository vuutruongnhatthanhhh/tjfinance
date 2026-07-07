import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildTelegramLinkToken,
  getTelegramBotUsername,
  getTelegramDeepLink,
} from "@/lib/telegramBot";

const LINK_TOKEN_TTL_HOURS = 1;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = buildTelegramLinkToken();
  const expiresAt = new Date(
    Date.now() + LINK_TOKEN_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("telegram_integrations").upsert({
    user_id: user.id,
    telegram_enabled: false,
    telegram_chat_id: null,
    telegram_username: null,
    telegram_connected_at: null,
    telegram_link_token: token,
    telegram_link_token_expires_at: expiresAt,
  });

  if (error) {
    return NextResponse.json(
      { error: "Không thể tạo token liên kết Telegram." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    token,
    expiresAt,
    botUsername: getTelegramBotUsername(),
    deepLink: getTelegramDeepLink(token),
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("telegram_integrations")
    .upsert({
      user_id: user.id,
      telegram_enabled: false,
      telegram_chat_id: null,
      telegram_username: null,
      telegram_connected_at: null,
      telegram_link_token: null,
      telegram_link_token_expires_at: null,
    });

  if (error) {
    return NextResponse.json(
      { error: "Không thể ngắt kết nối Telegram." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
