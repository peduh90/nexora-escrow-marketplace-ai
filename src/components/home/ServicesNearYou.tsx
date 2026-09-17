import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, MapPin, Navigation, Star, TrendingUp, Bike, Bus, CarTaxiFront, Package } from "lucide-react";
import { categoryImage } from "@/lib/categoryImages";

/** Same reveal-on-scroll wrapper the homepage already uses. */
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * "Services Near You" — Kenya-first local services & transport on the Nexora
 * homepage. Every number comes from the live backend; when nothing exists yet
 * we show honest empty states instead of fake providers or stats.
 */
export default function ServicesNearYou() {
  const navigate = useNavigate();
  const categories = useQuery(api.services.getCategories);
  const availableNow = useQuery(api.services.getAvailableNow, { limit: 10 });
  const popular = useQuery(api.services.getPopularServices, { limit: 8 });
  const riders = useQuery(api.transport.getTransportProviders, { availableNow: true });
  const routes = useQuery(api.transport.getRoutes);

  const loading =
    categories === undefined || availableNow === undefined ||
    popular === undefined || riders === undefined || routes === undefined;

  const goCategory = (slug: string) => navigate(`/services/category/${slug}`);

  return (
    <section className="relative z-10 py-10 px-4 md:px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* ── Services Near You ── */}
        <div>
          <FadeIn className="flex items-end justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-2 text-nx-cyan text-xs font-medium tracking-widest uppercase mb-2">
                <MapPin className="w-3.5 h-3.5" /> Services Near You
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Someone near you can <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">help right now</span>
              </h2>
              <p className="text-sm text-white/40 mt-1.5">Salon, plumber, mechanic, cleaner — request, pay safely, rate after.</p>
            </div>
            <button
              onClick={() => navigate("/services")}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors shrink-0"
            >
              All services <ArrowRight className="w-4 h-4" />
            </button>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
                ))
              : categories.map((cat: any, i: number) => (
                  <motion.button
                    key={cat.slug}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    onClick={() => goCategory(cat.slug)}
                    className="group relative flex flex-col items-center justify-end h-28 rounded-2xl overflow-hidden border border-white/8 hover:border-nx-cyan/40 transition-all text-center px-2 pb-2.5"
                  >
                    {/* Real photo background */}
                    {(() => { const img = categoryImage(cat.slug); return img ? (
                      <img
                        src={img}
                        alt={cat.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-b from-nx-cyan/[0.07] to-nx-violet/[0.07]" />
                    ); })()}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75 group-hover:from-black/45 group-hover:to-black/70 transition-colors" />
                    <span className="relative z-10 text-[11px] md:text-xs font-bold text-white leading-tight drop-shadow">
                      {cat.name}
                    </span>
                  </motion.button>
                ))}
          </div>
        </div>

        {/* ── Transport Near You ── */}
        <div>
          <FadeIn className="flex items-end justify-between gap-4 mb-5">
            <div>
              <div className="inline-flex items-center gap-2 text-nx-violet text-xs font-medium tracking-widest uppercase mb-2">
                <Navigation className="w-3.5 h-3.5" /> Transport Near You
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Boda, Matatu & Taxi — <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">price before you ride</span></h2>
              <p className="text-sm text-white/40 mt-1.5">Enter where you are and where you're going. See the fare first. Pay after arrival.</p>
            </div>
            <button
              onClick={() => navigate("/transport")}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors shrink-0"
            >
              Book a ride <ArrowRight className="w-4 h-4" />
            </button>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <button
              onClick={() => navigate("/transport?type=boda")}
              className="group rounded-2xl border border-nx-violet/25 bg-nx-violet/[0.07] hover:bg-nx-violet/[0.12] transition-all p-4 text-left"
            >
              <span className="flex w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 items-center justify-center text-nx-violet">
                <Bike className="w-6 h-6" strokeWidth={2.2} />
              </span>
              <p className="mt-2 text-sm font-bold text-white">Get a Boda</p>
              <p className="text-[11px] text-white/45 mt-0.5">Fare shown before you request</p>
            </button>
            <button
              onClick={() => navigate("/transport?type=taxi")}
              className="group rounded-2xl border border-nx-cyan/25 bg-nx-cyan/[0.06] hover:bg-nx-cyan/[0.12] transition-all p-4 text-left"
            >
              <span className="flex w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 items-center justify-center text-nx-cyan">
                <CarTaxiFront className="w-6 h-6" strokeWidth={2.2} />
              </span>
              <p className="mt-2 text-sm font-bold text-white">Take a Taxi</p>
              <p className="text-[11px] text-white/45 mt-0.5">Verified drivers only</p>
            </button>
            <button
              onClick={() => navigate("/transport?tab=matatu")}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all p-4 text-left"
            >
              <span className="flex w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 items-center justify-center text-amber-400">
                <Bus className="w-6 h-6" strokeWidth={2.2} />
              </span>
              <p className="mt-2 text-sm font-bold text-white">Matatu Routes</p>
              <p className="text-[11px] text-white/45 mt-0.5">Stage fares & schedules</p>
            </button>
            <button
              onClick={() => navigate("/transport?type=delivery")}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all p-4 text-left"
            >
              <span className="flex w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 items-center justify-center text-orange-400">
                <Package className="w-6 h-6" strokeWidth={2.2} />
              </span>
              <p className="mt-2 text-sm font-bold text-white">Send a Parcel</p>
              <p className="text-[11px] text-white/45 mt-0.5">Delivery priced by distance</p>
            </button>
          </div>

          {/* Live matatu routes (real routes only) */}
          {!loading && routes.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {routes.slice(0, 6).map((r: any) => (
                <button
                  key={r._id}
                  onClick={() => navigate("/transport?tab=matatu")}
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/70 hover:text-white hover:border-white/25 transition-colors"
                >
                  <Bus className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-400" />{r.name} · {r.stages.length} stages
                </button>
              ))}
            </div>
          )}

          {/* Riders available now (real, verified only) */}
          {!loading && riders.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {riders.slice(0, 8).map((p: any) => (
                <div
                  key={p._id}
                  className="shrink-0 flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-1.5"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="text-xs text-white/80">{p.displayName}</span>
                  <span className="text-[10px] uppercase tracking-wide text-white/40">{p.serviceType}</span>
                  {!!p.rating && (
                    <span className="text-[10px] text-amber-300 flex items-center gap-0.5">
                      <Star className="w-3 h-3" /> {p.rating}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Available Now + Popular Services ── */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <FadeIn className="mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
                Available Now
              </h3>
              <p className="text-xs text-white/40 mt-1">Providers accepting requests at this moment.</p>
            </FadeIn>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}</div>
            ) : availableNow.length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6 text-center">
                <p className="text-sm text-white/50">No providers are online right now.</p>
                <button
                  onClick={() => navigate("/services/register")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-nx-cyan hover:text-white transition-colors"
                >
                  Offer a service in your area <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {availableNow.slice(0, 5).map((p: any) => (
                  <button
                    key={p._id}
                    onClick={() => navigate(`/services/provider/${p._id}`)}
                    className="w-full flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all p-3 text-left"
                  >
                    <span
                      className="w-10 h-10 rounded-full bg-nx-violet/15 border border-nx-violet/25 flex items-center justify-center text-sm font-bold text-white/80 shrink-0"
                      aria-hidden
                    >
                      {(p.displayName || "?").trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{p.displayName}</p>
                      <p className="text-[11px] text-white/40 truncate">{p.serviceType} · {p.town}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {!!p.rating && (
                        <p className="text-xs text-amber-300 flex items-center gap-0.5 justify-end">
                          <Star className="w-3 h-3" /> {p.rating}
                        </p>
                      )}
                      {p.basePrice && p.pricingMode !== "quote" ? (
                        <p className="text-[11px] text-emerald-300">from KES {p.basePrice.toLocaleString()}</p>
                      ) : (
                        <p className="text-[11px] text-white/35">ask first</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <FadeIn className="mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-300" /> Popular Services
              </h3>
              <p className="text-xs text-white/40 mt-1">What your neighbours request the most.</p>
            </FadeIn>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}</div>
            ) : popular.length === 0 ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6 text-center">
                <p className="text-sm text-white/50">The first completed jobs will rank here — real jobs only, no fakes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {popular.slice(0, 6).map((s: any) => (
                  <button
                    key={`${s.category}:${s.serviceType}`}
                    onClick={() => goCategory(s.category)}
                    className="rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition-all p-3 text-left"
                  >
                    <p className="text-sm font-semibold text-white truncate">{s.serviceType}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {s.jobs} job{s.jobs === 1 ? "" : "s"} done
                      {!!s.rating && <span className="text-amber-300"> · {s.rating}★</span>}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Provider CTA ── */}
        <FadeIn>
          <div className="rounded-2xl border border-nx-cyan/20 bg-gradient-to-r from-nx-violet/[0.08] to-nx-cyan/[0.06] p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">Have a skill, a bike or a car?</h3>
              <p className="text-sm text-white/50 mt-1">
                Register your service or boda in under 2 minutes. Get customers nearby, keep your own prices, get paid to your wallet the moment the job is done.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigate("/services/register")}
                className="px-5 py-2.5 rounded-xl bg-nx-cyan text-black text-sm font-bold hover:bg-nx-cyan/85 transition-colors"
              >
                List My Service
              </button>
              <button
                onClick={() => navigate("/transport/register")}
                className="px-5 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-bold hover:bg-nx-violet/85 transition-colors"
              >
                Drive & Earn
              </button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
