import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { BarChart3, TrendingUp, Users, Eye, ShoppingCart } from "lucide-react";

export default function AdminAnalytics() {
  const allListings = useQuery(api.admin.getAllListings);
  const allUsers = useQuery(api.admin.getAllUsers);
  const allEscrows = useQuery(api.admin.getAllEscrows);

  const listings = allListings ?? [];
  const users = allUsers ?? [];
  const escrows = allEscrows ?? [];

  const totalViews = listings.reduce((s: number, l: any) => s + (l.views || 0), 0);
  const completedOrders = escrows.filter((e: any) => e.status === "completed" || e.status === "released");
  const totalRevenue = completedOrders.reduce((s: number, e: any) => s + e.amount, 0);
  const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;
  const activeSellers = users.filter((u: any) => u.role === "seller").length;

  // Group listings by category
  const categoryMap = new Map<string, { count: number; revenue: number }>();
  listings.forEach((l: any) => {
    const cat = l.category || "Uncategorized";
    const existing = categoryMap.get(cat) || { count: 0, revenue: 0 };
    existing.count++;
    const catEscrows = escrows.filter((e: any) => e.sellerId === l.sellerId && (e.status === "completed" || e.status === "released"));
    existing.revenue = catEscrows.reduce((s: number, e: any) => s + e.amount, 0);
    categoryMap.set(cat, existing);
  });

  const topCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({ name, products: data.count, revenue: data.revenue }));

  // Top products by views
  const topProducts = [...listings].sort((a: any, b: any) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Comprehensive platform performance metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "#8B5CF6" },
          { label: "Total Revenue", value: `KES ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "#10B981" },
          { label: "Avg Order Value", value: `KES ${avgOrderValue.toLocaleString()}`, icon: ShoppingCart, color: "#06B6D4" },
          { label: "Active Sellers", value: activeSellers.toString(), icon: Users, color: "#F59E0B" },
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
          {topProducts.length === 0 ? (
            <p className="text-sm text-white/20 py-4 text-center">No products listed yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => (
                <div key={p._id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]">
                  <span className="text-xs text-white/20 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/60 truncate">{p.title}</p>
                    <p className="text-[10px] text-white/25">{p.views || 0} views</p>
                  </div>
                  <span className="text-xs text-white/50 font-medium">KES {(p.price || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4">Top Categories</h3>
          {topCategories.length === 0 ? (
            <p className="text-sm text-white/20 py-4 text-center">No categories with data yet</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]">
                  <span className="text-xs text-white/20 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/60">{c.name}</p>
                    <p className="text-[10px] text-white/25">{c.products} products</p>
                  </div>
                  <span className="text-xs text-white/50 font-medium">KES {c.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
