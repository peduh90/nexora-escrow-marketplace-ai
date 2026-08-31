import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import BuyerSidebar from "./BuyerSidebar";
import { Truck, MapPin, Clock, Shield, CheckCircle2, Package } from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

const deliveries = [
  { id: "DLV-042", product: "Organic Coffee Beans 50kg", from: "Nyeri", to: "Nairobi", status: "in_transit", driver: "John Kamau", tracking: "NX-4829-KE", eta: "Today, 4 PM", insurance: true, km: 165, image: "☕" },
  { id: "DLV-040", product: "Bulk Maize 5T", from: "Uasin Gishu", to: "Nakuru", status: "pickup", driver: "Pending assignment", tracking: "NX-4827-KE", eta: "Tomorrow", insurance: true, km: 310, image: "🌽" },
  { id: "DLV-038", product: "Samsung Galaxy S24", from: "Nairobi", to: "Mombasa", status: "issue", driver: "Peter Ochieng", tracking: "NX-4826-KE", eta: "Delayed", insurance: true, km: 485, image: "📱" },
];

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  assigned: { label: "Driver Assigned", color: "text-nx-violet", bg: "bg-nx-violet/10" },
  pickup: { label: "Awaiting Pickup", color: "text-nx-gold", bg: "bg-nx-gold/10" },
  in_transit: { label: "In Transit", color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  delivered: { label: "Delivered", color: "text-nx-emerald", bg: "bg-nx-emerald/10" },
  issue: { label: "Issue Reported", color: "text-red-400", bg: "bg-red-400/10" },
};

export default function BuyerDeliveries() {
  return (
    <div className="flex min-h-screen bg-background">
      <BuyerSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <h2 className="text-sm font-semibold text-white">Deliveries</h2>
        </div>
        <div className="p-4 md:p-6 space-y-5">
          <FadeIn>
            <h1 className="text-2xl font-bold text-white">Delivery Tracking</h1>
            <p className="text-sm text-white/40 mt-1">All shipments are insured and GPS-tracked</p>
          </FadeIn>

          <div className="space-y-3">
            {deliveries.map((d, i) => {
              const st = statusMap[d.status];
              return (
                <FadeIn key={d.id} delay={i * 0.06}>
                  <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white/[0.03] flex items-center justify-center text-xl shrink-0">{d.image}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{d.product}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>{st.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-white/30">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {d.from} → {d.to}</span>
                          <span>{d.km} km</span>
                          <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {d.driver}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-white/60">{d.tracking}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">ETA: {d.eta}</p>
                        {d.insurance && (
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            <Shield className="w-3 h-3 text-nx-emerald" />
                            <span className="text-[9px] text-nx-emerald">Insured</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Progress */}
                    <div className="mt-4 flex items-center gap-2">
                      {["Assigned", "Picked Up", "In Transit", "Delivered"].map((step, si) => {
                        const active = d.status === "in_transit" ? si <= 2 : d.status === "delivered" ? si <= 3 : d.status === "pickup" ? si <= 0 : si <= 0;
                        return (
                          <div key={step} className="flex-1 flex items-center gap-1">
                            <div className={`w-full h-1.5 rounded-full ${active ? "bg-nx-cyan" : "bg-white/[0.05]"}`} />
                          </div>
                        );
                      })}
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
