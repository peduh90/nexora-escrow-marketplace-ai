import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import SellerLayout from "./SellerLayout";
import { Truck, Package, Shield, ArrowLeft, CheckCircle2, MapPin } from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

const IN_TRANSIT = ["delivery", "inspection"];
const DELIVERED = ["completed", "released"];

export default function SellerDelivery() {
  const navigate = useNavigate();
  const escrows = useQuery(api.wallet.getEscrowBySeller);

  const all = (escrows ?? []) as any[];
  const transportOrders = all.filter((e) => e.transportRequired);

  const awaitingPickup = transportOrders.filter((e) => ["funded", "active"].includes(e.status));
  const inTransit = transportOrders.filter((e) => IN_TRANSIT.includes(e.status));
  const delivered = transportOrders.filter((e) => DELIVERED.includes(e.status));

  const rows = [...awaitingPickup, ...inTransit, ...delivered];

  const stageLabel = (e: any) =>
    ["funded", "active"].includes(e.status) ? "Awaiting Pickup"
    : e.status === "delivery" ? "In Transit"
    : e.status === "inspection" ? "Delivered — Buyer Review"
    : ["completed", "released"].includes(e.status) ? "Delivered"
    : e.status;

  const stageStyle = (e: any) =>
    ["funded", "active"].includes(e.status) ? "bg-amber-400/10 text-amber-400"
    : IN_TRANSIT.includes(e.status) ? "bg-nx-cyan/10 text-nx-cyan"
    : "bg-emerald-400/10 text-emerald-400";

  return (
    <SellerLayout>
      <div className="space-y-5">
        {/* Back button */}
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate("/seller")}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Delivery Management</h1>
              <p className="text-sm text-white/40 mt-1">Track Nexora Market-managed deliveries</p>
            </div>
          </div>
        </FadeIn>

        {/* Transport info */}
        <FadeIn delay={0.05}>
          <div className="p-4 rounded-xl border border-nx-cyan/10 bg-nx-cyan/[0.02]">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-nx-cyan shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Delivery is handled by Nexora Market</p>
                <p className="text-[11px] text-white/30">Once you mark a product as "Ready for Collection", Nexora Market will collect and deliver it. You do not need to arrange delivery.</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Status summary */}
        <FadeIn delay={0.08}>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <Package className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{awaitingPickup.length}</p>
              <p className="text-[10px] text-white/30">Awaiting Pickup</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <Truck className="w-5 h-5 text-nx-cyan mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{inTransit.length}</p>
              <p className="text-[10px] text-white/30">In Transit</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{delivered.length}</p>
              <p className="text-[10px] text-white/30">Delivered</p>
            </div>
          </div>
        </FadeIn>

        {/* Deliveries list */}
        {escrows === undefined ? null : rows.length === 0 ? (
          <FadeIn delay={0.1}>
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">No active deliveries</p>
              <p className="text-[11px] text-white/20 mt-1 mb-4">Deliveries will appear here once buyers place orders with Nexora Transport</p>
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={0.1}>
            <div className="space-y-2">
              {rows.map((e) => (
                <div key={e._id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-nx-cyan/10 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-nx-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white truncate">{e.title}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${stageStyle(e)}`}>{stageLabel(e)}</span>
                      </div>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        Order #{e._id.slice(-8)} · {e.buyerName} · KSh {(e.amount ?? 0).toLocaleString()}
                      </p>
                      {e.deliveryTown || e.deliveryCounty ? (
                        <p className="text-[11px] text-white/25 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[e.deliveryTown, e.deliveryCounty].filter(Boolean).join(", ")}
                          {e.deliveryAddress ? ` — ${e.deliveryAddress}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right shrink-0">
                      {e.transportFee ? (
                        <p className="text-xs text-white/50">Transport KSh {e.transportFee.toLocaleString()}</p>
                      ) : (
                        <p className="text-xs text-white/30">Free delivery</p>
                      )}
                      {e.estimatedDeliveryDate && (
                        <p className="text-[10px] text-white/25 mt-0.5">
                          ETA {new Date(e.estimatedDeliveryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        )}
      </div>
    </SellerLayout>
  );
}
