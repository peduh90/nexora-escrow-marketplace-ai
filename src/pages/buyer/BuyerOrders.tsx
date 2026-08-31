import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import BuyerLayout from "./BuyerLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ShoppingCart, Package, Truck, CheckCircle2, Clock, Shield,
  MapPin, Eye, MessageSquare, AlertTriangle,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>
  );
}

const statusMap: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "Order Placed", color: "text-nx-gold", bg: "bg-nx-gold/10", icon: Clock },
  funds_secured: { label: "Funds Secured", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Shield },
  seller_processing: { label: "Seller Processing", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Package },
  in_transit: { label: "In Transit", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Truck },
  delivered: { label: "Delivered", color: "text-nx-violet", bg: "bg-nx-violet/10", icon: Package },
  completed: { label: "Completed", color: "text-nx-emerald", bg: "bg-nx-emerald/10", icon: CheckCircle2 },
  disputed: { label: "Disputed", color: "text-red-400", bg: "bg-red-400/10", icon: AlertTriangle },
  refunded: { label: "Refunded", color: "text-white/40", bg: "bg-white/5", icon: CheckCircle2 },
};

export default function BuyerOrders() {
  const escrowTxns = useQuery(api.wallet.getWalletTransactions);
  const orders = escrowTxns?.filter(t => t.type === "escrow_fund") ?? [];

  const statusCounts = {
    total: orders.length,
    inTransit: 0,
    pending: orders.filter(o => o.status === "pending" || o.status === "processing").length,
    completed: orders.filter(o => o.status === "completed").length,
  };

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
              { label: "Total Orders", value: String(statusCounts.total), color: "#8B5CF6" },
              { label: "In Transit", value: String(statusCounts.inTransit), color: "#06B6D4" },
              { label: "Awaiting Confirm", value: String(statusCounts.pending), color: "#F59E0B" },
              { label: "Completed", value: String(statusCounts.completed), color: "#10B981" },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] text-white/30 mt-1">{s.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Orders list */}
          {orders.length === 0 ? (
            <FadeIn>
              <div className="py-20 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <ShoppingCart className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/40 font-medium">No orders yet</p>
                <p className="text-[11px] text-white/20 mt-1">Your purchases will appear here after checkout</p>
              </div>
            </FadeIn>
          ) : (
            <div className="space-y-3">
              {orders.map((order, i) => {
                const st = statusMap[order.status] ?? statusMap.pending;
                const Icon = st.icon;
                return (
                  <FadeIn key={order._id} delay={i * 0.04}>
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-white/20" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white truncate">{order.description}</span>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>{st.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-white/30">
                            <span>{order.reference}</span>
                            {order.status === "completed" && <span className="flex items-center gap-1 text-nx-emerald"><CheckCircle2 className="w-3 h-3" /> Escrow Released</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-white">KES {order.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-white/20 mt-0.5">
                            {order.status === "completed" ? "Funds released" : "In escrow"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          )}
        </div>
    </BuyerLayout>
  );
}
