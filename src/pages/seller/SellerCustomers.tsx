import { useState } from "react";
import SellerLayout from "./SellerLayout";
import { Users, MessageSquare, Star, MapPin, ShoppingBag } from "lucide-react";

const customers = [
  { id: "c1", name: "James Kamau", verified: true, orders: 5, totalSpent: 185000, lastPurchase: "2 days ago", rating: 5, messages: 12, location: "Nairobi" },
  { id: "c2", name: "Sarah Wanjiku", verified: true, orders: 3, totalSpent: 320000, lastPurchase: "5 days ago", rating: 4, messages: 8, location: "Mombasa" },
  { id: "c3", name: "Peter Otieno", verified: false, orders: 2, totalSpent: 45000, lastPurchase: "1 week ago", rating: 5, messages: 5, location: "Kisumu" },
  { id: "c4", name: "Grace Muthoni", verified: true, orders: 8, totalSpent: 520000, lastPurchase: "1 day ago", rating: 5, messages: 22, location: "Nakuru" },
  { id: "c5", name: "David Kimani", verified: true, orders: 1, totalSpent: 165000, lastPurchase: "3 days ago", rating: 4, messages: 3, location: "Eldoret" },
];

export default function SellerCustomers() {
  const [search, setSearch] = useState("");
  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <SellerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Customers</h1>
            <p className="text-sm text-white/40 mt-1">{customers.length} customers • {customers.reduce((s, c) => s + c.orders, 0)} total orders</p>
          </div>
        </div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..."
          className="w-full max-w-sm px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30" />
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-nx-violet/10 flex items-center justify-center text-nx-violet text-sm font-bold">{c.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{c.name}</span>
                    {c.verified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400">✓ Verified</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-white/30 mt-0.5">
                    <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> {c.orders} orders</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {c.rating}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.location}</span>
                    <span>{c.messages} messages</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">KSh {c.totalSpent.toLocaleString()}</p>
                  <p className="text-[10px] text-white/25">Last: {c.lastPurchase}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SellerLayout>
  );
}
