import boda from "@/assets/categories/boda.jpg";
import matatu from "@/assets/categories/matatu.jpg";
import delivery from "@/assets/categories/delivery.jpg";
import plumbers from "@/assets/categories/plumbers.jpg";
import electricians from "@/assets/categories/electricians.jpg";
import auto from "@/assets/categories/auto.jpg";
import cleaning from "@/assets/categories/cleaning.jpg";
import laundry from "@/assets/categories/laundry.jpg";
import beauty from "@/assets/categories/beauty.jpg";
import makeup from "@/assets/categories/makeup.jpg";
import home from "@/assets/categories/home.jpg";
import fundis from "@/assets/categories/fundis.jpg";
import techRepair from "@/assets/categories/tech-repair.jpg";
import cyber from "@/assets/categories/cyber.jpg";
import courier from "@/assets/categories/courier.jpg";
import carhire from "@/assets/categories/carhire.jpg";
import events from "@/assets/categories/events.jpg";
import photography from "@/assets/categories/photography.jpg";
import appliance from "@/assets/categories/appliance.jpg";
import garden from "@/assets/categories/garden.jpg";
import waste from "@/assets/categories/waste.jpg";
import water from "@/assets/categories/water.jpg";
import gas from "@/assets/categories/gas.jpg";
import tutoring from "@/assets/categories/tutoring.jpg";
import childcare from "@/assets/categories/childcare.jpg";
import pets from "@/assets/categories/pets.jpg";
import professional from "@/assets/categories/professional.jpg";
import marketing from "@/assets/categories/marketing.jpg";
import emergency from "@/assets/categories/emergency.jpg";

/**
 * Real photographic imagery for every service category — used on the homepage
 * "Services Near You" grid and the Services Hub. Photos are bundled at build
 * time (no network dependency at runtime, no broken links ever).
 */
export const CATEGORY_IMAGES: Record<string, string> = {
  boda,
  matatu,
  delivery,
  plumbers,
  electricians,
  auto,
  cleaning,
  laundry,
  beauty,
  makeup,
  home,
  fundis,
  "tech-repair": techRepair,
  cyber,
  courier,
  carhire,
  events,
  photography,
  appliance,
  garden,
  waste,
  water,
  gas,
  tutoring,
  childcare,
  pets,
  professional,
  marketing,
  emergency,
};

export function categoryImage(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return CATEGORY_IMAGES[slug] ?? null;
}
