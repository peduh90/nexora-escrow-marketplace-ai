// WhatsApp integration for Nexora Market
// Uses WhatsApp Click-to-Chat API and Meta Cloud API

export const WHATSAPP_CONFIG = {
  // Nexora Market support WhatsApp number (Kenya format without +)
  phoneNumber: "254769739216",
  displayNumber: "0706 116 043",
  // Meta API key for WhatsApp Cloud API
  metaApiKey: "LLM_1112645931218236_TXyJlKx_ujur5I4CiHCyK_AjwMc",
  businessName: "Nexora Market Support",
} as const;

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
 * Generate a WhatsApp URL to contact the seller about a specific product
 */
export function getWhatsAppSellerUrl(
  sellerPhone: string,
  productTitle: string,
  productPrice: number
): string {
  const message = `Hi! I'm interested in "${productTitle}" listed on Nexora Market for KES ${productPrice.toLocaleString()}. Is this still available?`;
  // Normalize seller phone: remove + and leading 0, add 254 prefix
  let phone = sellerPhone.replace(/[+\s-]/g, "");
  if (phone.startsWith("0")) {
    phone = "254" + phone.slice(1);
  }
  return getWhatsAppChatUrl(phone, message);
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
