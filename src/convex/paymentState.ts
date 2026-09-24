export type PaymentLifecycleStatus =
  | "initiated"
  | "awaiting_confirmation"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired"
  | "reversed"
  | "disputed"
  | "refunded"
  | "partially_refunded";

export interface ExpectedFlutterwavePayment {
  reference: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerId?: string;
}

export interface VerifiedFlutterwaveTransaction {
  id: number | string;
  tx_ref: string;
  status: string;
  amount: number;
  currency: string;
  customer?: { id?: number | string; email?: string };
  meta?: Record<string, unknown>;
}

export interface FeeSnapshot {
  itemAmount: number;
  deliveryFee: number;
  nexoraCommission: number;
  buyerProtectionFee: number;
  providerFee: number;
  totalCharged: number;
  sellerNet: number;
}

/** Creates the required stable provider reference without exposing user data. */
export function createFlutterwaveReference(orderId: string, uniqueSuffix: string): string {
  const cleanOrder = orderId.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24);
  const cleanSuffix = uniqueSuffix.replace(/[^A-Za-z0-9]/g, "").slice(0, 12).toUpperCase();
  return `NEXORA-${cleanOrder}-${cleanSuffix || "PAY"}`;
}

export function buildFlutterwaveFeeSnapshot(input: {
  itemAmount: number;
  deliveryFee: number;
  nexoraCommission: number;
  buyerProtectionFee: number;
  providerFee?: number;
}): FeeSnapshot {
  return Object.freeze({
    itemAmount: input.itemAmount,
    deliveryFee: input.deliveryFee,
    nexoraCommission: input.nexoraCommission,
    buyerProtectionFee: input.buyerProtectionFee,
    providerFee: input.providerFee || 0,
    totalCharged:
      input.itemAmount +
      input.deliveryFee +
      input.buyerProtectionFee +
      (input.providerFee || 0),
    sellerNet: input.itemAmount - input.nexoraCommission,
  });
}

function sameText(a: unknown, b: unknown): boolean {
  return typeof a === "string" && typeof b === "string" && a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Verifies the provider response against immutable Nexora order data.
 * A redirect or webhook assertion alone can never pass this gate.
 */
export function verifyFlutterwaveTransaction(
  expected: ExpectedFlutterwavePayment,
  actual: VerifiedFlutterwaveTransaction | null | undefined,
): { verified: boolean; reason?: string } {
  if (!actual || actual.id === undefined || actual.id === null || String(actual.id).trim() === "") {
    return { verified: false, reason: "unknown_provider_transaction" };
  }
  if (!sameText(actual.tx_ref, expected.reference)) {
    return { verified: false, reason: "reference_mismatch" };
  }
  if (!sameText(actual.status, "successful")) {
    return { verified: false, reason: `provider_status_${actual.status || "unknown"}` };
  }
  if (Number(actual.amount) !== Number(expected.amount)) {
    return { verified: false, reason: "amount_mismatch" };
  }
  if (!sameText(actual.currency, expected.currency)) {
    return { verified: false, reason: "currency_mismatch" };
  }
  if (!sameText(actual.meta?.orderId, expected.orderId)) {
    return { verified: false, reason: "order_mismatch" };
  }
  if (!sameText(actual.meta?.buyerId, expected.buyerId) || !sameText(actual.meta?.sellerId, expected.sellerId)) {
    return { verified: false, reason: "party_mismatch" };
  }
  if (expected.customerId && actual.customer?.id !== undefined && String(actual.customer.id) !== String(expected.customerId)) {
    return { verified: false, reason: "customer_mismatch" };
  }
  if (expected.customerEmail && actual.customer?.email && !sameText(actual.customer.email, expected.customerEmail)) {
    return { verified: false, reason: "customer_mismatch" };
  }
  return { verified: true };
}

export function flutterwaveEventId(event: string, transaction: { id?: number | string; tx_ref?: string }): string {
  return `${event || "unknown"}:${transaction.id ?? "none"}:${transaction.tx_ref ?? "none"}`;
}

/** Returns true only the first time an event key is observed. */
export function claimWebhookEvent(seen: ReadonlySet<string>, eventId: string): boolean {
  return !seen.has(eventId);
}

export function lifecycleStatusForProviderEvent(event: string, providerStatus: string): PaymentLifecycleStatus | null {
  const state = providerStatus.toLowerCase();
  if (["successful", "completed", "success"].includes(state)) return "paid";
  if (["failed", "failure"].includes(state)) return "failed";
  if (["cancelled", "canceled"].includes(state)) return "cancelled";
  if (["expired", "timeout"].includes(state)) return "expired";
  if (["reversed", "reversal"].includes(state)) return "reversed";
  if (["refunded", "refund_completed"].includes(state)) return "refunded";
  if (["disputed", "dispute_opened"].includes(state)) return "disputed";
  return null;
}

/** Positive provider events never overwrite adverse terminal state. */
export function canTransitionPayment(from: PaymentLifecycleStatus, to: PaymentLifecycleStatus): boolean {
  if (from === to) return false;
  if (["reversed", "disputed", "refunded"].includes(from)) return false;
  if (to === "paid" && ["failed", "cancelled", "expired"].includes(from)) return false;
  return true;
}
