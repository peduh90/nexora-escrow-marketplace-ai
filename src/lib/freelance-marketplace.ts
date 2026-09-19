/**
 * Nexora Freelance Marketplace — shared constants.
 *
 * The platform has two separate marketplaces that share the `listings` table:
 *  - "product"   → the Normal (physical-goods) Marketplace  at /marketplace
 *  - "freelance" → the Freelance Digital-Work Marketplace    at /freelance
 *
 * A listing is placed into exactly one marketplace when it is published and it
 * only ever surfaces inside that marketplace (search, filters, feeds, detail
 * pages and recommendations all filter on `marketplace`).
 */

import type { LucideIcon } from "lucide-react";
import {
  PenLine, Palette, Clapperboard, Megaphone, Code2, BarChart3, Headset,
  GraduationCap, Briefcase, Bot, Package, Wrench, SpellCheck,
  FileSpreadsheet, Mail, Layers, Film, Figma, Github,
} from "lucide-react";

export const MARKETPLACES = {
  PRODUCT: "product",
  FREELANCE: "freelance",
} as const;

export type Marketplace = (typeof MARKETPLACES)[keyof typeof MARKETPLACES];

export interface FreelanceSubcategory {
  name: string;
  slug: string;
}

export interface FreelanceCategory {
  name: string;
  slug: string;
  /** Lucide icon name resolved via FREELANCE_CATEGORY_ICONS. */
  icon: string;
  description: string;
  subcategories: FreelanceSubcategory[];
}

/**
 * Category taxonomy built around the digital services Kenyans already know:
 * writing, design, video, social media, web/software, data, virtual assistance,
 * tutoring, business services, legitimate AI & productivity tools, and
 * everything else. Section order follows everyday demand.
 */
export const FREELANCE_CATEGORIES: FreelanceCategory[] = [
  {
    name: "Writing & Editing",
    slug: "writing",
    icon: "pen-line",
    description: "Articles, copywriting, proofreading, editing, CVs & translation",
    subcategories: [
      { name: "Content & Article Writing", slug: "article-writing" },
      { name: "Copywriting & Sales Pages", slug: "copywriting" },
      { name: "Proofreading & Editing", slug: "editing" },
      { name: "Translation & Transcription", slug: "translation-transcription" },
      { name: "CV, Resume & Cover Letters", slug: "cv-resume" },
      { name: "Technical Writing", slug: "technical-writing" },
      { name: "Research & Reports", slug: "research-reports" },
    ],
  },
  {
    name: "Design & Branding",
    slug: "design",
    icon: "palette",
    description: "Logos, brand identity, graphics, UI/UX & presentation design",
    subcategories: [
      { name: "Logo & Brand Identity", slug: "logo-branding" },
      { name: "Graphic Design", slug: "graphic-design" },
      { name: "UI/UX Design", slug: "ui-ux" },
      { name: "Social Media Designs", slug: "social-media-designs" },
      { name: "Presentations & Pitch Decks", slug: "presentations" },
      { name: "Posters & Flyers", slug: "posters-flyers" },
    ],
  },
  {
    name: "Video & Photography",
    slug: "video-photo",
    icon: "clapperboard",
    description: "Video editing, filming, photography, animation & voice-over",
    subcategories: [
      { name: "Video Editing", slug: "video-editing" },
      { name: "Photography", slug: "photography" },
      { name: "Videography", slug: "videography" },
      { name: "Animation & Motion Graphics", slug: "animation-motion-graphics" },
      { name: "Voice-Over & Audio", slug: "voice-over-audio" },
      { name: "Short-Form Content (TikTok/Reels)", slug: "short-form-content" },
    ],
  },
  {
    name: "Social Media & Marketing",
    slug: "marketing",
    icon: "megaphone",
    description: "Social media management, ads, SEO, email & growth",
    subcategories: [
      { name: "Social Media Management", slug: "social-media-management" },
      { name: "Digital Marketing", slug: "digital-marketing" },
      { name: "SEO & Keywords", slug: "seo" },
      { name: "Paid Ads (Meta / Google / TikTok)", slug: "paid-ads" },
      { name: "Email & Newsletter Marketing", slug: "email-marketing" },
      { name: "Market Research", slug: "market-research" },
    ],
  },
  {
    name: "Web & Software",
    slug: "development",
    icon: "code-2",
    description: "Websites, WordPress, apps, automation & technical help",
    subcategories: [
      { name: "Website Development", slug: "website-development" },
      { name: "WordPress & CMS", slug: "wordpress-cms" },
      { name: "UI/UX Implementation", slug: "ui-ux-implementation" },
      { name: "Mobile Apps", slug: "mobile-apps" },
      { name: "AI Integration & Automation", slug: "ai-integration-automation" },
      { name: "Debugging & Tech Support", slug: "debugging-support" },
    ],
  },
  {
    name: "Data & Research",
    slug: "data-research",
    icon: "bar-chart-3",
    description: "Data entry, data analysis, research assistance & scraping",
    subcategories: [
      { name: "Data Entry & Processing", slug: "data-entry" },
      { name: "Data Analysis & Dashboards", slug: "data-analysis" },
      { name: "Research Assistance", slug: "research-assistance" },
      { name: "Surveys & Field Data", slug: "surveys-field-data" },
      { name: "Database & Spreadsheets", slug: "database-spreadsheets" },
    ],
  },
  {
    name: "AI Tasking & Data Work",
    slug: "ai-tasking",
    icon: "bot",
    description: "AI-assisted tasks, data annotation, transcription & model testing",
    subcategories: [
      { name: "AI-Assisted Tasks", slug: "ai-assisted-tasks" },
      { name: "Data Annotation & Labeling", slug: "data-annotation" },
      { name: "Transcription", slug: "transcription" },
      { name: "Search Relevance Evaluation", slug: "search-evaluation" },
      { name: "Chatbot Testing & Rating", slug: "chatbot-testing" },
      { name: "AI Content Review", slug: "ai-content-review" },
      { name: "Data Collection & Surveys", slug: "data-collection" },
    ],
  },
  {
    name: "Virtual Assistance & Admin",
    slug: "virtual-assistance",
    icon: "headset",
    description: "Virtual assistants, customer support & admin help",
    subcategories: [
      { name: "Virtual Assistant", slug: "virtual-assistant" },
      { name: "Customer Support", slug: "customer-support" },
      { name: "Administration & Filing", slug: "administration" },
      { name: "Email & Calendar Management", slug: "email-calendar-management" },
      { name: "Chat & Live Support", slug: "chat-support" },
    ],
  },
  {
    name: "Education & Tutoring",
    slug: "education",
    icon: "graduation-cap",
    description: "Tutoring, online classes, exam prep & legitimate learning support",
    subcategories: [
      { name: "Home & Online Tutoring", slug: "tutoring" },
      { name: "Exam Preparation (KCSE, IGCSE)", slug: "exam-prep" },
      { name: "Language Lessons", slug: "language-lessons" },
      { name: "Online Classes & Courses", slug: "online-classes" },
      { name: "Proofreading & Formatting (students)", slug: "student-support" },
    ],
  },
  {
    name: "Business & Professional",
    slug: "business-professional",
    icon: "briefcase",
    description: "Bookkeeping, consulting, documents, registrations & compliance",
    subcategories: [
      { name: "Bookkeeping & Accounts", slug: "bookkeeping" },
      { name: "Business Consulting", slug: "business-consulting" },
      { name: "Business Documents & Proposals", slug: "business-documents" },
      { name: "Company Registration & CR12", slug: "company-registration" },
      { name: "Tax & KRA Filing Help", slug: "tax-filing" },
      { name: "Presentation Design", slug: "presentation-design" },
    ],
  },
  {
    name: "AI & Digital Tools",
    slug: "ai-accounts-tools",
    icon: "bot",
    description: "Authorized AI & productivity tool subscriptions and setup help",
    subcategories: [
      { name: "AI Tool Subscriptions (authorized)", slug: "ai-accounts" },
      { name: "ChatGPT / Claude / Gemini Setup", slug: "ai-setup" },
      { name: "Canva, Grammarly & QuillBot Setup", slug: "productivity-setup" },
      { name: "Microsoft 365 & Google Workspace", slug: "office-workspace" },
      { name: "Adobe Creative Cloud & CapCut", slug: "creative-cloud" },
      { name: "GitHub, Notion & Figma Help", slug: "dev-productivity" },
      { name: "Prompt Packs & AI Training", slug: "prompt-packs" },
    ],
  },
  {
    name: "Digital Products & Tools",
    slug: "digital-products",
    icon: "package",
    description: "Templates, e-books, presets, courses & downloadable assets",
    subcategories: [
      { name: "Templates & Documents", slug: "templates" },
      { name: "E-books & Guides", slug: "ebooks" },
      { name: "Presets & Asset Packs", slug: "presets" },
      { name: "Online Courses & Tutorials", slug: "courses" },
      { name: "Software Licenses (authorized)", slug: "software-licenses" },
    ],
  },
  {
    name: "Other Services",
    slug: "other-services",
    icon: "wrench",
    description: "Everything else — project management, operations & more",
    subcategories: [
      { name: "Project Management", slug: "project-management" },
      { name: "Event Support (virtual)", slug: "event-support" },
      { name: "Legal Templates (non-advice)", slug: "legal-templates" },
      { name: "Other Professional Services", slug: "other-professional" },
    ],
  },
];

export const FREELANCE_MARKETPLACE_CATEGORY_SLUGS = FREELANCE_CATEGORIES.map(
  (c) => c.slug,
);

export function getFreelanceCategory(slug: string): FreelanceCategory | undefined {
  return FREELANCE_CATEGORIES.find((c) => c.slug === slug);
}

/** Jobs posted by clients use the same category vocabulary as the marketplace. */
export const JOB_CATEGORIES = FREELANCE_CATEGORIES;

/** Lucide icon components for every category — the icon system for freelance UI. */
export const FREELANCE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  "pen-line": PenLine,
  palette: Palette,
  clapperboard: Clapperboard,
  megaphone: Megaphone,
  "code-2": Code2,
  "bar-chart-3": BarChart3,
  headset: Headset,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  bot: Bot,
  package: Package,
  wrench: Wrench,
};

/** Resolve a Lucide icon component for a category, with a safe default. */
export function getFreelanceCategoryIcon(slug: string): LucideIcon {
  const cat = getFreelanceCategory(slug);
  return (cat && FREELANCE_CATEGORY_ICONS[cat.icon]) || Wrench;
}

/**
 * Legacy category slugs from the previous taxonomy. Existing listings and jobs
 * still store these, so every consumer maps them to their new home.
 */
const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  "ai-accounts-tools": "ai-accounts-tools",
  // AI Taskers are freelancers with a field — legacy records land here.
  "ai-tasker": "ai-tasking",
  writing: "writing",
  design: "design",
  development: "development",
  marketing: "marketing",
  bots: "development",
  "other-services": "other-services",
  "video-photo": "video-photo",
  "data-research": "data-research",
  "virtual-assistance": "virtual-assistance",
  education: "education",
  "business-professional": "business-professional",
  "digital-products": "digital-products",
};

/** Normalize a stored (possibly legacy) category slug to the current taxonomy. */
export function normalizeFreelanceCategory(slug: string | undefined | null): string {
  if (!slug) return "other-services";
  return LEGACY_CATEGORY_ALIASES[slug] ?? slug;
}

/** Inline SVG / gradient used when a freelance listing has no image. */
export const FREELANCE_CATEGORY_GRADIENTS: Record<string, string> = {
  writing: "from-emerald-600/30 via-teal-600/10 to-transparent",
  design: "from-pink-600/30 via-rose-600/10 to-transparent",
  "video-photo": "from-purple-600/30 via-fuchsia-600/10 to-transparent",
  marketing: "from-amber-600/30 via-orange-600/10 to-transparent",
  development: "from-cyan-600/30 via-blue-600/10 to-transparent",
  "data-research": "from-sky-600/30 via-cyan-600/10 to-transparent",
  "virtual-assistance": "from-teal-600/30 via-emerald-600/10 to-transparent",
  education: "from-blue-600/30 via-indigo-600/10 to-transparent",
  "business-professional": "from-slate-500/30 via-slate-400/10 to-transparent",
  "ai-accounts-tools": "from-violet-600/30 via-fuchsia-600/10 to-transparent",
  "digital-products": "from-lime-600/30 via-emerald-600/10 to-transparent",
  "other-services": "from-slate-500/30 via-slate-400/10 to-transparent",
};

/** Every category slug the server accepts for freelance listings (with aliases). */
export const ALL_FREELANCE_CATEGORY_SLUGS: string[] = [
  ...FREELANCE_MARKETPLACE_CATEGORY_SLUGS,
  "bots", // legacy rows
];

/**
 * The AI & Digital Tools area sells legitimate, authorized subscriptions and
 * setup help only. These are the named tools Kenyan users recognize.
 * Nexora is not affiliated with them — names are examples, not endorsements.
 */
export const AI_TOOL_BRANDS = [
  "ChatGPT", "Claude", "Gemini", "Canva", "Grammarly", "QuillBot",
  "Perplexity", "Adobe Creative Cloud", "CapCut", "Figma", "Notion",
  "Microsoft 365", "Google Workspace", "GitHub",
] as const;

/** AI tool tiles for the homepage grid (Lucide icons, no vendor logos). */
export const AI_TOOL_TILES = [
  { name: "ChatGPT & Claude Setup", icon: "bot" },
  { name: "Canva", icon: "palette" },
  { name: "Grammarly & QuillBot", icon: "spell-check" },
  { name: "Microsoft 365", icon: "file-spreadsheet" },
  { name: "Google Workspace", icon: "mail" },
  { name: "Adobe Creative Cloud", icon: "layers" },
  { name: "CapCut", icon: "film" },
  { name: "Figma & Notion", icon: "figma" },
  { name: "GitHub & Perplexity", icon: "github" },
] as const;

/** Lucide icon components for the AI tool tiles. */
export const AI_TOOL_ICONS: Record<string, LucideIcon> = {
  bot: Bot,
  palette: Palette,
  "spell-check": SpellCheck,
  "file-spreadsheet": FileSpreadsheet,
  mail: Mail,
  layers: Layers,
  film: Film,
  figma: Figma,
  github: Github,
};

/**
 * Forbidden-in-title keywords for the freelance publish/search flow. These
 * describe stolen accounts, cracked software, credential sharing, exam fraud
 * and impersonation — they must never be rewarded on Nexora.
 */
export const ILLEGAL_SERVICE_KEYWORDS = [
  "cracked", "crack", "patched", "keygen", "nulled", "torrent",
  "shared account", "account sharing", "shared login", "stolen account",
  "hacked account", "bypass", "activated free", "free activation",
  "assign my exam", "write my exam", "sit my exam", "exam impersonation",
  "impersonate", "fake certificate", "forged certificate", "fake degree",
  "fake transcripts", "buy followers", "buy likes", "bot followers",
  "buy subscribers", "fake reviews",
] as const;

/** Quick check used by client forms (server re-validates). */
export function containsIllegalServiceKeyword(text: string): string | null {
  const t = (text || "").toLowerCase();
  const hit = ILLEGAL_SERVICE_KEYWORDS.find((k) => t.includes(k));
  return hit ?? null;
}

/** Present a category slug as a human label, e.g. ui-ux → UI/Ux. */
export function freelanceCategoryName(slug: string): string {
  const norm = normalizeFreelanceCategory(slug);
  return getFreelanceCategory(norm)?.name ?? formatSlug(slug);
}

export function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
