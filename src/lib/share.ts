// ─── Shareable listings (#150) & WhatsApp-first bridge (#53) ─────────────────
//
// Every listing should be one tap away from WhatsApp — where Kenyan commerce
// already lives. The seller's click-to-chat deep link keeps leads flowing to
// merchants without anyone needing to understand the whole platform first.
// No private WhatsApp data is ever scraped; wa.me deep links only.

import { WHATSAPP_CONFIG } from "./whatsapp";

export interface SharePayload {
  title: string;
  price: number;
  /** Business/provider display name. */
  sellerName?: string;
  listingId: string;
  /** "product" (default), "freelance", "service", "transport". */
  kind?: string;
  location?: string;
}

/** Public URL for a listing (share target). */
export function listingUrl(payload: SharePayload): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://nexora.market";
  const path =
    payload.kind === "freelance"
      ? `/freelance/service/${payload.listingId}`
      : `/product/${payload.listingId}`;
  return `${base}${path}`;
}

/** Human-readable share text — leads with the offer, ends with trust. */
export function shareText(payload: SharePayload): string {
  const loc = payload.location ? ` · ${payload.location}` : "";
  return [
    `${payload.title} — KES ${payload.price.toLocaleString()}${loc}`,
    payload.sellerName ? `by ${payload.sellerName} on Nexora Market` : "on Nexora Market",
    "",
    `Buy safely with escrow protection: ${listingUrl(payload)}`,
  ].join("\n");
}

/** WhatsApp deep link that pre-fills the offer to any chat (seller or customer). */
export function shareToWhatsApp(payload: SharePayload, toNumber?: string): string {
  const number = toNumber ? normalizeForWa(toNumber) : WHATSAPP_CONFIG.phoneNumber;
  const text = encodeURIComponent(shareText(payload));
  return `https://wa.me/${number}?text=${text}`;
}

function normalizeForWa(raw: string): string {
  let phone = String(raw).replace(/[^0-9]/g, "");
  if (phone.startsWith("0")) phone = "254" + phone.slice(1);
  if (!phone.startsWith("254")) phone = "254" + phone;
  return phone;
}

/** SMS body (no protocol needed — the compose sheet handles the rest). */
export function smsBody(payload: SharePayload): string {
  return `${payload.title} — KES ${payload.price.toLocaleString()} on Nexora (escrow protected). ${listingUrl(payload)}`;
}

/**
 * Native share sheet where available (Android Chrome, iOS Safari); falls back
 * to clipboard copy. Returns "shared" | "copied" | "failed".
 */
export async function shareListing(payload: SharePayload): Promise<"shared" | "copied" | "failed"> {
  const text = shareText(payload);
  const url = listingUrl(payload);
  try {
    const nav = navigator as any;
    if (nav?.share) {
      await nav.share({ title: `${payload.title} — Nexora Market`, text, url });
      return "shared";
    }
  } catch (err: any) {
    if (err?.name === "AbortError") return "failed";
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}

/** Simple WhatsApp click-to-chat for service providers (Chat on WhatsApp). */
export function providerWhatsAppUrl(phone: string | undefined, context: string): string {
  const number = phone ? normalizeForWa(phone) : WHATSAPP_CONFIG.phoneNumber;
  const text = encodeURIComponent(context);
  return `https://wa.me/${number}?text=${text}`;
}
