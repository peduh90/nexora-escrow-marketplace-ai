import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft, Briefcase, X, Plus, Loader2, CheckCircle2,
} from "lucide-react";

const CATEGORIES = [
  "web-development", "writing", "design", "marketing", "business", "video", "education", "ai-tech",
];

export default function FreelancePostTask() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createTask = useMutation(api.freelance.createTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [budgetType, setBudgetType] = useState<"fixed" | "milestone" | "hourly">("fixed");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [deadline, setDeadline] = useState("");
  const [remote, setRemote] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !category || !budget || skills.length === 0) return;
    setSubmitting(true);
    try {
      const deadlineMs = deadline ? new Date(deadline).getTime() : undefined;
      const result = await createTask({
        title,
        description,
        category,
        skills,
        budget: Number(budget),
        budgetType,
        priority,
        deadline: deadlineMs,
        remote,
        experienceLevel: "intermediate",
      });
      setSuccess(true);
      // Employers manage applicants from their own panel — always return there,
      // never to the writer dashboard.
      setTimeout(() => navigate("/employer/jobs"), 1500);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to create task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-nx-emerald mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Task Posted Successfully!</h2>
          <p className="text-sm text-white/40">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <button onClick={() => navigate("/employer")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors mr-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white">Post a Task</h1>
        </div>

        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
          <p className="text-sm text-white/40">Describe your project and find the right freelancer.</p>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Task Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build a Restaurant Website"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5}
              placeholder="Describe your project in detail, requirements, deliverables..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none resize-none" />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === c ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5 hover:border-white/10"}`}>
                  {c.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="text-xs font-medium text-white/60 mb-1.5 block">Required Skills</label>
            <div className="flex gap-2 mb-2">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Type a skill and press Enter"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              <button onClick={addSkill} className="px-4 py-2.5 rounded-xl bg-nx-violet/20 text-nx-violet text-sm font-medium hover:bg-nx-violet/30 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-nx-violet/10 text-nx-violet text-xs font-medium">
                  {s}
                  <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Budget & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Budget (KES)</label>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="25000"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Budget Type</label>
              <div className="flex gap-2">
                {(["fixed", "milestone", "hourly"] as const).map((t) => (
                  <button key={t} onClick={() => setBudgetType(t)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${budgetType === t ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5"}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Priority & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Priority</label>
              <div className="flex gap-2">
                {(["low", "medium", "high", "urgent"] as const).map((p) => (
                  <button key={p} onClick={() => setPriority(p)}
                    className={`flex-1 px-2 py-2 rounded-xl text-[10px] font-medium transition-colors capitalize ${priority === p ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-white/60 mb-1.5 block">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white focus:border-nx-violet/30 focus:outline-none [color-scheme:dark]" />
            </div>
          </div>

          {/* Remote */}
          <div className="flex items-center gap-3">
            <button onClick={() => setRemote(!remote)}
              className={`w-10 h-6 rounded-full transition-colors relative ${remote ? "bg-nx-violet" : "bg-white/10"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${remote ? "left-5" : "left-1"}`} />
            </button>
            <span className="text-sm text-white/60">Remote work available</span>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!title || !description || !category || !budget || skills.length === 0 || submitting}
            className="w-full py-3 rounded-xl bg-nx-violet text-white font-semibold text-sm hover:bg-nx-violet/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
            {submitting ? "Posting..." : "Post Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
