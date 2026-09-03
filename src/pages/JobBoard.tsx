import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import BuyerSidebar from "./buyer/BuyerSidebar";
import {
  Briefcase, Search, Plus, MapPin, Clock, Users, Globe, Package,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>;
}

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  job: { label: "Job", color: "text-nx-violet", bg: "bg-nx-violet/10" },
  service: { label: "Service", color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  gig: { label: "Gig", color: "text-nx-gold", bg: "bg-nx-gold/10" },
  freelance: { label: "Freelance", color: "text-nx-emerald", bg: "bg-nx-emerald/10" },
};

export default function JobBoard() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const jobPosts = useQuery(api.listings.getActiveListings, { limit: 50 });

  // Filter job-like listings (services, gigs, freelance work are listed as products)
  const allJobs = (jobPosts ?? []).filter((l: any) =>
    l.category === "services" || l.category === "jobs"
  );

  const filtered = allJobs.filter((j: any) => {
    const matchSearch = !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.description.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <BuyerSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <h2 className="text-sm font-semibold text-white">Job & Services Board</h2>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          <FadeIn>
            <h1 className="text-2xl font-bold text-white">Jobs & Services</h1>
            <p className="text-sm text-white/40 mt-1">Find work, hire talent, or offer your services — all escrow protected</p>
          </FadeIn>

          {/* Search */}
          <FadeIn delay={0.05}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search jobs, services, skills..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              </div>
            </div>
          </FadeIn>

          {/* Results */}
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((job: any, i: number) => (
                <FadeIn key={job._id} delay={i * 0.05}>
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-nx-violet/10 text-nx-violet font-medium">Service</span>
                          {job.escrowProtection && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-nx-emerald/10 text-nx-emerald font-medium">Escrow</span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">{job.title}</h3>
                        <p className="text-[11px] text-white/30 mb-2 line-clamp-2">{job.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/20">
                          {job.originCounty && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.originTown}, {job.originCounty}</span>
                          )}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(job.createdAt).toLocaleDateString()}</span>
                          {job.sellerVerified && <span className="text-nx-emerald">✓ Verified</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">KES {(job.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          ) : (
            <FadeIn delay={0.1}>
              <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
                <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/40 font-medium">No jobs or services posted yet</p>
                <p className="text-[11px] text-white/20 mt-1">Check back later or browse the marketplace</p>
              </div>
            </FadeIn>
          )}
        </div>
      </main>
    </div>
  );
}
