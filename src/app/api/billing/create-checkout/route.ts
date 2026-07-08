import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  PLAN_PRICES_VND,
  generateOrderCode15,
  normalizeCycle,
  normalizePlan,
} from "@/lib/billing";
import { getPayOS } from "@/lib/payos";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      plan?: string;
      cycle?: string;
    };

    const plan = normalizePlan(body.plan);
    const cycle = normalizeCycle(body.cycle);

    if (plan === "free") {
      return NextResponse.json(
        { error: "FREE_PLAN_NO_CHECKOUT" },
        { status: 400 },
      );
    }

    const amount = PLAN_PRICES_VND[plan][cycle];
    const payOS = getPayOS();
    let orderCode = generateOrderCode15();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data: existingOrder } = await supabase
        .from("billing_orders")
        .select("order_code")
        .eq("order_code", orderCode)
        .maybeSingle();

      if (!existingOrder) {
        break;
      }

      orderCode = generateOrderCode15();
    }

    const { error: insertError } = await supabase.from("billing_orders").insert({
      order_code: orderCode,
      user_id: user.id,
      plan,
      amount,
      status: "pending",
      renewal_cycle: cycle,
    });

    if (insertError) {
      console.error("[billing] insert order failed", insertError);
      return NextResponse.json({ error: "CREATE_ORDER_FAILED" }, { status: 500 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

    try {
      const paymentLink = await payOS.paymentRequests.create({
        orderCode,
        amount,
        description: `TJF_${orderCode}`.slice(0, 25),
        items: [
          {
            name: `TJFinance Plus ${cycle === "yearly" ? "Yearly" : "Monthly"}`,
            quantity: 1,
            price: amount,
          },
        ],
        returnUrl: `${baseUrl}/billing/result?status=success&orderCode=${orderCode}`,
        cancelUrl: `${baseUrl}/billing/result?status=cancel&orderCode=${orderCode}`,
      });

      return NextResponse.json({
        checkoutUrl: paymentLink.checkoutUrl,
        orderCode,
      });
    } catch (error) {
      await supabase.from("billing_orders").delete().eq("order_code", orderCode);
      console.error("[billing] create payment link failed", error);
      return NextResponse.json(
        { error: "CREATE_CHECKOUT_FAILED" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[billing] unexpected error", error);
    return NextResponse.json(
      { error: "CREATE_CHECKOUT_FAILED" },
      { status: 500 },
    );
  }
}
