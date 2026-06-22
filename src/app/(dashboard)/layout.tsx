import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayoutClient from "./DashboardLayoutClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayoutClient
      userEmail={user.email}
      userName={user.user_metadata?.full_name}
    >
      {children}
    </DashboardLayoutClient>
  );
}
