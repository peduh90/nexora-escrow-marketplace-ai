import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SellerSidebar from "./SellerSidebar";
import { Truck, MapPin, Package, Shield, CheckCircle2, Clock, Plus } from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

const shipments = [
  { id: "DLV-041", product: "Samsung Galaxy S24 Ultra", buyer: "James Odhiambo", from: "Nairobi, Westlands", to: "Nakuru Town", status: "assigned", driver: "David Mutua", tracking: "NX-4829-KE", insurance: true },
  { id: "DLV-040", product: "Organic Coffee 50kg", buyer: "Sarah Wanjiku", from: "Nyeri, Karatina", to: "Nairobi, CBD", status: "in_transit", driver: "John Kamau", tracking: "NX-4828-KE", insurance: true },
];

const stMap: Record<string, { label: string; color: string; bg: string }> = {
  assigned: { label: "Assigned", color: "text-nx-violet", bg: "bg-nx-violet/10" },
  pickup: { label: "Awaiting Pickup", color: "text-nx-gold", bg: "bg-nx-gold/10" },
  in_transit: { label: "In Transit", color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  delivered: { label: "Delivered", color: "text-nx-emerald", bg: "bg-nx-emerald/10" },
};

export default function SellerDeliveries() {
  return (
    <div className="flex min-h-screen bg-background">
      <SellerSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <h2 className="text-sm font-semibold text-white">Deliveries</h2>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-violet text-white text-xs font-medium hover:bg-nx-violet/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Arrange Delivery
          </button>
        </div>
        <div className="p-4 md:p-6 space-y-5">
          <FadeIn>
            <h1 className="text-2xl font-bold text-white">Delivery Management</h1>
            <p className="text-sm text-white/40 mt-1">Arrange and track shipments with insured transport partners</p>
          </FadeIn>

          {/* Transport info */}
          <FadeIn delay={0.05}>
            <div className="p-4 rounded-xl border border-nx-cyan/10 bg-nx-cyan/[0.02]">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-nx-cyan" />
                <div>
                  <p className="text-sm font-medium text-white">Nexora Transport — Insured & Tracked</p>
                  <p className="text-[11px] text-white/30">All deliveries are GPS-tracked with full insurance coverage. Platform earns 5% of transport fee.</p>
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="space-y-3">
            {shipments.map((s, i) => {
              const st = stMap[s.status];
              return (
                <FadeIn key={s.id} delay={i * 0.06}>
                  <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50">
                    <div className="flex items-center gap-3 mb-3">
                      <Package className="w-5 h-5 text-nx-violet" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{s.product}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>{st.label}</span>
                        </div>
                        <p className="text-[11px] text-white/30">Buyer: {s.buyer} · {s.tracking}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-white/[0.02]">
                        <p className="text-[10px] text-white/25 mb-0.5">Pickup</p>
                        <p className="text-white/60 flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.from}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.02]">
                        <p className="text-[10px] text-white/25 mb-0.5">Drop-off</p>
                        <p className="text-white/60 flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.to}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.03]">
                      <span className="text-[11px] text-white/30 flex items-center gap-1"><Truck className="w-3 h-3" /> {s.driver}</span>
                      {s.insurance && <span className="text-[11px] text-nx-emerald flex items-center gap-1"><Shield className="w-3 h-3" /> Insured</span>}
                    </div>
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
