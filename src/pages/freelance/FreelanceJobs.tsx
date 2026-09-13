import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import FreelanceNav from "./FreelanceNav";
import {
  FREELANCE_CATEGORIES,
  freelanceCategoryName,
  getFreelanceCategoryIcon,
  normalizeFreelanceCategory,
} from "@/lib/freelance-marketplace";
import { shortKES } from "@/lib/fees";
import {
  Search, Briefcase, MapPin, Clock, Users, Globe, X, Plus, Loader2,
  CheckCircle2, Shield, ArrowRight, Filter, ChevronDown,
} from "lucide-react";

const priorityColors: Record<string, string> = {
  low: "text-white/40 bg-white/5",
  medium: "text-nx-cyan bg-nx-cyan/10",
  high: "text-nx-gold bg-nx-gold/10",
  urgent: "text-red-400 bg-red-400/10",
};

const budgetRanges = [
  { label: "Any budget", min: 0, max: 0 },
  { label: "Under KES 10K", min: 0, max: 10000 },
  { label: "KES 10K – 50K", min: 10000, max: 50000 },
  { label: "KES 50K+", min: 50000, max: 0 },
];

const skillSuggestions = [
  "Writing", "AI Tools", "Web Design", "Development", "SEO", "Content",
  "Logo Design", "Social Media", "Chatbot", "Video Editing", "Translation", "Data Entry",
];

export default function FreelanceJobs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState<string>(searchParams.get("category") || "all");
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [showFilters, setShowFilters] = useState(searchParams.get("post") !== "1");

  // Post-job modal state
  const [showPost, setShowPost] = useState(searchParams.get("post") === "1");
  const createTask = useMutation(api.freelance.createTask);

  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pCat, setPCat] = useState("");
  const [pBudget, setPBudget] = useState("");
  const [pType, setPType] = useState<"fixed" | "milestone" | "hourly">("fixed");
  const [pSkills, setPSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [pDeadline, setPDeadline] = useState("");
  const [pRemote, setPRemote] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [posted, setPosted] = useState(false);

  const tasks = useQuery(api.freelance.getOpenTasks, {
    category: category === "all" ? undefined : category,
    query: search || undefined,
    limit: 80,
  });
  const display = useMemo(() => {
    const list = tasks ?? [];
    return budgetIdx > 0
      ? list.filter((t: any) => {
          const r = budgetRanges[budgetIdx];
          return t.budget >= r.min && (r.max === 0 || t.budget <= r.max);
        })
      : list;
  }, [tasks, budgetIdx]);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !pSkills.includes(s)) {
      setPSkills([...pSkills, s]);
      setSkillInput("");
    }
  };

  const openPost = () => {
    if (!isAuthenticated) {
      navigate("/auth?returnTo=%2Ffreelance%2Fjobs%3Fpost%3D1");
      return;
    }
    setPostError("");
    setPosted(false);
    setShowPost(true);
  };

  const submitJob = async () => {
    setPostError("");
    if (!pTitle.trim()) { setPostError("Give the job a clear title."); return; }
    if (!pDesc.trim()) { setPostError("Describe the job scope and deliverables."); return; }
    if (!pCat) { setPostError("Pick a category."); return; }
    if (!pBudget || Number(pBudget) <= 0) { setPostError("Set a budget for the job."); return; }
    if (pSkills.length === 0) { setPostError("Add at least one required skill."); return; }
    setPosting(true);
    try {
      await createTask({
        title: pTitle.trim(),
        description: pDesc.trim(),
        category: pCat,
        skills: pSkills,
        budget: Number(pBudget),
        budgetType: pType,
        priority: "medium",
        deadline: pDeadline ? new Date(pDeadline).getTime() : undefined,
        remote: pRemote,
        experienceLevel: "intermediate",
      });
      setPosted(true);
      setShowPost(false);
      setPTitle(""); setPDesc(""); setPCat(""); setPBudget(""); setPSkills([]); setPDeadline(""); setPRemote(true);
    } catch (err: any) {
      setPostError(err.message || "Failed to post job. Try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <FreelanceNav active="jobs" />

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-nx-violet text-xs font-semibold tracking-widest uppercase mb-2">
              <Briefcase className="w-3.5 h-3.5" /> Jobs Board
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white">
              Post a job, <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">find the right freelancer</span>
            </h1>
            <p className="text-sm text-white/40 mt-2">
              Clients post projects — freelancers apply. Hiring is confirmed in escrow with secure milestone payments.
            </p>
          </div>
          <button
            onClick={openPost}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/80 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Post a Job
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-16 space-y-5">
        {/* Search & filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job titles, skills, keywords..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/60 hover:border-nx-violet/25 transition-colors"
          >
            <Filter className="w-4 h-4" /> Filters <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
            <div>
              <p className="text-xs text-white/40 mb-2 font-medium">Category</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCategory("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${category === "all" ? "bg-nx-violet/15 text-nx-violet border-nx-violet/25" : "bg-white/[0.03] text-white/40 border-white/5 hover:border-white/15"}`}>
                  All
                </button>
                {FREELANCE_CATEGORIES.map((c) => (
                  <button key={c.slug} onClick={() => setCategory(c.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 ${category === c.slug ? "bg-nx-violet/15 text-nx-violet border-nx-violet/25" : "bg-white/[0.03] text-white/40 border-white/5 hover:border-white/15"}`}>
                    <CategoryIcon slug={c.slug} className="w-3.5 h-3.5" /> {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-2 font-medium">Budget</p>
              <div className="flex flex-wrap gap-2">
                {budgetRanges.map((r, i) => (
                  <button key={r.label} onClick={() => setBudgetIdx(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${budgetIdx === i ? "bg-nx-violet/15 text-nx-violet border-nx-violet/25" : "bg-white/[0.03] text-white/40 border-white/5 hover:border-white/15"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Post success banner */}
        {posted && (
          <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-400">Job posted successfully!</p>
              <p className="text-xs text-white/40 mt-0.5">Freelancers can now find it and apply.</p>
            </div>
          </div>
        )}

        {/* Results */}
        {display.length === 0 ? (
          <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/5">
            <Briefcase className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/50 font-medium">No open jobs match your filters</p>
            <p className="text-[11px] text-white/25 mt-1 max-w-sm mx-auto">
              Try clearing filters — or be the first to post this kind of job.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {display.map((task: any) => (
              <button
                key={task._id}
                onClick={() => navigate(`/freelance/jobs/${task._id}`)}
                className="w-full text-left p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/20 hover:bg-white/[0.03] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-nx-violet/10 text-nx-violet font-medium flex items-center gap-1">
                        <CategoryIcon slug={task.category} /> {freelanceCategoryName(task.category)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${priorityColors[task.priority] || priorityColors.medium}`}>
                        {String(task.priority || "medium").toUpperCase()}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-nx-emerald/10 text-nx-emerald font-medium flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" /> Escrow
                      </span>
                      {task.remote && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-nx-cyan/10 text-nx-cyan font-medium flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> Remote
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-nx-violet transition-colors">{task.title}</h3>
                    <p className="text-xs text-white/30 mt-1.5 line-clamp-2">{task.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(task.skills || []).slice(0, 5).map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/40">{s}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] text-white/25">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{task.applicants} {task.applicants === 1 ? "applicant" : "applicants"}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(task.createdAt)}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{task.employerName}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-nx-emerald">{shortKES(task.budget)}</p>
                    <p className="text-[10px] text-white/25 mt-0.5 capitalize">{task.budgetType}</p>
                    <span className="hidden md:flex items-center gap-1 text-[11px] text-nx-violet mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      View & Apply <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ───────── Post-a-Job modal ───────── */}
      {showPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPost(false)} />
          <div className="relative w-full max-w-xl rounded-2xl bg-[#0E0E18] border border-white/5 shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-nx-violet" /> Post a Job
                </h3>
                <p className="text-xs text-white/30 mt-0.5">Posting as {user?.name || user?.email || "you"}</p>
              </div>
              <button onClick={() => setShowPost(false)} className="p-1 text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Job title *</label>
                <input value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="e.g. Build a landing page for my coffee brand"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Category *</label>
                <div className="flex flex-wrap gap-2">
                  {FREELANCE_CATEGORIES.map((c) => (
                    <button key={c.slug} onClick={() => setPCat(c.slug)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 ${pCat === c.slug ? "bg-nx-violet/15 text-nx-violet border-nx-violet/25" : "bg-white/[0.03] text-white/40 border-white/5 hover:border-white/15"}`}>
                      <CategoryIcon slug={c.slug} className="w-3.5 h-3.5" /> {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Description & deliverables *</label>
                <textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={4}
                  placeholder="Scope, deliverables, what success looks like..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Budget (KES) *</label>
                  <input type="number" value={pBudget} onChange={(e) => setPBudget(e.target.value)} placeholder="25000"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Payment type</label>
                  <div className="flex gap-2">
                    {(["fixed", "milestone", "hourly"] as const).map((t) => (
                      <button key={t} onClick={() => setPType(t)}
                        className={`flex-1 px-2 py-2.5 rounded-xl text-[11px] font-medium capitalize transition-colors border ${pType === t ? "bg-nx-violet/15 text-nx-violet border-nx-violet/25" : "bg-white/[0.03] text-white/40 border-white/5"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Required skills *</label>
                <div className="flex gap-2 mb-2">
                  <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="Type a skill and press Enter"
                    className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
                  <button onClick={addSkill} className="px-3 py-2 rounded-xl bg-nx-violet/15 text-nx-violet text-sm hover:bg-nx-violet/25 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pSkills.map((s) => (
                    <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-nx-violet/10 text-nx-violet text-xs">
                      {s}
                      <button onClick={() => setPSkills(pSkills.filter((x) => x !== s))} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {pSkills.length === 0 && (
                    <span className="text-[11px] text-white/20">Suggestions: {skillSuggestions.slice(0, 6).join(" · ")}</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Deadline (optional)</label>
                  <input type="date" value={pDeadline} onChange={(e) => setPDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white focus:border-nx-violet/30 focus:outline-none [color-scheme:dark]" />
                </div>
                <div className="flex items-end pb-1">
                  <button onClick={() => setPRemote(!pRemote)} className="flex items-center gap-2 text-sm text-white/60">
                    <span className={`w-10 h-6 rounded-full transition-colors relative ${pRemote ? "bg-nx-violet" : "bg-white/10"}`}>
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${pRemote ? "left-5" : "left-1"}`} />
                    </span>
                    Remote work
                  </button>
                </div>
              </div>
              {postError && <p className="text-sm text-red-400">{postError}</p>}
              <button onClick={submitJob} disabled={posting}
                className="w-full py-3 rounded-xl bg-nx-violet text-white font-semibold text-sm hover:bg-nx-violet/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                {posting ? "Posting job..." : "Post Job for Free"}
              </button>
              <p className="text-[11px] text-white/25 text-center flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3 text-nx-emerald" /> When you hire, the budget is held in escrow — you only pay for delivered work.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Lucide category icon resolved through the shared taxonomy (legacy-safe). */
function CategoryIcon({ slug, className = "w-3 h-3" }: { slug: string; className?: string }) {
  const Icon = getFreelanceCategoryIcon(normalizeFreelanceCategory(slug));
  return <Icon className={className} />;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
