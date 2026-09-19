import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft, FolderOpen, Clock, CheckCircle2, AlertCircle,
  MessageSquare, DollarSign, Loader2, Shield, FileText, X,
} from "lucide-react";

type Tab = "review" | "active" | "completed" | "all";

interface ProjectRow {
  _id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  progress: number;
  freelancerName: string;
  employerFunded?: boolean;
  escrowReleased?: boolean;
  revisionCount?: number;
  totalPaid: number;
  files?: Array<{ name: string; url: string; uploadedBy: string; uploadedAt: number; version?: number; note?: string }>;
  lastReview?: { action: string; note?: string; by: string; at: number };
  deadline?: number;
  createdAt: number;
}

export default function EmployerProjects() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("review");
  const projectsResult = useQuery(api.freelance.getEmployerProjects);
  const projects = (projectsResult ?? []) as unknown as ProjectRow[];

  const reviewQueue = projects.filter((p) => p.status === "submitted");
  const activeQueue = projects.filter((p) => ["active", "revision_requested"].includes(p.status));
  const completedQueue = projects.filter((p) => p.status === "completed");
  const filtered =
    tab === "review" ? reviewQueue
    : tab === "active" ? activeQueue
    : tab === "completed" ? completedQueue
    : projects;

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="hidden md:flex sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 items-center px-4 md:px-6">
          <button onClick={() => navigate("/employer")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors mr-3">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white">Projects & Review</h1>
        </div>

        <div className="p-4 md:p-6 space-y-5 pb-28 md:pb-6">
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {([
              ["review", `Awaiting Review (${reviewQueue.length})`],
              ["active", `In Progress (${activeQueue.length})`],
              ["completed", `Completed (${completedQueue.length})`],
              ["all", `All (${projects.length})`],
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
              <p className="text-sm text-white/40 font-medium">
                {tab === "review" ? "No submissions waiting" : "No projects here yet"}
              </p>
              <p className="text-[11px] text-white/20 mt-1">
                {tab === "review" ? "When a writer submits work it will appear here for your review." : "Hire a writer to start your first project."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((proj) => (
                <ProjectReviewCard key={proj._id} proj={proj} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectReviewCard({ proj }: { proj: ProjectRow }) {
  const fundEscrow = useMutation(api.freelance.fundProjectEscrow);
  const requestRevision = useMutation(api.freelance.requestRevision);
  const approveWork = useMutation(api.freelance.approveWork);

  const [expanded, setExpanded] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    active: { icon: FolderOpen, color: "text-nx-violet", bg: "bg-nx-violet/10", label: "In Progress" },
    on_hold: { icon: AlertCircle, color: "text-nx-gold", bg: "bg-nx-gold/10", label: "On Hold" },
    submitted: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", label: "Awaiting Review" },
    revision_requested: { icon: AlertCircle, color: "text-nx-gold", bg: "bg-nx-gold/10", label: "Revision Requested" },
    completed: { icon: CheckCircle2, color: "text-nx-emerald", bg: "bg-nx-emerald/10", label: "Completed" },
    cancelled: { icon: AlertCircle, color: "text-white/40", bg: "bg-white/5", label: "Cancelled" },
    disputed: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10", label: "Disputed" },
  };
  const cfg = statusConfig[proj.status] || statusConfig.active;
  const StatusIcon = cfg.icon;

  const handleFund = async () => {
    setBusy("fund");
    setError("");
    try {
      await fundEscrow({ projectId: proj._id as any });
      setBanner("Escrow funded! The writer has been notified that funds are secured.");
    } catch (err: any) {
      setError(err.message || "Failed to fund escrow.");
    } finally {
      setBusy(null);
    }
  };

  const handleRevision = async () => {
    if (!revisionNote.trim()) {
      setError("Describe what needs to change.");
      return;
    }
    setBusy("revision");
    setError("");
    try {
      await requestRevision({ projectId: proj._id as any, note: revisionNote.trim() });
      setBanner("Revision requested. The writer has been notified.");
      setShowRevision(false);
      setRevisionNote("");
    } catch (err: any) {
      setError(err.message || "Failed to request revision.");
    } finally {
      setBusy(null);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm(`Approve "${proj.title}" and release KES ${proj.budget.toLocaleString()} to ${proj.freelancerName}? This transfers the escrow and completes the project.`)) return;
    setBusy("approve");
    setError("");
    try {
      await approveWork({ projectId: proj._id as any });
      setBanner("Work approved — escrow released to the writer and the project is complete.");
    } catch (err: any) {
      setError(err.message || "Failed to approve work.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
      <div className="p-5 cursor-pointer hover:bg-white/[0.01] transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                <StatusIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
              {!proj.employerFunded && proj.status === "active" && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-400/10 text-red-400">Escrow not funded</span>
              )}
              {proj.revisionCount ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/30">{proj.revisionCount} revision round{proj.revisionCount === 1 ? "" : "s"}</span>
              ) : null}
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{proj.title}</h3>
            <p className="text-xs text-white/30">Writer: {proj.freelancerName}</p>
            <div className="flex items-center gap-3 text-[10px] text-white/25 mt-2">
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
              <p className="text-xs font-medium text-white/50 mb-2">Deliveries ({proj.files.length})</p>
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

          {/* Latest review note */}
          {proj.lastReview && proj.lastReview.action !== "submitted" && (
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">
                {proj.lastReview.action === "approved" ? "Approval note" : "Revision note"}
              </p>
              <p className="text-xs text-white/50">{proj.lastReview.note || "—"}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Fund escrow */}
            {!proj.employerFunded && ["active", "revision_requested"].includes(proj.status) && (
              <button onClick={handleFund} disabled={busy === "fund"}
                className="px-4 py-2.5 rounded-lg bg-nx-cyan text-white text-xs font-semibold hover:bg-nx-cyan/80 transition-colors disabled:opacity-50 flex items-center gap-2">
                {busy === "fund" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                Fund Escrow (KES {proj.budget.toLocaleString()} + protection fee)
              </button>
            )}

            {/* Review actions on a submission */}
            {proj.status === "submitted" && (
              <>
                <button onClick={handleApprove} disabled={busy === "approve"}
                  className="px-4 py-2.5 rounded-lg bg-nx-emerald text-white text-xs font-semibold hover:bg-nx-emerald/80 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {busy === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Approve & Release Payment
                </button>
                {!showRevision ? (
                  <button onClick={() => setShowRevision(true)}
                    className="px-4 py-2.5 rounded-lg bg-amber-400/10 text-amber-400 text-xs font-semibold hover:bg-amber-400/20 transition-colors flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" /> Request Revisions
                  </button>
                ) : (
                  <div className="w-full space-y-2">
                    <textarea
                      value={revisionNote}
                      onChange={(e) => setRevisionNote(e.target.value)}
                      rows={3}
                      placeholder="Explain what needs to change so the writer can fix it..."
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white placeholder:text-white/20 focus:border-amber-400/30 focus:outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => { setShowRevision(false); setRevisionNote(""); }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-colors">Cancel</button>
                      <button onClick={handleRevision} disabled={busy === "revision"}
                        className="px-4 py-1.5 rounded-lg bg-amber-400/10 text-amber-400 text-xs font-semibold hover:bg-amber-400/20 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                        {busy === "revision" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Send Revision Request
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => window.location.href = "/employer/messages"}
              className="px-4 py-2.5 rounded-lg bg-white/[0.03] text-white/40 text-xs font-medium hover:text-white/60 hover:bg-white/[0.05] transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Messages
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
