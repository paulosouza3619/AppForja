import { ModuleScreen } from "@/components/modules/ModuleScreen";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function Page({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo } = await params;
  const supabase = await createServerSupabase();
  const email = supabase ? (await supabase.auth.getUser()).data.user?.email || "" : "";
  return <ModuleScreen module={modulo} email={email} />;
}
