import { NextRequest, NextResponse } from "next/server";
import { syncBillingOrder } from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      orderCode?: number | string;
    };

    const orderCode =
      typeof body.orderCode === "number"
        ? body.orderCode
        : Number.parseInt(String(body.orderCode || ""), 10);

    if (!Number.isFinite(orderCode) || orderCode <= 0) {
      return NextResponse.json({ error: "INVALID_ORDER_CODE" }, { status: 400 });
    }

    const result = await syncBillingOrder(orderCode);

    return NextResponse.json(result, {
      status: result.ok ? 200 : result.reason === "ORDER_NOT_FOUND" ? 404 : 409,
    });
  } catch (error) {
    console.error("[billing-sync] unexpected error", error);
    return NextResponse.json({ error: "SYNC_FAILED" }, { status: 500 });
  }
}
