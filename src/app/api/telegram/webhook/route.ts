import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import {
  buildTelegramHelpMessage,
  createTelegramInvestment,
  createTelegramTransaction,
  deleteTelegramTransaction,
  linkTelegramAccount,
  listTelegramCategories,
  listTelegramTransactions,
  parseCategoryListCommand,
  parseDeleteCommand,
  parseExpenseCommand,
  parseIncomeCommand,
  parseInvestmentCommand,
  parseListCommand,
  parseTelegramCommand,
} from "@/lib/telegramBot";

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: {
      id?: number;
    };
    from?: {
      username?: string;
    };
  };
}

function getWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET || "";
}

async function replyToTelegram(chatId: string, text: string) {
  await sendTelegramMessage({
    chatId,
    text,
  });
}

export async function POST(request: Request) {
  const configuredSecret = getWebhookSecret();
  const headerSecret =
    request.headers.get("x-telegram-bot-api-secret-token") || "";

  if (configuredSecret && headerSecret !== configuredSecret) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;
  const text = message?.text?.trim();
  const chatId = message?.chat?.id ? String(message.chat.id) : "";
  const username = message?.from?.username ? `@${message.from.username}` : "";

  if (!text || !chatId) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { command, args, rawArgs } = parseTelegramCommand(text);

    if (command === "/start") {
      const token = args[0];

      if (!token) {
        await replyToTelegram(chatId, buildTelegramHelpMessage());
        return NextResponse.json({ ok: true });
      }

      const result = await linkTelegramAccount({
        token,
        chatId,
        username,
      });

      await replyToTelegram(chatId, result.message);
      return NextResponse.json({ ok: true });
    }

    if (command === "/help") {
      await replyToTelegram(chatId, buildTelegramHelpMessage());
      return NextResponse.json({ ok: true });
    }

    if (command === "/expense") {
      const parsed = parseExpenseCommand(rawArgs);

      if (!parsed) {
        await replyToTelegram(
          chatId,
          [
            "Cú pháp chưa đúng.",
            "Dùng: /expense dd/mm/yyyy so_tien | danh_muc | ten_giao_dich | ghi_chu",
            "Ví dụ: /expense 07/07/2026 45000 | Ăn uống | Cà phê sáng | gặp khách",
          ].join("\n"),
        );
        return NextResponse.json({ ok: true });
      }

      const result = await createTelegramTransaction({
        chatId,
        type: "expense",
        payload: parsed,
      });
      await replyToTelegram(chatId, result.message);
      return NextResponse.json({ ok: true });
    }

    if (command === "/income") {
      const parsed = parseIncomeCommand(rawArgs);

      if (!parsed) {
        await replyToTelegram(
          chatId,
          [
            "Cú pháp chưa đúng.",
            "Dùng: /income dd/mm/yyyy so_tien | danh_muc | ten_giao_dich | ghi_chu",
            "Ví dụ: /income 07/07/2026 15000000 | Lương | Lương tháng 7",
          ].join("\n"),
        );
        return NextResponse.json({ ok: true });
      }

      const result = await createTelegramTransaction({
        chatId,
        type: "income",
        payload: parsed,
      });
      await replyToTelegram(chatId, result.message);
      return NextResponse.json({ ok: true });
    }

    if (command === "/investment") {
      const parsed = parseInvestmentCommand(rawArgs);

      if (!parsed) {
        await replyToTelegram(
          chatId,
          [
            "Cú pháp chưa đúng.",
            "Dùng: /investment dd/mm/yyyy so_tien | ten_khoan_dau_tu | danh_muc | ten_giao_dich | ghi_chu",
            "Ví dụ: /investment 07/07/2026 2000000 | Quỹ VCBF | Cổ phiếu | Mua thêm tháng 7",
          ].join("\n"),
        );
        return NextResponse.json({ ok: true });
      }

      const result = await createTelegramInvestment({
        chatId,
        payload: parsed,
      });
      await replyToTelegram(chatId, result.message);
      return NextResponse.json({ ok: true });
    }

    if (command === "/list") {
      const parsed = parseListCommand(rawArgs);

      if (!parsed) {
        await replyToTelegram(
          chatId,
          [
            "Cú pháp chưa đúng.",
            "Dùng: /list <all|expense|income|investment> <today|week|month|year>",
            "Ví dụ: /list all month",
          ].join("\n"),
        );
        return NextResponse.json({ ok: true });
      }

      const result = await listTelegramTransactions({
        chatId,
        filter: parsed,
      });
      await replyToTelegram(chatId, result.message);
      return NextResponse.json({ ok: true });
    }

    if (command === "/categories") {
      const parsed = parseCategoryListCommand(rawArgs);

      if (!parsed) {
        await replyToTelegram(
          chatId,
          [
            "Cú pháp chưa đúng.",
            "Dùng: /categories <all|expense|income|investment|asset>",
            "Ví dụ: /categories all",
          ].join("\n"),
        );
        return NextResponse.json({ ok: true });
      }

      const result = await listTelegramCategories({
        chatId,
        filter: parsed,
      });
      await replyToTelegram(chatId, result.message);
      return NextResponse.json({ ok: true });
    }

    if (command === "/delete") {
      const parsed = parseDeleteCommand(rawArgs);

      if (!parsed) {
        await replyToTelegram(
          chatId,
          [
            "CĂº phĂ¡p chÆ°a Ä‘Ăºng.",
            "DĂ¹ng: /delete <expense|income|investment> <id-prefix>",
            "VĂ­ dá»¥: /delete expense ab12cd34",
          ].join("\n"),
        );
        return NextResponse.json({ ok: true });
      }

      const result = await deleteTelegramTransaction({
        chatId,
        payload: parsed,
      });
      await replyToTelegram(chatId, result.message);
      return NextResponse.json({ ok: true });
    }

    await replyToTelegram(chatId, buildTelegramHelpMessage());
    return NextResponse.json({ ok: true });
  } catch (error) {
    const messageText =
      error instanceof Error
        ? error.message
        : "Webhook Telegram gặp lỗi không xác định.";

    await replyToTelegram(
      chatId,
      `Không thể xử lý yêu cầu lúc này.\nChi tiết: ${messageText}`,
    );
    return NextResponse.json({ ok: true });
  }
}
