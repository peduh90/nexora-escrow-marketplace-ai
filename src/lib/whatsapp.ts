// WhatsApp integration for Nexora Market
// Uses WhatsApp Click-to-Chat API and Meta Cloud API

export const WHATSAPP_CONFIG = {
  // Nexora Market support WhatsApp number (Kenya format without +)
  phoneNumber: "254769739216",
  displayNumber: "0769 739 216",
  // Meta API key for WhatsApp Cloud API
  metaApiKey: "LLM_1112645931218236_TXyJlKx_ujur5I4CiHCyK_AjwMc",
  businessName: "Nexora Market Support",
} as const;

/**
 * Normalize a Kenyan phone number to the international format WhatsApp
 * click-to-chat expects (2547XXXXXXXX / 2541XXXXXXXX). Handles 07.., 01..,
 * +254.., 254.. and strips spaces/dashes. Returns null when the value
 * cannot be a valid Kenyan number.
 */
export function normalizeKenyanPhone(
  raw: string | undefined | null
): string | null {
  if (!raw) return null;
  let phone = String(raw).replace(/[^0-9+]/g, "").replace(/^\+/, "");
  if (phone.startsWith("0")) phone = "254" + phone.slice(1);
  if (!phone.startsWith("254")) phone = "254" + phone;
  // Valid Kenyan numbers are 254 followed by 9 digits
  if (!/^254[0-9]{9}$/.test(phone)) return null;
  return phone;
}

/**
 * Generate a WhatsApp Click-to-Chat URL
 * Opens WhatsApp with the number pre-filled and optional message
 */
export function getWhatsAppChatUrl(
  phoneNumber?: string,
  message?: string
): string {
  const number = phoneNumber || WHATSAPP_CONFIG.phoneNumber;
  const baseUrl = `https://wa.me/${number}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

/**
 * Generate a WhatsApp URL to contact the seller about a specific product.
 * Normalizes the seller's registered phone; falls back to platform support
 * when the seller has no usable number.
 */
export function getWhatsAppSellerUrl(
  sellerPhone: string,
  productTitle: string,
  productPrice: number
): string {
  const message = `Hi! I'm interested in "${productTitle}" listed on Nexora Market for KES ${productPrice.toLocaleString()}. Is this still available?`;
  const phone = normalizeKenyanPhone(sellerPhone);
  return getWhatsAppChatUrl(phone || undefined, message);
}

/**
 * Generate a WhatsApp URL to contact Nexora admin/support
 */
export function getWhatsAppSupportUrl(issue?: string): string {
  const message = issue
    ? `Hello Nexora Market Support 👋\n\n${issue}\n\nPlease assist me.`
    : `Hello Nexora Market Support 👋\n\nI need assistance with my account.`;
  return getWhatsAppChatUrl(WHATSAPP_CONFIG.phoneNumber, message);
}

/**
 * Open WhatsApp in a new tab
 */
export function openWhatsApp(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
