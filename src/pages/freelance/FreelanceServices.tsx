import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft, Search, Star, Package, Plus, Eye, Store,
} from "lucide-react";
import {
  FREELANCE_CATEGORY_GRADIENTS,
  getFreelanceCategory,
} from "@/lib/freelance-marketplace";
import { shortKES } from "@/lib/fees";

/**
 * "My Services" — the freelancer's own published service listings.
 *
 * Reads the REAL listings table scoped to the signed-in user with
 * marketplace = "freelance" (the same records behind the public Freelance
 * Marketplace). The old version read the freelanceServices table, which
 * nothing in the app ever writes to — the page was permanently empty and its
 * cards had no click target.
 */
export default function FreelanceServices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const myListings = useQuery(api.listings.getSellerListings, {});
  const services = (myListings ?? []).filter(
    (l: any) => l.marketplace === "freelance" && l.status !== "deleted"
  );

  const display = services.filter((s: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  });

  const active = services.filter((s: any) => s.status === "active").length;
  const paused = services.filter((s: any) => s.status === "paused").length;
  const totalViews = services.reduce((sum: number, s: any) => sum + (s.views || 0), 0);

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/freelance/dashboard")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold text-white">My Services</h1>
          </div>
          <button
            onClick={() => navigate("/freelance/publish")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors"
            title="Publish a new service listing"
          >
            <Plus className="w-3.5 h-3.5" /> New Service
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-xl font-bold text-white">{active}</p>
              <p className="text-[11px] text-white/30 mt-0.5">Published</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-xl font-bold text-white">{paused}</p>
              <p className="text-[11px] text-white/30 mt-0.5">Paused / draft</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-xl font-bold text-white">{totalViews.toLocaleString()}</p>
              <p className="text-[11px] text-white/30 mt-0.5">Total views</p>
            </div>
          </div>

          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my services..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
          </div>

          {myListings === undefined ? (
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-white/40 font-medium">Loading your services…</p>
            </div>
          ) : display.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <Store className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">
                {search ? "No services match your search" : "You haven't published any services yet"}
              </p>
              <p className="text-[11px] text-white/20 mt-1 max-w-sm mx-auto">
                Services you publish through the listing form appear on the public
                Freelance Marketplace where employers can hire them with escrow protection.
              </p>
              <button
                onClick={() => navigate("/freelance/publish")}
                className="mt-4 px-5 py-2 rounded-xl bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors"
              >
                Publish your first service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {display.map((svc: any) => {
                const cat = getFreelanceCategory(svc.category);
                const gradient = FREELANCE_CATEGORY_GRADIENTS[svc.category] || FREELANCE_CATEGORY_GRADIENTS["other-services"];
                return (
                  <div
                    key={svc._id}
                    onClick={() => navigate(`/freelance/service/${svc._id}`)}
                    className="rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/20 transition-all overflow-hidden group cursor-pointer"
                  >
                    <div className={`aspect-[16/10] bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
                      {svc.images?.[0] ? (
                        <img src={svc.images[0]} alt={svc.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl drop-shadow-lg">{cat?.icon || "💼"}</span>
                      )}
                      <span className={`absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full font-medium ${
                        svc.status === "active" ? "bg-nx-emerald/15 text-nx-emerald" : "bg-white/10 text-white/50"
                      }`}>
                        {svc.status === "active" ? "Published" : svc.status === "paused" ? "Paused" : svc.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-white/40 truncate">{cat?.icon} {cat?.name || svc.category}</span>
                        <div className="flex items-center gap-0.5 ml-auto">
                          <Eye className="w-3 h-3 text-white/20" />
                          <span className="text-[10px] text-white/40">{svc.views || 0}</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1.5 line-clamp-2 group-hover:text-nx-violet transition-colors">{svc.title}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-white/25 mb-3">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-nx-gold fill-nx-gold" />
                          {svc.reputation ? svc.reputation.toFixed(1) : "New"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-[10px] text-white/30">Your price</span>
                        <span className="text-base font-bold text-nx-emerald">{shortKES(svc.price)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit hint — service management lives in the provider's listing manager */}
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-nx-cyan/[0.04] border border-nx-cyan/10">
            <Eye className="w-4 h-4 text-nx-cyan shrink-0" />
            <p className="text-[11px] text-white/40">
              Services are managed together with your listings. Use{" "}
              <button onClick={() => navigate("/seller/products")} className="text-nx-cyan underline underline-offset-2">
                My Listings → Products
              </button>{" "}
              to edit, pause, or remove any service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
