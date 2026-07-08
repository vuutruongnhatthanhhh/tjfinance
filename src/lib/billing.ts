import { createAdminClient } from "@/lib/supabase/admin";
import { getPayOS } from "@/lib/payos";

export type SubscriptionPlan = "free" | "plus";
export type RenewalCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "expired" | "canceled";

export const PLAN_PRICES_VND: Record<
  SubscriptionPlan,
  Record<RenewalCycle, number>
> = {
  free: {
    monthly: 0,
    yearly: 0,
  },
  plus: {
    monthly: 50000,
    yearly: 500000,
  },
};

export function normalizePlan(input: unknown): SubscriptionPlan {
  return input === "plus" ? "plus" : "free";
}

export function normalizeCycle(input: unknown): RenewalCycle {
  return input === "yearly" ? "yearly" : "monthly";
}

export function normalizeSubscriptionStatus(
  input: unknown,
): SubscriptionStatus {
  if (input === "expired") return "expired";
  if (input === "canceled") return "canceled";
  return "active";
}

export function generateOrderCode15() {
  const epochSeconds = Math.floor(Date.now() / 1000);
  const randomPart = Math.floor(Math.random() * 100000);
  return epochSeconds * 100000 + randomPart;
}

export function getEffectiveSubscription(input: {
  plan?: unknown;
  status?: unknown;
  expiresAt?: string | null;
}) {
  const plan = normalizePlan(input.plan);
  const status = normalizeSubscriptionStatus(input.status);
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  const hasValidExpiry =
    !expiresAt || Number.isNaN(expiresAt.getTime()) ? true : expiresAt > new Date();

  return {
    plan,
    status,
    expiresAt: input.expiresAt ?? null,
    effectivePlan: status === "active" && hasValidExpiry ? plan : "free",
  };
}

function addMonthsUTC(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function addYearsUTC(date: Date, years: number) {
  const result = new Date(date);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  return result;
}

function parseOrderCode(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }

  if (typeof input === "string" && /^\d+$/.test(input.trim())) {
    const parsed = Number(input.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function pickOrderCode(input: any): number | null {
  return (
    parseOrderCode(input?.orderCode) ??
    parseOrderCode(input?.data?.orderCode) ??
    parseOrderCode(input?.paymentLinkId) ??
    null
  );
}

export function isPaidPayOSStatus(status: unknown) {
  const normalized = String(status || "").toUpperCase();
  return (
    normalized === "PAID" ||
    normalized === "SUCCESS" ||
    normalized === "COMPLETED"
  );
}

export function isCanceledPayOSStatus(status: unknown) {
  const normalized = String(status || "").toUpperCase();
  return (
    normalized === "CANCELED" ||
    normalized === "CANCELLED" ||
    normalized === "FAILED"
  );
}

export async function syncBillingOrder(orderCode: number) {
  const supabase = createAdminClient();
  const payOS = getPayOS();

  const { data: order, error: orderError } = await supabase
    .from("billing_orders")
    .select("order_code, user_id, plan, status, renewal_cycle")
    .eq("order_code", orderCode)
    .maybeSingle();

  if (orderError) {
    throw new Error(`READ_ORDER_FAILED:${orderError.message}`);
  }

  if (!order) {
    return { ok: false, reason: "ORDER_NOT_FOUND" } as const;
  }

  if (order.status === "paid") {
    return {
      ok: true,
      status: "paid",
      plan: normalizePlan(order.plan),
      cycle: normalizeCycle(order.renewal_cycle),
    } as const;
  }

  const paymentRequests: any = (payOS as any).paymentRequests;
  const paymentData =
    (await paymentRequests?.get?.(orderCode).catch(() => null)) ||
    (await paymentRequests?.getPaymentLinkInformation?.(orderCode).catch(
      () => null,
    )) ||
    (await paymentRequests?.getPaymentRequest?.(orderCode).catch(() => null));

  const payOSStatus = String(
    paymentData?.status ?? paymentData?.data?.status ?? "",
  );

  if (isPaidPayOSStatus(payOSStatus)) {
    const now = new Date();
    const requestedPlan = normalizePlan(order.plan);
    const requestedCycle = normalizeCycle(order.renewal_cycle);

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("plan, status, renewal_cycle, expires_at")
      .eq("user_id", order.user_id)
      .maybeSingle();

    if (subscriptionError) {
      throw new Error(`READ_SUBSCRIPTION_FAILED:${subscriptionError.message}`);
    }

    const effectiveSubscription = getEffectiveSubscription({
      plan: subscription?.plan,
      status: subscription?.status,
      expiresAt: subscription?.expires_at ?? null,
    });

    const currentCycle = normalizeCycle(subscription?.renewal_cycle);
    const currentExpiry = subscription?.expires_at
      ? new Date(subscription.expires_at)
      : null;
    const stillValid =
      effectiveSubscription.effectivePlan !== "free" &&
      !!currentExpiry &&
      currentExpiry > now;

    const isYearlyToMonthlyDowngrade =
      effectiveSubscription.effectivePlan === requestedPlan &&
      currentCycle === "yearly" &&
      requestedCycle === "monthly" &&
      stillValid;

    if (isYearlyToMonthlyDowngrade) {
      await supabase
        .from("billing_orders")
        .update({ status: "failed" })
        .eq("order_code", orderCode);

      return { ok: false, reason: "DOWNGRADE_NOT_ALLOWED" } as const;
    }

    const shouldCarryOver =
      stillValid && effectiveSubscription.effectivePlan === requestedPlan;
    const baseDate = shouldCarryOver && currentExpiry ? currentExpiry : now;
    const expiresAt =
      requestedCycle === "yearly"
        ? addYearsUTC(baseDate, 1)
        : addMonthsUTC(baseDate, 1);

    const { error: orderUpdateError } = await supabase
      .from("billing_orders")
      .update({
        status: "paid",
        paid_at: now.toISOString(),
      })
      .eq("order_code", orderCode);

    if (orderUpdateError) {
      throw new Error(`UPDATE_ORDER_FAILED:${orderUpdateError.message}`);
    }

    const { error: subscriptionUpdateError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: order.user_id,
          plan: requestedPlan,
          status: "active",
          renewal_cycle: requestedCycle,
          expires_at: expiresAt.toISOString(),
          last_payment_order_code: orderCode,
        },
        { onConflict: "user_id" },
      );

    if (subscriptionUpdateError) {
      throw new Error(
        `UPSERT_SUBSCRIPTION_FAILED:${subscriptionUpdateError.message}`,
      );
    }

    return {
      ok: true,
      status: "paid",
      plan: requestedPlan,
      cycle: requestedCycle,
      expiresAt: expiresAt.toISOString(),
    } as const;
  }

  if (isCanceledPayOSStatus(payOSStatus)) {
    await supabase
      .from("billing_orders")
      .update({ status: "canceled" })
      .eq("order_code", orderCode);

    return {
      ok: true,
      status: "canceled",
      plan: normalizePlan(order.plan),
      cycle: normalizeCycle(order.renewal_cycle),
    } as const;
  }

  return {
    ok: true,
    status: "pending",
    plan: normalizePlan(order.plan),
    cycle: normalizeCycle(order.renewal_cycle),
  } as const;
}
