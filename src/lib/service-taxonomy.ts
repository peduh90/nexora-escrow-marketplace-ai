/**
 * Service category taxonomy — canonical mirror of SERVICE_CATEGORIES in
 * src/convex/services.ts (Convex remains the source used by queries). This
 * local copy lets the mobile Explore panel render instantly without a
 * network round-trip.
 */
export const SERVICE_CATEGORIES = [
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
  { slug: "home", name: "Home Repairs & Maintenance", emoji: "🏠" },
  { slug: "fundis", name: "Construction & Fundis", emoji: "🧱" },
  { slug: "tech-repair", name: "Computer & Phone Repair", emoji: "📱" },
  { slug: "cyber", name: "Printing, Photocopy & Cyber", emoji: "🖨️" },
  { slug: "courier", name: "Courier & Parcel Delivery", emoji: "🚚" },
  { slug: "carhire", name: "Car & Truck Hire", emoji: "🚗" },
  { slug: "events", name: "Events & Equipment Hire", emoji: "🎉" },
  { slug: "photography", name: "Photography & Videography", emoji: "📸" },
  { slug: "appliance", name: "Appliance Repair", emoji: "🔌" },
  { slug: "garden", name: "Gardening & Landscaping", emoji: "🌿" },
  { slug: "waste", name: "Waste Collection", emoji: "🗑️" },
  { slug: "water", name: "Water Delivery", emoji: "💧" },
  { slug: "gas", name: "Gas / LPG Delivery", emoji: "🔥" },
  { slug: "tutoring", name: "Tutoring & Education", emoji: "📚" },
  { slug: "childcare", name: "Childcare & Domestic Help", emoji: "👶" },
  { slug: "pets", name: "Pet Services", emoji: "🐕" },
  { slug: "professional", name: "Professional Services", emoji: "💼" },
  { slug: "marketing", name: "Business & Marketing Services", emoji: "📈" },
  { slug: "emergency", name: "Emergency Services", emoji: "🚨" },
] as const;
