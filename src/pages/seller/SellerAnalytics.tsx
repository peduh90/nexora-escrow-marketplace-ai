import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import SellerLayout from "./SellerLayout";
import { BarChart3, TrendingUp, Eye, ShoppingCart, Star } from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

export default function SellerAnalytics() {
  const { user } = useAuth();
  const listings = useQuery(api.users.getAllListings);
  const escrows = useQuery(api.users.getAllEscrows);

  const sellerId = user?._id ?? "";
  const myListings = (listings ?? []).filter((l: any) => l.sellerId === sellerId);
  const myEscrows = (escrows ?? []).filter((e: any) => e.sellerId === sellerId);
  const totalViews = myListings.reduce((s: number, l: any) => s + (l.views || 0), 0);
  const completedSales = myEscrows.filter((e: any) => e.status === "completed" || e.status === "released").length;
  const totalRevenue = myEscrows.filter((e: any) => e.status === "completed" || e.status === "released").reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <SellerLayout>
      <div className="space-y-6">
        <FadeIn>
          <h1 className="text-2xl font-bold text-white">Sales Analytics</h1>
          <p className="text-sm text-white/40 mt-1">Performance insights and growth metrics</p>
        </FadeIn>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "#8B5CF6" },
            { label: "Active Listings", value: myListings.filter((l: any) => l.status === "active").length.toString(), icon: TrendingUp, color: "#10B981" },
            { label: "Completed Sales", value: completedSales.toString(), icon: ShoppingCart, color: "#06B6D4" },
            { label: "Total Revenue", value: `KES ${totalRevenue.toLocaleString()}`, icon: Star, color: "#F59E0B" },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.05}>
              <div className="p-4 rounded-xl border border-white/5 bg-nx-surface/50">
                <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
                <p className="text-[10px] text-white/30">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Chart placeholder */}
        <FadeIn delay={0.1}>
          <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-4 h-4 text-nx-violet" />
              <h3 className="text-sm font-semibold text-white">Revenue Trend</h3>
            </div>
            {totalRevenue === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-white/20">Revenue chart will appear once you make sales</p>
              </div>
            ) : (
              <div className="h-48 flex items-end gap-1.5">
                {[45, 52, 38, 65, 58, 72, 81].map((h, i) => (
                  <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.4, delay: 0.2 + i * 0.01 }}
                    className="flex-1 rounded-t-sm" style={{ background: h > 65 ? "linear-gradient(to top, rgba(139,92,246,0.3), rgba(139,92,246,0.6))" : "linear-gradient(to top, rgba(6,182,212,0.2), rgba(6,182,212,0.4))" }} />
                ))}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Top products */}
        <FadeIn delay={0.15}>
          <div className="rounded-xl border border-white/5 bg-nx-surface/50 p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Your Products</h3>
            {myListings.length === 0 ? (
              <p className="text-sm text-white/20 py-4 text-center">No products listed yet. Add your first product to see performance data.</p>
            ) : (
              <div className="space-y-2">
                {myListings.slice(0, 5).map((p: any, i: number) => (
                  <div key={p._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.015] transition-colors">
                    <span className="text-xs font-bold text-nx-violet w-5">#{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm text-white/70">{p.title}</p>
                      <p className="text-[10px] text-white/25">{p.views || 0} views</p>
                    </div>
                    <span className="text-sm font-semibold text-white">KES {p.price?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </SellerLayout>
  );
}
