import { useState } from "react";
import SellerLayout from "./SellerLayout";
import { Megaphone, Star, TrendingUp, Zap, Eye, DollarSign } from "lucide-react";

const promotions = [
  { type: "Featured Listing", price: 500, description: "Get your product featured on the homepage and category pages", icon: Star, duration: "7 days" },
  { type: "Boost Product", price: 200, description: "Increase visibility in search results for 3 days", icon: TrendingUp, duration: "3 days" },
  { type: "Homepage Banner", price: 2000, description: "Your product displayed in the homepage carousel", icon: Zap, duration: "14 days" },
  { type: "Category Spotlight", price: 800, description: "Featured at the top of your product category", icon: Eye, duration: "7 days" },
];

const activePromos = [
  { product: "HP EliteBook 840 G3", type: "Featured Listing", status: "active", daysLeft: 4, impressions: 1250, clicks: 89 },
  { product: "Nike Air Max 90", type: "Boost Product", status: "expired", daysLeft: 0, impressions: 456, clicks: 34 },
];

export default function SellerPromotions() {
  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Promotions</h1>
          <p className="text-sm text-white/40 mt-1">Boost your products and get more visibility</p>
        </div>

        {/* Available promotions */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Available Promotions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {promotions.map(p => (
              <div key={p.type} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/20 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-nx-violet/10 flex items-center justify-center shrink-0">
                    <p.icon className="w-5 h-5 text-nx-violet" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-white">{p.type}</h3>
                    <p className="text-xs text-white/30 mt-1">{p.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-lg font-bold text-white">KSh {p.price.toLocaleString()}</span>
                      <span className="text-[10px] text-white/20">{p.duration}</span>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-3 py-2 rounded-lg bg-nx-violet/10 text-nx-violet text-xs font-medium hover:bg-nx-violet/20 transition-colors">
                  Promote Product
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active promotions */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Your Promotions</h2>
          <div className="space-y-2">
            {activePromos.map((p, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{p.product}</p>
                    <p className="text-xs text-white/30 mt-0.5">{p.type} • {p.status === "active" ? `${p.daysLeft} days left` : "Expired"}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-white/5 text-white/30"}`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-[11px] text-white/30">
                  <span>{p.impressions} impressions</span>
                  <span>{p.clicks} clicks</span>
                  <span>{p.clicks > 0 ? ((p.clicks / p.impressions) * 100).toFixed(1) : "0"}% CTR</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
