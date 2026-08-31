import AdminLayout from "./AdminLayout";
import { Star, Search, Eye, Flag, Trash2 } from "lucide-react";

const reviews = [
  { id: "REV-0891", buyer: "Edwin Kamau", seller: "TechZone Kenya", product: "HP EliteBook 840 G3", rating: 5, text: "Excellent seller! Laptop exactly as described. Fast delivery.", date: "Apr 5, 2025", flagged: false },
  { id: "REV-0890", buyer: "Peter Mwangi", seller: "PhoneWorld", product: "Samsung Galaxy S23", rating: 4, text: "Good product but delivery took a bit longer than expected.", date: "Apr 4, 2025", flagged: false },
  { id: "REV-0889", buyer: "Lucy Wambui", seller: "CheapDeals254", product: "Phone Charger", rating: 1, text: "FAKE product! Completely different from what was advertised.", date: "Apr 3, 2025", flagged: true },
  { id: "REV-0888", buyer: "Michael Chen", seller: "TechZone Kenya", product: "MacBook Pro M3", rating: 5, text: "Perfect condition, genuine Apple product. Highly recommend!", date: "Apr 2, 2025", flagged: false },
];

export default function AdminReviews() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Review Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor and moderate marketplace reviews</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Reviews", value: "24,567" },
          { label: "Average Rating", value: "4.6 ★" },
          { label: "Flagged", value: "8" },
          { label: "This Week", value: "342" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {reviews.map(r => (
          <div key={r.id} className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/30">{r.id}</span>
                {r.flagged && <Flag className="w-3 h-3 text-red-400" />}
              </div>
              <span className="text-[10px] text-white/20">{r.date}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-0.5">{Array.from({length:5}).map((_,i)=>(<Star key={i} className={`w-3 h-3 ${i<r.rating?"fill-nx-gold text-nx-gold":"text-white/10"}`} />))}</div>
              <span className="text-xs text-white/40">{r.rating}/5</span>
            </div>
            <p className="text-sm text-white/50 mb-2">{r.text}</p>
            <div className="flex items-center gap-3 text-[10px] text-white/25">
              <span>Buyer: {r.buyer}</span>
              <span>Seller: {r.seller}</span>
              <span>Product: {r.product}</span>
            </div>
            <div className="flex gap-1.5 mt-3">
              <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
              <button className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-400/5 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
