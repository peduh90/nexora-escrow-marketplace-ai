import {
  Bike, Bus, Package, Droplets, Zap, Wrench, Sparkles, Shirt,
  Scissors, Brush, Home, HardHat, Smartphone, Printer, Truck, Car,
  PartyPopper, Camera, Plug, Leaf, Trash2, Waves, Flame, GraduationCap,
  Baby, Dog, Briefcase, TrendingUp, Siren, PenLine,
  type LucideIcon,
} from "lucide-react";

/**
 * Real icon set for service categories — used on the homepage grid, the
 * Services Hub and anywhere a category chip renders. The legacy `emoji`
 * field stays in the backend config for data compatibility, but the UI
 * renders these Lucide icons instead.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  boda: Bike,
  matatu: Bus,
  delivery: Package,
  plumbers: Droplets,
  electricians: Zap,
  auto: Wrench,
  cleaning: Sparkles,
  laundry: Shirt,
  beauty: Scissors,
  makeup: Brush,
  home: Home,
  fundis: HardHat,
  "tech-repair": Smartphone,
  cyber: Printer,
  courier: Truck,
  carhire: Car,
  events: PartyPopper,
  photography: Camera,
  appliance: Plug,
  garden: Leaf,
  waste: Trash2,
  water: Waves,
  gas: Flame,
  tutoring: GraduationCap,
  childcare: Baby,
  pets: Dog,
  professional: Briefcase,
  marketing: TrendingUp,
  emergency: Siren,
};

/** AI Tasker task categories. */
export const TASK_ICONS: Record<string, LucideIcon> = {
  errands: Bike,
  research: GraduationCap,
  writing: PenLine,
  design: Brush,
  data: TrendingUp,
  tech: Smartphone,
  home: Home,
  events: PartyPopper,
};

/** Fallback icon when a slug is unknown. */
export const DEFAULT_CATEGORY_ICON: LucideIcon = Sparkles;

export function categoryIcon(slug: string | null | undefined): LucideIcon {
  if (!slug) return DEFAULT_CATEGORY_ICON;
  return CATEGORY_ICONS[slug] ?? TASK_ICONS[slug] ?? DEFAULT_CATEGORY_ICON;
}

/** Full-color per-category tint so grids feel alive without emojis. */
export const CATEGORY_TINTS: Record<string, string> = {
  boda: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  matatu: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  delivery: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  plumbers: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  electricians: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  auto: "text-slate-300 bg-slate-300/10 border-slate-300/20",
  cleaning: "text-cyan-300 bg-cyan-300/10 border-cyan-300/20",
  laundry: "text-blue-300 bg-blue-300/10 border-blue-300/20",
  beauty: "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20",
  makeup: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  home: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  fundis: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  "tech-repair": "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  cyber: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  courier: "text-red-400 bg-red-400/10 border-red-400/20",
  carhire: "text-red-300 bg-red-300/10 border-red-300/20",
  events: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  photography: "text-zinc-300 bg-zinc-300/10 border-zinc-300/20",
  appliance: "text-teal-400 bg-teal-400/10 border-teal-400/20",
  garden: "text-green-400 bg-green-400/10 border-green-400/20",
  waste: "text-lime-500 bg-lime-500/10 border-lime-500/20",
  water: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  gas: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  tutoring: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  childcare: "text-amber-300 bg-amber-300/10 border-amber-300/20",
  pets: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  professional: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  marketing: "text-emerald-300 bg-emerald-300/10 border-emerald-300/20",
  emergency: "text-red-400 bg-red-400/10 border-red-400/20",
};

export function categoryTint(slug: string | null | undefined): string {
  if (!slug) return "text-nx-cyan bg-nx-cyan/10 border-nx-cyan/20";
  return CATEGORY_TINTS[slug] ?? "text-nx-cyan bg-nx-cyan/10 border-nx-cyan/20";
}
