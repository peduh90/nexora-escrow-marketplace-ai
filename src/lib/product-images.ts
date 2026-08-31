/**
 * Product image helper — uses free stock photos from Unsplash.
 * All images are free to use under the Unsplash License.
 */

// Unsplash source URLs — free, direct image links
const productImages: Record<string, string[]> = {
  // Electronics / Laptops
  "laptop": [
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&h=400&fit=crop",
  ],
  "macbook": [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&h=400&fit=crop",
  ],

  // Phones
  "phone": [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&h=400&fit=crop",
  ],
  "iphone": [
    "https://images.unsplash.com/photo-1591337676887-a217a6c6eee4?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1567789884554-0b308a3483a0?w=600&h=400&fit=crop",
  ],
  "samsung": [
    "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=400&fit=crop",
  ],

  // Vehicles
  "car": [
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&h=400&fit=crop",
  ],
  "toyota": [
    "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&h=400&fit=crop",
  ],
  "motorcycle": [
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=400&fit=crop",
  ],

  // Property
  "house": [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
  ],
  "apartment": [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
  ],
  "land": [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
  ],

  // Fashion
  "shoes": [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop",
  ],
  "nike": [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop",
  ],
  "fashion": [
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop",
  ],
  "watch": [
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600&h=400&fit=crop",
  ],

  // Home & Furniture
  "sofa": [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
  ],
  "furniture": [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&h=400&fit=crop",
  ],
  "kitchen": [
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
  ],
  "refrigerator": [
    "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&h=400&fit=crop",
  ],

  // Electronics - TV / Audio
  "tv": [
    "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=400&fit=crop",
  ],
  "headphones": [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop",
  ],
  "camera": [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop",
  ],
  "gaming": [
    "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=400&fit=crop",
  ],

  // Beauty
  "beauty": [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop",
  ],
  "perfume": [
    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=400&fit=crop",
  ],

  // Agriculture
  "farm": [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
  ],
  "produce": [
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop",
  ],

  // Services
  "construction": [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop",
  ],

  // Default
  "default": [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop",
  ],
};

// Map categories to image keywords
const categoryKeywordMap: Record<string, string> = {
  "electronics": "laptop",
  "phones & tablets": "phone",
  "vehicles": "car",
  "property": "house",
  "home & furniture": "furniture",
  "fashion": "fashion",
  "beauty & personal care": "beauty",
  "agriculture": "farm",
  "services": "construction",
  "jobs": "default",
};

// Map specific product titles to image keywords
const titleKeywordMap: Record<string, string> = {
  "hp elitebook": "laptop",
  "macbook": "macbook",
  "dell": "laptop",
  "lenovo": "laptop",
  "asus": "laptop",
  "iphone": "iphone",
  "samsung galaxy": "samsung",
  "phone": "phone",
  "charger": "phone",
  "toyota": "car",
  "nissan": "car",
  "honda": "car",
  "mercedes": "car",
  "bmw": "car",
  "motorcycle": "motorcycle",
  "nike": "nike",
  "adidas": "shoes",
  "shoe": "shoes",
  "watch": "watch",
  "sofa": "sofa",
  "bed": "furniture",
  "table": "furniture",
  "refrigerator": "refrigerator",
  "tv": "tv",
  "television": "tv",
  "headphone": "headphones",
  "sony": "headphones",
  "camera": "camera",
  "playstation": "gaming",
  "xbox": "gaming",
  "apartment": "apartment",
  "house": "house",
  "land": "land",
  "perfume": "perfume",
  "makeup": "beauty",
};

/**
 * Get a product image URL based on title and category.
 * Uses free Unsplash stock photos.
 */
export function getProductImage(title: string, category: string, index = 0): string {
  const titleLower = title.toLowerCase();

  // Try title-based matching first
  for (const [keyword, imageKey] of Object.entries(titleKeywordMap)) {
    if (titleLower.includes(keyword)) {
      const images = productImages[imageKey] || productImages["default"];
      return images[index % images.length];
    }
  }

  // Fall back to category-based matching
  const categoryKey = categoryKeywordMap[category.toLowerCase()] || "default";
  const images = productImages[categoryKey] || productImages["default"];
  return images[index % images.length];
}

/**
 * Get seller avatar — uses initials on a colored background.
 */
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
