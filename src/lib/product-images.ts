/**
 * Product image helper — generates deterministic placeholder images
 * based on product category and title. No copyrighted assets used.
 */

// Category-to-color mapping for visual consistency
const categoryColors: Record<string, { bg: string; fg: string; icon: string }> = {
  "Electronics": { bg: "#1a1a2e", fg: "#8B5CF6", icon: "💻" },
  "Phones & Tablets": { bg: "#0d1b2a", fg: "#06B6D4", icon: "📱" },
  "Vehicles": { bg: "#1b2838", fg: "#F59E0B", icon: "🚗" },
  "Property": { bg: "#1a1a1a", fg: "#10B981", icon: "🏠" },
  "Home & Furniture": { bg: "#2d1b2e", fg: "#EC4899", icon: "🛋️" },
  "Fashion": { bg: "#1b1b2f", fg: "#A855F7", icon: "👗" },
  "Beauty & Personal Care": { bg: "#2b1a2b", fg: "#F472B6", icon: "💄" },
  "Services": { bg: "#1a2b1a", fg: "#22C55E", icon: "🔧" },
  "Agriculture": { bg: "#1a2a1a", fg: "#84CC16", icon: "🌾" },
  "Jobs": { bg: "#1a1a2e", fg: "#3B82F6", icon: "💼" },
};

export function getProductImage(title: string, category: string, index = 0): string {
  const colors = categoryColors[category] || { bg: "#1a1a2e", fg: "#8B5CF6", icon: "📦" };

  // Generate a deterministic SVG placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.bg}dd;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#grad)" />
      <circle cx="200" cy="130" r="50" fill="${colors.fg}22" stroke="${colors.fg}44" stroke-width="1" />
      <text x="200" y="145" text-anchor="middle" font-size="40">${colors.icon}</text>
      <text x="200" y="200" text-anchor="middle" font-size="12" fill="${colors.fg}88" font-family="system-ui">${title.slice(0, 20)}</text>
      <text x="200" y="220" text-anchor="middle" font-size="10" fill="${colors.fg}44" font-family="system-ui">${category}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Get a placeholder for seller avatars
export function getSellerAvatar(name: string): string {
  const initial = name.charAt(0).toUpperCase();
  const colors = ["#8B5CF6", "#06B6D4", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="40" fill="${color}33" />
      <text x="40" y="48" text-anchor="middle" font-size="28" font-weight="bold" fill="${color}" font-family="system-ui">${initial}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
