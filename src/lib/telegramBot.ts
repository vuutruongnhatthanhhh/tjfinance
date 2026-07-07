import { createAdminClient } from "@/lib/supabase/admin";
import { Category, InvestmentAsset } from "@/types";

type TransactionCommandType = "expense" | "income" | "investment";
type ListRange = "today" | "week" | "month" | "year";
type ListType = TransactionCommandType | "all";
type CategoryListType = TransactionCommandType | "asset" | "all";

interface TelegramIntegrationRow {
  user_id: string;
  telegram_link_token_expires_at: string | null;
}

interface LinkedTelegramIntegrationRow {
  user_id: string;
}

interface TransactionPayload {
  date: string;
  amount: number;
  categoryName: string;
  description: string;
  note: string | null;
}

interface InvestmentCommandPayload extends TransactionPayload {
  assetName: string;
}

interface ListCommandPayload {
  type: ListType;
  range: ListRange;
}

interface CategoryListCommandPayload {
  type: CategoryListType;
}

interface DeleteCommandPayload {
  type: TransactionCommandType;
  idPrefix: string;
}

interface TransactionListRow {
  id: string;
  amount: number | string;
  date: string;
  description: string;
  category?: {
    name?: string | null;
  } | null;
  asset?: {
    name?: string | null;
  } | null;
}

function padTwoDigits(value: number) {
  return String(value).padStart(2, "0");
}

function removeVietnameseTones(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizeText(value: string) {
  return removeVietnameseTones(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseVietnameseDate(dateValue: string) {
  const match = dateValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, dayValue, monthValue, yearValue] = match;
  const day = Number(dayValue);
  const month = Number(monthValue);
  const year = Number(yearValue);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() + 1 !== month ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return `${yearValue}-${monthValue}-${dayValue}`;
}

function parseAmount(value: string) {
  const normalizedValue = value.replace(/[^\d]/g, "");

  if (!normalizedValue) {
    return null;
  }

  const amount = Number(normalizedValue);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function formatVietnameseDate(dateValue: string | Date) {
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  const bangkokDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  return `${padTwoDigits(bangkokDate.getUTCDate())}/${padTwoDigits(
    bangkokDate.getUTCMonth() + 1,
  )}/${bangkokDate.getUTCFullYear()}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function buildListRange(range: ListRange) {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const start = new Date(today);
  const end = new Date(today);

  if (range === "week") {
    const weekday = (today.getUTCDay() + 6) % 7;
    start.setUTCDate(today.getUTCDate() - weekday);
    end.setUTCDate(start.getUTCDate() + 6);
  } else if (range === "month") {
    start.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() + 1, 0);
  } else if (range === "year") {
    start.setUTCMonth(0, 1);
    end.setUTCMonth(11, 31);
  }

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function getRangeLabel(range: ListRange) {
  if (range === "today") return "hôm nay";
  if (range === "week") return "tuần này";
  if (range === "month") return "tháng này";
  return "năm nay";
}

function getTypeLabel(type: ListType) {
  if (type === "expense") return "chi tiêu";
  if (type === "income") return "thu nhập";
  if (type === "investment") return "đầu tư";
  return "giao dịch";
}

function getCommandLabel(type: TransactionCommandType) {
  if (type === "expense") return "chi tiêu";
  if (type === "income") return "thu nhập";
  return "đầu tư";
}

function getTransactionTable(type: TransactionCommandType) {
  if (type === "expense") return "expenses";
  if (type === "income") return "incomes";
  return "investments";
}

function getCategoryTypes(type: TransactionCommandType) {
  if (type === "investment") {
    return ["investment"] as const;
  }

  return [type] as const;
}

async function getLinkedUser(chatId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("telegram_integrations")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .eq("telegram_enabled", true)
    .maybeSingle<LinkedTelegramIntegrationRow>();

  if (error) {
    throw new Error("Không thể kiểm tra kết nối Telegram.");
  }

  return data?.user_id || null;
}

async function getCategoryByName({
  userId,
  categoryName,
  type,
}: {
  userId: string;
  categoryName: string;
  type: TransactionCommandType;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .in("type", [...getCategoryTypes(type)])
    .returns<Category[]>();

  if (error) {
    throw new Error("Không thể tải danh mục.");
  }

  const normalizedTarget = normalizeText(categoryName);
  return (
    (data || []).find((item) => normalizeText(item.name) === normalizedTarget) ||
    null
  );
}

function parseTransactionCommand(
  rawArgs: string,
  type: Exclude<TransactionCommandType, "investment">,
) {
  const parts = rawArgs
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length < 3 || parts.length > 4) {
    return null;
  }

  const [header, categoryName, description, noteValue] = parts;
  const headerMatch = header.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)$/);

  if (!headerMatch) {
    return null;
  }

  const [, dateValue, amountValue] = headerMatch;
  const parsedDate = parseVietnameseDate(dateValue);
  const amount = parseAmount(amountValue);

  if (!parsedDate || !amount || !categoryName || !description) {
    return null;
  }

  return {
    type,
    date: parsedDate,
    amount,
    categoryName,
    description,
    note: noteValue || null,
  } satisfies TransactionPayload & { type: typeof type };
}

export function parseInvestmentCommand(rawArgs: string) {
  const parts = rawArgs
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length < 4 || parts.length > 5) {
    return null;
  }

  const [header, assetName, categoryName, description, noteValue] = parts;
  const headerMatch = header.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)$/);

  if (!headerMatch) {
    return null;
  }

  const [, dateValue, amountValue] = headerMatch;
  const parsedDate = parseVietnameseDate(dateValue);
  const amount = parseAmount(amountValue);

  if (!parsedDate || !amount || !assetName || !categoryName || !description) {
    return null;
  }

  return {
    date: parsedDate,
    amount,
    assetName,
    categoryName,
    description,
    note: noteValue || null,
  } satisfies InvestmentCommandPayload;
}

export function buildTelegramLinkToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export function getTelegramBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME || "TJFinanceBot";
}

export function getTelegramDeepLink(token: string) {
  return `https://t.me/${getTelegramBotUsername().replace(/^@/, "")}?start=${token}`;
}

export function parseTelegramCommand(text: string) {
  const trimmed = text.trim();
  const [rawCommand = "", ...args] = trimmed.split(/\s+/);
  const command = rawCommand.split("@")[0].toLowerCase();

  return {
    command,
    args,
    rawArgs: trimmed.slice(rawCommand.length).trim(),
  };
}

export function parseListCommand(rawArgs: string): ListCommandPayload | null {
  const [typeValue = "all", rangeValue = "month"] = rawArgs
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const normalizedType = typeValue.toLowerCase() as ListType;
  const normalizedRange = rangeValue.toLowerCase() as ListRange;
  const allowedTypes: ListType[] = ["all", "expense", "income", "investment"];
  const allowedRanges: ListRange[] = ["today", "week", "month", "year"];

  if (
    !allowedTypes.includes(normalizedType) ||
    !allowedRanges.includes(normalizedRange)
  ) {
    return null;
  }

  return {
    type: normalizedType,
    range: normalizedRange,
  };
}

export function parseCategoryListCommand(
  rawArgs: string,
): CategoryListCommandPayload | null {
  const normalizedType = (rawArgs.trim().toLowerCase() || "all") as CategoryListType;
  const allowedTypes: CategoryListType[] = [
    "all",
    "expense",
    "income",
    "investment",
    "asset",
  ];

  if (!allowedTypes.includes(normalizedType)) {
    return null;
  }

  return {
    type: normalizedType,
  };
}

export function parseDeleteCommand(rawArgs: string): DeleteCommandPayload | null {
  const [typeValue = "", idPrefixValue = ""] = rawArgs
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const type = typeValue.toLowerCase() as TransactionCommandType;
  const idPrefix = idPrefixValue.trim().toLowerCase();
  const allowedTypes: TransactionCommandType[] = [
    "expense",
    "income",
    "investment",
  ];

  if (!allowedTypes.includes(type) || !idPrefix) {
    return null;
  }

  return {
    type,
    idPrefix,
  };
}

export async function linkTelegramAccount({
  token,
  chatId,
  username,
}: {
  token: string;
  chatId: string;
  username: string;
}) {
  const supabase = createAdminClient();

  const { data: integration, error } = await supabase
    .from("telegram_integrations")
    .select("user_id,telegram_link_token_expires_at")
    .eq("telegram_link_token", token)
    .maybeSingle<TelegramIntegrationRow>();

  if (error) {
    throw new Error("Không thể kiểm tra token liên kết Telegram.");
  }

  if (!integration) {
    return {
      success: false as const,
      message: "Token liên kết không hợp lệ hoặc đã hết hạn.",
    };
  }

  if (
    integration.telegram_link_token_expires_at &&
    new Date(integration.telegram_link_token_expires_at).getTime() < Date.now()
  ) {
    return {
      success: false as const,
      message: "Token liên kết đã hết hạn. Vui lòng tạo token mới trong TJFinance.",
    };
  }

  const { error: updateError } = await supabase
    .from("telegram_integrations")
    .update({
      telegram_enabled: true,
      telegram_chat_id: chatId,
      telegram_username: username || null,
      telegram_connected_at: new Date().toISOString(),
      telegram_link_token: null,
      telegram_link_token_expires_at: null,
    })
    .eq("user_id", integration.user_id);

  if (updateError) {
    throw new Error("Không thể lưu kết nối Telegram.");
  }

  return {
    success: true as const,
    message:
      "Đã liên kết Telegram với TJFinance. Bây giờ bạn có thể dùng /expense, /income, /investment và /list.",
  };
}

export async function createTelegramTransaction({
  chatId,
  type,
  payload,
}: {
  chatId: string;
  type: Exclude<TransactionCommandType, "investment">;
  payload: TransactionPayload;
}) {
  const userId = await getLinkedUser(chatId);

  if (!userId) {
    return {
      success: false as const,
      message:
        "Chat Telegram này chưa được liên kết. Vào trang Telegram trong TJFinance để kết nối bot trước.",
    };
  }

  const category = await getCategoryByName({
    userId,
    categoryName: payload.categoryName,
    type,
  });

  if (!category) {
    return {
      success: false as const,
      message: `Không tìm thấy danh mục ${getCommandLabel(type)} "${payload.categoryName}".`,
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from(getTransactionTable(type)).insert({
    user_id: userId,
    category_id: category.id,
    amount: payload.amount,
    description: payload.description,
    note: payload.note,
    date: payload.date,
  });

  if (error) {
    throw new Error(`Không thể tạo ${getCommandLabel(type)} từ Telegram.`);
  }

  return {
    success: true as const,
    message: [
      `Đã thêm ${getCommandLabel(type)} mới.`,
      `Ngày: ${formatVietnameseDate(payload.date)}`,
      `Số tiền: ${formatCurrency(payload.amount)} đ`,
      `Danh mục: ${category.name}`,
      `Tên giao dịch: ${payload.description}`,
      ...(payload.note ? [`Ghi chú: ${payload.note}`] : []),
    ].join("\n"),
  };
}

async function findOrCreateInvestmentAsset({
  userId,
  assetName,
  category,
  date,
}: {
  userId: string;
  assetName: string;
  category: Category;
  date: string;
}) {
  const supabase = createAdminClient();
  const { data: assets, error: assetError } = await supabase
    .from("investment_assets")
    .select("*")
    .eq("user_id", userId)
    .returns<InvestmentAsset[]>();

  if (assetError) {
    throw new Error("Không thể tải khoản đầu tư.");
  }

  const matchedAsset = (assets || []).find(
    (item) => normalizeText(item.name) === normalizeText(assetName),
  );

  if (matchedAsset) {
    return matchedAsset;
  }

  const { data: createdAsset, error: createAssetError } = await supabase
    .from("investment_assets")
    .insert({
      user_id: userId,
      category_id: category.id,
      name: assetName.trim(),
      description: "Tạo nhanh từ Telegram bot",
      is_business: false,
      started_at: date,
    })
    .select("*")
    .single<InvestmentAsset>();

  if (createAssetError || !createdAsset) {
    throw new Error("Không thể tạo khoản đầu tư mới.");
  }

  return createdAsset;
}

export async function createTelegramInvestment({
  chatId,
  payload,
}: {
  chatId: string;
  payload: InvestmentCommandPayload;
}) {
  const userId = await getLinkedUser(chatId);

  if (!userId) {
    return {
      success: false as const,
      message:
        "Chat Telegram này chưa được liên kết. Vào trang Telegram trong TJFinance để kết nối bot trước.",
    };
  }

  const category = await getCategoryByName({
    userId,
    categoryName: payload.categoryName,
    type: "investment",
  });

  if (!category) {
    return {
      success: false as const,
      message: `Không tìm thấy danh mục đầu tư "${payload.categoryName}".`,
    };
  }

  const asset = await findOrCreateInvestmentAsset({
    userId,
    assetName: payload.assetName,
    category,
    date: payload.date,
  });

  const supabase = createAdminClient();
  const { error } = await supabase.from("investments").insert({
    user_id: userId,
    category_id: category.id,
    asset_id: asset.id,
    amount: payload.amount,
    description: payload.description,
    note: payload.note,
    date: payload.date,
  });

  if (error) {
    throw new Error("Không thể tạo đầu tư từ Telegram.");
  }

  return {
    success: true as const,
    message: [
      "Đã thêm đầu tư mới.",
      `Ngày: ${formatVietnameseDate(payload.date)}`,
      `Số tiền: ${formatCurrency(payload.amount)} đ`,
      `Khoản đầu tư: ${asset.name}`,
      `Danh mục: ${category.name}`,
      `Tên giao dịch: ${payload.description}`,
      ...(payload.note ? [`Ghi chú: ${payload.note}`] : []),
    ].join("\n"),
  };
}

export async function listTelegramTransactions({
  chatId,
  filter,
}: {
  chatId: string;
  filter: ListCommandPayload;
}) {
  const userId = await getLinkedUser(chatId);

  if (!userId) {
    return {
      success: false as const,
      message:
        "Chat Telegram này chưa được liên kết. Vào trang Telegram trong TJFinance để kết nối bot trước.",
    };
  }

  const supabase = createAdminClient();
  const range = buildListRange(filter.range);
  const sections: string[] = [];
  let grandTotal = 0;
  let grandCount = 0;
  const types: TransactionCommandType[] =
    filter.type === "all"
      ? ["expense", "income", "investment"]
      : [filter.type];

  for (const type of types) {
    const query = supabase
      .from(getTransactionTable(type))
      .select(
        type === "investment"
          ? "*, category:categories(*), asset:investment_assets(*)"
          : "*, category:categories(*)",
      )
      .eq("user_id", userId)
      .gte("date", range.start)
      .lte("date", range.end)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Không thể tải danh sách ${getTypeLabel(type)}.`);
    }

    const items = ((data || []) as unknown) as TransactionListRow[];
    const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

    grandTotal += total;
    grandCount += items.length;

    if (filter.type !== "all" || items.length > 0) {
      sections.push(
        [
          `${getTypeLabel(type).toUpperCase()}: ${items.length} mục - ${formatCurrency(total)} đ`,
          ...(items.length === 0
            ? ["Chưa có dữ liệu."]
            : items.map((item, index) => {
                const assetName =
                  type === "investment" && item.asset?.name
                    ? ` | ${item.asset.name}`
                    : "";
                return `${index + 1}. [${item.id.slice(0, 8)}] ${formatVietnameseDate(item.date)} | ${formatCurrency(
                  Number(item.amount),
                )} đ | ${item.category?.name || "Không danh mục"}${assetName} | ${item.description}`;
              })),
        ].join("\n"),
      );
    }
  }

  if (grandCount === 0) {
    return {
      success: true as const,
      message: `Chưa có ${getTypeLabel(filter.type)} trong ${getRangeLabel(filter.range)}.`,
    };
  }

  return {
    success: true as const,
    message: [
      `Danh sách ${getTypeLabel(filter.type)} ${getRangeLabel(filter.range)} (${formatVietnameseDate(range.start)} - ${formatVietnameseDate(range.end)}):`,
      ...sections,
      ...(filter.type === "all"
        ? [`TỔNG CỘNG: ${grandCount} mục - ${formatCurrency(grandTotal)} đ`]
        : []),
    ].join("\n\n"),
  };
}

async function listCategoriesByType({
  userId,
  type,
}: {
  userId: string;
  type: TransactionCommandType;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", userId)
    .in("type", [...getCategoryTypes(type)])
    .order("name");

  if (error) {
    throw new Error(`Không thể tải danh mục ${getTypeLabel(type)}.`);
  }

  return (data || [])
    .map((item) => item.name)
    .filter((item): item is string => Boolean(item));
}

async function listInvestmentAssets(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("investment_assets")
    .select("name,is_business,category:categories(name)")
    .eq("user_id", userId)
    .order("name");

  if (error) {
    throw new Error("Không thể tải danh sách khoản đầu tư.");
  }

  return ((data || []) as Array<{
    name?: string | null;
    is_business?: boolean | null;
    category?: { name?: string | null } | null;
  }>).filter((item) => item.name);
}

export async function listTelegramCategories({
  chatId,
  filter,
}: {
  chatId: string;
  filter: CategoryListCommandPayload;
}) {
  const userId = await getLinkedUser(chatId);

  if (!userId) {
    return {
      success: false as const,
      message:
        "Chat Telegram này chưa được liên kết. Vào trang Telegram trong TJFinance để kết nối bot trước.",
    };
  }

  const sections: string[] = [];
  const categoryTypes: TransactionCommandType[] =
    filter.type === "all"
      ? ["expense", "income", "investment"]
      : filter.type === "asset"
        ? []
        : [filter.type];

  for (const type of categoryTypes) {
    const categoryNames = await listCategoriesByType({ userId, type });

    sections.push(
      [
        `DANH MỤC ${getTypeLabel(type).toUpperCase()}: ${categoryNames.length} mục`,
        ...(categoryNames.length === 0
          ? ["Chưa có dữ liệu."]
          : categoryNames.map((name, index) => `${index + 1}. ${name}`)),
      ].join("\n"),
    );
  }

  if (filter.type === "asset" || filter.type === "all") {
    const assets = await listInvestmentAssets(userId);

    sections.push(
      [
        `KHOẢN ĐẦU TƯ: ${assets.length} mục`,
        ...(assets.length === 0
          ? ["Chưa có dữ liệu."]
          : assets.map((item, index) => {
              const categoryName = item.category?.name
                ? ` | ${item.category.name}`
                : "";
              const businessLabel = item.is_business ? " | business" : "";
              return `${index + 1}. ${item.name}${categoryName}${businessLabel}`;
            })),
      ].join("\n"),
    );
  }

  return {
    success: true as const,
    message: sections.join("\n\n"),
  };
}

export async function deleteTelegramTransaction({
  chatId,
  payload,
}: {
  chatId: string;
  payload: DeleteCommandPayload;
}) {
  const userId = await getLinkedUser(chatId);

  if (!userId) {
    return {
      success: false as const,
      message:
        "Chat Telegram này chưa được liên kết. Vào trang Telegram trong TJFinance để kết nối bot trước.",
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(getTransactionTable(payload.type))
    .select("id,description")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Không thể tải danh sách ${getTypeLabel(payload.type)} để xóa.`);
  }

  const matchedItems = ((data || []) as Array<{
    id: string;
    description?: string | null;
  }>).filter((item) => item.id.toLowerCase().startsWith(payload.idPrefix));

  if (matchedItems.length === 0) {
    return {
      success: false as const,
      message: `Không tìm thấy ${getTypeLabel(payload.type)} với mã đã nhập.`,
    };
  }

  if (matchedItems.length > 1) {
    return {
      success: false as const,
      message:
        "Mã giao dịch đang bị trùng. Vui lòng dùng nhiều ký tự hơn trong id-prefix.",
    };
  }

  const transaction = matchedItems[0];
  const { error: deleteError } = await supabase
    .from(getTransactionTable(payload.type))
    .delete()
    .eq("id", transaction.id)
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error(`Không thể xóa ${getTypeLabel(payload.type)} từ Telegram.`);
  }

  return {
    success: true as const,
    message: `Đã xóa ${getTypeLabel(payload.type)} [${transaction.id.slice(0, 8)}] ${transaction.description || ""}`.trim(),
  };
}

export function buildTelegramHelpMessage() {
  return [
    "Các lệnh hỗ trợ:",
    "/start <token> - Liên kết bot với tài khoản TJFinance",
    "/expense dd/mm/yyyy so_tien | danh_muc | ten_giao_dich | ghi_chu",
    "/income dd/mm/yyyy so_tien | danh_muc | ten_giao_dich | ghi_chu",
    "/investment dd/mm/yyyy so_tien | ten_khoan_dau_tu | danh_muc | ten_giao_dich | ghi_chu",
    "/list <all|expense|income|investment> <today|week|month|year>",
    "/delete <expense|income|investment> <id-prefix>",
    "/categories <all|expense|income|investment|asset>",
    "/help - Xem hướng dẫn",
    "",
    "Ví dụ:",
    "/expense 07/07/2026 45000 | Ăn uống | Cà phê sáng | gặp khách",
    "/income 07/07/2026 15000000 | Lương | Lương tháng 7",
    "/investment 07/07/2026 2000000 | Quỹ VCBF | Cổ phiếu | Mua thêm tháng 7",
    "/list all month",
    "/delete expense ab12cd34",
    "/categories all",
    "",
    "Lưu ý: lệnh /investment hiện hỗ trợ tạo nhanh khoản đầu tư thường, không dùng cho khoản business.",
  ].join("\n");
}

export function parseExpenseCommand(rawArgs: string) {
  return parseTransactionCommand(rawArgs, "expense");
}

export function parseIncomeCommand(rawArgs: string) {
  return parseTransactionCommand(rawArgs, "income");
}
