import { useQuery } from "convex/react";
import { useNavigate, useParams } from "react-router";
import { api } from "../convex/_generated/api";
import ScrollReveal from "@/components/ScrollReveal";
import { MapPin, Star, Shield, Package, MessageSquare, ArrowLeft, Clock, CheckCircle2, ExternalLink } from "lucide-react";

export default function SellerProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const allListings = useQuery(api.listings.getActiveListings, { limit: 100 });

  // Get seller info from listings
  const sellerListings = (allListings ?? []).filter((l: any) => l.sellerId === userId);
  const firstListing = sellerListings[0];

  const sellerName = firstListing?.sellerName || "Seller";
  const sellerVerified = firstListing?.sellerVerified || false;
  const sellerLocation = firstListing?.originCounty || "Kenya";
  const totalProducts = sellerListings.length;
  const avgPrice = sellerListings.length > 0
    ? Math.round(sellerListings.reduce((s: number, l: any) => s + (l.price || 0), 0) / sellerListings.length)
    : 0;

  const handleChat = () => {
    if (sellerListings[0]) {
      navigate(`/product/${sellerListings[0]._id}`);
    }
  };

  return (
    <div className="min-h-screen bg-nx-bg">
      {/* Header */}
      <div className="sticky top-0 z-30 h-14 bg-nx-card/80 backdrop-blur-xl border-b border-nx-border flex items-center px-4 md:px-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors mr-3">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-white">Seller Profile</h2>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Seller Card */}
        <ScrollReveal>
          <div className="relative p-6 md:p-8 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-nx-violet/10 to-nx-cyan/5" />
            <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-nx-violet/20 border-2 border-nx-violet/30 flex items-center justify-center text-2xl font-bold text-nx-violet shrink-0">
                {sellerName.charAt(0)}
              </div>
              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white">{sellerName}</h1>
                  {sellerVerified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-nx-emerald/10 text-nx-emerald text-[10px] font-semibold border border-nx-emerald/20">
                      <Shield className="w-3 h-3" /> Verified Seller
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-white/40 mt-2">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{sellerLocation}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Member since 2024</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />98% response rate</span>
                </div>
                {/* Stats */}
                <div className="flex items-center gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{totalProducts}</p>
                    <p className="text-[10px] text-white/30">Products</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">4.8</p>
                    <p className="text-[10px] text-white/30">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">
                      {avgPrice > 0 ? `KES ${(avgPrice / 1000).toFixed(0)}K` : "-"}
                    </p>
                    <p className="text-[10px] text-white/30">Avg Price</p>
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleChat}
                  className="px-4 py-2 rounded-lg bg-nx-violet/10 text-nx-violet text-sm font-medium hover:bg-nx-violet/20 transition-colors border border-nx-violet/20 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" /> Chat
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Rating Summary */}
        <ScrollReveal delay={100}>
          <div className="mt-6 p-5 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">Rating Summary</h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">4.8</p>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3 h-3 ${s <= 4 ? "text-yellow-400 fill-yellow-400" : "text-white/10"}`} />
                  ))}
                </div>
                <p className="text-[10px] text-white/30 mt-1">Based on reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[
                  { stars: 5, pct: 78 },
                  { stars: 4, pct: 15 },
                  { stars: 3, pct: 5 },
                  { stars: 2, pct: 1 },
                  { stars: 1, pct: 1 },
                ].map((r) => (
                  <div key={r.stars} className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30 w-3">{r.stars}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-yellow-400/60" style={{ width: `${r.pct}%` }} />
                    </div>
                    <span className="text-[10px] text-white/20 w-8">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Products */}
        <ScrollReveal delay={200}>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                Products ({totalProducts})
              </h3>
            </div>
            {sellerListings.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-white/5">
                <Package className="w-10 h-10 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">No products listed yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sellerListings.map((listing: any) => (
                  <button
                    key={listing._id}
                    onClick={() => navigate(`/product/${listing._id}`)}
                    className="text-left rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-all group"
                  >
                    <div className="aspect-[4/3] bg-white/[0.03] overflow-hidden">
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-white/10" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm text-white/70 font-medium truncate group-hover:text-white transition-colors">{listing.title}</h4>
                      <p className="text-sm font-bold text-white mt-0.5">KES {(listing.price || 0).toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
