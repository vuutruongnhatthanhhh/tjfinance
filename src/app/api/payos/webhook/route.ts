import { NextRequest, NextResponse } from "next/server";
import { pickOrderCode, syncBillingOrder } from "@/lib/billing";
import { getPayOS } from "@/lib/payos";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text();
    const rawBody = rawText ? JSON.parse(rawText) : null;
    const payOS = getPayOS();

    let verifiedPayload: any;

    try {
      verifiedPayload = payOS.webhooks.verify(rawBody);
    } catch (error) {
      console.error("[payos-webhook] verify failed", error);
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    }

    const orderCode =
      pickOrderCode(verifiedPayload?.data) ??
      pickOrderCode(rawBody?.data) ??
      pickOrderCode(rawBody);

    if (!orderCode) {
      return NextResponse.json({ ok: true });
    }

    const result = await syncBillingOrder(orderCode);

    if (!result.ok && result.reason !== "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: result.reason }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[payos-webhook] unexpected error", error);
    return NextResponse.json({ error: "WEBHOOK_FAILED" }, { status: 500 });
  }
}
