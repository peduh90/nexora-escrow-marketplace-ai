/**
 * ─── NEXORA MARKETPLACE HIERARCHY ─────────────────────────────────────────
 *
 * Five intuitive market sections a first-time Kenyan user instantly gets:
 *   Products            = things you buy
 *   Services            = people or businesses you hire
 *   Stays & Experiences = places/activities you book or experience
 *   Rentals             = things/places you rent
 *   Freelance           = digital work you hire or perform
 *
 * COMPATIBILITY CONTRACT (nothing breaks, nothing is lost):
 *  - `listings.category` keeps storing LEAF category slugs exactly as today
 *    (e.g. "mobile-phones", "services", "rentals"). No Convex migration is
 *    required and every existing listing remains visible.
 *  - Each leaf category belongs to exactly ONE primary section (owner map).
 *    The Marketplace UI browses by SECTION; selecting a section filters by the
 *    set of leaf slugs that belong to it (server-side, see searchListings).
 *  - Legacy/duplicate slugs ("animals-pets" → "pets", "school-education" →
 *    "learning-books", "jobs" → "services", "property" → "rentals") resolve
 *    through CATEGORY_ALIASES at read time, so old data keeps rendering.
 */

import type { Category } from "./categories";

export interface MarketSection {
  id: "products" | "services" | "stays" | "rentals" | "freelance";
  name: string;
  /** Short promise shown under the section name on cards. */
  tagline: string;
  /** Full sentence for the drill-down header. */
  description: string;
  /** Lucide icon name, resolved by the UI (keeps this lib UI-free). */
  icon: string;
  /** Premium hero image for the section card. */
  image: string;
  /** Accent token used for the card glow/border in the marketplace grid. */
  accent: "violet" | "cyan" | "emerald" | "amber" | "gold";
  /**
   * Primary in-section categories — rendered as cards in the drill-down.
   * Empty for Freelance (that market has its own dedicated panel).
   */
  categories: Category[];
  /** Optional helper route surfaced in the section drill-down (e.g. /services). */
  helperPath?: string;
  helperLabel?: string;
}

/* ─── Leaf category slugs owned by each section ─── */
export const SECTION_OF_CATEGORY: Record<string, MarketSection["id"]> = {
  // PRODUCTS — physical goods
  "mobile-phones": "products",
  "computers-laptops": "products",
  fashion: "products",
  "home-living": "products",
  "tvs-video": "products",
  "health-beauty": "products",
  agriculture: "products",
  "baby-kids": "products",
  gaming: "products",
  "sports-fitness": "products",
  "handmade-art": "products",
  "learning-books": "products",
  "business-industrial": "products",
  "music-entertainment": "products",
  "food-drinks": "products",
  pets: "products",
  // SERVICES — people/businesses you hire
  services: "services",
  // STAYS & EXPERIENCES — places & activities you book
  "stays-experiences": "stays",
  "events-tickets": "stays",
  // RENTALS — things/places you rent
  rentals: "rentals",
  // FREELANCE — digital & remote work
  writing: "freelance",
  design: "freelance",
  "video-photo": "freelance",
  marketing: "freelance",
  development: "freelance",
  "data-research": "freelance",
  "virtual-assistance": "freelance",
  education: "freelance",
  "business-professional": "freelance",
  "ai-accounts-tools": "freelance",
  "digital-products": "freelance",
  "other-services": "freelance",
};

/** Legacy / duplicate slugs → canonical leaf slug (read-time aliasing). */
export const CATEGORY_ALIASES: Record<string, string> = {
  "animals-pets": "pets", // merged: one Pets category
  "school-education": "learning-books", // merged into Learning & Books
  jobs: "services", // employment is not a product; hiring lives in Services/Freelance workflows
  "phones-tablets": "mobile-phones",
  electronics: "tvs-video",
  property: "rentals", // houses & apartments surface under Rentals
  "stays-experiences": "stays-experiences",
};

/** Resolve any stored category slug to its canonical leaf slug. */
export function canonicalCategory(slug: string | undefined | null): string {
  if (!slug) return "";
  return CATEGORY_ALIASES[slug] ?? slug;
}

/** Which section does a stored (possibly legacy) category slug belong to? */
export function sectionIdOfCategory(slug: string | undefined | null): MarketSection["id"] | undefined {
  return SECTION_OF_CATEGORY[canonicalCategory(slug)];
}

/* ─── The five sections ─── */

import { CATEGORIES } from "./categories";

const pexels = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900&h=560&dpr=1`;

/** Look up a leaf category from the master list (by any slug incl. aliases). */
function cat(slug: string): Category | undefined {
  const canonical = canonicalCategory(slug);
  return CATEGORIES.find((c) => c.slug === canonical);
}

/** Keep only categories that actually exist in the master list. */
function pick(slugs: string[]): Category[] {
  return slugs.map(cat).filter((c): c is Category => !!c);
}

export const MARKET_SECTIONS: MarketSection[] = [
  {
    id: "products",
    name: "Products",
    tagline: "Things you buy",
    description: "Physical goods delivered to your door — every order escrow-protected.",
    icon: "shopping-bag",
    image: pexels(1092671),
    accent: "violet",
    categories: pick([
      "mobile-phones", "computers-laptops", "fashion", "home-living", "tvs-video",
      "health-beauty", "agriculture", "baby-kids", "gaming", "sports-fitness",
      "handmade-art", "learning-books", "business-industrial", "music-entertainment",
      "food-drinks", "pets",
    ]),
  },
  {
    id: "services",
    name: "Services",
    tagline: "People you hire",
    description: "Verified local pros — plumbers, electricians, cleaners, fundis & more.",
    icon: "wrench",
    image: pexels(3184418),
    accent: "cyan",
    categories: pick(["services"]),
    helperPath: "/services",
    helperLabel: "Book a service provider near you →",
  },
  {
    id: "stays",
    name: "Stays & Experiences",
    tagline: "Places & activities you book",
    description: "Hotels, short stays, restaurants, tours, events and venues.",
    icon: "bed-double",
    image: pexels(258154),
    accent: "emerald",
    categories: pick(["stays-experiences", "events-tickets"]),
  },
  {
    id: "rentals",
    name: "Rentals",
    tagline: "Things you rent",
    description: "Cars, houses, tools, event equipment and spaces — hire instead of buy.",
    icon: "key-round",
    image: pexels(116675),
    accent: "amber",
    categories: pick(["rentals"]), // legacy "property" listings alias to "rentals"
  },
  {
    id: "freelance",
    name: "Freelance",
    tagline: "Digital work, done online",
    description: "Writers, designers, developers & AI taskers — escrow until delivery.",
    icon: "laptop",
    image: pexels(3861969),
    accent: "gold",
    categories: [],
  },
];

export function getSection(id: string | null | undefined): MarketSection | undefined {
  return MARKET_SECTIONS.find((s) => s.id === id);
}

/** All canonical leaf slugs that belong to a section (owner only). */
export function sectionCategorySlugs(id: MarketSection["id"]): string[] {
  const section = getSection(id);
  if (!section) return [];
  return section.categories.map((c) => c.slug);
}

/** True when a stored listing category should surface inside this section. */
export function categoryBelongsToSection(
  sectionId: MarketSection["id"],
  storedCategorySlug: string | undefined,
): boolean {
  const canonical = canonicalCategory(storedCategorySlug);
  return sectionCategorySlugs(sectionId).includes(canonical);
}
