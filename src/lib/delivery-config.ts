export interface DeliveryZone {
  name: string;
  county: string;
  fee: number;
  freeDelivery: boolean;
  estimatedDays: string;
}

export interface KenyaLocation {
  county: string;
  towns: string[];
}

export const KENYA_LOCATIONS: KenyaLocation[] = [
  { county: "Baringo", towns: ["Kabarnet", "Eldama Ravine", "Mogotio", "Baringo Central"] },
  { county: "Bomet", towns: ["Bomet", "Sotik", "Litein", "Longisa"] },
  { county: "Bungoma", towns: ["Bungoma", "Webuye", "Kimilili", "Chwele"] },
  { county: "Busia", towns: ["Busia", "Malaba", "Funyula", "Butula"] },
  { county: "Elgeyo-Marakwet", towns: ["Iten", "Eldoret", "Kerio Valley"] },
  { county: "Embu", towns: ["Embu", "Runyenjes", "Siakago"] },
  { county: "Garissa", towns: ["Garissa", "Dadaab", "Mandera"] },
  { county: "Homa Bay", towns: ["Homa Bay", "Rangwe", "Ndhiwa", "Kabondo"] },
  { county: "Isiolo", towns: ["Isiolo", "Merti"] },
  { county: "Kajiado", towns: ["Kajiado", "Ngong", "Kitengela", "Ongata Rongai", "Loitoktok"] },
  { county: "Kakamega", towns: ["Kakamega", "Mumias", "Malava", "Shinyalu"] },
  { county: "Kericho", towns: ["Kericho", "Litein", "Londiani", "Kipkelion"] },
  { county: "Kiambu", towns: ["Kiambu", "Thika", "Ruiru", "Juja", "Kikuyu", "Limuru"] },
  { county: "Kilifi", towns: ["Kilifi", "Malindi", "Watamu", "Mtwapa"] },
  { county: "Kirinyaga", towns: ["Kutus", "Sagana", "Kerugoya"] },
  { county: "Kisii", towns: ["Kisii", "Kisii Town", "Ogembo", "Nyamira"] },
  { county: "Kisumu", towns: ["Kisumu", "Milimani", "Nyalenda", "Kondele", "Ketemb0"] },
  { county: "Kitui", towns: ["Kitui", "Mwingi", "Mutomo"] },
  { county: "Kwale", towns: ["Kwale", "Ukunda", "Diani", "Tiwi"] },
  { county: "Laikipia", towns: ["Nanyuki", "Nyeri Town", "Rumuruti"] },
  { county: "Lamu", towns: ["Lamu", "Mpeketoni", "Faza"] },
  { county: "Machakos", towns: ["Machakos", "Athi River", "Mavoko", "Kitengela"] },
  { county: "Makueni", towns: ["Wote", "Makueni", "Emali"] },
  { county: "Mandera", towns: ["Mandera", "Elwak", "Rhamu"] },
  { county: "Marsabit", towns: ["Marsabit", "Isiolo", "Laisamis"] },
  { county: "Meru", towns: ["Meru", "Maua", "Chuka", "Timau"] },
  { county: "Migori", towns: ["Migori", "Rongo", "Awendo", "Kehancha"] },
  { county: "Mombasa", towns: ["Mombasa", "Nyali", "Kisauni", "Likoni", "Changamwe", "Island"] },
  { county: "Murang'a", towns: ["Murang'a", "Kangema", "Kigumo", "Maragua"] },
  { county: "Nairobi", towns: ["CBD", "Westlands", "Karen", "Kilimani", "Kasarani", "Langata", "Eastleigh", "Luthuli Avenue", "Kenyatta Avenue", "Industrial Area", "Embakasi", "Kibera"] },
  { county: "Nakuru", towns: ["Nakuru", "Naivasha", "Njoro", "Gilgil", "Molo", "Subukia"] },
  { county: "Nandi", towns: ["Kapsabet", "Nandi Hills", "Kabiyet"] },
  { county: "Narok", towns: ["Narok", "Kilgoris", "Ololulung'a"] },
  { county: "Nyamira", towns: ["Nyamira", "Keroka", "Nyansiongo"] },
  { county: "Nyandarua", towns: ["Ol Kalou", "Engineer", "Ndaragwa"] },
  { county: "Nyeri", towns: ["Nyeri", "Karatina", "Othaya", "Mukurweini"] },
  { county: "Samburu", towns: ["Maralal", "Wamba", "Baragoi"] },
  { county: "Siaya", towns: ["Siaya", "Bondo", "Ugunja", "Yala"] },
  { county: "Taita-Taveta", towns: ["Voi", "Taveta", "Wundanyi"] },
  { county: "Tana River", towns: ["Hola", "Garsen", "Bura"] },
  { county: "Tharaka-Nithi", towns: ["Chuka", "Meru South", "Tharaka"] },
  { county: "Trans-Nzoia", towns: ["Kitale", "Endebess", "Kiminini"] },
  { county: "Turkana", towns: ["Lodwar", "Kakuma", "Lokichoggio"] },
  { county: "Uasin Gishu", towns: ["Eldoret", "Burnt Forest", "Moiben"] },
  { county: "Vihiga", towns: ["Vihiga", "Sabatia", "Hamisi"] },
  { county: "Wajir", towns: ["Wajir", "Mandera", "Habaswein"] },
  { county: "West Pokot", towns: ["Kapenguria", "Kacheliba", "Sigor"] },
];

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { name: "Nairobi CBD", county: "Nairobi", fee: 0, freeDelivery: true, estimatedDays: "1-2 business days" },
  { name: "Nairobi Metro", county: "Nairobi", fee: 0, freeDelivery: true, estimatedDays: "1-2 business days" },
  { name: "Kiambu", county: "Kiambu", fee: 200, freeDelivery: false, estimatedDays: "1-3 business days" },
  { name: "Nakuru", county: "Nakuru", fee: 500, freeDelivery: false, estimatedDays: "2-3 business days" },
  { name: "Kisumu", county: "Kisumu", fee: 600, freeDelivery: false, estimatedDays: "2-4 business days" },
  { name: "Mombasa", county: "Mombasa", fee: 800, freeDelivery: false, estimatedDays: "2-4 business days" },
  { name: "Eldoret", county: "Uasin Gishu", fee: 600, freeDelivery: false, estimatedDays: "2-4 business days" },
  { name: "Thika", county: "Kiambu", fee: 300, freeDelivery: false, estimatedDays: "1-3 business days" },
  { name: "Kajiado", county: "Kajiado", fee: 400, freeDelivery: false, estimatedDays: "2-3 business days" },
  { name: "Machakos", county: "Machakos", fee: 400, freeDelivery: false, estimatedDays: "2-3 business days" },
  { name: "Nyeri", county: "Nyeri", fee: 500, freeDelivery: false, estimatedDays: "2-3 business days" },
  { name: "Meru", county: "Meru", fee: 500, freeDelivery: false, estimatedDays: "2-3 business days" },
  { name: "Kericho", county: "Kericho", fee: 600, freeDelivery: false, estimatedDays: "2-4 business days" },
  { name: "Kisii", county: "Kisii", fee: 600, freeDelivery: false, estimatedDays: "2-4 business days" },
  { name: "Malindi", county: "Kilifi", fee: 900, freeDelivery: false, estimatedDays: "3-5 business days" },
  { name: "Other Counties", county: "Other", fee: 1000, freeDelivery: false, estimatedDays: "3-7 business days" },
];

export function getDeliveryFee(county: string): { fee: number; free: boolean; estimatedDays: string } {
  const zone = DEFAULT_DELIVERY_ZONES.find(
    (z) => z.county.toLowerCase() === county.toLowerCase()
  );
  if (zone) {
    return { fee: zone.fee, free: zone.freeDelivery, estimatedDays: zone.estimatedDays };
  }
  return { fee: 1000, free: false, estimatedDays: "3-7 business days" };
}

export function getCounties(): string[] {
  return KENYA_LOCATIONS.map((l) => l.county);
}

export function getTownsForCounty(county: string): string[] {
  const location = KENYA_LOCATIONS.find(
    (l) => l.county.toLowerCase() === county.toLowerCase()
  );
  return location?.towns || [];
}
