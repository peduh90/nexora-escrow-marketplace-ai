export interface SampleProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  condition: "Brand New" | "Used - Like New" | "Used - Good" | "Used - Fair" | "Refurbished";
  category: string;
  subcategory: string;
  description: string;
  specifications: Record<string, string>;
  images: number;
  location: { county: string; town: string };
  seller: {
    id: string;
    name: string;
    verified: boolean;
    rating: number;
    reviews: number;
    products: number;
    sales: number;
    responseRate: string;
    responseTime: string;
    memberSince: string;
  };
  escrowProtected: boolean;
  deliveryAvailable: boolean;
  negotiable: boolean;
  views: number;
  favorites: number;
  postedAt: string;
  status: "active" | "sold" | "pending" | "featured";
}

const defaultSeller = (name: string, id: string) => ({
  id, name, verified: true, rating: 4.7, reviews: 120, products: 60, sales: 340,
  responseRate: "95%", responseTime: "Within 15 minutes", memberSince: "2023",
});

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  // ===== ELECTRONICS - LAPTOPS =====
  {
    id: "p1", title: "HP EliteBook 840 G3", price: 22000, originalPrice: 28000, condition: "Used - Good",
    category: "electronics", subcategory: "laptops",
    description: "Clean and reliable business laptop suitable for students, office work, programming, browsing and freelancing. Comes with original charger. Battery lasts 4+ hours.",
    specifications: { Brand: "HP", Model: "EliteBook 840 G3", Processor: "Intel Core i7-6600U", RAM: "8GB DDR4", Storage: "256GB SSD", "Screen Size": "14 inch", Resolution: "1920x1080", "Operating System": "Windows 11 Pro" },
    images: 4, location: { county: "Nairobi", town: "Westlands" }, seller: defaultSeller("TechZone Kenya", "s1"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 1247, favorites: 89, postedAt: "2 days ago", status: "active",
  },
  {
    id: "p9", title: "MacBook Pro 14\" M3 Max", price: 285000, originalPrice: 320000, condition: "Brand New",
    category: "electronics", subcategory: "laptops",
    description: "Brand new, sealed MacBook Pro 14 inch with M3 Max chip. 36GB RAM, 1TB SSD. Space Black. Apple warranty included.",
    specifications: { Brand: "Apple", Model: "MacBook Pro 14\" M3 Max", Processor: "Apple M3 Max", RAM: "36GB", Storage: "1TB SSD", "Screen Size": "14 inch", "Operating System": "macOS Sonoma" },
    images: 5, location: { county: "Nairobi", town: "Westlands" }, seller: { ...defaultSeller("AppleStore KE", "s2"), rating: 4.9 },
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 1247, favorites: 89, postedAt: "1 day ago", status: "active",
  },
  {
    id: "p17", title: "Lenovo ThinkPad X1 Carbon Gen 11", price: 95000, originalPrice: 120000, condition: "Used - Like New",
    category: "electronics", subcategory: "laptops",
    description: "Premium business ultrabook. Intel i7 13th gen, 16GB RAM, 512GB SSD. 14\" 2.8K OLED display. Fingerprint + IR camera.",
    specifications: { Brand: "Lenovo", Model: "ThinkPad X1 Carbon Gen 11", Processor: "Intel i7-1365U", RAM: "16GB", Storage: "512GB SSD", "Screen Size": "14 inch" },
    images: 4, location: { county: "Nairobi", town: "Kilimani" }, seller: defaultSeller("TechZone Kenya", "s1"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 567, favorites: 34, postedAt: "3 days ago", status: "active",
  },

  // ===== PHONES =====
  {
    id: "p2", title: "iPhone 15 Pro Max 256GB", price: 142000, originalPrice: 165000, condition: "Brand New",
    category: "phones-tablets", subcategory: "iphones",
    description: "Brand new, sealed box iPhone 15 Pro Max. Natural Titanium color. 100% battery health. Apple warranty included.",
    specifications: { Model: "iPhone 15 Pro Max", Storage: "256GB", Color: "Natural Titanium", Camera: "48MP Triple Camera", Display: "6.7 inch Super Retina XDR" },
    images: 5, location: { county: "Nairobi", town: "CBD" }, seller: { ...defaultSeller("AppleStore KE", "s2"), rating: 4.9 },
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 2341, favorites: 156, postedAt: "1 day ago", status: "active",
  },
  {
    id: "p3", title: "Samsung Galaxy S24 Ultra 512GB", price: 165000, originalPrice: 185000, condition: "Brand New",
    category: "phones-tablets", subcategory: "samsung",
    description: "Factory unlocked Samsung Galaxy S24 Ultra. Titanium Black. S Pen included. AI features enabled. Dual SIM.",
    specifications: { Brand: "Samsung", Model: "Galaxy S24 Ultra", Storage: "512GB", RAM: "12GB", Camera: "200MP Quad Camera", Display: "6.8 inch Dynamic AMOLED 2X" },
    images: 4, location: { county: "Nairobi", town: "Karen" }, seller: defaultSeller("Samsung Hub KE", "s3"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 983, favorites: 67, postedAt: "3 days ago", status: "active",
  },
  {
    id: "p15", title: "Infinix Hot 40 Pro", price: 18500, condition: "Brand New",
    category: "phones-tablets", subcategory: "android-phones",
    description: "Infinix Hot 40 Pro. 256GB storage, 8GB RAM. 108MP camera. 5000mAh battery. Fast charging. Dual SIM.",
    specifications: { Brand: "Infinix", Model: "Hot 40 Pro", Storage: "256GB", RAM: "8GB", Battery: "5000mAh", Camera: "108MP" },
    images: 3, location: { county: "Nairobi", town: "Eastleigh" }, seller: defaultSeller("PhoneWorld KE", "s12"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 456, favorites: 34, postedAt: "1 day ago", status: "active",
  },
  {
    id: "p18", title: "iPad Air M2 256GB WiFi", price: 82000, originalPrice: 95000, condition: "Brand New",
    category: "phones-tablets", subcategory: "tablets",
    description: "Apple iPad Air M2. 11-inch Liquid Retina display. 256GB storage. WiFi model. Space Gray. Apple Pencil Pro compatible.",
    specifications: { Brand: "Apple", Model: "iPad Air M2", Storage: "256GB", Display: "11 inch Liquid Retina", Processor: "Apple M2" },
    images: 3, location: { county: "Nairobi", town: "Westlands" }, seller: { ...defaultSeller("AppleStore KE", "s2"), rating: 4.9 },
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 345, favorites: 28, postedAt: "2 days ago", status: "active",
  },

  // ===== ELECTRONICS - TV & AUDIO =====
  {
    id: "p16", title: "Samsung 55\" Smart TV", price: 65000, originalPrice: 78000, condition: "Brand New",
    category: "electronics", subcategory: "tvs",
    description: "Samsung 55 inch Crystal UHD 4K Smart TV. HDR10+. Voice assistant. 3 HDMI ports. Wall mount included.",
    specifications: { Brand: "Samsung", Model: "CU8000", "Screen Size": "55 inch", Resolution: "3840x2160 (4K)", "Smart TV": "Yes - Tizen OS" },
    images: 4, location: { county: "Nairobi", town: "Luthuli Avenue" }, seller: defaultSeller("Samsung Hub KE", "s3"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 345, favorites: 28, postedAt: "3 days ago", status: "active",
  },
  {
    id: "p6", title: "Sony WH-1000XM5 Headphones", price: 38000, originalPrice: 45000, condition: "Brand New",
    category: "electronics", subcategory: "audio-equipment",
    description: "Industry-leading noise cancelling headphones. Silver color. 30-hour battery. Multipoint connection. Hi-Res Audio.",
    specifications: { Brand: "Sony", Model: "WH-1000XM5", Type: "Over-Ear Wireless", "Battery Life": "30 hours" },
    images: 3, location: { county: "Nairobi", town: "Westlands" }, seller: defaultSeller("AudioPro KE", "s6"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 445, favorites: 34, postedAt: "4 days ago", status: "active",
  },
  {
    id: "p7", title: "Dell 27\" 4K Monitor", price: 45000, originalPrice: 55000, condition: "Used - Like New",
    category: "electronics", subcategory: "monitors",
    description: "Dell UltraSharp 27\" 4K USB-C Monitor. Excellent for design and coding. Includes all cables and stand.",
    specifications: { Brand: "Dell", Model: "U2723QE", "Screen Size": "27 inch", Resolution: "3840x2160 (4K)" },
    images: 3, location: { county: "Nairobi", town: "Kilimani" }, seller: defaultSeller("TechZone Kenya", "s1"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 312, favorites: 23, postedAt: "1 week ago", status: "active",
  },
  {
    id: "p13", title: "PS5 Console Bundle", price: 72000, originalPrice: 80000, condition: "Brand New",
    category: "electronics", subcategory: "gaming",
    description: "PlayStation 5 Disc Edition. Includes 2 controllers, 3 games (Spider-Man 2, FIFA 24, GTA V), and extra headset.",
    specifications: { Brand: "Sony", Model: "PS5 Disc Edition", Storage: "825GB SSD", Type: "Console Bundle" },
    images: 5, location: { county: "Nairobi", town: "Kasarani" }, seller: defaultSeller("GameZone KE", "s10"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 567, favorites: 67, postedAt: "2 days ago", status: "active",
  },

  // ===== VEHICLES =====
  {
    id: "p4", title: "Toyota Fielder 2019", price: 1850000, originalPrice: 2100000, condition: "Used - Like New",
    category: "vehicles", subcategory: "cars",
    description: "Toyota Fielder 2019 model. Low mileage, single owner. Well maintained with full service history. Original paint. AA inspected.",
    specifications: { Make: "Toyota", Model: "Fielder", Year: "2019", Mileage: "45,000 km", Engine: "1500cc", Transmission: "Automatic", Fuel: "Petrol" },
    images: 8, location: { county: "Nairobi", town: "Langata" }, seller: defaultSeller("AutoHub Kenya", "s4"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 3456, favorites: 234, postedAt: "5 days ago", status: "active",
  },
  {
    id: "p10", title: "Subaru Forester 2020", price: 3200000, condition: "Used - Good",
    category: "vehicles", subcategory: "cars",
    description: "Subaru Forester 2020 XT. Turbocharged. EyeSight safety. All-wheel drive. Low mileage. Full service history.",
    specifications: { Make: "Subaru", Model: "Forester XT", Year: "2020", Mileage: "38,000 km", Engine: "1800cc Turbo", Drive: "AWD" },
    images: 10, location: { county: "Mombasa", town: "Nyali" }, seller: defaultSeller("AutoHub Kenya", "s4"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 4567, favorites: 312, postedAt: "2 days ago", status: "active",
  },
  {
    id: "p19", title: "Toyota Hilux 2019 Double Cab", price: 3800000, originalPrice: 4200000, condition: "Used - Like New",
    category: "vehicles", subcategory: "trucks",
    description: "Toyota Hilux 2019 double cabin. 4x4. Diesel. Low mileage. Excellent condition. Service records available.",
    specifications: { Make: "Toyota", Model: "Hilux", Year: "2019", Mileage: "52,000 km", Engine: "2400cc D-4D", Drive: "4x4", Transmission: "Automatic" },
    images: 8, location: { county: "Nairobi", town: "Industrial Area" }, seller: defaultSeller("AutoHub Kenya", "s4"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 1890, favorites: 145, postedAt: "4 days ago", status: "active",
  },
  {
    id: "p20", title: "Namaha Honda CB125", price: 85000, condition: "Brand New",
    category: "vehicles", subcategory: "motorcycles",
    description: "Brand new Honda CB125 motorcycle. Fuel efficient. Perfect for boda boda or personal use. Insurance ready.",
    specifications: { Make: "Honda", Model: "CB125", Engine: "125cc", Fuel: "Petrol", Condition: "Brand New" },
    images: 3, location: { county: "Kisumu", town: "CBD" }, seller: defaultSeller("MotorHub KE", "s13"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 234, favorites: 18, postedAt: "1 day ago", status: "active",
  },

  // ===== FASHION =====
  {
    id: "p5", title: "Nike Air Max 90 - White/Black", price: 12500, originalPrice: 15000, condition: "Brand New",
    category: "fashion", subcategory: "shoes",
    description: "Authentic Nike Air Max 90. White and black colorway. Size 42 EU. Brand new in box with tags. 100% genuine.",
    specifications: { Brand: "Nike", Size: "42 EU", Color: "White/Black", Material: "Leather and Mesh" },
    images: 4, location: { county: "Nairobi", town: "CBD" }, seller: defaultSeller("SneakerVault KE", "s5"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 654, favorites: 45, postedAt: "1 day ago", status: "active",
  },
  {
    id: "p12", title: "Ladies Genuine Leather Handbag", price: 4500, originalPrice: 6000, condition: "Brand New",
    category: "fashion", subcategory: "bags",
    description: "Genuine leather ladies handbag. Multiple compartments. Premium quality. Available in black, brown, and red.",
    specifications: { Brand: "Premium", Type: "Handbag", Material: "Genuine Leather", Color: "Black/Brown/Red" },
    images: 4, location: { county: "Nairobi", town: "CBD" }, seller: defaultSeller("Fashion Hub KE", "s9"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 345, favorites: 28, postedAt: "3 days ago", status: "active",
  },
  {
    id: "p21", title: "Adidas Originals Gazelle Shoes", price: 8500, condition: "Brand New",
    category: "fashion", subcategory: "shoes",
    description: "Adidas Gazelle Originals. Classic suede upper. Gum sole. Size 43 EU. Brand new in box.",
    specifications: { Brand: "Adidas", Model: "Gazelle", Size: "43 EU", Material: "Suede" },
    images: 3, location: { county: "Nairobi", town: "Westlands" }, seller: defaultSeller("SneakerVault KE", "s5"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 234, favorites: 19, postedAt: "2 days ago", status: "active",
  },
  {
    id: "p22", title: "Men's Swiss Watch - Gold", price: 25000, originalPrice: 35000, condition: "Brand New",
    category: "fashion", subcategory: "watches",
    description: "Luxury men's Swiss watch. Gold plated. Water resistant. Leather strap. Comes in premium box.",
    specifications: { Brand: "Swiss", Type: "Analog", Material: "Gold Plated", WaterResistant: "Yes" },
    images: 3, location: { county: "Nairobi", town: "Karen" }, seller: defaultSeller("Luxury Watch KE", "s14"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 567, favorites: 45, postedAt: "3 days ago", status: "active",
  },
  {
    id: "p23", title: "Kids School Uniform Set", price: 2500, condition: "Brand New",
    category: "fashion", subcategory: "children-fashion",
    description: "Complete school uniform set. Shirt, sweater, trousers/skirt. Sizes 6-16. Navy blue and white.",
    specifications: { Type: "School Uniform", Sizes: "6-16", Colors: "Navy Blue, White" },
    images: 2, location: { county: "Nairobi", town: "Eastleigh" }, seller: defaultSeller("Fashion Hub KE", "s9"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 189, favorites: 12, postedAt: "1 day ago", status: "active",
  },

  // ===== HOME & FURNITURE =====
  {
    id: "p8", title: "Italian Leather Sofa Set", price: 85000, originalPrice: 95000, condition: "Brand New",
    category: "home-furniture", subcategory: "sofas",
    description: "3-seater + 2-seater + single. Dark brown genuine leather. Premium quality. Free delivery within Nairobi.",
    specifications: { Brand: "Italian Design", Type: "3-Piece Set", Material: "Genuine Leather", Color: "Dark Brown" },
    images: 6, location: { county: "Nairobi", town: "Industrial Area" }, seller: defaultSeller("FurniWorld KE", "s7"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 234, favorites: 18, postedAt: "3 days ago", status: "active",
  },
  {
    id: "p24", title: "Samsung Refrigerator 320L", price: 55000, originalPrice: 68000, condition: "Brand New",
    category: "home-furniture", subcategory: "kitchen-appliances",
    description: "Samsung 320L double door refrigerator. Digital inverter technology. Frost free. Energy efficient.",
    specifications: { Brand: "Samsung", Capacity: "320 Liters", Type: "Double Door", Technology: "Digital Inverter" },
    images: 3, location: { county: "Nairobi", town: "Luthuli Avenue" }, seller: defaultSeller("Samsung Hub KE", "s3"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 189, favorites: 14, postedAt: "2 days ago", status: "active",
  },
  {
    id: "p25", title: "Standing Desk - Electric Adjustable", price: 28000, originalPrice: 35000, condition: "Brand New",
    category: "home-furniture", subcategory: "tables",
    description: "Electric standing desk. 120x60cm. Height adjustable 70-120cm. Memory controller. Cable management. Black.",
    specifications: { Type: "Standing Desk", Size: "120x60cm", Material: "Steel + MDF", Adjustment: "Electric 70-120cm" },
    images: 3, location: { county: "Nairobi", town: "Westlands" }, seller: defaultSeller("FurniWorld KE", "s7"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 156, favorites: 11, postedAt: "4 days ago", status: "active",
  },
  {
    id: "p26", title: "Washing Machine 8kg Front Load", price: 42000, originalPrice: 52000, condition: "Brand New",
    category: "home-furniture", subcategory: "washing-machines",
    description: "LG 8kg front load washing machine. Inverter Direct Drive. 6 Motion technology. 10 year motor warranty.",
    specifications: { Brand: "LG", Capacity: "8kg", Type: "Front Load", Technology: "Inverter Direct Drive" },
    images: 3, location: { county: "Nairobi", town: "Luthuli Avenue" }, seller: defaultSeller("ApplianceWorld KE", "s15"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 234, favorites: 18, postedAt: "5 days ago", status: "active",
  },

  // ===== PROPERTY =====
  {
    id: "p11", title: "50 Acres Farmland - Nakuru", price: 4500000, condition: "Brand New",
    category: "property", subcategory: "land",
    description: "50 acres of prime farmland in Nakuru County. Fertile soil, water available, road access, title deed ready. Perfect for farming or investment.",
    specifications: { Type: "Farmland", Size: "50 Acres", Title: "Freehold", Water: "Available", Road: "Tarmac Access" },
    images: 6, location: { county: "Nakuru", town: "Naivasha" }, seller: defaultSeller("Kenya Lands KE", "s8"),
    escrowProtected: true, deliveryAvailable: false, negotiable: true, views: 789, favorites: 45, postedAt: "1 week ago", status: "active",
  },
  {
    id: "p27", title: "Modern 3BR Apartment Kilimani", price: 65000, condition: "Brand New",
    category: "property", subcategory: "apartments",
    description: "3 bedroom apartment for rent in Kilimani. Spacious living room. Modern kitchen. 2 parking slots. 24/7 security.",
    specifications: { Type: "Apartment", Bedrooms: "3", Bathrooms: "2", Parking: "2", Security: "24/7" },
    images: 5, location: { county: "Nairobi", town: "Kilimani" }, seller: defaultSeller("Prime Properties", "s8"),
    escrowProtected: true, deliveryAvailable: false, negotiable: true, views: 567, favorites: 34, postedAt: "3 days ago", status: "active",
  },
  {
    id: "p28", title: "2BR House for Sale - Ruiru", price: 5500000, condition: "Brand New",
    category: "property", subcategory: "houses-for-sale",
    description: "3 bedroom bungalow for sale in Ruiru. Half acre plot. Perimeter wall. Borehole water. Near Thika Superhighway.",
    specifications: { Type: "House", Bedrooms: "3", Plot: "0.5 Acres", Water: "Borehole", Title: "Freehold" },
    images: 6, location: { county: "Kiambu", town: "Ruiru" }, seller: defaultSeller("Prime Properties", "s8"),
    escrowProtected: true, deliveryAvailable: false, negotiable: true, views: 456, favorites: 28, postedAt: "1 week ago", status: "active",
  },

  // ===== AGRICULTURE =====
  {
    id: "p29", title: "Organic Coffee Beans (50kg)", price: 85000, condition: "Brand New",
    category: "agriculture", subcategory: "produce",
    description: "Premium organic Arabica coffee beans from Nyeri highlands. 50kg bags. Fair trade certified. Direct from farm.",
    specifications: { Type: "Arabica Coffee", Weight: "50kg", Origin: "Nyeri", Certification: "Organic + Fair Trade" },
    images: 3, location: { county: "Nyeri", town: "Karatina" }, seller: defaultSeller("Highlands Farm", "s16"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 187, favorites: 14, postedAt: "2 days ago", status: "active",
  },
  {
    id: "p30", title: "Drip Irrigation System Kit", price: 15000, condition: "Brand New",
    category: "agriculture", subcategory: "farm-equipment",
    description: "Complete drip irrigation kit for 1 acre. Includes pipes, drippers, filter, timer. Easy setup. Water saving.",
    specifications: { Type: "Drip Irrigation", Coverage: "1 Acre", Includes: "Pipes, Drippers, Filter, Timer" },
    images: 3, location: { county: "Nakuru", town: "Naivasha" }, seller: defaultSeller("AgroTech KE", "s17"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 123, favorites: 9, postedAt: "4 days ago", status: "active",
  },

  // ===== SERVICES =====
  {
    id: "p14", title: "Web Development Services", price: 50000, condition: "Brand New",
    category: "services", subcategory: "it-services",
    description: "Professional web development services. React, Next.js, Node.js. Full-stack development. Responsive design. SEO optimized. 30-day support.",
    specifications: { Type: "Web Development", Technology: "React, Next.js, Node.js", Duration: "2-4 weeks", Support: "30 days" },
    images: 2, location: { county: "Nairobi", town: "Westlands" }, seller: defaultSeller("DevStudio KE", "s11"),
    escrowProtected: true, deliveryAvailable: false, negotiable: true, views: 234, favorites: 19, postedAt: "5 days ago", status: "active",
  },
  {
    id: "p31", title: "Professional Photography Package", price: 25000, condition: "Brand New",
    category: "services", subcategory: "photography",
    description: "Event photography package. 4 hours coverage. 200+ edited photos. Online gallery. Portrait + candid shots.",
    specifications: { Type: "Event Photography", Duration: "4 hours", Deliverables: "200+ edited photos", Format: "Digital + Online Gallery" },
    images: 2, location: { county: "Nairobi", town: "CBD" }, seller: defaultSeller("LensMaster KE", "s18"),
    escrowProtected: true, deliveryAvailable: false, negotiable: true, views: 189, favorites: 15, postedAt: "3 days ago", status: "active",
  },
  {
    id: "p32", title: "House Cleaning Service", price: 3500, condition: "Brand New",
    category: "services", subcategory: "cleaning",
    description: "Professional house cleaning service. Deep clean. 3-person team. Eco-friendly products. Same day available.",
    specifications: { Type: "House Cleaning", Team: "3 People", Duration: "4-6 hours", Products: "Eco-friendly" },
    images: 2, location: { county: "Nairobi", town: "Westlands" }, seller: defaultSeller("CleanPro KE", "s19"),
    escrowProtected: true, deliveryAvailable: false, negotiable: false, views: 156, favorites: 11, postedAt: "1 day ago", status: "active",
  },

  // ===== DIGITAL GOODS / B2B =====
  {
    id: "p33", title: "E-Commerce Platform License", price: 75000, condition: "Brand New",
    category: "digital-goods", subcategory: "software",
    description: "Full e-commerce platform with admin panel, product management, M-Pesa integration, escrow system, delivery tracking.",
    specifications: { Type: "E-Commerce Platform", Features: "Admin, Products, Payments, Escrow", Support: "1 Year", Updates: "Free" },
    images: 2, location: { county: "Nairobi", town: "Online" }, seller: defaultSeller("SoftTech Africa", "s20"),
    escrowProtected: true, deliveryAvailable: false, negotiable: true, views: 456, favorites: 34, postedAt: "1 week ago", status: "active",
  },
  {
    id: "p34", title: "B2B Logistics Partnership", price: 500000, condition: "Brand New",
    category: "b2b", subcategory: "logistics",
    description: "Partnership opportunity for bulk logistics. Nationwide coverage. Fleet of 50+ vehicles. Warehouse network. Real-time tracking.",
    specifications: { Type: "Logistics Partnership", Coverage: "Nationwide", Fleet: "50+ Vehicles", Tracking: "Real-time GPS" },
    images: 2, location: { county: "Nairobi", town: "Industrial Area" }, seller: defaultSeller("MoveIt KE", "s21"),
    escrowProtected: true, deliveryAvailable: false, negotiable: true, views: 167, favorites: 12, postedAt: "1 week ago", status: "active",
  },

  // ===== BEAUTY =====
  {
    id: "p35", title: "Professional Hair Dryer Set", price: 8500, originalPrice: 12000, condition: "Brand New",
    category: "beauty", subcategory: "hair",
    description: "Professional salon hair dryer set. 2200W. 3 heat settings. Diffuser + concentrator attachments. Lightweight.",
    specifications: { Brand: "Professional", Power: "2200W", Settings: "3 Heat + 2 Speed", Attachments: "Diffuser + Concentrator" },
    images: 2, location: { county: "Nairobi", town: "CBD" }, seller: defaultSeller("Beauty World KE", "s22"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 123, favorites: 8, postedAt: "2 days ago", status: "active",
  },
  {
    id: "p36", title: "Luxury Perfume Collection", price: 15000, condition: "Brand New",
    category: "beauty", subcategory: "fragrance",
    description: "Collection of 3 luxury perfumes. 100ml each. Long lasting. Authentic designer brands.",
    specifications: { Type: "Perfume Collection", Volume: "3 x 100ml", Authenticity: "100% Genuine" },
    images: 3, location: { county: "Nairobi", town: "Karen" }, seller: defaultSeller("Luxury Watch KE", "s14"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 234, favorites: 19, postedAt: "3 days ago", status: "active",
  },

  // ===== JOBS =====
  {
    id: "p37", title: "UI/UX Designer - Remote", price: 0, condition: "Brand New",
    category: "jobs", subcategory: "freelance",
    description: "Looking for a skilled UI/UX designer for a fintech app project. 3-month contract. Remote work. Portfolio required.",
    specifications: { Type: "Freelance", Duration: "3 months", Skills: "Figma, UI/UX, Fintech", Budget: "KES 150,000/month" },
    images: 0, location: { county: "Nairobi", town: "Online" }, seller: defaultSeller("TechStartup KE", "s23"),
    escrowProtected: true, deliveryAvailable: false, negotiable: true, views: 345, favorites: 23, postedAt: "1 day ago", status: "active",
  },
  {
    id: "p38", title: "Full Stack Developer - React/Node", price: 0, condition: "Brand New",
    category: "jobs", subcategory: "remote",
    description: "Hiring full stack developer. React + Node.js. 2+ years experience. Start immediately. Competitive salary.",
    specifications: { Type: "Full Time", Skills: "React, Node.js, TypeScript", Experience: "2+ years", Salary: "KES 120,000 - 180,000/month" },
    images: 0, location: { county: "Nairobi", town: "Westlands" }, seller: defaultSeller("TechStartup KE", "s23"),
    escrowProtected: true, deliveryAvailable: false, negotiable: false, views: 567, favorites: 45, postedAt: "2 days ago", status: "active",
  },

  // ===== MORE ELECTRONICS =====
  {
    id: "p39", title: "Canon EOS R50 Camera", price: 95000, originalPrice: 110000, condition: "Brand New",
    category: "electronics", subcategory: "cameras",
    description: "Canon EOS R50 mirrorless camera. 24.2MP. 4K video. Interchangeable lens kit included. Perfect for content creators.",
    specifications: { Brand: "Canon", Model: "EOS R50", Megapixels: "24.2MP", Video: "4K 30fps", Kit: "18-45mm lens" },
    images: 4, location: { county: "Nairobi", town: "Westlands" }, seller: defaultSeller("TechZone Kenya", "s1"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 345, favorites: 28, postedAt: "3 days ago", status: "active",
  },
  {
    id: "p40", title: "Hisense 43\" Smart TV", price: 32000, originalPrice: 38000, condition: "Brand New",
    category: "electronics", subcategory: "tvs",
    description: "Hisense 43 inch Full HD Smart TV. VIDAA OS. DTS Virtual surround. 2 HDMI ports. Netflix, YouTube built-in.",
    specifications: { Brand: "Hisense", "Screen Size": "43 inch", Resolution: "1920x1080", "Smart TV": "VIDAA OS" },
    images: 3, location: { county: "Mombasa", town: "CBD" }, seller: defaultSeller("ApplianceWorld KE", "s15"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 234, favorites: 18, postedAt: "2 days ago", status: "active",
  },
  {
    id: "p41", title: "Tecno Spark 20 Pro+", price: 22000, condition: "Brand New",
    category: "phones-tablets", subcategory: "android-phones",
    description: "Tecno Spark 20 Pro+. 256GB, 8GB RAM. 108MP camera. 5000mAh battery. NFC. Dual SIM.",
    specifications: { Brand: "Tecno", Model: "Spark 20 Pro+", Storage: "256GB", RAM: "8GB", Camera: "108MP", Battery: "5000mAh" },
    images: 3, location: { county: "Nairobi", town: "Eastleigh" }, seller: defaultSeller("PhoneWorld KE", "s12"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 345, favorites: 23, postedAt: "1 day ago", status: "active",
  },
  {
    id: "p42", title: "IKEA KALLAX Shelf Unit", price: 12000, condition: "Brand New",
    category: "home-furniture", subcategory: "cabinets",
    description: "IKEA KALLAX shelf unit 4x4. White. Perfect for living room, bedroom, or home office. Multiple storage combinations.",
    specifications: { Brand: "IKEA", Model: "KALLAX 4x4", Color: "White", Material: "Particleboard" },
    images: 3, location: { county: "Nairobi", town: "Karen" }, seller: defaultSeller("FurniWorld KE", "s7"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 189, favorites: 14, postedAt: "4 days ago", status: "active",
  },
  {
    id: "p43", title: "GoPro Hero 12 Black", price: 52000, originalPrice: 62000, condition: "Brand New",
    category: "electronics", subcategory: "cameras",
    description: "GoPro Hero 12 Black action camera. 5.3K video. HyperSmooth 6.0. Waterproof to 10m. Dual screen.",
    specifications: { Brand: "GoPro", Model: "Hero 12 Black", Video: "5.3K 60fps", Waterproof: "10m" },
    images: 3, location: { county: "Nairobi", town: "Westlands" }, seller: defaultSeller("GameZone KE", "s10"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 289, favorites: 22, postedAt: "2 days ago", status: "active",
  },
  {
    id: "p44", title: "Water Dispenser - Hot & Cold", price: 8500, originalPrice: 12000, condition: "Brand New",
    category: "home-furniture", subcategory: "kitchen-appliances",
    description: "2 taps water dispenser. Hot and cold. Floor standing. Stainless steel tank. Energy saving.",
    specifications: { Type: "Floor Standing", Taps: "Hot + Cold", Tank: "Stainless Steel" },
    images: 2, location: { county: "Nairobi", town: "Luthuli Avenue" }, seller: defaultSeller("ApplianceWorld KE", "s15"),
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 156, favorites: 11, postedAt: "3 days ago", status: "active",
  },
  {
    id: "p45", title: "JBL Charge 5 Speaker", price: 12000, originalPrice: 15000, condition: "Brand New",
    category: "electronics", subcategory: "audio-equipment",
    description: "JBL Charge 5 portable Bluetooth speaker. IP67 waterproof. 20-hour battery. Powerbank function. PartyBoost.",
    specifications: { Brand: "JBL", Model: "Charge 5", Battery: "20 hours", Waterproof: "IP67", Connectivity: "Bluetooth 5.1" },
    images: 3, location: { county: "Nairobi", town: "Kasarani" }, seller: defaultSeller("AudioPro KE", "s6"),
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 345, favorites: 28, postedAt: "1 day ago", status: "active",
  },

  // ===== COOKING GAS & FUEL =====
  {
    id: "p46", title: "Cooking Gas Refill - 6kg (Delivered)", price: 1100, condition: "Brand New",
    category: "home-living", subcategory: "cooking-gas",
    description: "Complete cooking gas refill service. 6kg cylinder filled and delivered to your doorstep anywhere in Nairobi and surrounding areas. Safe, certified, and fast same-day delivery. WhatsApp / Call to order.",
    specifications: { Type: "Gas Refill", CylinderSize: "6kg", Brand: "Any Cylinder", Delivery: "Same-day Nairobi and surrounds", Safety: "Certified fill" },
    images: 3, location: { county: "Nairobi", town: "Industrial Area" }, seller: { ...defaultSeller("Smart Fill Gas Point", "s24"), rating: 4.9, reviews: 89, products: 120, sales: 450, responseTime: "Within 10 minutes", memberSince: "2022" },
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 1247, favorites: 203, postedAt: "Just now", status: "active",
  },
  {
    id: "p47", title: "6kg Cooking Gas Cylinder - Full", price: 3900, condition: "Brand New",
    category: "home-living", subcategory: "cooking-gas",
    description: "Brand new 6kg full cooking gas cylinder. Ready for immediate use. Includes proper valve, safety seal, and weight certificate. Available in Afrigas, Cashug, and standard green cylinders. Delivery available within Nairobi.",
    specifications: { Type: "Full Cylinder", Capacity: "6kg", BrandsAvailable: "Afrigas, Cashug, Standard", Condition: "Brand New with seal", Includes: "Valve + Safety Seal" },
    images: 3, location: { county: "Nairobi", town: "Industrial Area" }, seller: { ...defaultSeller("Stanish Gas Suppliers", "s25"), rating: 4.8, reviews: 156, products: 80, sales: 280, responseTime: "Within 15 minutes", memberSince: "2021" },
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 2341, favorites: 387, postedAt: "1 hour ago", status: "active",
  },
  {
    id: "p48", title: "12kg Cooking Gas Cylinder - Full", price: 6500, condition: "Brand New",
    category: "home-living", subcategory: "cooking-gas",
    description: "Full 12kg cooking gas cylinder for larger households and餐廳 use. Brand new, sealed, with proper labeling and safety certification. Available from top brands. Free delivery in Nairobi and nearby counties.",
    specifications: { Type: "Full Cylinder", Capacity: "12kg", BrandsAvailable: "Afrigas, Cashug, Solgas", Condition: "Brand New sealed", IdealFor: "Large households,餐廳s" },
    images: 3, location: { county: "Nairobi", town: "Industrial Area" }, seller: { ...defaultSeller("Stanish Gas Suppliers", "s25"), rating: 4.8, reviews: 156, products: 80, sales: 280, responseTime: "Within 15 minutes", memberSince: "2021" },
    escrowProtected: true, deliveryAvailable: true, negotiable: true, views: 876, favorites: 142, postedAt: "3 hours ago", status: "active",
  },
  {
    id: "p49", title: "3kg Portable Cooking Gas Cylinder", price: 2500, condition: "Brand New",
    category: "home-living", subcategory: "cooking-gas",
    description: "Compact 3kg portable cooking gas cylinder. Perfect for single users, dorms,小巧 kitchens, and outdoor cooking. Brand new with full warranty. Lightweight and easy to carry.",
    specifications: { Type: "Full Cylinder", Capacity: "3kg", BrandsAvailable: "Standard", Condition: "Brand New", Portable: "Yes - lightweight" },
    images: 2, location: { county: "Nairobi", town: "CBD" }, seller: { ...defaultSeller("Smart Fill Gas Point", "s24"), rating: 4.9, reviews: 89, products: 120, sales: 450, responseTime: "Within 10 minutes", memberSince: "2022" },
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 567, favorites: 89, postedAt: "2 days ago", status: "active",
  },
  {
    id: "p50", title: "Gas Cylinder Exchange - Bring Your Empty", price: 2800, condition: "Used - Like New",
    category: "home-living", subcategory: "cooking-gas",
    description: "Exchange your empty 6kg cylinder for a filled one. Save on buying a new cylinder. We accept all brands. Fast swap service. Available for pickup in Industrial Area or delivery within Nairobi for KES 300 extra.",
    specifications: { Type: "Cylinder Exchange", CylinderSize: "6kg", BrandsAccepted: "All brands", DeliveryFee: "KES 300 extra in Nairobi", Pickup: "Industrial Area, Nairobi" },
    images: 2, location: { county: "Nairobi", town: "Industrial Area" }, seller: { ...defaultSeller("Smart Fill Gas Point", "s24"), rating: 4.9, reviews: 89, products: 120, sales: 450, responseTime: "Within 10 minutes", memberSince: "2022" },
    escrowProtected: true, deliveryAvailable: true, negotiable: false, views: 432, favorites: 67, postedAt: "1 day ago", status: "active",
  },
];

export function getProductsByCategory(categorySlug: string): SampleProduct[] {
  return SAMPLE_PRODUCTS.filter((p) => p.category === categorySlug);
}

export function getProductById(id: string): SampleProduct | undefined {
  return SAMPLE_PRODUCTS.find((p) => p.id === id);
}

export function searchProducts(query: string): SampleProduct[] {
  const q = query.toLowerCase();
  return SAMPLE_PRODUCTS.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.seller.name.toLowerCase().includes(q) ||
      p.location.county.toLowerCase().includes(q) ||
      p.location.town.toLowerCase().includes(q)
  );
}

export function formatPrice(price: number): string {
  return `KSh ${price.toLocaleString()}`;
}

export function getConditionColor(condition: string): string {
  if (condition === "Brand New") return "text-emerald-400 bg-emerald-400/10";
  if (condition.startsWith("Used")) return "text-amber-400 bg-amber-400/10";
  return "text-blue-400 bg-blue-400/10";
}
