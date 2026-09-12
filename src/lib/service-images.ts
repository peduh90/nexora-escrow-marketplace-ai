/**
 * Real Pexels photos for Nexora's Kenya-first service & transport categories.
 * Sourced from pexels.com (free commercial use) — searched for authentic
 * Kenyan/African environments: boda boda riders, matatus, salons, fundis,
 * market work and everyday transport.
 *
 * Kept as a Record keyed by the service-category slug (see
 * src/convex/services.ts SERVICE_CATEGORIES) so tiles can fall back to the
 * emoji when a category has no photo yet.
 */

const pexels = (id: number, w = 400, h = 300) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&dpr=1`;

export const SERVICE_CATEGORY_IMAGES: Record<string, string> = {
  // ── Transport Near You ──
  boda: pexels(33757406),      // Boda boda rider on a Nairobi street
  matatu: pexels(30661414),    // Colorful matatu bus with football art, Nairobi
  delivery: pexels(6867959),   // Deliveryman on a motorbike holding a parcel
  taxi: pexels(20496232),      // Yellow taxi at a city stand

  // ── Home & repair ──
  plumbers: pexels(6474205),   // Plumber holding a silver faucet
  electricians: pexels(257736),// Electrician fixing an opened switchboard
  home: pexels(6764275),       // Painter rolling a wall during renovation
  fundis: pexels(33595992),    // Construction workers laying foundation bricks
  appliance: pexels(6755075),  // Technician fixing an appliance with a screwdriver
  "tech-repair": pexels(6754839), // Smartphone repair under a microscope

  // ── Cleaning & laundry ──
  cleaning: pexels(8055202),   // Woman vacuuming a living room
  laundry: pexels(28576617),   // Neat laundry room with ironing board

  // ── Beauty & wellness ──
  beauty: pexels(5282408),     // Barber giving a precise haircut
  makeup: pexels(6954145),     // Makeup artist applying eyeshadow

  // ── Auto & transport services ──
  auto: pexels(8985972),       // Mechanic working on an engine in a garage

  // ── Moving & courier ──
  courier: pexels(12203654),   // Courier riding with a thermal bag
  carhire: pexels(14203408),   // Row of white hire cars

  // ── Events & media ──
  events: pexels(15921581),    // DJ playing for a crowd under a tent
  photography: pexels(30402283), // Young photographer at an outdoor event

  // ── Cyber & printing ──
  cyber: pexels(9550363),      // Printing machine processing paper

  // ── Outdoor & utilities ──
  garden: pexels(6728926),     // Gardener mowing a lawn
  waste: pexels(11115604),     // Garbage truck emptying a bin
  water: pexels(6647127),      // Bottled water distribution
  gas: pexels(33058285),       // Red gas cylinder with a cooking pot

  // ── People & professional ──
  tutoring: pexels(30058872),  // African classroom, teacher and students
  childcare: pexels(6974315),  // Nanny and child at the table
  pets: pexels(19145885),      // Groomer trimming a dog
  professional: pexels(7643756), // Professionals in a meeting
  marketing: pexels(7643758),  // Businesspeople in a meeting room

  // ── Emergency ──
  emergency: pexels(28123710), // Ambulance with flashing lights at night
};

/** Photo for a category slug, or undefined when only the emoji exists. */
export function serviceImage(slug: string): string | undefined {
  return SERVICE_CATEGORY_IMAGES[slug];
}
