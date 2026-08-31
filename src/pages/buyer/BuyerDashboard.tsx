import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import BuyerSidebar from "./BuyerSidebar";
import {
  ShoppingCart, Package, Truck, Shield, Wallet, Star, Clock,
  ChevronRight, TrendingUp, Eye, CheckCircle2, AlertTriangle,
  MapPin, Store, Brain,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>
  );
}

const myOrders = [
  { id: "ORD-291", product: "Samsung Galaxy S24 Ultra", seller: "TechHub Nairobi", amount: 145000, status: "pending", transport: true, deliveryDate: "Jan 3", image: "📱" },
  { id: "ORD-290", product: "Organic Coffee Beans 50kg", seller: "Highlands Farm", amount: 85000, status: "in_transit", transport: true, deliveryDate: "Jan 2", image: "☕" },
  { id: "ORD-289", product: "Nike Air Max 2025", seller: "Urban Fashion KE", amount: 18500, status: "delivered", transport: false, deliveryDate: "Dec 30", image: "👟" },
];

const recommended = [
  { title: "MacBook Air M3", price: 165000, seller: "TechHub Nairobi", rating: 4.9, escrow: true, image: "💻" },
  { title: "Artisan Coffee 25kg", price: 42000, seller: "Highlands Farm", rating: 4.8, escrow: true, image: "☕" },
  { title: "Graphic Design Service", price: 35000, seller: "Creative Studio KE", rating: 4.7, escrow: true, image: "🎨" },
];

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Order Placed", color: "text-nx-gold", bg: "bg-nx-gold/10" },
  in_transit: { label: "In Transit", color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  delivered: { label: "Delivered", color: "text-nx-violet", bg: "bg-nx-violet/10" },
  completed: { label: "Completed", color: "text-nx-emerald", bg: "bg-nx-emerald/10" },
};

export default function BuyerDashboard() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <BuyerSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <h2 className="text-sm font-semibold text-white">Buyer Dashboard</h2>
          <Store className="w-4 h-4 text-white/30" />
        </div>

        <div className="p-4 md:p-6 space-y-6">
          <FadeIn>
            <div>
              <p className="text-sm text-white/40 mb-1">Welcome back</p>
              <h1 className="text-2xl font-bold text-white">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0] || "there"}</h1>
              <p className="text-xs text-white/30 mt-1">Your protected shopping dashboard</p>
            </div>
          </FadeIn>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Active Orders", value: "3", icon: ShoppingCart, color: "#8B5CF6" },
              { label: "In Transit", value: "1", icon: Truck, color: "#06B6D4" },
              { label: "Total Spent", value: "KES 248K", icon: Wallet, color: "#10B981" },
              { label: "Saved Items", value: "12", icon: Star, color: "#F59E0B" },
            ].map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.05}>
                <div className="p-4 rounded-xl border border-white/5 bg-nx-surface/50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${s.color}12` }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <p className="text-[10px] text-white/30">{s.label}</p>
                  <p className="text-lg font-bold text-white">{s.value}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Protection Status */}
          <FadeIn delay={0.08}>
            <div className="p-4 rounded-xl border border-nx-emerald/15 bg-nx-emerald/[0.02]">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-nx-emerald" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-nx-emerald">Escrow Protection Active</p>
                  <p className="text-[11px] text-white/30">All your orders are protected. Funds are held securely until you confirm delivery.</p>
                </div>
                <Brain className="w-4 h-4 text-nx-violet" />
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Orders */}
            <FadeIn delay={0.1} className="lg:col-span-2">
              <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">My Orders</h3>
                  <button className="text-[11px] text-nx-cyan flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="space-y-2">
                  {myOrders.map((order, i) => {
                    const st = statusMap[order.status];
                    return (
                      <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center text-lg shrink-0">{order.image}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{order.product}</span>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>{st.label}</span>
                          </div>
                          <p className="text-[11px] text-white/30">{order.seller} · {order.id}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-white">KES {order.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-white/20">ETA: {order.deliveryDate}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </FadeIn>

            {/* Delivery Tracker */}
            <FadeIn delay={0.15}>
              <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-4 h-4 text-nx-cyan" />
                  <h3 className="text-sm font-semibold text-white">Delivery Tracker</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-white/[0.02]">
                    <p className="text-xs font-medium text-white mb-2">Coffee Beans 50kg</p>
                    <div className="space-y-2">
                      {["Order Placed", "Picked Up", "In Transit", "Arriving", "Delivered"].map((step, i) => (
                        <div key={step} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${i < 2 ? "bg-nx-emerald" : i === 2 ? "bg-nx-cyan animate-nx-pulse" : "bg-white/10"}`} />
                          <span className={`text-[10px] ${i <= 2 ? "text-white/50" : "text-white/20"}`}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-dashed border-white/5 text-center">
                    <MapPin className="w-5 h-5 text-white/15 mx-auto mb-1" />
                    <p className="text-[10px] text-white/25">Real-time tracking active</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Recommendations */}
          <FadeIn delay={0.2}>
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Recommended for You</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recommended.map((item, i) => (
                  <motion.div key={item.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.05 }}
                    className="p-4 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all cursor-pointer group">
                    <div className="w-full h-24 rounded-lg bg-white/[0.02] flex items-center justify-center text-3xl mb-3 group-hover:bg-white/[0.03] transition-colors">{item.image}</div>
                    <h4 className="text-sm font-medium text-white truncate">{item.title}</h4>
                    <p className="text-[11px] text-white/30">{item.seller}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-white">KES {item.price.toLocaleString()}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-nx-gold" />
                        <span className="text-[10px] text-white/30">{item.rating}</span>
                      </div>
                    </div>
                    {item.escrow && (
                      <div className="flex items-center gap-1 mt-2">
                        <Shield className="w-3 h-3 text-nx-violet" />
                        <span className="text-[9px] text-nx-violet">Escrow Protected</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
