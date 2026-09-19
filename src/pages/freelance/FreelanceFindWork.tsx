import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Shield, ArrowLeft, Search, Clock, Users, MapPin, Briefcase,
  Filter, ChevronDown, Star, Globe,
} from "lucide-react";

const CATEGORIES = [
  "all", "web-development", "writing", "design", "marketing",
  "business", "video", "education", "ai-tech",
];

const BUDGET_RANGES = [
  { label: "Any Budget", min: 0, max: 0 },
  { label: "Under KES 10,000", min: 0, max: 10000 },
  { label: "KES 10,000 - 25,000", min: 10000, max: 25000 },
  { label: "KES 25,000 - 50,000", min: 25000, max: 50000 },
  { label: "KES 50,000+", min: 50000, max: 999999 },
];


const priorityColors: Record<string, string> = {
  low: "text-white/40 bg-white/5",
  medium: "text-nx-cyan bg-nx-cyan/10",
  high: "text-nx-gold bg-nx-gold/10",
  urgent: "text-red-400 bg-red-400/10",
};

export default function FreelanceFindWork() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const tasks = useQuery(api.freelance.getOpenTasks, {
    category: category === "all" ? undefined : category,
    query: search || undefined,
  });

  const displayTasks = tasks ?? [];
  const filteredTasks = displayTasks.filter((t: any) => {
    if (budgetIdx > 0) {
      const range = BUDGET_RANGES[budgetIdx];
      if (t.budget < range.min || (range.max > 0 && t.budget > range.max)) return false;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="hidden md:flex sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/freelance/dashboard")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold text-white">Find Work</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">{filteredTasks.length} tasks</span>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks, skills, keywords..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/60 hover:border-nx-violet/20 transition-colors">
              <Filter className="w-4 h-4" /> Filters
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
              <div>
                <p className="text-xs text-white/40 mb-2 font-medium">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === c ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5 hover:border-white/10"}`}>
                      {c === "all" ? "All Categories" : c.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-2 font-medium">Budget Range</p>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_RANGES.map((r, i) => (
                    <button key={r.label} onClick={() => setBudgetIdx(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${budgetIdx === i ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5 hover:border-white/10"}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
                <Briefcase className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/40 font-medium">No jobs available yet</p>
                <p className="text-[11px] text-white/20 mt-1">Check back soon or adjust your search</p>
              </div>
            ) : (
              filteredTasks.map((task: any, i: number) => (
                <div key={task._id} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/15 transition-all cursor-pointer"
                  onClick={() => navigate(`/freelance/jobs/${task._id}`)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-nx-violet/10 text-nx-violet font-medium">
                          {task.category.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${priorityColors[task.priority] || ""}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-nx-emerald/10 text-nx-emerald font-medium">Escrow</span>
                        {task.remote && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-nx-cyan/10 text-nx-cyan font-medium flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" /> Remote
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1.5">{task.title}</h3>
                      <p className="text-xs text-white/30 mb-3 line-clamp-2">{task.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(task.skills || []).map((s: string) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40">{s}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-white/25">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.deadline || "Flexible"}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{task.applicants} applicants</span>
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{task.employerName}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-nx-emerald">KES {task.budget.toLocaleString()}</p>
                      <p className="text-[10px] text-white/25 mt-0.5 capitalize">{task.budgetType}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
