export type EntitlementStatus = "active" | "inactive" | "revoked" | "overdue";

export interface MappedHotmartEvent {
  email: string;
  status: EntitlementStatus;
  subscriberCode: string | null;
  productId: string | null;
  periodEnd: string | null;
  eventId: string;
}

export type MapResult = { ok: true; event: MappedHotmartEvent } | { ok: false; ignore?: boolean; error?: string };

interface HotmartBody {
  id?: string;
  event?: string;
  creation_date?: number;
  data?: {
    buyer?: { email?: string };
    subscriber?: { email?: string; code?: string };
    product?: { id?: number | string; ucode?: string };
    subscription?: {
      status?: string;
      subscriber_code?: string;
      date_next_charge?: string;
      subscriber?: { code?: string };
      product?: { id?: number | string };
    };
    plan?: { id?: number | string };
  };
}

function emailOf(body: HotmartBody): string {
  return (body.data?.buyer?.email || body.data?.subscriber?.email || "").trim().toLowerCase();
}

function productOf(body: HotmartBody): string | null {
  const id = body.data?.product?.id ?? body.data?.subscription?.product?.id ?? body.data?.plan?.id;
  return id == null ? null : String(id);
}

function subscriberOf(body: HotmartBody): string | null {
  return body.data?.subscriber?.code || body.data?.subscription?.subscriber?.code || body.data?.subscription?.subscriber_code || null;
}

function fromSubscriptionStatus(status: string | undefined): EntitlementStatus | null {
  if (!status) return null;
  const value = status.toUpperCase();
  if (value === "ACTIVE" || value === "STARTED") return "active";
  if (value === "OVERDUE") return "overdue";
  if (value === "INACTIVE" || value === "EXPIRED" || value.startsWith("CANCELED")) return "inactive";
  return null;
}

export function mapHotmartEvent(body: HotmartBody, expectedProductId?: string): MapResult {
  const eventName = body.event || "";
  const eventId = body.id || "";
  if (!eventId) return { ok: false, error: "Evento sem id." };
  const email = emailOf(body);
  if (!email) return { ok: false, error: "Evento sem e-mail do comprador." };
  const productId = productOf(body);
  if (expectedProductId && productId && productId !== expectedProductId) {
    return { ok: false, ignore: true };
  }

  let status: EntitlementStatus | null = null;
  if (eventName === "PURCHASE_APPROVED" || eventName === "PURCHASE_COMPLETE") status = "active";
  else if (eventName === "PURCHASE_REFUNDED" || eventName === "PURCHASE_CHARGEBACK") status = "revoked";
  else if (eventName === "SUBSCRIPTION_CANCELLATION") status = "inactive";
  else status = fromSubscriptionStatus(body.data?.subscription?.status);

  if (!status) return { ok: false, ignore: true };

  return {
    ok: true,
    event: {
      email,
      status,
      subscriberCode: subscriberOf(body),
      productId,
      periodEnd: body.data?.subscription?.date_next_charge || null,
      eventId,
    },
  };
}

export function hottokMatches(header: string | null, secret: string): boolean {
  if (!header || !secret || header.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < header.length; i++) diff |= header.charCodeAt(i) ^ secret.charCodeAt(i);
  return diff === 0;
}

export function accessAllowed(status: string | null | undefined, allowOverdue: boolean): boolean {
  if (status === "active") return true;
  if (status === "overdue" && allowOverdue) return true;
  return false;
}
