import { CATEGORIES } from "@/lib/categories";
import { FREELANCE_CATEGORIES } from "@/lib/freelance-marketplace";
import { SERVICE_CATEGORIES } from "@/lib/service-taxonomy";

/**
 * ─── NEXORA MOBILE NAVIGATION ARCHITECTURE ────────────────────────────────
 *
 * One navigation system, role-aware destinations. The phone experience is a
 * distinct interaction model: contextual header + fixed bottom tabs +
 * full-screen discovery panels. Desktop keeps its spacious NavigationBar.
 *
 * Everything here is derived from the EXISTING routes and taxonomies — no
 * functionality is removed, only reorganised for thumb reach.
 */

/* ─── REAL CATEGORY ICONS ───────────────────────────────────────────────────
   Every category renders a proper lucide icon (no emoji). Keys are slugs. */
export const CATEGORY_ICONS: Record<string, string> = {
  // Products
  "mobile-phones": "smartphone", "computers-laptops": "laptop", "fashion": "shirt",
  "home-living": "sofa", "services": "wrench", "jobs": "briefcase",
  "agriculture": "wheat", "gaming": "gamepad-2", "health-beauty": "heart-pulse",
  "sports-fitness": "dumbbell", "baby-kids": "baby", "handmade-art": "palette",
  "events-tickets": "ticket", "business-industrial": "factory", "tvs-video": "tv",
  "pets": "paw-print", "animals-pets": "paw-print", "learning-books": "book-open",
  "food-drinks": "utensils",
  "music-entertainment": "music", "school-education": "graduation-cap",
  // Services
  "boda": "bike", "matatu": "bus", "delivery": "package", "plumbers": "droplets",
  "electricians": "zap", "auto": "wrench", "cleaning": "sparkles", "laundry": "shirt",
  "beauty": "scissors", "makeup": "sparkles", "home": "home", "fundis": "hammer",
  "tech-repair": "smartphone", "cyber": "printer", "courier": "truck",
  "carhire": "car-front", "events": "party-popper", "photography": "camera",
  "appliance": "plug", "garden": "leaf",
  // Freelance
  "writing": "pen-line", "design": "palette", "video-photo": "camera",
  "marketing": "megaphone", "development": "code", "data-research": "bar-chart-3",
  "virtual-assistance": "headphones", "education": "graduation-cap",
  "business-professional": "briefcase", "ai-accounts-tools": "bot",
  "digital-products": "download", "other-services": "circle-dashed",
};

/** Fallback icon when a slug has no mapping. */
export function categoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] ?? "layout-grid";
}

/** The most-used categories per market, surfaced first in Explore.
 *  Everything else remains reachable via the market header + "All …"
 *  toggle — nothing is lost, the rest is simply tucked away. */
export const TOP_CATEGORIES: Record<"products" | "services" | "freelance", string[]> = {
  products: ["mobile-phones", "computers-laptops", "fashion", "home-living", "food-drinks"],
  services: ["boda", "plumbers", "electricians", "cleaning", "beauty"],
  freelance: ["writing", "design", "development", "video-photo", "ai-accounts-tools"],
};

export type NxRole =
  | "admin"
  | "buyer"
  | "seller"
  | "driver"
  | "freelancer"
  | "employer"
  | "creator";

/** Signed-in home for each role (matches RoleRouter.getDashboardPath). */
export function roleHome(role?: string | null): string {
  switch (role) {
    case "admin": return "/admin";
    case "seller": return "/seller";
    case "buyer": return "/buyer";
    case "freelancer": return "/freelance/dashboard";
    case "employer": return "/employer";
    case "creator": return "/creator";
    case "service_provider": return "/services/dashboard";
    case "driver": return "/transport/dashboard";
    default: return "/auth";
  }
}

/** Where "Orders / Work" opens for this role. */
export function roleOrdersPath(role?: string | null): string {
  switch (role) {
    case "seller": return "/seller/orders";
    case "freelancer": return "/freelance/projects";
    case "employer": return "/employer/projects";
    case "service_provider":
    case "driver": return "/services/bookings";
    default: return "/buyer/orders";
  }
}

/** Label for the middle tab depends on what the role does. */
export function roleWorkLabel(role?: string | null): string {
  switch (role) {
    case "seller": return "Orders";
    case "freelancer": return "Work";
    case "employer": return "Jobs";
    case "service_provider":
    case "driver": return "Bookings";
    default: return "Orders";
  }
}

/** Contextual actions surfaced in Account for this role. */
export interface AccountLink {
  label: string;
  path: string;
  icon: string; // lucide icon name, resolved in the component
  desc?: string;
}

export function accountSections(role?: string | null): Array<{
  title: string;
  links: AccountLink[];
}> {
  if (!role) {
    return [
      {
        title: "Get started",
        links: [
          { label: "Sign in or create account", path: "/auth", icon: "log-in", desc: "Buy, sell, hire & work safely" },
          { label: "Creator Program", path: "/join", icon: "sparkles", desc: "Earn by sharing what you love" },
        ],
      },
    ];
  }

  const common: Array<{ title: string; links: AccountLink[] }> = [
    {
      title: "My activity",
      links: [
        // Role dashboard first — the control centre for this account type.
        { label: dashboardLabel(role), path: roleHome(role), icon: "layout-dashboard", desc: dashboardDesc(role) },
        { label: roleOrdersLabel(role), path: roleOrdersPath(role), icon: "package" },
        { label: "Messages", path: messagesPath(role), icon: "message-square" },
        { label: "Wallet & money", path: walletPath(role), icon: "wallet" },
        { label: "Notifications", path: notificationsPath(role), icon: "bell" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Profile", path: "/buyer/profile", icon: "user" },
        { label: "Settings", path: settingsPath(role), icon: "settings" },
        { label: "Help & support", path: helpPath(role), icon: "life-buoy", desc: "WhatsApp +254 706 116 043" },
      ],
    },
  ];

  const roleBlocks: Record<string, Array<{ title: string; links: AccountLink[] }>> = {
    buyer: [
      {
        title: "Buying",
        links: [
          { label: "My deliveries", path: "/buyer/deliveries", icon: "truck" },
          { label: "Disputes & refunds", path: "/buyer/disputes", icon: "shield" },
          { label: "Saved & browsing", path: "/marketplace", icon: "search" },
        ],
      },
    ],
    seller: [
      {
        title: "Selling",
        links: [
          { label: "My products", path: "/seller/products", icon: "package" },
          { label: "Add product", path: "/seller/add-product", icon: "plus-circle" },
          { label: "Withdrawals", path: "/seller/withdrawals", icon: "banknote" },
          { label: "Storefront", path: "/seller/store", icon: "store" },
          { label: "Verification (KYC)", path: "/seller/kyc", icon: "badge-check" },
          { label: "Analytics", path: "/seller/analytics", icon: "bar-chart-3" },
          { label: "Promotions", path: "/seller/promotions", icon: "megaphone" },
          { label: "Reviews", path: "/seller/reviews", icon: "star" },
          { label: "Escrow", path: "/seller/escrow", icon: "shield" },
          { label: "Customers", path: "/seller/customers", icon: "users" },
          { label: "Offers", path: "/seller/offers", icon: "tag" },
          { label: "Delivery", path: "/seller/delivery", icon: "truck" },
          { label: "Earnings", path: "/seller/earnings", icon: "trending-up" },
        ],
      },
    ],
    freelancer: [
      {
        title: "Freelancing",
        links: [
          { label: "Find work", path: "/freelance/find-work", icon: "search" },
          { label: "My projects", path: "/freelance/projects", icon: "briefcase" },
          { label: "Applications", path: "/freelance/applications", icon: "file-text" },
          { label: "Publish a service", path: "/freelance/publish", icon: "plus-circle" },
          { label: "My services", path: "/freelance/services", icon: "package" },
          { label: "Earnings", path: "/freelance/earnings", icon: "trending-up" },
          { label: "Profile settings", path: "/freelance/settings", icon: "user" },
        ],
      },
    ],
    employer: [
      {
        title: "Hiring",
        links: [
          { label: "Post a job", path: "/employer/post-job", icon: "plus-circle" },
          { label: "My jobs", path: "/employer/jobs", icon: "briefcase" },
          { label: "Active work", path: "/employer/projects", icon: "package" },
          { label: "Find freelancers", path: "/freelance/find-freelancers", icon: "users" },
          { label: "Earnings & spend", path: "/employer/earnings", icon: "trending-up" },
        ],
      },
    ],
    creator: [
      {
        title: "Creator",
        links: [
          { label: "Referral tools", path: "/creator", icon: "share-2" },
          { label: "Agreement", path: "/creator/agreement", icon: "file-text" },
        ],
      },
      {
        title: "Buying",
        links: [
          { label: "Browse marketplace", path: "/marketplace", icon: "search" },
          { label: "My orders", path: "/buyer/orders", icon: "package" },
        ],
      },
    ],
    service_provider: [
      {
        title: "My service",
        links: [
          { label: "Service dashboard", path: "/services/dashboard", icon: "wrench", desc: "Profile, prices & availability" },
          { label: "My bookings", path: "/services/bookings", icon: "package" },
          { label: "Register transport", path: "/transport/register", icon: "truck", desc: "Also drive or deliver" },
        ],
      },
    ],
    driver: [
      {
        title: "Transport",
        links: [
          { label: "Driver dashboard", path: "/transport/dashboard", icon: "truck" },
          { label: "My bookings", path: "/services/bookings", icon: "package" },
        ],
      },
    ],
    admin: [
      {
        title: "Administration",
        links: [
          { label: "All users & sellers", path: "/admin/users", icon: "users" },
        ],
      },
    ],
  };

  return [...(roleBlocks[role] ?? []), ...common];
}

/** Label for the role's dashboard link in Account. */
export function dashboardLabel(role?: string | null): string {
  switch (role) {
    case "seller": return "Seller Dashboard";
    case "freelancer": return "Freelancer Dashboard";
    case "employer": return "Employer Dashboard";
    case "creator": return "Creator Dashboard";
    case "service_provider": return "Service Dashboard";
    case "driver": return "Driver Dashboard";
    case "admin": return "Admin Panel";
    default: return "My Dashboard";
  }
}

function dashboardDesc(role?: string | null): string | undefined {
  switch (role) {
    case "seller": return "Sales, products & store controls";
    case "freelancer": return "Projects, applications & services";
    case "employer": return "Jobs, applicants & spending";
    case "creator": return "Referrals, earnings & tools";
    case "service_provider": return "Your service, bookings & availability";
    case "driver": return "Bookings & trips";
    case "admin": return "Full platform control";
    default: return "Your overview & quick actions";
  }
}

export function roleOrdersLabel(role?: string | null): string {
  switch (role) {
    case "seller": return "Orders received";
    case "freelancer": return "My projects";
    case "employer": return "Active work";
    case "service_provider":
    case "driver": return "My bookings";
    default: return "My orders";
  }
}

export function messagesPath(role?: string | null): string {
  switch (role) {
    case "seller": return "/seller/messages";
    case "freelancer": return "/freelance/messages";
    case "employer": return "/employer/messages";
    // Local service providers and drivers use the shared chat inbox — their
    // panels have no dedicated messages screen yet.
    case "service_provider": return "/chat";
    case "driver": return "/chat";
    default: return "/chat";
  }
}

export function walletPath(role?: string | null): string {
  switch (role) {
    case "seller": return "/seller/withdrawals";
    case "freelancer": return "/freelance/earnings";
    case "employer": return "/employer/earnings";
    case "creator": return "/creator";
    default: return "/buyer/wallet";
  }
}

export function notificationsPath(role?: string | null): string {
  switch (role) {
    case "seller": return "/seller/notifications";
    case "freelancer": return "/freelance/notifications";
    case "employer": return "/employer/notifications";
    default: return "/buyer/notifications";
  }
}

export function settingsPath(role?: string | null): string {
  switch (role) {
    case "seller": return "/seller/settings";
    case "freelancer": return "/freelance/settings";
    // All other roles (incl. service providers & drivers) manage their
    // account in the shared account settings screen.
    default: return "/buyer/settings";
  }
}

export function helpPath(role?: string | null): string {
  switch (role) {
    case "seller": return "/seller/help";
    default: return "/chat";
  }
}

/* ─── EXPLORE: the three marketplaces ──────────────────────────────────────
   Derived from the real taxonomies the app already uses. */

export interface ExploreMarket {
  id: "products" | "services" | "freelance";
  name: string;
  tagline: string;
  desc: string;
  accent: "violet" | "cyan" | "gold";
  basePath: string;
  categories: Array<{ name: string; slug: string; emoji?: string }>;
}

/** Service taxonomy lives in Convex; mirror the canonical slugs locally for
 * instant rendering (values match SERVICE_CATEGORIES in src/convex/services.ts). */
const SERVICE_TAXONOMY: Array<{ slug: string; name: string; emoji: string }> = [
  { slug: "boda", name: "Boda Boda & Rides", emoji: "🏍️" },
  { slug: "matatu", name: "Matatu & Transport", emoji: "🚐" },
  { slug: "delivery", name: "Moving & Delivery", emoji: "📦" },
  { slug: "plumbers", name: "Plumbers", emoji: "🚰" },
  { slug: "electricians", name: "Electricians", emoji: "⚡" },
  { slug: "auto", name: "Mechanics & Car Repair", emoji: "🔧" },
  { slug: "cleaning", name: "Cleaning Services", emoji: "🧹" },
  { slug: "laundry", name: "Laundry & Ironing", emoji: "👕" },
  { slug: "beauty", name: "Salon & Barber", emoji: "💈" },
  { slug: "makeup", name: "Beauty & Makeup", emoji: "💅" },
  { slug: "home", name: "Home Repairs", emoji: "🏠" },
  { slug: "fundis", name: "Construction & Fundis", emoji: "🧱" },
  { slug: "tech-repair", name: "Phone & Computer Repair", emoji: "📱" },
  { slug: "cyber", name: "Printing & Cyber", emoji: "🖨️" },
  { slug: "courier", name: "Courier & Parcels", emoji: "🚚" },
  { slug: "carhire", name: "Car & Truck Hire", emoji: "🚗" },
  { slug: "events", name: "Events & Equipment Hire", emoji: "🎉" },
  { slug: "photography", name: "Photography & Video", emoji: "📸" },
  { slug: "appliance", name: "Appliance Repair", emoji: "🔌" },
  { slug: "garden", name: "Gardening & Landscaping", emoji: "🌿" },
];

export const EXPLORE_MARKETS: ExploreMarket[] = [
  {
    id: "products",
    name: "Products",
    tagline: "Things you buy",
    desc: "Physical goods delivered to your door — every order escrow-protected.",
    accent: "violet",
    basePath: "/marketplace",
    categories: CATEGORIES.map((c) => ({ name: c.name, slug: c.slug, emoji: c.icon })),
  },
  {
    id: "services",
    name: "Services",
    tagline: "People you hire",
    desc: "Local pros — boda, plumbers, salons, mechanics. Book & pay safely.",
    accent: "cyan",
    basePath: "/services",
    categories: SERVICE_TAXONOMY,
  },
  {
    id: "freelance",
    name: "Freelance",
    tagline: "Digital work, done online",
    desc: "Writers, designers, developers & AI taskers. Hire or get hired.",
    accent: "gold",
    basePath: "/freelance/jobs",
    categories: FREELANCE_CATEGORIES.map((c) => ({ name: c.name, slug: c.slug })),
  },
];

/** Popular searches per market for the mobile search experience. */
export const SEARCH_SUGGESTIONS: Record<string, string[]> = {
  products: ["iPhone", "Laptop", "Sofa set", "TV", "Sneakers", "Generator"],
  services: ["Boda ride", "Plumber", "House cleaning", "Phone repair", "Moving", "Salon"],
  freelance: ["Content writer", "Logo design", "Web developer", "Data entry", "Tutor"],
};

/** Routes where the mobile shell is fully hidden (immersive flows). */
export const MOBILE_SHELL_HIDDEN_ON = [
  "/",
  "/auth",
  "/auth/seller",
  "/auth/freelance",
  "/auth/creator",
  "/privacy",
  "/terms",
  "/join",
];

export function isImmersiveRoute(pathname: string): boolean {
  if (MOBILE_SHELL_HIDDEN_ON.includes(pathname)) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/auth")) return true;
  return false;
}

/** Focused checkout-style flows keep a minimal header only. */
export function isFocusedFlow(pathname: string): boolean {
  return pathname.startsWith("/seller/add-product") || pathname.startsWith("/freelance/publish");
}
