import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import SellerSidebar from "./SellerSidebar";
import {
  ShoppingCart, Package, Truck, CheckCircle2, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownLeft, Eye, MessageSquare, RefreshCw, X,
  Shield, MapPin,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>
  );
}

const orders = [
  { id: "ORD-291", buyer: "James Odhiambo", product: "Samsung Galaxy S24 Ultra", amount: 145000, status: "pending", time: "5 min ago", transport: true, pickupCounty: "Nairobi", dropoffCounty: "Nakuru", escrowActive: true },
  { id: "ORD-290", buyer: "Sarah Wanjiku", product: "Organic Coffee Beans 50kg", amount: 85000, status: "shipped", time: "1 hr ago", transport: true, pickupCounty: "Nyeri", dropoffCounty: "Nairobi", escrowActive: true },
  { id: "ORD-289", buyer: "Michael Kipchoge", product: "Nike Air Max 2025", amount: 18500, status: "delivered", time: "3 hr ago", transport: false, pickupCounty: "Nairobi", dropoffCounty: "Nairobi", escrowActive: true },
  { id: "ORD-288", buyer: "Grace Njeri", product: "E-Commerce License", amount: 75000, status: "completed", time: "5 hr ago", transport: false, pickupCounty: "Nairobi", dropoffCounty: "Digital", escrowActive: false },
  { id: "ORD-287", buyer: "Peter Mwangi", product: "Bulk Maize 5T", amount: 320000, status: "in_transit", time: "1 day ago", transport: true, pickupCounty: "Uasin Gishu", dropoffCounty: "Nakuru", escrowActive: true },
  { id: "ORD-286", buyer: "Alice Wambui", product: "Samsung Galaxy S24", amount: 145000, status: "refund_requested", time: "2 days ago", transport: true, pickupCounty: "Nairobi", dropoffCounty: "Mombasa", escrowActive: true },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "text-nx-gold", bg: "bg-nx-gold/10", icon: Clock },
  shipped: { label: "Shipped", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Truck },
  in_transit: { label: "In Transit", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Truck },
  delivered: { label: "Delivered", color: "text-nx-violet", bg: "bg-nx-violet/10", icon: Package },
  completed: { label: "Completed", color: "text-nx-emerald", bg: "bg-nx-emerald/10", icon: CheckCircle2 },
  refund_requested: { label: "Refund Requested", color: "text-red-400", bg: "bg-red-400/10", icon: AlertTriangle },
};

export default function SellerOrders() {
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null);

  const filtered = orders.filter((o) => filter === "all" || o.status === filter);

  return (
    <div className="flex min-h-screen bg-background">
      <SellerSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <h2 className="text-sm font-semibold text-white">Orders</h2>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          <FadeIn>
            <h1 className="text-2xl font-bold text-white">Order Management</h1>
            <p className="text-sm text-white/40 mt-1">Manage incoming orders, shipments, and refunds</p>
          </FadeIn>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Pending Orders", value: "1", color: "#F59E0B" },
              { label: "In Transit", value: "2", color: "#06B6D4" },
              { label: "Completed Today", value: "1", color: "#10B981" },
              { label: "Refund Requests", value: "1", color: "#EF4444" },
            ].map((s) => (
              <FadeIn key={s.label}>
                <div className="p-3 rounded-xl border border-white/5 bg-nx-surface/50 text-center">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-white/30">{s.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-1 overflow-x-auto">
            {["all", "pending", "shipped", "in_transit", "delivered", "completed", "refund_requested"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${filter === f ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50"}`}>
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Orders */}
          <div className="space-y-2">
            {filtered.map((order, i) => {
              const st = statusConfig[order.status];
              return (
                <FadeIn key={order.id} delay={i * 0.04}>
                  <div className="p-4 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all cursor-pointer"
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${st.bg}`}>
                        <st.icon className={`w-5 h-5 ${st.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{order.product}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>{st.label}</span>
                          {order.escrowActive && <Shield className="w-3 h-3 text-nx-violet" />}
                        </div>
                        <p className="text-[11px] text-white/30">{order.buyer} · {order.id} · {order.time}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">KES {order.amount.toLocaleString()}</p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-white/20">
                          <MapPin className="w-2.5 h-2.5" />
                          {order.pickupCounty} → {order.dropoffCounty}
                        </div>
                      </div>
                    </div>

                    {/* Expanded actions */}
                    {selectedOrder?.id === order.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        className="mt-4 pt-4 border-t border-white/5 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {order.status === "pending" && (
                            <>
                              <button className="px-3 py-1.5 rounded-lg bg-nx-emerald/10 text-nx-emerald text-xs font-medium hover:bg-nx-emerald/20 transition-colors flex items-center gap-1">
                                <Package className="w-3 h-3" /> Mark as Shipped
                              </button>
                              <button className="px-3 py-1.5 rounded-lg bg-nx-violet/10 text-nx-violet text-xs font-medium hover:bg-nx-violet/20 transition-colors flex items-center gap-1">
                                <Truck className="w-3 h-3" /> Arrange Transport
                              </button>
                            </>
                          )}
                          {order.status === "refund_requested" && (
                            <>
                              <button className="px-3 py-1.5 rounded-lg bg-nx-emerald/10 text-nx-emerald text-xs font-medium hover:bg-nx-emerald/20 transition-colors flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Approve Refund
                              </button>
                              <button className="px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 text-xs font-medium hover:bg-red-400/20 transition-colors flex items-center gap-1">
                                <X className="w-3 h-3" /> Reject Refund
                              </button>
                            </>
                          )}
                          <button className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-white/50 text-xs hover:text-white/70 transition-colors flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Message Buyer
                          </button>
                          <button className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-white/50 text-xs hover:text-white/70 transition-colors flex items-center gap-1">
                            <Eye className="w-3 h-3" /> View Details
                          </button>
                        </div>
                        {order.transport && (
                          <div className="p-3 rounded-lg bg-nx-cyan/[0.03] border border-nx-cyan/10">
                            <div className="flex items-center gap-2 text-xs">
                              <Truck className="w-3.5 h-3.5 text-nx-cyan" />
                              <span className="text-nx-cyan font-medium">Transport Active</span>
                              <span className="text-white/30">·</span>
                              <span className="text-white/40">{order.pickupCounty} → {order.dropoffCounty}</span>
                              <span className="text-white/30">·</span>
                              <span className="text-white/30">Insurance: Active</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
