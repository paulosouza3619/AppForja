import { ProfileView } from "@/components/shell/CycleViews";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createServerSupabase();
  const email = supabase ? (await supabase.auth.getUser()).data.user?.email || "" : "";
  return <ProfileView email={email} />;
}
