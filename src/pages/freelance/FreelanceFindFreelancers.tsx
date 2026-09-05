import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft, Search, Star, MapPin, Briefcase, Filter, ChevronDown,
  Globe, CheckCircle2, Users,
} from "lucide-react";

const CATEGORIES = [
  "all", "web-development", "writing", "design", "marketing",
  "business", "video", "education", "ai-tech",
];

const SAMPLE_FREELANCERS = [
  { userId: "f1", displayName: "Faith Wanjiku", title: "Full-Stack Developer", bio: "Experienced full-stack developer with 5+ years building web apps for African startups.", skills: ["React", "Node.js", "TypeScript", "PostgreSQL"], categories: ["web-development"], hourlyRate: 2500, avgRating: 4.9, completedProjects: 47, availability: "available", location: "Nairobi", languages: ["English", "Swahili"] },
  { userId: "f2", displayName: "James Ochieng", title: "Content Writer & SEO Specialist", bio: "Professional content writer specializing in tech and fintech content for African markets.", skills: ["SEO", "Blog Writing", "Copywriting", "Content Strategy"], categories: ["writing"], hourlyRate: 1200, avgRating: 4.8, completedProjects: 63, availability: "available", location: "Mombasa", languages: ["English"] },
  { userId: "f3", displayName: "Amina Hassan", title: "UI/UX Designer", bio: "Creative UI/UX designer with expertise in mobile app design and fintech interfaces.", skills: ["Figma", "UI Design", "Prototyping", "User Research"], categories: ["design"], hourlyRate: 3000, avgRating: 5.0, completedProjects: 38, availability: "available", location: "Nairobi", languages: ["English", "Swahili", "Somali"] },
  { userId: "f4", displayName: "Peter Kamau", title: "Mobile App Developer", bio: "Specialized in cross-platform mobile development with Flutter and React Native.", skills: ["Flutter", "React Native", "iOS", "Android"], categories: ["web-development", "ai-tech"], hourlyRate: 3500, avgRating: 4.7, completedProjects: 29, availability: "busy", location: "Kisumu", languages: ["English", "Swahili"] },
  { userId: "f5", displayName: "Grace Nyambura", title: "Digital Marketing Expert", bio: "Helping businesses grow through social media marketing and paid advertising.", skills: ["SEO", "Social Media", "Google Ads", "Facebook Ads"], categories: ["marketing"], hourlyRate: 1800, avgRating: 4.9, completedProjects: 51, availability: "available", location: "Nairobi", languages: ["English"] },
  { userId: "f6", displayName: "David Mutua", title: "Data Analyst & Python Developer", bio: "Turning data into actionable insights for businesses across East Africa.", skills: ["Python", "SQL", "Excel", "Machine Learning"], categories: ["ai-tech", "business"], hourlyRate: 2000, avgRating: 4.6, completedProjects: 22, availability: "available", location: "Nairobi", languages: ["English", "Swahili"] },
];

export default function FreelanceFindFreelancers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [showFilters, setShowFilters] = useState(false);

  const freelancers = useQuery(api.freelance.searchFreelancers, {
    query: search || undefined,
    category: category === "all" ? undefined : category,
  });

  const display = (freelancers && freelancers.length > 0) ? freelancers : SAMPLE_FREELANCERS;

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/freelance/dashboard")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold text-white">Find Freelancers</h1>
          </div>
          <span className="text-xs text-white/30">{display.length} freelancers</span>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, skill, or title..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/60 hover:border-nx-violet/20 transition-colors">
              <Filter className="w-4 h-4" /> Filters
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-xs text-white/40 mb-2 font-medium">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === c ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5 hover:border-white/10"}`}>
                    {c === "all" ? "All" : c.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Freelancer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {display.map((fl: any, i: number) => (
              <div key={fl._id || fl.userId || i} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/20 hover:bg-white/[0.04] transition-all cursor-pointer"
                onClick={() => navigate(`/freelance/profile/${fl.userId}`)}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-nx-violet/15 flex items-center justify-center text-nx-violet font-bold text-lg shrink-0">
                    {(fl.displayName || "U")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white">{fl.displayName}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{fl.title || "Freelancer"}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-nx-gold fill-nx-gold" />
                        <span className="text-xs font-medium text-white">{fl.avgRating?.toFixed(1) || "4.8"}</span>
                      </div>
                      <span className="text-[10px] text-white/25">{fl.completedProjects || 0} done</span>
                    </div>
                  </div>
                  <div className={`text-[10px] px-2 py-0.5 rounded font-medium ${fl.availability === "available" ? "text-nx-emerald bg-nx-emerald/10" : "text-white/40 bg-white/5"}`}>
                    {fl.availability || "available"}
                  </div>
                </div>

                <p className="text-xs text-white/30 mb-3 line-clamp-2">{fl.bio || "No bio available"}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(fl.skills || []).slice(0, 4).map((s: string) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-nx-violet/10 text-nx-violet/70">{s}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-3 text-[10px] text-white/25">
                    {fl.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{fl.location}</span>}
                    {fl.languages && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{fl.languages.join(", ")}</span>}
                  </div>
                  <span className="text-sm font-bold text-nx-emerald">KES {(fl.hourlyRate || 0).toLocaleString()}/hr</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
