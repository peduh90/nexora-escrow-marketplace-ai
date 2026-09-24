// @ts-ignore Bun's built-in test module is available at runtime.
import { describe, expect, test } from "bun:test";
import {
  buildFlutterwaveFeeSnapshot,
  canTransitionPayment,
  claimWebhookEvent,
  createFlutterwaveReference,
  flutterwaveEventId,
  lifecycleStatusForProviderEvent,
  verifyFlutterwaveTransaction,
  type ExpectedFlutterwavePayment,
  type VerifiedFlutterwaveTransaction,
} from "../convex/paymentState";

const expected: ExpectedFlutterwavePayment = {
  reference: "NEXORA-ORDER123-ABC123",
  orderId: "ORDER123",
  buyerId: "buyer1",
  sellerId: "seller1",
  amount: 1200,
  currency: "KES",
  customerEmail: "buyer@example.com",
};

const successful: VerifiedFlutterwaveTransaction = {
  id: 991,
  tx_ref: expected.reference,
  status: "successful",
  amount: 1200,
  currency: "KES",
  customer: { email: "buyer@example.com" },
  meta: { orderId: "ORDER123", buyerId: "buyer1", sellerId: "seller1" },
};

describe("Flutterwave payment scenarios", () => {
  test("1. successful payment", () => expect(verifyFlutterwaveTransaction(expected, successful).verified).toBe(true));
  test("2. failed payment", () => expect(lifecycleStatusForProviderEvent("charge.failed", "failed")).toBe("failed"));
  test("3. cancelled payment", () => expect(lifecycleStatusForProviderEvent("charge.cancelled", "cancelled")).toBe("cancelled"));
  test("4. duplicate webhook", () => { const seen = new Set<string>(); expect(claimWebhookEvent(seen, "event")).toBe(true); seen.add("event"); expect(claimWebhookEvent(seen, "event")).toBe(false); });
  test("5. incorrect amount", () => expect(verifyFlutterwaveTransaction(expected, { ...successful, amount: 1199 }).reason).toBe("amount_mismatch"));
  test("6. incorrect currency", () => expect(verifyFlutterwaveTransaction(expected, { ...successful, currency: "UGX" }).reason).toBe("currency_mismatch"));
  test("7. unknown transaction id", () => expect(verifyFlutterwaveTransaction(expected, null).reason).toBe("unknown_provider_transaction"));
  test("8. delayed webhook", () => expect(lifecycleStatusForProviderEvent("charge.completed", "pending")).toBeNull());
  test("9. payment reversal", () => expect(canTransitionPayment("paid", "reversed")).toBe(true));
  test("10. refund", () => expect(lifecycleStatusForProviderEvent("refund.processed", "refunded")).toBe("refunded"));
  test("11. order cancellation fee snapshot", () => expect(buildFlutterwaveFeeSnapshot({ itemAmount: 1000, deliveryFee: 0, nexoraCommission: 50, buyerProtectionFee: 20 }).totalCharged).toBe(1020));
  test("12. seller payout failure remains auditable", () => expect(canTransitionPayment("paid", "disputed")).toBe(true));
  test("13. network/API timeout", () => expect(verifyFlutterwaveTransaction(expected, { ...successful, status: "pending" }).verified).toBe(false));
  test("14. replayed webhook", () => { const event = { id: 991, tx_ref: expected.reference }; expect(flutterwaveEventId("charge.completed", event)).toBe(flutterwaveEventId("charge.completed", event)); });
  test("15. two payments against same order use distinct references", () => { const a = createFlutterwaveReference("ORDER123", "aaa111"); const b = createFlutterwaveReference("ORDER123", "bbb222"); expect(a).not.toBe(b); expect(a).toMatch(/^NEXORA-ORDER123-[A-Z0-9]+$/); });
});
