import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SellerLayout from "./SellerLayout";
import { Truck, Package, Shield } from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

export default function SellerDeliveries() {
  return (
    <SellerLayout>
      <div className="space-y-5">
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

        {/* Empty state */}
        <FadeIn delay={0.1}>
          <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
            <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-medium">No deliveries yet</p>
            <p className="text-[11px] text-white/20 mt-1">Shipments will appear here when Nexora Market collects products for delivery</p>
          </div>
        </FadeIn>
      </div>
    </SellerLayout>
  );
}
