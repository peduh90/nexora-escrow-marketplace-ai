import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SellerLayout from "./SellerLayout";
import { BarChart3, TrendingUp, Eye, ShoppingCart, Star, MapPin, Clock } from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

export default function SellerAnalytics() {
  return (
    <SellerLayout>
      <div className="space-y-6">
        <FadeIn>
          <h1 className="text-2xl font-bold text-white">Sales Analytics</h1>
          <p className="text-sm text-white/40 mt-1">Performance insights and growth metrics</p>
        </FadeIn>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Views", value: "2,424", icon: Eye, color: "#8B5CF6", change: "+12%" },
            { label: "Conversion Rate", value: "4.8%", icon: TrendingUp, color: "#10B981", change: "+0.3%" },
            { label: "Total Sales", value: "116", icon: ShoppingCart, color: "#06B6D4", change: "+8 this month" },
            { label: "Avg Rating", value: "4.8★", icon: Star, color: "#F59E0B", change: "Excellent" },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.05}>
              <div className="p-4 rounded-xl border border-white/5 bg-nx-surface/50">
                <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
                <p className="text-[10px] text-white/30">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-[10px] text-nx-emerald mt-0.5">{s.change}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Chart */}
        <FadeIn delay={0.1}>
          <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-nx-violet" />
                <h3 className="text-sm font-semibold text-white">Revenue Trend</h3>
              </div>
              <div className="flex gap-1 text-[11px]">
                {["7D", "30D", "90D"].map((p) => (
                  <button key={p} className={`px-2.5 py-1 rounded ${p === "30D" ? "bg-nx-violet/10 text-nx-violet" : "text-white/20"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-48">
              {[45, 52, 38, 65, 58, 72, 81, 68, 93, 86, 100, 95, 88, 97, 82, 91, 100, 87, 93, 89, 96, 92, 98, 94].map((h, i) => (
                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.4, delay: 0.2 + i * 0.01 }}
                  className="flex-1 rounded-t-sm" style={{ background: h > 85 ? "linear-gradient(to top, rgba(139,92,246,0.3), rgba(139,92,246,0.6))" : "linear-gradient(to top, rgba(6,182,212,0.2), rgba(6,182,212,0.4))" }} />
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Top products */}
        <FadeIn delay={0.15}>
          <div className="rounded-xl border border-white/5 bg-nx-surface/50 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Top Performing Products</h3>
            <div className="space-y-2">
              {[
                { name: "Nike Air Max 2025", views: 1205, sales: 32, revenue: "KES 592K" },
                { name: "E-Commerce License", views: 456, sales: 12, revenue: "KES 900K" },
                { name: "Samsung Galaxy S24", views: 342, sales: 8, revenue: "KES 1.16M" },
                { name: "Organic Coffee 50kg", views: 187, sales: 15, revenue: "KES 1.28M" },
              ].map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.015] transition-colors">
                  <span className="text-xs font-bold text-nx-violet w-5">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white/70">{p.name}</p>
                    <p className="text-[10px] text-white/25">{p.views} views · {p.sales} sales</p>
                  </div>
                  <span className="text-sm font-semibold text-white">{p.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </SellerLayout>
  );
}
