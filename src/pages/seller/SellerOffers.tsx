import { useState } from "react";
import SellerLayout from "./SellerLayout";
import { TrendingUp, Clock, CheckCircle2, XCircle, ArrowRightLeft, Package, User } from "lucide-react";

const offers = [
  { id: "OFF-101", product: "HP EliteBook 840 G3", buyer: "James Kamau", buyerVerified: true, originalPrice: 25000, offerPrice: 22000, status: "pending", time: "2 min ago", productImage: "💻" },
  { id: "OFF-100", product: "iPhone 15 Pro Max", buyer: "Sarah Wanjiku", buyerVerified: true, originalPrice: 165000, offerPrice: 150000, status: "pending", time: "1 hour ago", productImage: "📱" },
  { id: "OFF-99", product: "Nike Air Max 90", buyer: "Peter Otieno", buyerVerified: false, originalPrice: 15000, offerPrice: 12000, status: "countered", counterPrice: 13500, time: "3 hours ago", productImage: "👟" },
  { id: "OFF-98", product: "Sony WH-1000XM5", buyer: "Grace Muthoni", buyerVerified: true, originalPrice: 42000, offerPrice: 35000, status: "accepted", time: "1 day ago", productImage: "🎧" },
  { id: "OFF-97", product: "Samsung Galaxy S24", buyer: "David Kimani", buyerVerified: true, originalPrice: 185000, offerPrice: 160000, status: "rejected", time: "2 days ago", productImage: "📱" },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
  countered: { label: "Countered", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: ArrowRightLeft },
  accepted: { label: "Accepted", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
};

export default function SellerOffers() {
  const [activeTab, setActiveTab] = useState("All");
  const [counterModal, setCounterModal] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState("");

  const tabs = ["All", "Pending", "Countered", "Accepted", "Rejected"];
  const filtered = activeTab === "All" ? offers : offers.filter(o => o.status === activeTab);

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Offers</h1>
          <p className="text-sm text-white/40 mt-1">Manage price negotiations from buyers</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/10">
            <p className="text-2xl font-bold text-amber-400">{offers.filter(o => o.status === "pending").length}</p>
            <p className="text-[11px] text-white/30 mt-1">Pending Offers</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-2xl font-bold text-nx-cyan">{offers.filter(o => o.status === "countered").length}</p>
            <p className="text-[11px] text-white/30 mt-1">Countered</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
            <p className="text-2xl font-bold text-emerald-400">{offers.filter(o => o.status === "accepted").length}</p>
            <p className="text-[11px] text-white/30 mt-1">Accepted</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Offers list */}
        <div className="space-y-3">
          {filtered.map((offer) => {
            const st = statusConfig[offer.status];
            const discount = Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100);
            return (
              <div key={offer.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/[0.03] flex items-center justify-center text-xl shrink-0">{offer.productImage}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white">{offer.product}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color} ${st.bg}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <User className="w-3 h-3" /> {offer.buyer}
                      {offer.buyerVerified && <span className="text-emerald-400">✓</span>}
                      <span>• {offer.time}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/30 line-through">KSh {offer.originalPrice.toLocaleString()}</span>
                      <span className="text-sm font-bold text-nx-violet">KSh {offer.offerPrice.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-amber-400 mt-0.5">{discount}% off</p>
                    {offer.counterPrice && (
                      <p className="text-[10px] text-nx-cyan mt-0.5">Your counter: KSh {offer.counterPrice.toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {offer.status === "pending" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                    <button className="flex-1 py-2 rounded-lg bg-emerald-400/10 text-emerald-400 text-xs font-medium hover:bg-emerald-400/20 transition-colors">Accept Offer</button>
                    <button onClick={() => { setCounterModal(offer.id); setCounterPrice(String(Math.round(offer.offerPrice * 1.05))); }} className="flex-1 py-2 rounded-lg bg-nx-cyan/10 text-nx-cyan text-xs font-medium hover:bg-nx-cyan/20 transition-colors">Counter Offer</button>
                    <button className="flex-1 py-2 rounded-lg bg-red-400/10 text-red-400 text-xs font-medium hover:bg-red-400/20 transition-colors">Reject</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Counter modal */}
        {counterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCounterModal(null)} />
            <div className="relative w-full max-w-sm rounded-2xl bg-[#0E0E18] border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Counter Offer</h3>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Your Counter Price (KSh)</label>
                <input type="number" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 text-xl text-white font-bold focus:outline-none focus:border-nx-cyan/30" />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setCounterModal(null)} className="flex-1 py-2.5 rounded-lg text-sm text-white/40 hover:bg-white/[0.03]">Cancel</button>
                <button onClick={() => setCounterModal(null)} className="flex-1 py-2.5 rounded-lg bg-nx-cyan text-white text-sm font-medium">Send Counter</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
