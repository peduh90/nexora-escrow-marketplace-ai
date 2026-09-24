import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Shield, Sparkles, Star, Wrench } from "lucide-react";
import {
  FREELANCE_CATEGORY_GRADIENTS,
  getFreelanceCategoryIcon,
  normalizeFreelanceCategory,
  freelanceCategoryName,
} from "@/lib/freelance-marketplace";

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
 * "Digital services marketplace" — ready-made freelance services (writing,
 * design, video, AI setup…) published to Nexora Freelance. Visually distinct
 * from the product rail: horizontal snap-scroll cards in the Freelance violet
 * identity, each leading to the full escrow checkout page.
 */
export default function DigitalServicesRail() {
  const navigate = useNavigate();
  const services = useQuery(api.listings.searchFreelanceListings, { query: "", limit: 10 });

  const showcase = (services ?? [])
    .filter((s: any) => normalizeFreelanceCategory(s.category) !== "ai-accounts-tools")
    .slice(0, 10);

  return (
    <section className="relative z-10 py-10 px-4 md:px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 text-nx-violet text-xs font-medium tracking-widest uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Digital Services Marketplace
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Digital services <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">marketplace</span>
            </h2>
            <p className="text-xs md:text-sm text-white/35 mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-nx-emerald animate-pulse" />
              {showcase.length} service{showcase.length === 1 ? "" : "s"} · only listings published to Nexora Freelance appear here
            </p>
          </div>
          <button
            onClick={() => navigate("/freelance/services")}
            className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-nx-violet transition-colors shrink-0"
          >
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </FadeIn>

        {services === undefined ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[280px] h-[300px] rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : showcase.length === 0 ? (
          <FadeIn>
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 px-6 py-10 text-center">
              <Wrench className="w-8 h-8 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/50 font-medium">No services published yet</p>
              <p className="text-xs text-white/25 mt-1.5">When a freelancer publishes a service, it appears here instantly.</p>
              <button
                onClick={() => navigate("/freelance/join?returnTo=%2Ffreelance%2Fpublish")}
                className="mt-4 px-5 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/85 transition-colors"
              >
                Sell Digital Products
              </button>
            </div>
          </FadeIn>
        ) : (
          <div className="-mx-4 md:-mx-6 px-4 md:px-6 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
            <div className="flex gap-4 w-max">
              {showcase.map((svc: any, i: number) => {
                const catSlug = normalizeFreelanceCategory(svc.category);
                const CatIcon = getFreelanceCategoryIcon(catSlug);
                const catName = freelanceCategoryName(svc.category);
                return (
                  <button
                      key={svc._id}
                      onClick={() => navigate(`/freelance/service/${svc._id}`)}
                      className="snap-start shrink-0 w-[260px] sm:w-[280px] text-left rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-nx-violet/40 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-nx-violet/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                    >
                      <div className={`aspect-[16/10] bg-gradient-to-br ${FREELANCE_CATEGORY_GRADIENTS[catSlug] || FREELANCE_CATEGORY_GRADIENTS["other-services"]} overflow-hidden relative flex items-center justify-center`}>
                        {svc.images?.[0] ? (
                          <img src={svc.images[0]} alt={svc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <CatIcon className="w-12 h-12 text-white/30" />
                        )}
                        <span className="absolute top-2 left-2 text-[9px] font-medium px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/90">
                          {catName}
                        </span>
                        <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-medium px-2 py-1 rounded-full bg-nx-emerald/15 backdrop-blur-sm border border-nx-emerald/25 text-nx-emerald">
                          <Shield className="w-2.5 h-2.5" /> Escrow
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-sm font-bold text-white leading-snug group-hover:text-nx-violet transition-colors line-clamp-2">
                          {svc.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-5 h-5 rounded-full bg-nx-violet/15 flex items-center justify-center text-nx-violet text-[9px] font-bold shrink-0">
                            {(svc.sellerName || "S").charAt(0)}
                          </div>
                          <span className="text-[10px] text-white/40 truncate">{svc.sellerName}</span>
                          {svc.sellerReputation > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-400 ml-auto shrink-0">
                              <Star className="w-2.5 h-2.5 fill-amber-400" /> {svc.sellerReputation.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                          <span className="text-[10px] font-semibold text-nx-violet/80 group-hover:text-nx-violet transition-colors">
                            Order now →
                          </span>
                          <span className="flex items-baseline gap-1">
                            <span className="text-[10px] text-white/30">from</span>
                            <span className="text-sm font-bold text-white">KES {Number(svc.price).toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
