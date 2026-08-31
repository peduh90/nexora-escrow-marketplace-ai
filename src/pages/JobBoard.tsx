import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import BuyerSidebar from "./buyer/BuyerSidebar";
import { JOB_CATEGORIES, KENYA_COUNTIES } from "@/lib/kenya-locations";
import {
  Briefcase, Search, Filter, Plus, MapPin, Clock, Star, Users,
  CheckCircle2, Shield, ChevronRight, Globe, Wallet, Eye, X,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>{children}</motion.div>
  );
}

const jobs = [
  { id: "JOB-001", type: "job", title: "React Native Developer Needed", desc: "Building a fintech mobile app for the Kenyan market. Must have 3+ years experience with React Native and TypeScript.", budget: 250000, budgetType: "fixed", category: "Web Development", county: "Nairobi", town: "Westlands", remote: true, skills: ["React Native", "TypeScript", "Firebase"], duration: "3 months", applicants: 12, views: 342, postedBy: "TechStartup KE", verified: true, time: "2 hrs ago", status: "open" },
  { id: "JOB-002", type: "service", title: "Professional Photography Services", desc: "Event photography for weddings, corporate events, and product shoots. Full equipment included.", budget: 15000, budgetType: "hourly", category: "Photography & Video", county: "Nairobi", town: "Karen", remote: false, skills: ["Photography", "Editing"], duration: "Per event", applicants: 8, views: 567, postedBy: "Capture KE Studio", verified: true, time: "5 hrs ago", status: "open" },
  { id: "JOB-003", type: "gig", title: "Delivery Driver Needed — Nakuru Route", desc: "Experienced driver needed for inter-county deliveries. Own vehicle preferred. Nakuru-Nairobi route.", budget: 5000, budgetType: "daily", category: "Transport & Delivery", county: "Nakuru", town: "Nakuru", remote: false, skills: ["Driving", "Logistics"], duration: "Ongoing", applicants: 23, views: 891, postedBy: "QuickTrucks KE", verified: true, time: "1 day ago", status: "open" },
  { id: "JOB-004", type: "freelance", title: "Logo & Brand Identity Design", desc: "Need a creative designer for a new agriculture brand. Logo, color palette, and brand guidelines.", budget: 35000, budgetType: "fixed", category: "Graphic Design", county: "Kisii", town: "Kisii", remote: true, skills: ["Logo Design", "Branding", "Illustrator"], duration: "2 weeks", applicants: 19, views: 445, postedBy: "GreenFarm Co.", verified: false, time: "2 days ago", status: "open" },
  { id: "JOB-005", type: "service", title: "House Cleaning & Deep Cleaning", desc: "Professional cleaning services for homes and offices. Eco-friendly products used. Nairobi metropolitan.", budget: 3000, budgetType: "hourly", category: "Cleaning & Housekeeping", county: "Nairobi", town: "Kilimani", remote: false, skills: ["Cleaning", "Organizing"], duration: "Per session", applicants: 15, views: 678, postedBy: "CleanHome KE", verified: true, time: "3 days ago", status: "open" },
  { id: "JOB-006", type: "job", title: "Digital Marketing Manager", desc: "Managing social media, SEO, and paid ads for an e-commerce platform. Must understand the Kenyan market.", budget: 120000, budgetType: "monthly", category: "Digital Marketing", county: "Mombasa", town: "Nyali", remote: true, skills: ["SEO", "Social Media", "Google Ads", "Analytics"], duration: "6 months", applicants: 31, views: 1203, postedBy: "Coast E-Commerce", verified: true, time: "4 days ago", status: "open" },
];

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  job: { label: "Job", color: "text-nx-violet", bg: "bg-nx-violet/10" },
  service: { label: "Service", color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  gig: { label: "Gig", color: "text-nx-gold", bg: "bg-nx-gold/10" },
  freelance: { label: "Freelance", color: "text-nx-emerald", bg: "bg-nx-emerald/10" },
};

export default function JobBoard() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const filtered = jobs.filter((j) => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.category.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || j.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <BuyerSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <h2 className="text-sm font-semibold text-white">Job & Services Board</h2>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-violet text-white text-xs font-medium hover:bg-nx-violet/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Post Job
          </button>
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

          {/* Type filters */}
          <div className="flex gap-1.5 overflow-x-auto">
            {["all", "job", "service", "gig", "freelance"].map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${typeFilter === t ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-white/[0.02]"}`}>
                {t === "all" ? "All" : t}
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {JOB_CATEGORIES.slice(0, 10).map((cat) => (
              <button key={cat.slug} className="px-2.5 py-1.5 rounded-lg text-[11px] text-white/30 hover:text-white/50 bg-white/[0.02] whitespace-nowrap transition-colors flex items-center gap-1">
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>

          {/* Job listings */}
          <div className="space-y-3">
            {filtered.map((job, i) => {
              const tp = typeConfig[job.type];
              return (
                <FadeIn key={job.id} delay={i * 0.04}>
                  <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 hover:border-white/10 transition-all cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center text-xl shrink-0 group-hover:bg-white/[0.05] transition-colors">
                        {JOB_CATEGORIES.find((c) => c.name === job.category)?.icon || "💼"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-medium text-white">{job.title}</h3>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${tp.color} ${tp.bg}`}>{tp.label}</span>
                          {job.verified && <CheckCircle2 className="w-3 h-3 text-nx-cyan" />}
                          {job.remote && <Globe className="w-3 h-3 text-nx-emerald" />}
                        </div>
                        <p className="text-xs text-white/40 line-clamp-2 mb-2">{job.desc}</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {job.skills.map((s) => (
                            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.03] text-white/30">{s}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-white/25">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.town}, {job.county}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.duration}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job.applicants} applicants</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {job.views}</span>
                          <span>{job.time}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-white">
                          KES {job.budget.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-white/25">{job.budgetType}</p>
                        <div className="flex items-center gap-1 mt-2 justify-end">
                          <Shield className="w-3 h-3 text-nx-violet" />
                          <span className="text-[9px] text-nx-violet">Escrow</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>

        {/* Post Job Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-white/10 bg-nx-surface shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Post a Job / Service</h3>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-white/[0.05] text-white/30"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Type *</label>
                  <select className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none">
                    <option value="job">Job Posting</option>
                    <option value="service">Service Offer</option>
                    <option value="gig">Gig / Task</option>
                    <option value="freelance">Freelance Project</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Title *</label>
                  <input placeholder="e.g. React Developer Needed"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Description *</label>
                  <textarea rows={4} placeholder="Describe the job/service in detail..."
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Budget (KES) *</label>
                    <input type="number" placeholder="0"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Budget Type</label>
                    <select className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none">
                      <option value="fixed">Fixed Price</option>
                      <option value="hourly">Per Hour</option>
                      <option value="daily">Per Day</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Category *</label>
                    <select className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none">
                      <option value="">Select</option>
                      {JOB_CATEGORIES.map((c) => <option key={c.slug} value={c.name}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">County *</label>
                    <select className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:border-nx-violet/50 focus:outline-none">
                      <option value="">Select</option>
                      {KENYA_COUNTIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="remote" className="rounded border-white/20 bg-white/[0.03]" />
                  <label htmlFor="remote" className="text-sm text-white/60">Available for remote work</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-white/50">Cancel</button>
                  <button className="flex-1 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors">Post Job</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
