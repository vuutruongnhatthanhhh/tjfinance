import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getEffectiveSubscription,
  normalizeCycle,
  normalizePlan,
} from "@/lib/billing";
import UpgradePageClient from "./UpgradePageClient";

export default async function UpgradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, renewal_cycle, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentSubscription = getEffectiveSubscription({
    plan: subscription?.plan,
    status: subscription?.status,
    expiresAt: subscription?.expires_at ?? null,
  });

  return (
    <UpgradePageClient
      currentPlan={currentSubscription.effectivePlan}
      currentCycle={normalizeCycle(subscription?.renewal_cycle)}
      expiresAt={subscription?.expires_at ?? null}
      rawPlan={normalizePlan(subscription?.plan)}
    />
  );
}
