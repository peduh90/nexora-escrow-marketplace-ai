/**
 * ─── NEXORA QR INFRASTRUCTURE ─────────────────────────────────────────────
 *
 * QR codes for PUBLIC entities only: storefronts, products, service providers,
 * freelance profiles. Codes resolve to ordinary https URLs, so they work
 * identically whether or not the recipient has Nexora installed. Never used
 * for private or sensitive data.
 *
 * Rendering is on-demand (a share sheet action / storefront card), so the
 * qrcode dependency is loaded lazily and never bloats first paint.
 */

import type QRCodeToDataUrl from "qrcode";

export type QrEntity =
  | { kind: "storefront"; sellerId: string }
  | { kind: "product"; listingId: string }
  | { kind: "service"; providerId: string }
  | { kind: "freelancer"; userId: string };

export function qrTargetUrl(entity: QrEntity): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  switch (entity.kind) {
    case "storefront": return `${base}/seller/${entity.sellerId}`;
    case "product": return `${base}/product/${entity.listingId}`;
    case "service": return `${base}/services/provider/${entity.providerId}`;
    case "freelancer": return `${base}/freelancer/${entity.userId}`;
  }
}

export interface QrOptions {
  /** Pixel size of the PNG data URL (default 512). */
  size?: number;
  /** Dark module colour — Nexora ink by default. */
  dark?: string;
  /** Light module colour — Nexora card by default. */
  light?: string;
}

let qrLib: any = null;
async function getQrLib(): Promise<any> {
  if (!qrLib) {
    qrLib = (await import("qrcode")).default;
  }
  return qrLib;
}

/** Generate a scannable branded QR as a PNG data URL. */
export async function generateQr(entity: QrEntity, opts: QrOptions = {}): Promise<string> {
  const QR = await getQrLib();
  return QR.toDataURL(qrTargetUrl(entity), {
    width: opts.size ?? 512,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: opts.dark ?? "#05050A",
      light: opts.light ?? "#FFFFFF",
    },
  });
}

/** Download the QR as a file (storefront "Download QR" action). */
export async function downloadQr(entity: QrEntity, filename: string, opts?: QrOptions) {
  const dataUrl = await generateQr(entity, opts);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
