import BuyerLayout from "./BuyerLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Truck, Package, Shield, MapPin, Clock, CheckCircle2, ArrowRight } from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

export default function BuyerDeliveries() {
  const escrows = useQuery(api.wallet.getEscrowByBuyer);
  const activeDeliveries = (escrows ?? []).filter((e: any) => ["delivery", "inspection", "active"].includes(e.status));

  return (
    <BuyerLayout>
      <div className="space-y-5">
        <FadeIn>
          <h1 className="text-2xl font-bold text-white">My Deliveries</h1>
          <p className="text-sm text-white/40 mt-1">Track all your Nexora-managed deliveries in real-time</p>
        </FadeIn>

        {/* Status summary */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <Package className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{activeDeliveries.length}</p>
              <p className="text-[10px] text-white/30">In Transit</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{(escrows ?? []).filter((e: any) => e.status === "completed").length}</p>
              <p className="text-[10px] text-white/30">Delivered</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <Clock className="w-5 h-5 text-nx-cyan mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{(escrows ?? []).filter((e: any) => ["created", "funded"].includes(e.status)).length}</p>
              <p className="text-[10px] text-white/30">Pending</p>
            </div>
          </div>
        </FadeIn>

        {/* Nexora transport info */}
        <FadeIn delay={0.08}>
          <div className="p-4 rounded-xl border border-nx-cyan/10 bg-nx-cyan/[0.02]">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-nx-cyan shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Nexora Transport — Insured & Tracked</p>
                <p className="text-[11px] text-white/30">All deliveries are GPS-tracked with full insurance coverage. Nexora collects from the seller and delivers to your location.</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Active deliveries */}
        {activeDeliveries.length > 0 ? (
          <FadeIn delay={0.1}>
            <div className="space-y-3">
              {activeDeliveries.map((escrow: any, i: number) => (
                <div key={escrow._id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-4 h-4 text-nx-cyan shrink-0" />
                        <h3 className="text-sm font-semibold text-white truncate">{escrow.title}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                        <MapPin className="w-3 h-3" />
                        <span>{escrow.deliveryTown}, {escrow.deliveryCounty}</span>
                      </div>
                      {/* Delivery progress */}
                      <div className="flex items-center gap-1 mt-3">
                        {["Ordered", "Picked Up", "In Transit", "Delivered", "Confirmed"].map((step, si) => {
                          const stepIdx = escrow.status === "active" ? 1 : escrow.status === "delivery" ? 2 : escrow.status === "inspection" ? 3 : 0;
                          const isActive = si <= stepIdx;
                          return (
                            <div key={step} className="flex items-center gap-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${isActive ? si === stepIdx ? "bg-nx-cyan text-black" : "bg-nx-cyan/20 text-nx-cyan" : "bg-white/5 text-white/20"}`}>
                                {si < stepIdx ? <CheckCircle2 className="w-3 h-3" /> : si + 1}
                              </div>
                              {si < 4 && <div className={`w-6 h-px ${isActive ? "bg-nx-cyan/40" : "bg-white/5"}`} />}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-4 mt-2 text-[10px] text-white/20">
                        <span>Seller: {escrow.sellerName}</span>
                        <span>KES {escrow.amount?.toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${escrow.status === "delivery" ? "bg-nx-cyan/10 text-nx-cyan" : escrow.status === "inspection" ? "bg-amber-400/10 text-amber-400" : "bg-white/5 text-white/40"}`}>
                      {escrow.status === "delivery" ? "In Transit" : escrow.status === "inspection" ? "Awaiting Confirmation" : "Processing"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={0.1}>
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">No active deliveries</p>
              <p className="text-[11px] text-white/20 mt-1 mb-4">Shipments will appear here once you place an order</p>
              <a href="/marketplace" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors">
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </FadeIn>
        )}
      </div>
    </BuyerLayout>
  );
}
