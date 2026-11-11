import { redirect } from "next/navigation";
import { AppFrame } from "@/components/shell/AppFrame";
import { resolveAccess } from "@/lib/billing/access";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/login");
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) redirect("/login");
  const access = await resolveAccess(data.user.email, data.user.id);
  if (!access.allowed) redirect("/bloqueado");
  return (
    <AppFrame email={data.user.email} overdue={access.status === "overdue"}>
      {children}
    </AppFrame>
  );
}
