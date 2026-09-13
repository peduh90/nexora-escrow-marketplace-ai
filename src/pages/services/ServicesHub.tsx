import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import NavigationBar from "@/components/layout/NavigationBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import SupportDock from "@/components/SupportDock";
import {
  ArrowLeft, MapPin, Search, Star, Navigation, Loader2,
} from "lucide-react";
import { KENYA_COUNTIES } from "@/lib/kenya-locations";
import { serviceImage } from "@/lib/service-images";

/**
 * Local Services hub + category browser. Extremely simple:
 * pick a category → see who's nearby → tap a provider.
 */
export default function ServicesHub() {
  const navigate = useNavigate();
  const { category } = useParams();
  const [params] = useSearchParams();
  // Accept ?q= from the homepage universal search (scope: Services).
  const [q, setQ] = useState(params.get("q") ?? "");
  const [availableOnly, setAvailableOnly] = useState(false);
  // Location-based discovery — the user picks their county; results are
  // filtered server-side. Persisted so it survives page navigation.
  const [county, setCounty] = useState(localStorage.getItem("nx_service_county") ?? "");
  useEffect(() => {
    if (county) localStorage.setItem("nx_service_county", county);
  }, [county]);

  const categories = useQuery(api.services.getCategories);
  const results = useQuery(
    q.trim() ? api.services.searchProviders : api.services.getProvidersByCategory,
    q.trim()
      ? { q: q.trim(), ...(category ? { category } : {}), ...(county ? { county } : {}) }
      : { category: category || "beauty", availableNow: availableOnly || undefined, ...(county ? { county } : {}) },
  );
  const availableNow = useQuery(api.services.getAvailableNow, { limit: 6 });

  useEffect(() => {
    setAvailableOnly(params.get("available") === "1");
  }, [params]);

  const activeCat = useMemo(
    () => categories?.find((c: any) => c.slug === category),
    [categories, category],
  );

  const providers = (results ?? []) as any[];
  const loading = categories === undefined || results === undefined;

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-24 md:pb-8">
      <NavigationBar />

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (category ? navigate("/services") : navigate("/"))}
            className="p-2 rounded-lg bg-white/[0.04] border border-white/8 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              {activeCat ? `${activeCat.emoji} ${activeCat.name}` : "Services Near You"}
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              {activeCat ? activeCat.types.join(" · ") : "Real people, real skills, escrow-protected payments."}
            </p>
          </div>
        </div>

        {/* Category chips (when not inside one) */}
        {!category && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {(categories ?? []).map((c: any) => (
              <button
                key={c.slug}
                onClick={() => navigate(`/services/category/${c.slug}`)}
                className="shrink-0 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] pl-1.5 pr-3.5 py-1.5 text-xs font-medium text-white/75 hover:border-nx-cyan/40 hover:text-white transition-colors"
              >
                {serviceImage(c.slug) ? (
                  <img
                    src={serviceImage(c.slug)}
                    alt=""
                    loading="lazy"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="ml-1.5">{c.emoji}</span>
                )}
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 flex items-center rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <Search className="w-4 h-4 text-white/30 ml-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={activeCat ? `Search ${activeCat.name.toLowerCase()}…` : "Search plumber, salon, mechanic…"}
              className="flex-1 px-3 py-2.5 bg-transparent text-sm placeholder:text-white/25 outline-none"
            />
          </div>
          {/* Location picker — Kenyan-first, all 47 counties */}
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-white/70 outline-none focus:border-nx-cyan/40 [&>option]:bg-[#0B0B14]"
            aria-label="Choose your county"
          >
            <option value="">📍 All Kenya</option>
            {KENYA_COUNTIES.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => setAvailableOnly((v) => !v)}
            className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
              availableOnly
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/[0.04] text-white/55 hover:text-white"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full ${availableOnly ? "animate-ping bg-emerald-400 opacity-60" : ""}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${availableOnly ? "bg-emerald-400" : "bg-white/30"}`} />
            </span>
            Available now
          </button>
        </div>

        {/* Available-now strip on the hub */}
        {!category && !q && availableNow && availableNow.length > 0 && (
          <div className="mt-5">
            <h2 className="text-sm font-bold text-white/85 flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Available right now
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {availableNow.map((p: any) => (
                <button
                  key={p._id}
                  onClick={() => navigate(`/services/provider/${p._id}`)}
                  className="shrink-0 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.1] transition-colors px-3.5 py-2 text-left"
                >
                  <p className="text-xs font-semibold text-white">{p.displayName}</p>
                  <p className="text-[10px] text-white/45">{p.serviceType} · {p.town}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Providers */}
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
          ) : providers.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-10 text-center">
              <p className="text-sm text-white/55 font-medium">
                {q ? `No providers match "${q}".` : "No providers here yet."}
              </p>
              <p className="text-xs text-white/35 mt-1.5 max-w-md mx-auto">
                Be the first {activeCat ? activeCat.name.toLowerCase() : "provider"} in your area — registration is free and you keep your own prices.
              </p>
              <button
                onClick={() => navigate("/services/register")}
                className="mt-4 px-5 py-2.5 rounded-xl bg-nx-cyan text-black text-sm font-bold hover:bg-nx-cyan/85"
              >
                List My Service
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {providers.map((p) => (
                <button
                  key={p._id}
                  onClick={() => navigate(`/services/provider/${p._id}`)}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{p.displayName}</p>
                      <p className="text-xs text-white/45 mt-0.5">{p.serviceType}</p>
                    </div>
                    {p.availability === "available_now" && (
                      <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded-full px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> NOW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {p.town}, {p.county}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    {p.pricingMode !== "quote" && p.basePrice ? (
                      <span className="text-sm font-bold text-emerald-300">
                        {p.pricingMode === "starting_from" ? "from " : ""}KES {p.basePrice.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-xs text-white/35">Ask price first</span>
                    )}
                    <span className="flex items-center gap-2 text-xs">
                      {p.verified && <span className="text-[10px] text-nx-cyan font-semibold">✓ Verified</span>}
                      {!!p.rating && (
                        <span className="text-amber-300 flex items-center gap-0.5">
                          <Star className="w-3 h-3" /> {p.rating}
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transport cross-link */}
        <div className="mt-8 rounded-2xl border border-nx-violet/20 bg-nx-violet/[0.05] p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-2xl">🏍️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Need a ride instead?</p>
            <p className="text-xs text-white/45 mt-0.5">Boda, taxi, tuk-tuk & delivery — see the fare before you request.</p>
          </div>
          <button
            onClick={() => navigate("/transport")}
            className="shrink-0 px-4 py-2 rounded-xl bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/85 inline-flex items-center gap-1.5"
          >
            <Navigation className="w-4 h-4" /> Book a Ride
          </button>
        </div>
      </div>

      <MobileBottomNav />
      {/* Help icons on every surface: WhatsApp + NexoraAI */}
      <SupportDock panel="services" stacked message="Hello Nexora Support 👋 I need help with Nexora services." />
    </div>
  );
}
