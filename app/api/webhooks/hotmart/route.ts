import { NextResponse } from "next/server";
import { hottokMatches, mapHotmartEvent } from "@/lib/billing/map-event";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!hottokMatches(request.headers.get("x-hotmart-hottok"), process.env.HOTMART_HOTTOK || "")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const mapped = mapHotmartEvent(body as Parameters<typeof mapHotmartEvent>[0], process.env.HOTMART_PRODUCT_ID || undefined);
  if (!mapped.ok) {
    if (mapped.ignore) return NextResponse.json({ ok: true, ignored: true });
    return NextResponse.json({ error: mapped.error || "invalid" }, { status: 400 });
  }
  const admin = createAdminSupabase();
  if (!admin) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const inserted = await admin.from("hotmart_events").insert({ id: mapped.event.eventId });
  if (inserted.error) {
    if (inserted.error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ error: "store" }, { status: 500 });
  }
  const { event } = mapped;
  const saved = await admin.from("entitlements").upsert(
    {
      email: event.email,
      status: event.status,
      hotmart_subscriber_code: event.subscriberCode,
      product_id: event.productId,
      current_period_end: event.periodEnd,
      hotmart_event_id: event.eventId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (saved.error) return NextResponse.json({ error: "store" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
