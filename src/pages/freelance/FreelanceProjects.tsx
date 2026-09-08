import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft, FolderOpen, Clock, CheckCircle2, AlertCircle,
  MessageSquare, DollarSign, Loader2, Shield, FileText, X, Upload,
} from "lucide-react";

type Tab = "active" | "submitted" | "completed" | "all";

interface ProjectRow {
  _id: string;
  taskId: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  progress: number;
  employerName: string;
  isFreelancer?: boolean;
  employerFunded?: boolean;
  escrowReleased?: boolean;
  revisionCount?: number;
  totalPaid: number;
  files?: Array<{ name: string; url: string; uploadedBy: string; uploadedAt: number; version?: number; note?: string }>;
  lastReview?: { action: string; note?: string; by: string; at: number };
  deadline?: number;
  createdAt: number;
}

export default function FreelanceProjects() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("active");
  const projectsResult = useQuery(api.freelance.getMyProjects);
  const allProjects = (projectsResult ?? []) as unknown as ProjectRow[];

  const activeQueue = allProjects.filter((p) => ["active", "on_hold", "revision_requested"].includes(p.status));
  const submittedQueue = allProjects.filter((p) => p.status === "submitted");
  const completedQueue = allProjects.filter((p) => p.status === "completed");
  const filtered =
    tab === "active" ? activeQueue
    : tab === "submitted" ? submittedQueue
    : tab === "completed" ? completedQueue
    : allProjects;

  const revisionCount = allProjects.filter((p) => p.status === "revision_requested").length;

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <button onClick={() => navigate("/freelance/dashboard")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors mr-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white">My Projects</h1>
        </div>

        <div className="p-4 md:p-6 space-y-5 pb-20">
          {/* Revision alert */}
          {revisionCount > 0 && (
            <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/10 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-white/70">
                The employer requested changes on {revisionCount} project{revisionCount === 1 ? "" : "s"}. Open it below to see the notes and resubmit.
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {([
              ["active", `Working (${activeQueue.length})`],
              ["submitted", `Awaiting Review (${submittedQueue.length})`],
              ["completed", `Completed (${completedQueue.length})`],
              ["all", `All (${allProjects.length})`],
            ] as Array<[Tab, string]>).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${tab === t ? "bg-nx-violet/20 text-nx-violet border border-nx-violet/30" : "bg-white/[0.03] text-white/40 border border-white/5 hover:border-white/10"}`}>
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <FolderOpen className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">No projects found</p>
              <p className="text-[11px] text-white/20 mt-1">Start by applying to tasks or posting a project</p>
              <button onClick={() => navigate("/freelance/find-work")}
                className="mt-4 px-5 py-2 rounded-xl bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors">
                Find Work
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((proj) => (
                <WriterProjectCard key={proj._id} proj={proj} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WriterProjectCard({ proj }: { proj: ProjectRow }) {
  const submitWork = useMutation(api.freelance.submitWork);
  const updateProgress = useMutation(api.freelance.updateProjectProgress);

  const [expanded, setExpanded] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    active: { icon: FolderOpen, color: "text-nx-violet", bg: "bg-nx-violet/10", label: "Working" },
    on_hold: { icon: AlertCircle, color: "text-nx-gold", bg: "bg-nx-gold/10", label: "On Hold" },
    submitted: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", label: "Awaiting Employer Review" },
    revision_requested: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-400/10", label: "Revision Requested" },
    completed: { icon: CheckCircle2, color: "text-nx-emerald", bg: "bg-nx-emerald/10", label: "Completed — Paid" },
    cancelled: { icon: AlertCircle, color: "text-white/40", bg: "bg-white/5", label: "Cancelled" },
    disputed: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10", label: "Disputed" },
  };
  const cfg = statusConfig[proj.status] || statusConfig.active;
  const StatusIcon = cfg.icon;

  const canSubmit = ["active", "revision_requested"].includes(proj.status);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("Describe what you delivered so the employer can review it.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await submitWork({ projectId: proj._id as any, message: message.trim() });
      setBanner(`Work submitted (delivery v${(result as any)?.version ?? 1}). The employer has been notified and will review, request revisions, or approve payment.`);
      setShowSubmit(false);
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Failed to submit work.");
    } finally {
      setBusy(false);
    }
  };

  const handleProgress = async (value: number) => {
    try {
      await updateProgress({ projectId: proj._id as any, progress: value });
    } catch {}
  };

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
      <div className="p-5 cursor-pointer hover:bg-white/[0.01] transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                <StatusIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
              {proj.employerFunded && !proj.escrowReleased && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-nx-cyan/10 text-nx-cyan flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> Escrow funded
                </span>
              )}
              {proj.revisionCount ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-400">Revision round {proj.revisionCount}</span>
              ) : null}
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{proj.title}</h3>
            <p className="text-xs text-white/30">Employer: {proj.employerName}</p>

            <div className="flex items-center gap-3 mb-3 mt-3">
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-nx-violet transition-all" style={{ width: `${proj.progress}%` }} />
              </div>
              <span className="text-[10px] text-white/40 font-medium">{proj.progress}%</span>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-white/25">
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />KES {proj.budget.toLocaleString()}</span>
              <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
              {proj.deadline && <span>Due: {new Date(proj.deadline).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
          <p className="text-xs text-white/40 whitespace-pre-wrap">{proj.description}</p>

          {/* Employer's latest review feedback */}
          {proj.lastReview && proj.lastReview.action !== "submitted" && (
            <div className={`p-3 rounded-lg border ${proj.lastReview.action === "approved" ? "bg-nx-emerald/5 border-nx-emerald/20" : "bg-amber-400/5 border-amber-400/20"}`}>
              <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">
                {proj.lastReview.action === "approved" ? "✅ Approved" : "🔁 Revision requested"}
              </p>
              <p className="text-xs text-white/60 whitespace-pre-wrap">{proj.lastReview.note || "—"}</p>
            </div>
          )}

          {banner && (
            <div className="p-3 rounded-lg bg-nx-emerald/10 border border-nx-emerald/20 text-xs text-nx-emerald flex items-start justify-between gap-2">
              <span>{banner}</span>
              <button onClick={() => setBanner("")}><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Submission history */}
          {proj.files && proj.files.length > 0 && (
            <div>
              <p className="text-xs font-medium text-white/50 mb-2">Your deliveries ({proj.files.length})</p>
              <div className="space-y-2">
                {[...proj.files].reverse().map((f, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-nx-cyan shrink-0" />
                      <span className="text-xs text-white/70">Delivery v{f.version ?? i + 1}</span>
                      <span className="text-[10px] text-white/20 ml-auto">{new Date(f.uploadedAt).toLocaleString()}</span>
                    </div>
                    {f.note && <p className="text-xs text-white/40 mt-1.5 whitespace-pre-wrap">{f.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress stepper (working projects only) */}
          {proj.status === "active" && (
            <div>
              <p className="text-xs font-medium text-white/50 mb-2">Update progress</p>
              <div className="flex gap-2 flex-wrap">
                {[25, 50, 75, 100].map((v) => (
                  <button key={v} onClick={() => handleProgress(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${proj.progress >= v ? "bg-nx-violet/20 text-nx-violet" : "bg-white/[0.03] text-white/40 hover:text-white/60"}`}>
                    {v}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {canSubmit && !showSubmit && (
              <button onClick={() => setShowSubmit(true)}
                className="px-4 py-2.5 rounded-lg bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                {proj.status === "revision_requested" ? "Resubmit Revised Work" : "Submit Completed Work"}
              </button>
            )}
            <button
              onClick={() => window.location.href = "/freelance/messages"}
              className="px-4 py-2.5 rounded-lg bg-white/[0.03] text-white/40 text-xs font-medium hover:text-white/60 hover:bg-white/[0.05] transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Messages
            </button>
            {proj.status === "completed" && (
              <div className="px-4 py-2.5 rounded-lg bg-nx-emerald/10 text-nx-emerald text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Paid: KES {proj.totalPaid?.toLocaleString()} (net)
              </div>
            )}
          </div>

          {/* Submission form */}
          {showSubmit && (
            <div className="pt-3 border-t border-white/5 space-y-3">
              <label className="block text-xs font-medium text-white/60">Describe your delivery *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Summarise what you completed: files, links, key points for the employer to check..."
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none resize-none"
              />
              <p className="text-[11px] text-white/25">
                Submitting moves the project to <span className="text-white/50">Awaiting Review</span>. The employer can then approve (releasing escrow to your wallet) or request revisions.
              </p>
              <div className="flex gap-2">
                <button onClick={() => { setShowSubmit(false); setMessage(""); setError(""); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={handleSubmit} disabled={busy}
                  className="px-4 py-1.5 rounded-lg bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {busy ? "Submitting..." : "Submit Work"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
