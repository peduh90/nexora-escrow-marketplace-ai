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
    name: "Vehicles",
    slug: "vehicles",
    icon: "🚗",
    description: "Cars, motorcycles, trucks, and vehicle parts",
    subcategories: [
      { name: "Cars", slug: "cars" },
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Trucks", slug: "trucks" },
      { name: "Buses", slug: "buses" },
      { name: "Vehicle Parts", slug: "vehicle-parts" },
      { name: "Tyres", slug: "tyres" },
      { name: "Car Accessories", slug: "car-accessories" },
      { name: "Vehicle Services", slug: "vehicle-services" },
    ],
  },
  {
    name: "Property",
    slug: "property",
    icon: "🏠",
    description: "Houses, apartments, land, and commercial property",
    subcategories: [
      { name: "Houses for Sale", slug: "houses-for-sale" },
      { name: "Houses for Rent", slug: "houses-for-rent" },
      { name: "Apartments", slug: "apartments" },
      { name: "Land", slug: "land" },
      { name: "Commercial Property", slug: "commercial-property" },
      { name: "Offices", slug: "offices" },
      { name: "Short Stay", slug: "short-stay" },
      { name: "New Developments", slug: "new-developments" },
    ],
  },
  {
    name: "Phones & Tablets",
    slug: "phones-tablets",
    icon: "📱",
    description: "Mobile phones, tablets, smart watches, and accessories",
    subcategories: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "iPhones", slug: "iphones" },
      { name: "Samsung", slug: "samsung" },
      { name: "Android Phones", slug: "android-phones" },
      { name: "Tablets", slug: "tablets" },
      { name: "Smart Watches", slug: "smart-watches" },
      { name: "Phone Accessories", slug: "phone-accessories" },
      { name: "Chargers", slug: "chargers" },
      { name: "Earphones", slug: "earphones" },
    ],
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: "💻",
    description: "Laptops, desktops, TVs, cameras, gaming, and more",
    subcategories: [
      { name: "Laptops", slug: "laptops" },
      { name: "Desktop Computers", slug: "desktop-computers" },
      { name: "Monitors", slug: "monitors" },
      { name: "TVs", slug: "tvs" },
      { name: "Cameras", slug: "cameras" },
      { name: "Printers", slug: "printers" },
      { name: "Gaming", slug: "gaming" },
      { name: "Networking", slug: "networking" },
      { name: "Computer Accessories", slug: "computer-accessories" },
      { name: "Audio Equipment", slug: "audio-equipment" },
      { name: "Security Equipment", slug: "security-equipment" },
    ],
  },
  {
    name: "Home & Furniture",
    slug: "home-furniture",
    icon: "🛋️",
    description: "Beds, sofas, tables, kitchen appliances, and home decor",
    subcategories: [
      { name: "Beds", slug: "beds" },
      { name: "Sofas", slug: "sofas" },
      { name: "Tables", slug: "tables" },
      { name: "Chairs", slug: "chairs" },
      { name: "Cabinets", slug: "cabinets" },
      { name: "Kitchen Appliances", slug: "kitchen-appliances" },
      { name: "Refrigerators", slug: "refrigerators" },
      { name: "Washing Machines", slug: "washing-machines" },
      { name: "Cookers", slug: "cookers" },
      { name: "Lighting", slug: "lighting" },
      { name: "Home Decor", slug: "home-decor" },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    icon: "👔",
    description: "Men's, women's and children's fashion, shoes, bags, and jewelry",
    subcategories: [
      { name: "Men's Fashion", slug: "mens-fashion" },
      { name: "Women's Fashion", slug: "womens-fashion" },
      { name: "Shoes", slug: "shoes" },
      { name: "Bags", slug: "bags" },
      { name: "Watches", slug: "watches" },
      { name: "Jewellery", slug: "jewellery" },
      { name: "Children's Fashion", slug: "childrens-fashion" },
    ],
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    icon: "💄",
    description: "Hair, skin care, makeup, fragrance, and personal care",
    subcategories: [
      { name: "Hair", slug: "hair" },
      { name: "Skin Care", slug: "skin-care" },
      { name: "Makeup", slug: "makeup" },
      { name: "Fragrance", slug: "fragrance" },
      { name: "Personal Care", slug: "personal-care" },
      { name: "Beauty Equipment", slug: "beauty-equipment" },
    ],
  },
  {
    name: "Services",
    slug: "services",
    icon: "🔧",
    description: "IT, construction, cleaning, repair, transport, and more",
    subcategories: [
      { name: "IT Services", slug: "it-services" },
      { name: "Construction", slug: "construction" },
      { name: "Cleaning", slug: "cleaning" },
      { name: "Repair", slug: "repair" },
      { name: "Transport", slug: "transport" },
      { name: "Photography", slug: "photography" },
      { name: "Education", slug: "education" },
      { name: "Events", slug: "events" },
      { name: "Business Services", slug: "business-services" },
      { name: "Professional Services", slug: "professional-services" },
    ],
  },
  {
    name: "Agriculture",
    slug: "agriculture",
    icon: "🌾",
    description: "Farm equipment, seeds, fertilizer, animals, and produce",
    subcategories: [
      { name: "Farm Equipment", slug: "farm-equipment" },
      { name: "Seeds", slug: "seeds" },
      { name: "Fertilizer", slug: "fertilizer" },
      { name: "Animals", slug: "animals" },
      { name: "Produce", slug: "produce" },
      { name: "Machinery", slug: "machinery" },
    ],
  },
  {
    name: "Jobs",
    slug: "jobs",
    icon: "💼",
    description: "Full time, part time, freelance, internship, and remote jobs",
    subcategories: [
      { name: "Full Time", slug: "full-time" },
      { name: "Part Time", slug: "part-time" },
      { name: "Freelance", slug: "freelance" },
      { name: "Internship", slug: "internship" },
      { name: "Remote", slug: "remote" },
      { name: "Seeking Work", slug: "seeking-work" },
    ],
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getSubcategoryBySlug(categorySlug: string, subcategorySlug: string): Subcategory | undefined {
  const category = getCategoryBySlug(categorySlug);
  return category?.subcategories.find((s) => s.slug === subcategorySlug);
}

// Dynamic specifications per category
export const CATEGORY_SPECS: Record<string, string[]> = {
  laptops: ["Brand", "Model", "Processor", "CPU Generation", "RAM", "Storage", "GPU", "Screen Size", "Resolution", "Operating System", "Battery", "Condition", "Warranty"],
  desktops: ["Brand", "Model", "Processor", "RAM", "Storage", "GPU", "Operating System", "Condition"],
  "mobile-phones": ["Brand", "Model", "Storage", "RAM", "Battery Health", "Camera", "Display", "SIM", "Condition", "Warranty"],
  iphones: ["Model", "Storage", "Color", "Battery Health", "Camera", "Display", "Condition", "Warranty", "Face ID"],
  samsung: ["Model", "Storage", "RAM", "Battery Health", "Camera", "Display", "Condition", "Warranty"],
  cars: ["Make", "Model", "Year", "Mileage", "Engine", "Transmission", "Fuel", "Drive", "Condition", "Registration"],
  motorcycles: ["Make", "Model", "Year", "Mileage", "Engine", "Condition", "Registration"],
  "smart-watches": ["Brand", "Model", "Display", "Battery", "Features", "Condition", "Warranty"],
  tvs: ["Brand", "Model", "Screen Size", "Resolution", "Smart TV", "Condition", "Warranty"],
  cameras: ["Brand", "Model", "Type", "Resolution", "Lens", "Condition", "Warranty"],
  gaming: ["Brand", "Model", "Type", "Storage", "Condition", "Warranty"],
  tablets: ["Brand", "Model", "Storage", "RAM", "Display", "Condition", "Warranty"],
  watches: ["Brand", "Model", "Type", "Material", "Condition"],
  shoes: ["Brand", "Size", "Color", "Material", "Condition"],
  bags: ["Brand", "Type", "Material", "Color", "Condition"],
};

// Dynamic specification templates for product listing
export const SPECS_TEMPLATES: Record<string, { label: string; type: "text" | "select"; options?: string[] }[]> = {
  laptops: [
    { label: "Brand", type: "select", options: ["HP", "Dell", "Lenovo", "Apple", "Acer", "ASUS", "Samsung", "Other"] },
    { label: "Model", type: "text" },
    { label: "Processor", type: "select", options: ["Intel Core i3", "Intel Core i5", "Intel Core i7", "Intel Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "Apple M1", "Apple M2", "Apple M3"] },
    { label: "RAM", type: "select", options: ["2GB", "4GB", "8GB", "16GB", "32GB", "64GB"] },
    { label: "Storage", type: "select", options: ["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "500GB HDD", "1TB HDD"] },
    { label: "Screen Size", type: "select", options: ["11 inch", "13 inch", "14 inch", "15.6 inch", "16 inch", "17 inch"] },
    { label: "Operating System", type: "select", options: ["Windows 10", "Windows 11", "macOS", "Linux", "Chrome OS"] },
    { label: "GPU", type: "text" },
    { label: "Battery", type: "select", options: ["Excellent", "Good", "Fair", "Needs Replacement"] },
  ],
  "mobile-phones": [
    { label: "Brand", type: "select", options: ["Samsung", "Apple", "Xiaomi", "Tecno", "Infinix", "Huawei", "OnePlus", "Google", "Other"] },
    { label: "Model", type: "text" },
    { label: "Storage", type: "select", options: ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
    { label: "RAM", type: "select", options: ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB"] },
    { label: "Battery Health", type: "select", options: ["100%", "90%+", "80%+", "70%+", "Below 70%"] },
    { label: "Camera", type: "text" },
    { label: "Display", type: "select", options: ["AMOLED", "LCD", "OLED", "IPS"] },
    { label: "Condition", type: "select", options: ["Brand New", "Used - Like New", "Used - Good", "Used - Fair", "Refurbished"] },
  ],
  cars: [
    { label: "Make", type: "select", options: ["Toyota", "Nissan", "Honda", "Mazda", "Subaru", "Mercedes-Benz", "BMW", "Volkswagen", "Hyundai", "Kia", "Ford", "Other"] },
    { label: "Model", type: "text" },
    { label: "Year", type: "text" },
    { label: "Mileage", type: "text" },
    { label: "Engine", type: "select", options: ["1000cc", "1300cc", "1500cc", "1800cc", "2000cc", "2500cc", "3000cc", "Other"] },
    { label: "Transmission", type: "select", options: ["Automatic", "Manual"] },
    { label: "Fuel", type: "select", options: ["Petrol", "Diesel", "Hybrid", "Electric"] },
    { label: "Drive", type: "select", options: ["2WD", "4WD", "AWD"] },
    { label: "Condition", type: "select", options: ["New", "Used"] },
    { label: "Registration", type: "text" },
  ],
};
