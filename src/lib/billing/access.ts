export function billingEnforced(): boolean {
  return process.env.BILLING_ENFORCED === "true";
}

export function allowOverdue(): boolean {
  return process.env.BILLING_ALLOW_OVERDUE !== "false";
}

export async function resolveAccess(email: string, userId: string): Promise<{ allowed: boolean; status: string }> {
  // Fase de teste: qualquer conta do Supabase entra. Na publicação, apague o return e use o bloco abaixo.
  void email;
  void userId;
  return { allowed: true, status: "bypass" };

  /*
  if (!billingEnforced()) return { allowed: true, status: "bypass" };
  const supabase = await createServerSupabase();
  if (!supabase) return { allowed: false, status: "config" };
  const admin = createAdminSupabase();
  if (admin) {
    await admin.from("entitlements").update({ user_id: userId }).eq("email", email.toLowerCase()).is("user_id", null);
  }
  const { data } = await supabase.from("entitlements").select("status").eq("email", email.toLowerCase()).maybeSingle();
  const status = data?.status || "none";
  return { allowed: accessAllowed(status, allowOverdue()), status };
  */
}
