/**
 * Nexora Freelance Marketplace — shared constants.
 *
 * The platform has two separate marketplaces that share the `listings` table:
 *  - "product"   → the Normal (physical-goods) Marketplace  at /marketplace
 *  - "freelance" → the Freelance Services & Digital Tools    at /freelance
 *
 * A listing is placed into exactly one marketplace when it is published and it
 * only ever surfaces inside that marketplace (search, filters, feeds, detail
 * pages and recommendations all filter on `marketplace`).
 */

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
  icon: string;
  description: string;
  subcategories: FreelanceSubcategory[];
}

export const FREELANCE_CATEGORIES: FreelanceCategory[] = [
  {
    name: "AI Accounts & Tools",
    slug: "ai-accounts-tools",
    icon: "🤖",
    description: "AI accounts, subscriptions, prompt packs, AI training & setup",
    subcategories: [
      { name: "AI Accounts & Subscriptions", slug: "ai-accounts" },
      { name: "ChatGPT / Gemini / Claude Setup", slug: "ai-setup" },
      { name: "Prompt Packs & Templates", slug: "prompt-packs" },
      { name: "AI Training & Onboarding", slug: "ai-training" },
      { name: "AI Automation Setup", slug: "ai-automation" },
    ],
  },
  {
    name: "Writing & Content",
    slug: "writing",
    icon: "✍️",
    description: "Articles, copywriting, editing, CVs, translations & more",
    subcategories: [
      { name: "Articles & Blog Posts", slug: "articles" },
      { name: "Copywriting & Sales Pages", slug: "copywriting" },
      { name: "Editing & Proofreading", slug: "editing" },
      { name: "CV / Resume & Cover Letters", slug: "cv-resume" },
      { name: "Technical Writing", slug: "technical-writing" },
      { name: "Translation", slug: "translation" },
      { name: "Research & Reports", slug: "research" },
    ],
  },
  {
    name: "Design & Creative",
    slug: "design",
    icon: "🎨",
    description: "Logos, branding, graphics, UI/UX and presentation design",
    subcategories: [
      { name: "Logo & Brand Identity", slug: "logo-branding" },
      { name: "Graphic Design", slug: "graphic-design" },
      { name: "UI/UX Design", slug: "ui-ux" },
      { name: "Social Media Designs", slug: "social-design" },
      { name: "Presentations & Pitch Decks", slug: "presentations" },
      { name: "Print & Packaging", slug: "print-packaging" },
    ],
  },
  {
    name: "Development & Tech",
    slug: "development",
    icon: "💻",
    description: "Websites, apps, scripts, integrations and technical help",
    subcategories: [
      { name: "Website Development", slug: "websites" },
      { name: "Mobile Apps", slug: "mobile-apps" },
      { name: "WordPress & CMS", slug: "wordpress" },
      { name: "APIs & Integrations", slug: "apis" },
      { name: "Scripts & Automation", slug: "scripts" },
      { name: "Debugging & Support", slug: "debugging" },
    ],
  },
  {
    name: "Marketing & Growth",
    slug: "marketing",
    icon: "📣",
    description: "Social media, SEO, ads, email and content strategy",
    subcategories: [
      { name: "Social Media Management", slug: "social-management" },
      { name: "SEO & Keywords", slug: "seo" },
      { name: "Paid Ads (Meta / Google / TikTok)", slug: "paid-ads" },
      { name: "Email & Newsletter", slug: "email-marketing" },
      { name: "Content Strategy", slug: "content-strategy" },
      { name: "Market Research", slug: "market-research" },
    ],
  },
  {
    name: "Bots & Automation",
    slug: "bots",
    icon: "⚙️",
    description: "Chatbots, Telegram/WhatsApp/Discord bots and workflows",
    subcategories: [
      { name: "Chatbots (Website / AI)", slug: "chatbots" },
      { name: "WhatsApp Bots", slug: "whatsapp-bots" },
      { name: "Telegram Bots", slug: "telegram-bots" },
      { name: "Discord Bots", slug: "discord-bots" },
      { name: "Workflow Automation", slug: "workflow-automation" },
      { name: "Data Scraping", slug: "scraping" },
    ],
  },
  {
    name: "Other Freelance Services",
    slug: "other-services",
    icon: "🛠️",
    description: "Virtual assistance, data, video, voice-over, consulting",
    subcategories: [
      { name: "Virtual Assistant", slug: "virtual-assistant" },
      { name: "Data Entry & Processing", slug: "data-entry" },
      { name: "Transcription", slug: "transcription" },
      { name: "Video Editing", slug: "video-editing" },
      { name: "Voice Over & Audio", slug: "voice-over" },
      { name: "Consulting & Coaching", slug: "consulting" },
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

/** Inline SVG / gradient used when a freelance listing has no image. */
export const FREELANCE_CATEGORY_GRADIENTS: Record<string, string> = {
  "ai-accounts-tools": "from-violet-600/30 via-fuchsia-600/10 to-transparent",
  writing: "from-emerald-600/30 via-teal-600/10 to-transparent",
  design: "from-pink-600/30 via-rose-600/10 to-transparent",
  development: "from-cyan-600/30 via-blue-600/10 to-transparent",
  marketing: "from-amber-600/30 via-orange-600/10 to-transparent",
  bots: "from-indigo-600/30 via-sky-600/10 to-transparent",
  "other-services": "from-slate-500/30 via-slate-400/10 to-transparent",
};

/** Present a category slug as a human label, e.g. ai-accounts-tools → AI Accounts & Tools. */
export function freelanceCategoryName(slug: string): string {
  return getFreelanceCategory(slug)?.name ?? formatSlug(slug);
}

export function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
