import AdminLayout from "./AdminLayout";
import { BarChart3, TrendingUp, Users, Eye, ShoppingCart } from "lucide-react";

const topProducts = [
  { name: "HP EliteBook 840 G3", views: 2450, orders: 8, revenue: "KES 176,000" },
  { name: "Samsung Galaxy S23", views: 1800, orders: 12, revenue: "KES 540,000" },
  { name: "MacBook Pro M3", views: 8900, orders: 3, revenue: "KES 555,000" },
  { name: "Toyota Vitz 2019", views: 5600, orders: 1, revenue: "KES 1,450,000" },
  { name: "Nike Air Max 90", views: 1200, orders: 15, revenue: "KES 127,500" },
];

const topCategories = [
  { name: "Electronics", products: 3200, revenue: "KES 45.2M" },
  { name: "Vehicles", products: 890, revenue: "KES 38.7M" },
  { name: "Phones & Tablets", products: 2100, revenue: "KES 28.4M" },
  { name: "Property", products: 540, revenue: "KES 18.2M" },
  { name: "Fashion", products: 1800, revenue: "KES 12.3M" },
];

export default function AdminAnalytics() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Comprehensive platform performance metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Views", value: "2.4M", icon: Eye, color: "#8B5CF6" },
          { label: "Conversion Rate", value: "3.2%", icon: TrendingUp, color: "#10B981" },
          { label: "Avg Order Value", value: "KES 8,450", icon: ShoppingCart, color: "#06B6D4" },
          { label: "Active Sellers", value: "3,245", icon: Users, color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]">
                <span className="text-xs text-white/20 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60 truncate">{p.name}</p>
                  <p className="text-[10px] text-white/25">{p.views.toLocaleString()} views · {p.orders} orders</p>
                </div>
                <span className="text-xs text-white/50 font-medium">{p.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4">Top Categories</h3>
          <div className="space-y-3">
            {topCategories.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]">
                <span className="text-xs text-white/20 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60">{c.name}</p>
                  <p className="text-[10px] text-white/25">{c.products.toLocaleString()} products</p>
                </div>
                <span className="text-xs text-white/50 font-medium">{c.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
