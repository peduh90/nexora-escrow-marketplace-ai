import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import BuyerLayout from "./BuyerLayout";
import {
  ShoppingCart, Package, Truck, CheckCircle2, Clock, Shield,
  MapPin, Eye, MessageSquare, AlertTriangle, Star,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>
  );
}

const orders = [
  { id: "ORD-291", product: "Samsung Galaxy S24 Ultra", seller: "TechHub Nairobi", amount: 145000, status: "pending", transport: true, date: "Today, 09:15", deliveryDate: "Jan 3", escrowActive: true, image: "📱" },
  { id: "ORD-290", product: "Organic Coffee Beans 50kg", seller: "Highlands Farm", amount: 85000, status: "in_transit", transport: true, date: "Yesterday, 14:22", deliveryDate: "Jan 2", escrowActive: true, image: "☕" },
  { id: "ORD-289", product: "Nike Air Max 2025", seller: "Urban Fashion KE", amount: 18500, status: "delivered", transport: false, date: "Dec 28, 10:30", deliveryDate: "Dec 30", escrowActive: true, image: "👟", deliveredDate: "Dec 30" },
  { id: "ORD-288", product: "E-Commerce Platform License", seller: "SoftTech Africa", amount: 75000, status: "completed", transport: false, date: "Dec 20, 09:00", deliveryDate: "Dec 20", escrowActive: false, image: "📦", completedDate: "Dec 22" },
  { id: "ORD-287", product: "MacBook Air M3", seller: "TechHub Nairobi", amount: 165000, status: "disputed", transport: true, date: "Dec 15, 16:45", deliveryDate: "Dec 18", escrowActive: true, image: "💻" },
];

const statusMap: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "Order Placed", color: "text-nx-gold", bg: "bg-nx-gold/10", icon: Clock },
  shipped: { label: "Shipped", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Truck },
  in_transit: { label: "In Transit", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Truck },
  delivered: { label: "Delivered — Confirm?", color: "text-nx-violet", bg: "bg-nx-violet/10", icon: Package },
  completed: { label: "Completed", color: "text-nx-emerald", bg: "bg-nx-emerald/10", icon: CheckCircle2 },
  disputed: { label: "Disputed", color: "text-red-400", bg: "bg-red-400/10", icon: AlertTriangle },
};

export default function BuyerOrders() {
  return (
    <BuyerLayout>
        <div className="space-y-5">
          <FadeIn>
            <h1 className="text-2xl font-bold text-white">My Orders</h1>
            <p className="text-sm text-white/40 mt-1">Track and manage all your purchases</p>
          </FadeIn>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Orders", value: "5", color: "#8B5CF6" },
              { label: "In Transit", value: "1", color: "#06B6D4" },
              { label: "Awaiting Confirm", value: "1", color: "#F59E0B" },
              { label: "Completed", value: "3", color: "#10B981" },
            ].map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.04}>
                <div className="p-3 rounded-xl border border-white/5 bg-nx-surface/50 text-center">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-white/30">{s.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="space-y-2">
            {orders.map((order, i) => {
              const st = statusMap[order.status];
              return (
                <FadeIn key={order.id} delay={i * 0.04}>
                  <div className="p-4 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/[0.03] flex items-center justify-center text-xl shrink-0">{order.image}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{order.product}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>{st.label}</span>
                          {order.escrowActive && <Shield className="w-3 h-3 text-nx-violet" />}
                        </div>
                        <p className="text-[11px] text-white/30">{order.seller} · {order.id} · {order.date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">KES {order.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-white/20 mt-0.5">ETA: {order.deliveryDate}</p>
                      </div>
                    </div>
                    {/* Action buttons based on status */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.03]">
                      {order.status === "delivered" && (
                        <>
                          <button className="px-3 py-1.5 rounded-lg bg-nx-emerald/10 text-nx-emerald text-xs font-medium hover:bg-nx-emerald/20 transition-colors flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Confirm Delivery
                          </button>
                          <button className="px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 text-xs font-medium hover:bg-red-400/20 transition-colors flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> File Dispute
                          </button>
                        </>
                      )}
                      {order.status === "in_transit" && (
                        <button className="px-3 py-1.5 rounded-lg bg-nx-cyan/10 text-nx-cyan text-xs font-medium hover:bg-nx-cyan/20 transition-colors flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Track Delivery
                        </button>
                      )}
                      <button className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-white/40 text-xs hover:text-white/60 transition-colors flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Contact Seller
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-white/40 text-xs hover:text-white/60 transition-colors flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Details
                      </button>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
    </BuyerLayout>
  );
}
