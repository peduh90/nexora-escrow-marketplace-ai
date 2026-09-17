/**
 * ─── NEXORA SEO / SOCIAL METADATA ─────────────────────────────────────────
 *
 * Client-side per-page metadata for shareable public entities. Links pasted
 * into WhatsApp, Facebook, X and Slack render with real Nexora previews:
 * title, description, price and the listing image when available.
 *
 * Usage: useEffect(() => setMeta({...}), [listing]); and call resetMeta()
 * on unmount (or just set new values on the next page).
 */

export interface PageMeta {
  title: string;
  description: string;
  /** Canonical path (e.g. /product/abc123) — origin is added. */
  path?: string;
  /** Absolute or root-relative image URL. */
  image?: string;
  /** Optional price line folded into the og:description. */
  price?: string;
  type?: "website" | "product";
}

const ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "https://nexoramarketplace.freebuff.app";

function upsertMeta(attr: "property" | "name", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function setMeta(meta: PageMeta): void {
  const title = meta.title.slice(0, 120);
  const desc = [meta.price, meta.description]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 300);
  const url = meta.path ? `${ORIGIN}${meta.path}` : window.location.href;
  const image = meta.image
    ? meta.image.startsWith("http")
      ? meta.image
      : `${ORIGIN}${meta.image}`
    : `${ORIGIN}/og-image.png`;

  document.title = title;

  upsertMeta("name", "description", desc);
  upsertLink("canonical", url);

  // Open Graph (WhatsApp, Facebook, LinkedIn…)
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", desc);
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:image", image);
  upsertMeta("property", "og:type", meta.type === "product" ? "product" : "website");

  // Twitter/X
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", desc);
  upsertMeta("name", "twitter:image", image);
}

/** Restore site defaults when leaving a public entity page. */
export function resetMeta(): void {
  setMeta({
    title: "Nexora Market — AI-Powered Escrow Marketplace",
    description:
      "Buy, sell, hire and work securely. Every payment escrow-protected, every participant verified. Built for Kenya and East Africa.",
    path: "/marketplace",
  });
}

/** Build a product/listing meta from the listing record shape used app-wide. */
export function listingMeta(listing: {
  title: string;
  price: number;
  description?: string;
  images?: string[];
  sellerName?: string;
  county?: string;
  id: string;
  marketplace?: string;
}, kind: "product" | "service" | "freelance"): PageMeta {
  const path = kind === "freelance" ? `/freelance/service/${listing.id}` : `/product/${listing.id}`;
  const where = listing.county ? ` in ${listing.county}` : "";
  const who = listing.sellerName ? ` by ${listing.sellerName}` : "";
  return {
    title: `${listing.title} — Nexora Market`,
    description: `${listing.description?.slice(0, 140) || "Escrow-protected listing"}${where}${who}.`,
    price: `KES ${Number(listing.price).toLocaleString()}`,
    path,
    image: listing.images?.[0],
    type: "product",
  };
}
