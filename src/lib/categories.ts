export interface Subcategory {
  name: string;
  slug: string;
}

export interface Category {
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: Subcategory[];
}

export const CATEGORIES: Category[] = [
  {
    name: "Mobile Phones",
    slug: "mobile-phones",
    icon: "📱",
    description: "Smartphones, feature phones, and accessories",
    subcategories: [
      { name: "Smartphones", slug: "smartphones" },
      { name: "Feature Phones", slug: "feature-phones" },
      { name: "Phone Accessories", slug: "phone-accessories" },
      { name: "SIM Cards & Data", slug: "sim-cards-data" },
    ],
  },
  {
    name: "Computers & Laptops",
    slug: "computers-laptops",
    icon: "💻",
    description: "Laptops, desktops, monitors, and accessories",
    subcategories: [
      { name: "Laptops", slug: "laptops" },
      { name: "Desktop Computers", slug: "desktops" },
      { name: "Monitors", slug: "monitors" },
      { name: "Printers & Scanners", slug: "printers" },
      { name: "Computer Accessories", slug: "computer-accessories" },
      { name: "Networking", slug: "networking" },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    icon: "👔",
    description: "Clothes, shoes, bags, watches, and jewelry",
    subcategories: [
      { name: "Men's Clothing", slug: "mens-clothing" },
      { name: "Women's Clothing", slug: "womens-clothing" },
      { name: "Shoes", slug: "shoes" },
      { name: "Bags & Luggage", slug: "bags" },
      { name: "Watches", slug: "watches" },
      { name: "Jewelry", slug: "jewelry" },
      { name: "Children's Fashion", slug: "childrens-fashion" },
      { name: "Sunglasses", slug: "sunglasses" },
    ],
  },
  {
    name: "Home & Living",
    slug: "home-living",
    icon: "🛋️",
    description: "Furniture, appliances, decor, and kitchen items",
    subcategories: [
      { name: "Living Room Furniture", slug: "living-room" },
      { name: "Bedroom Furniture", slug: "bedroom" },
      { name: "Dining Room Furniture", slug: "dining-room" },
      { name: "Kitchen Appliances", slug: "kitchen-appliances" },
      { name: "Lighting", slug: "lighting" },
      { name: "Decor & Accessories", slug: "decor" },
      { name: "Mattresses & Beddings", slug: "mattresses" },
      { name: "Carpets & Rugs", slug: "carpets" },
    ],
  },
  {
    name: "Services",
    slug: "services",
    icon: "🔧",
    description: "Construction, repair, photography, and more",
    subcategories: [
      { name: "Construction & Renovation", slug: "construction" },
      { name: "Cleaning Services", slug: "cleaning" },
      { name: "Photography & Videography", slug: "photography" },
      { name: "Event Planning", slug: "event-planning" },
      { name: "Graphic Design", slug: "graphic-design" },
      { name: "Web Development", slug: "web-development" },
      { name: "Digital Marketing", slug: "digital-marketing" },
      { name: "Transport & Logistics", slug: "transport" },
      { name: "Security Services", slug: "security" },
    ],
  },
  {
    name: "Food & Drinks",
    slug: "food-drinks",
    icon: "🍽️",
    description: "Groceries, snacks, beverages, and farm-fresh food",
    subcategories: [
      { name: "Groceries", slug: "groceries" },
      { name: "Snacks & Confectionery", slug: "snacks" },
      { name: "Beverages", slug: "beverages" },
      { name: "Wine & Spirits", slug: "wine-spirits" },
      { name: "Farm Produce", slug: "farm-produce" },
      { name: "Coffee & Tea", slug: "coffee-tea" },
    ],
  },
  {
    name: "Agriculture",
    slug: "agriculture",
    icon: "🌾",
    description: "Farm equipment, livestock, seeds, and produce",
    subcategories: [
      { name: "Tractors & Machinery", slug: "tractors" },
      { name: "Seeds & Seedlings", slug: "seeds" },
      { name: "Fertilizers", slug: "fertilizers" },
      { name: "Livestock", slug: "livestock" },
      { name: "Farm Produce", slug: "farm-produce" },
      { name: "Irrigation", slug: "irrigation" },
    ],
  },
  {
    name: "Gaming",
    slug: "gaming",
    icon: "🎮",
    description: "Consoles, games, and gaming accessories",
    subcategories: [
      { name: "PlayStation", slug: "playstation" },
      { name: "Xbox", slug: "xbox" },
      { name: "Nintendo", slug: "nintendo" },
      { name: "PC Gaming", slug: "pc-gaming" },
      { name: "Gaming Accessories", slug: "gaming-accessories" },
      { name: "Video Games", slug: "video-games" },
    ],
  },
  {
    name: "Health & Beauty",
    slug: "health-beauty",
    icon: "💄",
    description: "Cosmetics, skincare, hair products, and wellness",
    subcategories: [
      { name: "Cosmetics", slug: "cosmetics" },
      { name: "Skincare", slug: "skincare" },
      { name: "Hair Care", slug: "hair-care" },
      { name: "Fragrances", slug: "fragrances" },
      { name: "Personal Care", slug: "personal-care" },
      { name: "Health Supplements", slug: "supplements" },
    ],
  },
  {
    name: "Sports & Fitness",
    slug: "sports-fitness",
    icon: "⚽",
    description: "Equipment, apparel, and outdoor gear",
    subcategories: [
      { name: "Fitness Equipment", slug: "fitness-equipment" },
      { name: "Team Sports", slug: "team-sports" },
      { name: "Cycling", slug: "cycling" },
      { name: "Running", slug: "running" },
      { name: "Swimming", slug: "swimming" },
      { name: "Camping & Hiking", slug: "camping" },
    ],
  },
  {
    name: "Baby & Kids",
    slug: "baby-kids",
    icon: "👶",
    description: "Clothing, toys, strollers, and furniture for children",
    subcategories: [
      { name: "Baby Clothing", slug: "baby-clothing" },
      { name: "Kids Clothing", slug: "kids-clothing" },
      { name: "Toys", slug: "toys" },
      { name: "Strollers & Prams", slug: "strollers" },
      { name: "Baby Cots & Cribs", slug: "cots" },
      { name: "Car Seats", slug: "car-seats" },
    ],
  },
  {
    name: "Handmade & Art",
    slug: "handmade-art",
    icon: "🎨",
    description: "Crafts, artwork, jewelry, and vintage items",
    subcategories: [
      { name: "Paintings", slug: "paintings" },
      { name: "Sculptures", slug: "sculptures" },
      { name: "Handmade Jewelry", slug: "handmade-jewelry" },
      { name: "Traditional Crafts", slug: "traditional-crafts" },
      { name: "Wood Carvings", slug: "wood-carvings" },
      { name: "Beadwork", slug: "beadwork" },
    ],
  },
  {
    name: "Events & Tickets",
    slug: "events-tickets",
    icon: "🎫",
    description: "Concerts, sports events, festivals, and theatre tickets",
    subcategories: [
      { name: "Concert Tickets", slug: "concert-tickets" },
      { name: "Sports Events", slug: "sports-events" },
      { name: "Festivals", slug: "festivals" },
      { name: "Theatre & Arts", slug: "theatre" },
      { name: "Conference Tickets", slug: "conference-tickets" },
    ],
  },
  {
    name: "Business & Industrial",
    slug: "business-industrial",
    icon: "🏭",
    description: "Office equipment, supplies, and machinery",
    subcategories: [
      { name: "Office Equipment", slug: "office-equipment" },
      { name: "Commercial Kitchen", slug: "commercial-kitchen" },
      { name: "Industrial Machinery", slug: "industrial-machinery" },
      { name: "POS Systems", slug: "pos-systems" },
      { name: "Power Generators", slug: "generators" },
      { name: "Solar Equipment", slug: "solar" },
    ],
  },
  {
    name: "TVs & Video",
    slug: "tvs-video",
    icon: "📺",
    description: "Televisions, projectors, and media players",
    subcategories: [
      { name: "Televisions", slug: "televisions" },
      { name: "Projectors", slug: "projectors" },
      { name: "Home Theaters", slug: "home-theaters" },
      { name: "Soundbars", slug: "soundbars" },
      { name: "Streaming Devices", slug: "streaming-devices" },
    ],
  },
  {
    name: "Pets",
    slug: "pets",
    icon: "🐾",
    description: "Pet food, supplies, and accessories",
    subcategories: [
      { name: "Dogs", slug: "dogs" },
      { name: "Cats", slug: "cats" },
      { name: "Birds", slug: "birds" },
      { name: "Fish & Aquariums", slug: "fish" },
      { name: "Pet Food", slug: "pet-food" },
      { name: "Pet Accessories", slug: "pet-accessories" },
    ],
  },
  {
    name: "Learning & Books",
    slug: "learning-books",
    icon: "📚",
    description: "Textbooks, courses, educational materials, and stationery",
    subcategories: [
      { name: "Textbooks", slug: "textbooks" },
      { name: "Stationery", slug: "stationery" },
      { name: "School Uniforms", slug: "school-uniforms" },
      { name: "Online Courses", slug: "online-courses" },
      { name: "Tutoring Services", slug: "tutoring" },
    ],
  },
  {
    name: "Music & Entertainment",
    slug: "music-entertainment",
    icon: "🎵",
    description: "Instruments, speakers, party equipment, and more",
    subcategories: [
      { name: "Musical Instruments", slug: "instruments" },
      { name: "Speakers & Audio", slug: "speakers" },
      { name: "DJ Equipment", slug: "dj-equipment" },
      { name: "Karaoke", slug: "karaoke" },
      { name: "Party Supplies", slug: "party-supplies" },
    ],
  },
  {
    name: "Stays & Experiences",
    slug: "stays-experiences",
    icon: "🏨",
    description: "Hotels, short stays, restaurants, tours, and venues",
    subcategories: [
      { name: "Hotels & Accommodation", slug: "hotels" },
      { name: "Apartments & Short Stays", slug: "apartments-short-stays" },
      { name: "Restaurants & Bars", slug: "restaurants-bars" },
      { name: "Travel & Tours", slug: "travel-tours" },
      { name: "Venues & Spaces", slug: "venues-spaces" },
    ],
  },
  {
    name: "Rentals",
    slug: "rentals",
    icon: "🔑",
    description: "Cars, tools, event equipment, and spaces you rent",
    subcategories: [
      { name: "Cars & Motorbikes", slug: "cars-motorbikes" },
      { name: "Equipment & Tools", slug: "equipment-tools" },
      { name: "Event Equipment", slug: "event-equipment" },
      { name: "Spaces & Venues", slug: "spaces-venues" },
    ],
  },
];

/**
 * RETIRED top-level categories — kept out of the browsing UI, but their slugs
 * still resolve everywhere via CATEGORY_ALIASES (src/lib/market-sections.ts):
 *  - "jobs"             → hiring/work lives in Services & Freelance workflows
 *  - "animals-pets"     → merged into "pets"
 *  - "school-education" → merged into "learning-books"
 *  - "property"         → surfaced under Rentals (houses & apartments)
 *
 * The marketplace browses by the five MARKET_SECTIONS (Products, Services,
 * Stays & Experiences, Rentals, Freelance) — see src/lib/market-sections.ts.
 */

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getSubcategoryBySlug(categorySlug: string, subcategorySlug: string): Subcategory | undefined {
  const category = getCategoryBySlug(categorySlug);
  return category?.subcategories.find((s) => s.slug === subcategorySlug);
}

// Dynamic specification templates for product listing
export const SPECS_TEMPLATES: Record<string, { label: string; type: "text" | "select"; options?: string[] }[]> = {
  // === MOBILE PHONES ===
  smartphones: [
    { label: "Brand", type: "select", options: ["Apple", "Samsung", "Tecno", "Infinix", "Nokia", "Huawei", "Xiaomi", "Oppo", "Vivo", "Google", "OnePlus", "Sony", "Realme", "Itel", "Other"] },
    { label: "Model", type: "text" },
    { label: "Storage", type: "select", options: ["8GB", "16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
    { label: "RAM", type: "select", options: ["1GB", "2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"] },
    { label: "Screen Size", type: "select", options: ['4.0"', '4.7"', '5.0"', '5.5"', '6.0"', '6.1"', '6.4"', '6.5"', '6.7"', '7.0"+'] },
    { label: "Network", type: "select", options: ["2G", "3G", "4G", "5G"] },
    { label: "SIM Type", type: "select", options: ["Single SIM", "Dual SIM", "eSIM"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used", "Refurbished", "Open Box"] },
    { label: "Battery Health", type: "select", options: ["100%", "90%+", "80%+", "70%+", "Below 70%"] },
  ],
  "feature-phones": [
    { label: "Brand", type: "select", options: ["Nokia", "Samsung", "Tecno", "Itel", "Other"] },
    { label: "Model", type: "text" },
    { label: "Condition", type: "select", options: ["Brand New", "Used"] },
  ],
  // === COMPUTERS ===
  laptops: [
    { label: "Brand", type: "select", options: ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "Microsoft", "Samsung", "Huawei", "Toshiba", "Other"] },
    { label: "Model", type: "text" },
    { label: "Processor", type: "select", options: ["Intel Celeron", "Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9", "Apple M1", "Apple M2", "Apple M3", "Apple M4"] },
    { label: "RAM", type: "select", options: ["2GB", "4GB", "8GB", "16GB", "32GB", "64GB"] },
    { label: "Storage Type", type: "select", options: ["SSD", "HDD", "SSHD", "eMMC"] },
    { label: "Storage Size", type: "select", options: ["128GB", "256GB", "512GB", "1TB", "2TB"] },
    { label: "Screen Size", type: "select", options: ['11.6"', '12.5"', '13.3"', '14"', '15.6"', '16"', '17.3"'] },
    { label: "Screen Resolution", type: "select", options: ["HD (1366x768)", "Full HD (1920x1080)", "2K", "4K (3840x2160)"] },
    { label: "Touchscreen", type: "select", options: ["Yes", "No"] },
    { label: "Operating System", type: "select", options: ["Windows 10", "Windows 11", "macOS", "Linux", "ChromeOS", "No OS"] },
    { label: "Graphics", type: "select", options: ["Integrated", "Intel Iris Xe", "NVIDIA GeForce", "AMD Radeon", "Apple GPU"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used", "Refurbished"] },
  ],
  desktops: [
    { label: "Brand", type: "select", options: ["Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "Custom Build", "Other"] },
    { label: "Model", type: "text" },
    { label: "Processor", type: "select", options: ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "AMD Ryzen 9"] },
    { label: "RAM", type: "select", options: ["4GB", "8GB", "16GB", "32GB", "64GB"] },
    { label: "Storage", type: "select", options: ["256GB SSD", "512GB SSD", "1TB SSD", "1TB HDD", "2TB HDD"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used", "Refurbished"] },
  ],
  monitors: [
    { label: "Brand", type: "select", options: ["Samsung", "LG", "Dell", "HP", "Lenovo", "Asus", "Acer", "BenQ", "Philips", "Other"] },
    { label: "Screen Size", type: "select", options: ['19"', '21.5"', '24"', '27"', '32"', '34"', '43"+'] },
    { label: "Resolution", type: "select", options: ["HD (1366x768)", "Full HD (1920x1080)", "2K (2560x1440)", "4K (3840x2160)"] },
    { label: "Panel Type", type: "select", options: ["IPS", "VA", "TN", "OLED"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used", "Refurbished"] },
  ],
  televisions: [
    { label: "Brand", type: "select", options: ["Samsung", "LG", "Sony", "TCL", "Hisense", "Panasonic", "Philips", "Skyworth", "Other"] },
    { label: "Screen Size", type: "select", options: ['24"', '32"', '40"', '43"', '49"', '50"', '55"', '65"', '75"', '85"+'] },
    { label: "Resolution", type: "select", options: ["HD Ready (1366x768)", "Full HD (1920x1080)", "4K UHD", "8K"] },
    { label: "Smart TV", type: "select", options: ["Yes", "No"] },
    { label: "Operating System", type: "select", options: ["WebOS", "Tizen", "Android TV", "Google TV", "Roku", "Fire TV", "Other"] },
    { label: "HDR", type: "select", options: ["No", "HDR", "HDR10+", "Dolby Vision"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used", "Refurbished"] },
  ],
  // === VEHICLES (cross-listed) ===
  cars: [
    { label: "Make", type: "select", options: ["Toyota", "Honda", "Nissan", "Mitsubishi", "Subaru", "Mercedes-Benz", "BMW", "Audi", "Volkswagen", "Ford", "Mazda", "Isuzu", "Suzuki", "Lexus", "Land Rover", "Jeep", "Hyundai", "Kia", "Other"] },
    { label: "Model", type: "text" },
    { label: "Year", type: "text" },
    { label: "Mileage", type: "text" },
    { label: "Transmission", type: "select", options: ["Manual", "Automatic", "CVT", "Tiptronic"] },
    { label: "Fuel Type", type: "select", options: ["Petrol", "Diesel", "Electric", "Hybrid", "LPG/CNG"] },
    { label: "Engine Capacity", type: "select", options: ["1.0L", "1.2L", "1.4L", "1.5L", "1.6L", "1.8L", "2.0L", "2.2L", "2.4L", "2.5L", "2.7L", "3.0L", "3.5L", "4.0L", "5.0L+"] },
    { label: "Body Type", type: "select", options: ["Sedan", "SUV", "Hatchback", "Coupe", "Convertible", "Wagon", "Pickup", "Van", "Minivan"] },
    { label: "Color", type: "select", options: ["Black", "White", "Silver", "Grey", "Blue", "Red", "Green", "Gold", "Brown", "Maroon", "Other"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used", "Accident-Free", "Rebuilt", "Salvage"] },
    { label: "Number of Owners", type: "select", options: ["0", "1", "2", "3", "4", "5+"] },
    { label: "Drive Type", type: "select", options: ["2WD", "4WD", "AWD"] },
  ],
  motorcycles: [
    { label: "Make", type: "select", options: ["Honda", "Yamaha", "Suzuki", "Kawasaki", "Bajaj", "TVS", "Piaggio", "Other"] },
    { label: "Model", type: "text" },
    { label: "Year", type: "text" },
    { label: "Mileage", type: "text" },
    { label: "Engine Capacity", type: "text" },
    { label: "Fuel Type", type: "select", options: ["Petrol", "Diesel", "Electric"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used"] },
  ],
  // === FASHION ===
  shoes: [
    { label: "Type", type: "select", options: ["Sneakers", "Boots", "Sandals", "Formal/Office", "Sports", "Casual", "Loafers", "Heels", "Flats", "Slippers"] },
    { label: "Brand", type: "text" },
    { label: "Size", type: "select", options: ["EU 35", "EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46", "EU 47"] },
    { label: "Color", type: "select", options: ["Black", "White", "Brown", "Beige", "Navy Blue", "Red", "Green", "Gold", "Silver", "Multi-color"] },
    { label: "Material", type: "select", options: ["Leather", "Synthetic", "Suede", "Canvas", "Fabric", "Rubber"] },
    { label: "Gender", type: "select", options: ["Men", "Women", "Unisex", "Boys", "Girls"] },
    { label: "Condition", type: "select", options: ["Brand New", "New without Tags", "Used - Excellent", "Used - Good"] },
  ],
  "mens-clothing": [
    { label: "Type", type: "select", options: ["T-Shirts", "Shirts", "Jeans", "Trousers", "Shorts", "Jackets", "Hoodies", "Suits", "Blazers", "Tracksuits"] },
    { label: "Size", type: "select", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"] },
    { label: "Color", type: "text" },
    { label: "Material", type: "select", options: ["Cotton", "Polyester", "Wool", "Denim", "Leather", "Linen", "Silk"] },
    { label: "Condition", type: "select", options: ["Brand New", "New without Tags", "Used - Excellent", "Used - Good"] },
  ],
  "womens-clothing": [
    { label: "Type", type: "select", options: ["Dresses", "Tops", "Blouses", "Skirts", "Jeans", "Trousers", "Jackets", "Sweaters", "Swimwear", "Lingerie"] },
    { label: "Size", type: "select", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
    { label: "Color", type: "text" },
    { label: "Material", type: "select", options: ["Cotton", "Polyester", "Silk", "Linen", "Chiffon", "Denim", "Leather"] },
    { label: "Condition", type: "select", options: ["Brand New", "New without Tags", "Used - Excellent", "Used - Good"] },
  ],
  bags: [
    { label: "Type", type: "select", options: ["Handbag", "Backpack", "Shoulder Bag", "Crossbody", "Clutch", "Travel Bag", "Laptop Bag", "Tote"] },
    { label: "Brand", type: "text" },
    { label: "Material", type: "select", options: ["Leather", "Synthetic", "Canvas", "Nylon", "PU Leather", "Fabric"] },
    { label: "Color", type: "text" },
    { label: "Condition", type: "select", options: ["Brand New", "New without Tags", "Used - Excellent", "Used - Good"] },
  ],
  watches: [
    { label: "Brand", type: "text" },
    { label: "Type", type: "select", options: ["Analog", "Digital", "Smart Watch", "Chronograph", "Automatic"] },
    { label: "Material", type: "select", options: ["Stainless Steel", "Leather", "Rubber", "Ceramic", "Titanium", "Plastic"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used - Excellent", "Used - Good"] },
  ],
  jewelry: [
    { label: "Type", type: "select", options: ["Necklace", "Ring", "Bracelet", "Earrings", "Pendant", "Anklet", "Brooch"] },
    { label: "Material", type: "select", options: ["Gold", "Silver", "Platinum", "Stainless Steel", "Copper", "Brass", "Beads"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used"] },
  ],
  // === HOME ===
  "living-room": [
    { label: "Type", type: "select", options: ["Sofa", "Loveseat", "Armchair", "Recliner", "Coffee Table", "TV Stand", "Bookshelf", "Shelf Unit"] },
    { label: "Material", type: "select", options: ["Wood", "Metal", "Fabric", "Leather", "PU Leather", "Glass", "Rattan"] },
    { label: "Color", type: "text" },
    { label: "Style", type: "select", options: ["Modern", "Contemporary", "Traditional", "Vintage", "Industrial", "Minimalist"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used", "Vintage"] },
  ],
  bedroom: [
    { label: "Type", type: "select", options: ["Bed", "Wardrobe", "Dresser", "Nightstand", "Headboard", "Chest of Drawers"] },
    { label: "Size", type: "select", options: ["Single", "Double", "Queen", "King"] },
    { label: "Material", type: "select", options: ["Wood", "Metal", "Upholstered", "MDF"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used"] },
  ],
  "dining-room": [
    { label: "Type", type: "select", options: ["Dining Table", "Dining Chairs", "Dining Set", "Cabinet", "Sideboard"] },
    { label: "Material", type: "select", options: ["Wood", "Glass", "Metal", "Marble"] },
    { label: "Seating Capacity", type: "select", options: ["2", "4", "6", "8", "10+"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used"] },
  ],
  "kitchen-appliances": [
    { label: "Type", type: "select", options: ["Refrigerator", "Microwave", "Oven", "Cooker", "Blender", "Toaster", "Kettle", "Dishwasher"] },
    { label: "Brand", type: "text" },
    { label: "Capacity", type: "text" },
    { label: "Condition", type: "select", options: ["Brand New", "Used - Excellent", "Used - Good"] },
  ],
  // === HEALTH & BEAUTY ===
  cosmetics: [
    { label: "Type", type: "select", options: ["Foundation", "Concealer", "Powder", "Blush", "Eyeshadow", "Mascara", "Lipstick", "Lipgloss", "Nail Polish"] },
    { label: "Brand", type: "text" },
    { label: "Shade", type: "text" },
    { label: "Skin Type", type: "select", options: ["All", "Dry", "Oily", "Combination", "Sensitive", "Normal"] },
    { label: "Condition", type: "select", options: ["New", "Used (once/twice)"] },
  ],
  skincare: [
    { label: "Type", type: "select", options: ["Cleanser", "Moisturizer", "Serum", "Sunscreen", "Toner", "Exfoliator", "Face Mask", "Eye Cream"] },
    { label: "Brand", type: "text" },
    { label: "Skin Type", type: "select", options: ["All", "Dry", "Oily", "Combination", "Sensitive", "Normal"] },
    { label: "Condition", type: "select", options: ["New", "Used"] },
  ],
  "hair-care": [
    { label: "Type", type: "select", options: ["Shampoo", "Conditioner", "Hair Oil", "Hair Cream", "Hair Spray", "Wig", "Weave", "Extensions", "Braids"] },
    { label: "Brand", type: "text" },
    { label: "Hair Type", type: "select", options: ["Natural", "Relaxed", "Curly", "Straight", "Kinky"] },
    { label: "Condition", type: "select", options: ["New", "Used"] },
  ],
  fragrances: [
    { label: "Type", type: "select", options: ["Perfume", "Cologne", "Body Mist", "Oil", "Attar"] },
    { label: "Brand", type: "text" },
    { label: "Size", type: "text" },
    { label: "For", type: "select", options: ["Men", "Women", "Unisex"] },
    { label: "Condition", type: "select", options: ["New", "Used"] },
  ],
  // === BABY & KIDS ===
  "baby-clothing": [
    { label: "Type", type: "select", options: ["Bodysuits", "Rompers", "Onesies", "T-Shirts", "Pants", "Dresses", "Sleepsuits", "Jackets"] },
    { label: "Size", type: "select", options: ["Newborn", "0-3M", "3-6M", "6-9M", "9-12M", "12-18M", "18-24M", "2T", "3T", "4T", "5T"] },
    { label: "Material", type: "select", options: ["Cotton", "Organic Cotton", "Bamboo", "Polyester", "Wool"] },
    { label: "Gender", type: "select", options: ["Boy", "Girl", "Unisex"] },
    { label: "Condition", type: "select", options: ["New", "Used - Excellent", "Used - Good"] },
  ],
  toys: [
    { label: "Type", type: "select", options: ["Action Figures", "Dolls", "Board Games", "Puzzles", "LEGO", "Outdoor", "Educational", "Electronic", "Stuffed Animals"] },
    { label: "Age Range", type: "select", options: ["0-12 months", "1-3 years", "3-5 years", "5-8 years", "8-12 years", "12+ years"] },
    { label: "Condition", type: "select", options: ["New", "Used - Excellent", "Used - Good"] },
  ],
  // === SERVICES ===
  construction: [
    { label: "Service Type", type: "select", options: ["House Construction", "Renovation", "Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Flooring"] },
    { label: "Experience", type: "select", options: ["1-3 years", "3-5 years", "5-10 years", "10+ years"] },
    { label: "Availability", type: "select", options: ["Immediately", "Within a week", "Within a month"] },
  ],
  photography: [
    { label: "Service Type", type: "select", options: ["Wedding", "Event", "Portrait", "Product", "Commercial", "Real Estate", "Drone/Aerial"] },
    { label: "Includes", type: "text" },
    { label: "Turnaround", type: "select", options: ["Same Day", "1-3 Days", "1 Week", "2 Weeks"] },
  ],
  // === JOBS ===
  "it-software": [
    { label: "Job Type", type: "select", options: ["Full-Time", "Part-Time", "Contract", "Freelance", "Internship"] },
    { label: "Experience Level", type: "select", options: ["Entry Level (0-1 yr)", "Junior (1-3 yrs)", "Mid-Level (3-5 yrs)", "Senior (5-8 yrs)", "Executive (8+ yrs)"] },
    { label: "Salary Range", type: "text" },
    { label: "Education", type: "select", options: ["High School", "Diploma", "Bachelor's", "Master's", "PhD", "Professional Certificate"] },
  ],
  // === GAMING ===
  playstation: [
    { label: "Model", type: "select", options: ["PS5", "PS5 Digital", "PS4 Pro", "PS4 Slim", "PS4", "PS3", "PS Vita", "PSP"] },
    { label: "Storage", type: "select", options: ["256GB", "500GB", "1TB", "2TB"] },
    { label: "Controller Included", type: "select", options: ["Yes", "No"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used - Excellent", "Used - Good"] },
  ],
  xbox: [
    { label: "Model", type: "select", options: ["Xbox Series X", "Xbox Series S", "Xbox One X", "Xbox One S", "Xbox One"] },
    { label: "Storage", type: "select", options: ["500GB", "1TB", "2TB"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used - Excellent", "Used - Good"] },
  ],
  "pc-gaming": [
    { label: "Component", type: "select", options: ["Gaming PC", "Graphics Card", "Gaming Monitor", "Gaming Chair", "Gaming Desk"] },
    { label: "Brand", type: "text" },
    { label: "Condition", type: "select", options: ["Brand New", "Used"] },
  ],
  // === SPORTS ===
  "fitness-equipment": [
    { label: "Type", type: "select", options: ["Treadmill", "Exercise Bike", "Weights", "Bench", "Yoga Mat", "Resistance Bands", "Dumbbells", "Barbell", "Multi-Gym"] },
    { label: "Brand", type: "text" },
    { label: "Condition", type: "select", options: ["Brand New", "Used - Excellent", "Used - Good"] },
  ],
  // === PETS ===
  dogs: [
    { label: "Breed", type: "text" },
    { label: "Age", type: "select", options: ["Puppy (0-6 months)", "Young (6-12 months)", "Adult (1-7 years)", "Senior (7+ years)"] },
    { label: "Gender", type: "select", options: ["Male", "Female"] },
    { label: "Vaccinated", type: "select", options: ["Yes", "No"] },
    { label: "Condition", type: "select", options: ["Healthy", "Needs Care"] },
  ],
  cats: [
    { label: "Breed", type: "text" },
    { label: "Age", type: "select", options: ["Kitten (0-6 months)", "Young (6-12 months)", "Adult (1-7 years)", "Senior (7+ years)"] },
    { label: "Gender", type: "select", options: ["Male", "Female"] },
    { label: "Vaccinated", type: "select", options: ["Yes", "No"] },
    { label: "Condition", type: "select", options: ["Healthy", "Needs Care"] },
  ],
  // === AGRICULTURE ===
  tractors: [
    { label: "Brand", type: "select", options: ["Massey Ferguson", "John Deere", "New Holland", "Case IH", "Kubota", "Other"] },
    { label: "Model", type: "text" },
    { label: "Year", type: "text" },
    { label: "Horsepower", type: "select", options: ["<50HP", "50-75HP", "75-100HP", "100-150HP", "150-200HP", "200+HP"] },
    { label: "Hours Used", type: "text" },
    { label: "Condition", type: "select", options: ["New", "Used"] },
  ],
  // === BUSINESS ===
  generators: [
    { label: "Brand", type: "select", options: ["Honda", "Yamaha", "Caterpillar", "Cummins", "Perkins", "Other"] },
    { label: "Power Output", type: "select", options: ["1-5 KVA", "5-10 KVA", "10-20 KVA", "20-50 KVA", "50-100 KVA", "100+ KVA"] },
    { label: "Fuel Type", type: "select", options: ["Diesel", "Petrol", "Gas", "Hybrid"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used"] },
  ],
  solar: [
    { label: "Type", type: "select", options: ["Solar Panel", "Inverter", "Battery", "Complete System", "Charge Controller"] },
    { label: "Power Output", type: "text" },
    { label: "Brand", type: "text" },
    { label: "Condition", type: "select", options: ["Brand New", "Used"] },
  ],
  // === LEARNING ===
  textbooks: [
    { label: "Level", type: "select", options: ["Primary", "Secondary", "University", "Professional"] },
    { label: "Subject", type: "text" },
    { label: "Author", type: "text" },
    { label: "Condition", type: "select", options: ["New", "Good", "Fair", "Worn"] },
  ],
};
