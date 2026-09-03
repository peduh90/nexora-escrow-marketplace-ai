/**
 * Real Pexels images for all Nexora Market categories and subcategories.
 * Source: https://www.pexels.com — Free commercial-use images.
 */

const pexels = (id: number, w = 800, h = 600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&dpr=1`;

/** Hero/banner images for each top-level category */
export const CATEGORY_BANNERS: Record<string, string> = {
  "mobile-phones": pexels(1092671),
  "computers-laptops": pexels(18105),
  "fashion": pexels(1536619),
  "home-living": pexels(1648776),
  "services": pexels(3184418),
  "jobs": pexels(3184291),
  "agriculture": pexels(250615),
  "gaming": pexels(3165335),
  "health-beauty": pexels(3373716),
  "sports-fitness": pexels(2294361),
  "baby-kids": pexels(1648377),
  "handmade-art": pexels(1103970),
  "events-tickets": pexels(2263436),
  "business-industrial": pexels(1181298),
  "tvs-video": pexels(1229861),
  "pets": pexels(1108099),
  "learning-books": pexels(159711),
  "vehicles": pexels(116675),
  "property": pexels(106399),
  "phones-tablets": pexels(699122),
  "electronics": pexels(1714208),
  "property-rent": pexels(106399),
  "animals-pets": pexels(1108099),
  "music-entertainment": pexels(1190298),
  "school-education": pexels(5212700),
};

/** Subcategory images — keyed by subcategory slug */
export const SUBCATEGORY_IMAGES: Record<string, string> = {
  // Mobile Phones
  smartphones: pexels(1092671),
  "feature-phones": pexels(699122),
  "phone-accessories": pexels(4526412),
  "sim-cards-data": pexels(4042822),

  // Computers
  laptops: pexels(18105),
  desktops: pexels(1714208),
  monitors: pexels(1525041),
  printers: pexels(4792079),
  "computer-accessories": pexels(2582434),
  networking: pexels(325229),

  // Fashion
  "mens-clothing": pexels(934074),
  "womens-clothing": pexels(1536619),
  shoes: pexels(2529148),
  bags: pexels(1549208),
  watches: pexels(190539),
  jewelry: pexels(1152077),
  kids: pexels(1648377),

  // Home & Living
  "living-room": pexels(1648776),
  bedroom: pexels(1743518),
  "dining-room": pexels(1080696),
  "kitchen-appliances": pexels(4352247),
  lighting: pexels(1112080),
  decor: pexels(1090638),
  mattresses: pexels(5858742),

  // Services
  construction: pexels(544966),
  cleaning: pexels(5217967),
  photography: pexels(3184418),
  events: pexels(2263436),
  design: pexels(196644),
  marketing: pexels(3184292),
  transport: pexels(1302422),

  // Jobs
  "it-software": pexels(3861969),
  accounting: pexels(3760067),
  marketing_jobs: pexels(3184292),
  sales: pexels(3184291),
  "customer-service": pexels(3184465),
  education: pexels(5212700),

  // Agriculture
  tractors: pexels(250615),
  seeds: pexels(1470171),
  livestock: pexels(2255935),
  produce: pexels(1068554),
  irrigation: pexels(250615),

  // Gaming
  playstation: pexels(3165335),
  xbox: pexels(3165335),
  "pc-gaming": pexels(3165335),
  "game-accessories": pexels(442576),

  // Health & Beauty
  cosmetics: pexels(3373716),
  skincare: pexels(3373720),
  "hair-care": pexels(3993316),
  fragrances: pexels(965989),
  "personal-care": pexels(3373720),

  // Baby & Kids
  "baby-clothing": pexels(1648377),
  toys: pexels(1444442),
  strollers: pexels(325876),
  cribs: pexels(3807517),

  // Sports & Fitness
  "fitness-equipment": pexels(2294361),
  "team-sports": pexels(3621104),
  cycling: pexels(100582),
  running: pexels(2803158),

  // Pets
  dogs: pexels(1108099),
  cats: pexels(1741205),
  birds: pexels(1661179),

  // Handmade & Art
  paintings: pexels(1103970),
  sculptures: pexels(1103970),
  crafts: pexels(1462637),

  // Events & Tickets
  concerts: pexels(1190298),
  sports_events: pexels(2263436),

  // Business & Industrial
  generators: pexels(247763),
  solar: pexels(356036),
  "office-equipment": pexels(3184292),

  // TVs & Video
  televisions: pexels(1229861),
  projectors: pexels(2387793),
  soundbars: pexels(1553204),
  streaming: pexels(3165335),

  // Learning & Books
  textbooks: pexels(159711),
  stationery: pexels(5717411),
  uniforms: pexels(8941588),
  courses: pexels(5212700),

  // Vehicles
  cars: pexels(116675),
  motorcycles: pexels(210019),
  "spare-parts": pexels(3807517),
  trucks: pexels(210019),

  // Property
  "houses-for-sale": pexels(106399),
  "houses-for-rent": pexels(106399),
  apartments: pexels(2581922),
  land: pexels(1029599),
  offices: pexels(260931),
};

/** Default fallback images per top-level category */
export const CATEGORY_DEFAULTS: Record<string, string> = {
  "mobile-phones": pexels(1092671),
  "computers-laptops": pexels(18105),
  fashion: pexels(1536619),
  "home-living": pexels(1648776),
  services: pexels(3184418),
  jobs: pexels(3184291),
  agriculture: pexels(250615),
  gaming: pexels(3165335),
  "health-beauty": pexels(3373716),
  "sports-fitness": pexels(2294361),
  "baby-kids": pexels(1648377),
  "handmade-art": pexels(1103970),
  "events-tickets": pexels(2263436),
  "business-industrial": pexels(1181298),
  "tvs-video": pexels(1229861),
  pets: pexels(1108099),
  "learning-books": pexels(159711),
  "animals-pets": pexels(1108099),
  "music-entertainment": pexels(1190298),
  "school-education": pexels(5212700),
  vehicles: pexels(116675),
  property: pexels(106399),
  "phones-tablets": pexels(699122),
  electronics: pexels(1714208),
};

/**
 * Get the best image for a category/subcategory.
 * Priority: subcategory slug → category slug → fallback placeholder.
 */
export function getCategoryImage(categorySlug: string, subcategorySlug?: string): string {
  if (subcategorySlug && SUBCATEGORY_IMAGES[subcategorySlug]) {
    return SUBCATEGORY_IMAGES[subcategorySlug];
  }
  if (CATEGORY_DEFAULTS[categorySlug]) {
    return CATEGORY_DEFAULTS[categorySlug];
  }
  if (CATEGORY_BANNERS[categorySlug]) {
    return CATEGORY_BANNERS[categorySlug];
  }
  // Global fallback
  return pexels(1092671);
}

/** Product placeholder image by category */
export const PRODUCT_PLACEHOLDER: Record<string, string> = {
  "mobile-phones": pexels(699122, 400, 400),
  "computers-laptops": pexels(18105, 400, 400),
  fashion: pexels(934074, 400, 400),
  "home-living": pexels(1080696, 400, 400),
  services: pexels(3184418, 400, 400),
  jobs: pexels(3184291, 400, 400),
  agriculture: pexels(250615, 400, 400),
  gaming: pexels(3165335, 400, 400),
  "health-beauty": pexels(3373716, 400, 400),
  "sports-fitness": pexels(2294361, 400, 400),
  "baby-kids": pexels(1648377, 400, 400),
  "handmade-art": pexels(1103970, 400, 400),
  "events-tickets": pexels(2263436, 400, 400),
  "business-industrial": pexels(1181298, 400, 400),
  "tvs-video": pexels(1229861, 400, 400),
  pets: pexels(1108099, 400, 400),
  "learning-books": pexels(159711, 400, 400),
  vehicles: pexels(116675, 400, 400),
  property: pexels(106399, 400, 400),
  "phones-tablets": pexels(699122, 400, 400),
  electronics: pexels(1714208, 400, 400),
  "animals-pets": pexels(1108099, 400, 400),
  "music-entertainment": pexels(1190298, 400, 400),
  "school-education": pexels(5212700, 400, 400),
};
