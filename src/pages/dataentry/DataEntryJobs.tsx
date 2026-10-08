import DataEntryLayout from "./DataEntryLayout";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Loader2, Briefcase, Send, MapPin, Clock, Coins,
  CheckCircle2, Package,
} from "lucide-react";

export default function DataEntryJobs() {
  const openJobs = useQuery(api.dataEntry.browseJobs);
  const assignedJobs = useQuery(api.dataEntry.myAssignedJobs);
  const applyToJob = useMutation(api.dataEntry.applyToJob);

  const [tab, setTab] = useState<"open" | "assigned">("open");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<string[]>([]);

  const handleApply = async (jobId: string) => {
    setBusy(jobId);
    setError(null);
    try {
      await applyToJob({ jobId: jobId as any });
      setApplied((prev) => [...prev, jobId]);
    } catch (err: any) {
      setError(err?.message || "Could not apply.");
    } finally {
      setBusy(null);
    }
  };

  const jobs = tab === "open" ? openJobs : assignedJobs;

  return (
    <DataEntryLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Data Entry Jobs</h2>
          <p className="text-xs text-white/30 mt-0.5">Product-entry jobs posted by sellers on Nexora.</p>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl border border-white/5 bg-white/[0.03]">
          <button
            onClick={() => setTab("open")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === "open" ? "bg-nx-violet text-white" : "text-white/50 hover:text-white"
            }`}
          >
            Open jobs
          </button>
          <button
            onClick={() => setTab("assigned")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === "assigned" ? "bg-nx-violet text-white" : "text-white/50 hover:text-white"
            }`}
          >
            My assignments
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-400/10 border border-red-400/20 text-xs text-red-300">
          {error}
        </div>
      )}

      {jobs === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-nx-violet animate-spin" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
          <Briefcase className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/35">
            {tab === "open"
              ? "No open jobs right now. Sellers post jobs when they need bulk product entry."
              : "You have no accepted assignments yet — apply to an open job to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: any) => {
            const isApplied = applied.includes(job._id);
            return (
              <div key={job._id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-white">{job.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        job.status === "open" ? "bg-emerald-400/10 text-emerald-400" :
                        job.status === "draft" ? "bg-white/10 text-white/50" :
                        job.status === "cancelled" ? "bg-red-400/10 text-red-400" :
                        "bg-nx-cyan/10 text-nx-cyan"
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-white/30">
                      <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {job.productCount} products</span>
                      <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> KSh {(job.pricePerProduct ?? 0).toLocaleString()} / product</span>
                      {job.totalBudget && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> Budget KSh {job.totalBudget.toLocaleString()}</span>}
                      {job.category && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.category}</span>}
                      {job.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(job.deadline).toLocaleDateString()}</span>}
                      <span className="text-white/25">by {job.createdByName || "Seller"}</span>
                    </div>
                  </div>
                  {tab === "open" && (
                    <button
                      onClick={() => handleApply(job._id)}
                      disabled={busy === job._id || isApplied}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-nx-violet hover:bg-nx-violet/80 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {isApplied ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Applied</>
                      ) : busy === job._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <><Send className="w-3.5 h-3.5" /> Apply</>
                      )}
                    </button>
                  )}
                  {tab === "assigned" && job.status === "completed" && (
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-400/10 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DataEntryLayout>
  );
}
