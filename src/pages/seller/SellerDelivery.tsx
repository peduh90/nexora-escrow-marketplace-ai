import SellerLayout from "./SellerLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { Truck, Package, MapPin, Shield, Clock, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export default function SellerDelivery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const escrows = useQuery(api.users.getAllEscrows);
  const listings = useQuery(api.listings.getSellerListings);

  const sellerId = user?._id ?? "";
  const myEscrows = (escrows ?? []).filter((e) => e.sellerId === sellerId);

  // Filter to orders that have delivery info
  const deliveryOrders = myEscrows.filter((e) =>
    e.deliveryCounty || e.deliveryTown || e.deliveryAddress
  );

  const awaitingPickup = deliveryOrders.filter((e) =>
    ["funded", "active", "created"].includes(e.status)
  );
  const inTransit = deliveryOrders.filter((e) =>
    ["delivery", "inspection"].includes(e.status)
  );
  const delivered = deliveryOrders.filter((e) =>
    ["released", "completed"].includes(e.status)
  );

  const getListingTitle = (escrow: any) => {
    const listing = (listings ?? []).find((l: any) => l._id === escrow.listingId || l.title === escrow.title);
    return escrow.title || listing?.title || "Product";
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Delivery</h1>
          <p className="text-sm text-white/40 mt-1">Track Nexora Market-managed deliveries</p>
        </div>

        <div className="p-4 rounded-xl bg-nx-violet/5 border border-nx-violet/10">
          <p className="text-xs text-white/40">
            <span className="text-nx-violet font-medium">Delivery is handled by Nexora Market.</span> Once you mark a product as "Ready for Collection", Nexora Market will collect and deliver it. You do not need to arrange delivery.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/10">
            <p className="text-2xl font-bold text-amber-400">{awaitingPickup.length}</p>
            <p className="text-[11px] text-white/30">Awaiting Pickup</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-400/5 border border-blue-400/10">
            <p className="text-2xl font-bold text-blue-400">{inTransit.length}</p>
            <p className="text-[11px] text-white/30">In Transit</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
            <p className="text-2xl font-bold text-emerald-400">{delivered.length}</p>
            <p className="text-[11px] text-white/30">Delivered</p>
          </div>
        </div>

        {escrows === undefined ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-nx-violet animate-spin" />
          </div>
        ) : deliveryOrders.length === 0 ? (
          <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
            <Truck className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-medium">No active deliveries</p>
            <p className="text-[11px] text-white/20 mt-1 mb-4">Deliveries will appear here once buyers place orders with Nexora Transport</p>
            <button onClick={() => navigate("/seller/products")} className="px-5 py-2 rounded-lg bg-nx-violet/10 text-nx-violet text-xs font-medium hover:bg-nx-violet/20 transition-colors">
              View Products
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active deliveries */}
            {[...awaitingPickup, ...inTransit].map((escrow) => (
              <div key={escrow._id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-nx-violet/10 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-nx-violet" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white truncate">{getListingTitle(escrow)}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        escrow.status === "delivery" || escrow.status === "inspection"
                          ? "bg-blue-400/10 text-blue-400"
                          : "bg-amber-400/10 text-amber-400"
                      }`}>
                        {escrow.status === "delivery" || escrow.status === "inspection" ? "In Transit" : "Awaiting Pickup"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-white/30 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {escrow.deliveryTown || "—"}, {escrow.deliveryCounty || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(escrow.createdAt)}
                      </span>
                      <span className="font-medium text-white/50">
                        KES {escrow.amount.toLocaleString()}
                      </span>
                    </div>
                    {escrow.deliveryAddress && (
                      <p className="text-[10px] text-white/20 mt-1.5">📍 {escrow.deliveryAddress}</p>
                    )}
                  </div>
                  <button onClick={() => navigate("/seller/orders")} className="p-2 rounded-lg hover:bg-white/[0.03] text-white/20 hover:text-white/50 transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Completed deliveries */}
            {delivered.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-4">
                  <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider">Completed</h3>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                {delivered.map((escrow) => (
                  <div key={escrow._id} className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] opacity-70">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/60 truncate">{getListingTitle(escrow)}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">Delivered · KES {escrow.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
