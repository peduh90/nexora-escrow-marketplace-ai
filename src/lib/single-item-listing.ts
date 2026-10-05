/**
 * ─── ONE LISTING = ONE ITEM (Part 9) ──────────────────────────────────────
 *
 * A single seller submission creates exactly ONE product record. The photos
 * attached to that record are all photos of THAT SAME item:
 *
 *   ALLOWED   "HP EliteBook 840 G5" + 5 photos of that laptop  → 1 record
 *   FORBIDDEN one submission containing laptop + phone + TV + sofa → 5 records
 *
 * The seller wizard already submits one mutation per submission, so the record
 * count is structurally 1:1. This module adds the guard the audit demands:
 * the SAME validator runs in the frontend form (before the round-trip) and in
 * the backend `createListing` mutation (authoritative), so hiding the UI is
 * never the only defence.
 */

/** Photos of the single item. More than this is not one item's photo set. */
export const MAX_LISTING_PHOTOS = 8;

/**
 * Explicit "I am listing several products here" markers. We deliberately look
 * for enumeration only — a legitimate single-product description that happens
 * to mention two accessories is not rejected.
 */
const ENUMERATION_PATTERNS: Array<{ re: RegExp; hint: string }> = [
  {
    re: /\b(?:product|item|items|lot|listing|option)\s*#?\s*[1-9]\b/i,
    hint: "it is numbered like a multi-product list",
  },
  {
    re: /\b(?:products?|items?)\s*[:\-]\s*(?:one|two|three|four|five|1|2|3|4|5)\b/i,
    hint: "it announces several products",
  },
  {
    re: /\b(?:bundle|pack)\s+of\s+[2-9]\b/i,
    hint: "it bundles several different items",
  },
  {
    re: /\b(?:contains|includes|consists\s+of)\s+(?:the\s+)?following\s+(?:items|products)\b/i,
    hint: "it lists several items",
  },
];

/** A numbered list of 2+ lines is a multi-item catalogue, not one product. */
function looksLikeNumberedCatalogue(text: string): boolean {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const numbered = lines.filter((l) => /^[1-9][.)]\s+\S/.test(l));
  return numbered.length >= 2;
}

export interface SingleItemInput {
  title: string;
  description: string;
  images?: string[];
}

/**
 * Returns an error message when the payload looks like several products in one
 * submission, or null when it is a valid single-item listing.
 */
export function findMultiItemListing(input: SingleItemInput): string | null {
  const title = (input.title ?? "").trim();
  const description = (input.description ?? "").trim();

  const images = input.images ?? [];
  if (images.length > MAX_LISTING_PHOTOS) {
    return `A single listing holds up to ${MAX_LISTING_PHOTOS} photos of the same item. Upload fewer photos or create another listing.`;
  }

  // Enumeration markers are checked in BOTH fields: a multi-product submission
  // shows up as "Product 1 - iPhone…" in the title, or as "bundle of 5" /
  // "contains the following items" in the description. A model number such as
  // "iPhone 15" or "A54 5G" is not an enumeration and is never rejected.
  for (const { re, hint } of ENUMERATION_PATTERNS) {
    if (re.test(title)) {
      return `Each listing must be a single product — the title ${hint}. Create one listing per product.`;
    }
    if (re.test(description)) {
      return `Each listing must be a single product — the description ${hint}. Create one listing per product.`;
    }
  }
  if (looksLikeNumberedCatalogue(title)) {
    return "Each listing must be a single product — the title is a numbered list. Create one listing per product.";
  }
  if (looksLikeNumberedCatalogue(description)) {
    return "Each listing must describe one product — the description reads as a numbered catalogue. Create one listing per product.";
  }
  return null;
}

/** True when the payload is a valid single-item listing. */
export function isSingleItemListing(input: SingleItemInput): boolean {
  return findMultiItemListing(input) === null;
}