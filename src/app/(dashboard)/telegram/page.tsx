import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTelegramBotUsername, getTelegramDeepLink } from "@/lib/telegramBot";
import TelegramSettingsClient from "./TelegramSettingsClient";

interface TelegramIntegration {
  telegram_enabled: boolean;
  telegram_chat_id: string | null;
  telegram_username: string | null;
  telegram_connected_at: string | null;
  telegram_link_token: string | null;
  telegram_link_token_expires_at: string | null;
}

export default async function TelegramPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: integration } = await supabase
    .from("telegram_integrations")
    .select(
      "telegram_enabled,telegram_chat_id,telegram_username,telegram_connected_at,telegram_link_token,telegram_link_token_expires_at",
    )
    .eq("user_id", user.id)
    .maybeSingle<TelegramIntegration>();

  const deepLink = integration?.telegram_link_token
    ? getTelegramDeepLink(integration.telegram_link_token)
    : null;

  return (
    <TelegramSettingsClient
      botUsername={getTelegramBotUsername()}
      initialIntegration={{
        telegramEnabled: integration?.telegram_enabled || false,
        telegramChatId: integration?.telegram_chat_id || null,
        telegramUsername: integration?.telegram_username || null,
        telegramConnectedAt: integration?.telegram_connected_at || null,
        telegramLinkToken: integration?.telegram_link_token || null,
        telegramLinkTokenExpiresAt:
          integration?.telegram_link_token_expires_at || null,
        deepLink,
      }}
    />
  );
}
