interface TelegramSendMessageResult {
  ok: boolean;
  result?: {
    message_id?: number;
  };
  description?: string;
}

export async function sendTelegramMessage({
  chatId,
  text,
  parseMode,
}: {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "MarkdownV2";
}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error("Thiếu TELEGRAM_BOT_TOKEN.");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...(parseMode ? { parse_mode: parseMode } : {}),
      }),
    },
  );

  const result = (await response.json()) as TelegramSendMessageResult;

  if (!response.ok || !result.ok) {
    throw new Error(result.description || "Telegram gửi thất bại.");
  }

  return {
    messageId: result.result?.message_id
      ? String(result.result.message_id)
      : null,
  };
}
