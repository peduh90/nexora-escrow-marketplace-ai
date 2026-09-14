import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import {
  Briefcase, Search, ChevronUp, ChevronDown, Ban, RotateCcw,
  Loader2, Star, CheckCircle2, Clock, ShieldAlert,
} from "lucide-react";

/**
 * Freelancers — the FREELANCE side of the marketplace (people, profiles,
 * skills, ratings) as opposed to marketplace sellers (Products page). The
 * count is people-based: accounts with the freelancer role OR a profile, so
 * it always matches the Users page stat card.
 */
export default function AdminFreelancers() {
  const profiles = useQuery(api.admin.getAllFreelanceProfiles);
  const users = useQuery(api.admin.getAllUsers);
  const counts = useQuery(api.admin.getUserCounts);
  const suspendFreelancer = useMutation(api.admin.suspendFreelancer);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");

  const userById = useMemo(() => {
    const m = new Map<string, any>();
    for (const u of users ?? []) m.set(u._id, u);
    return m;
  }, [users]);

  const rows = (profiles ?? []).map((p: any) => {
    const u = userById.get(p.userId);
    return {
      ...p,
      userName: u?.name || p.displayName,
      userEmail: u?.email,
      accountSuspended: u?.accountStatus === "suspended",
    };
  });

  const filtered = rows.filter((p: any) => {
    if (filter === "Active" && p.status !== "active") return false;
    if (filter === "Suspended" && p.status !== "suspended") return false;
    if (filter === "Pending Review" && p.status !== "pending_review") return false;
    if (filter === "Verified" && !p.isVerified) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = [p.displayName, p.userName, p.userEmail, p.title, (p.skills || []).join(" "), p.location]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const activeCount = rows.filter((p: any) => p.status === "active").length;
  const suspendedCount = rows.filter((p: any) => p.status === "suspended").length;
  const verifiedCount = rows.filter((p: any) => p.isVerified).length;

  const toggleSuspend = async (p: any) => {
    if (p.status === "suspended") {
      setBusyId(p._id);
      try {
        // Reactivate = patch status back to active via the same mutation
        // family; suspendFreelancer with an empty reason re-activates.
        await suspendFreelancer({ profileId: p._id, reason: "" });
        toast.success(`${p.displayName} reactivated`);
      } catch (e: any) {
        toast.error(e?.message || "Failed");
      } finally {
        setBusyId(null);
      }
      return;
    }
    setSuspendTarget({ id: p._id, name: p.displayName });
  };

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    setBusyId(suspendTarget.id);
    try {
      await suspendFreelancer({ profileId: suspendTarget.id, reason: reason || "Suspended by admin" });
      toast.success("Freelancer suspended");
      setSuspendTarget(null);
      setReason("");
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const statusPill = (s: string) =>
    s === "active" ? (
      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-400/10 text-emerald-300 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Active</span>
    ) : s === "suspended" ? (
      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-red-400/10 text-red-300 flex items-center gap-1 w-fit"><ShieldAlert className="w-3 h-3" /> Suspended</span>
    ) : (
      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-400/10 text-amber-300 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending review</span>
    );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Freelancers</h1>
        <p className="text-sm text-white/40 mt-1">
          The freelance workforce — profiles, skills and standing.{" "}
          {counts ? `${counts.freelancers} freelancer accounts · ${counts.freelanceProfiles ?? rows.length} completed profiles` : `${rows.length} profiles`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Profiles", value: rows.length },
          { label: "Active", value: activeCount },
          { label: "Verified", value: verifiedCount },
          { label: "Suspended", value: suspendedCount },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-[#0A0A12] p-4">
            <p className="text-[10px] text-white/30 uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill, title, location..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["All", "Active", "Verified", "Pending Review", "Suspended"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-nx-violet/15 border border-nx-violet/40 text-nx-violet"
                  : "bg-white/[0.02] border border-white/5 text-white/40 hover:text-white/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Briefcase className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No freelancers match</p>
          <p className="text-[11px] text-white/15 mt-1">
            Freelance profiles appear here the moment users complete them
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Freelancer</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Title &amp; Skills</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Rating</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Projects</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((p: any) => {
                  const isExpanded = expandedId === p._id;
                  return (
                    <tr key={p._id} className="hover:bg-white/[0.01] transition-colors align-top">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.avatar ? (
                            <img src={p.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-emerald-300">{(p.displayName || "F")[0]}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm text-white/70 font-medium truncate">{p.displayName}</p>
                              {p.isVerified && <CheckCircle2 className="w-3 h-3 text-nx-emerald shrink-0" />}
                            </div>
                            <p className="text-[10px] text-white/25 truncate">{p.userEmail || p.location || ""}</p>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="mt-3 ml-11 p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
                            <p className="text-[10px] text-white/50">Title: <span className="text-white/80">{p.title || "Not set"}</span></p>
                            <p className="text-[10px] text-white/50">Skills: <span className="text-white/80">{(p.skills || []).join(", ") || "Not listed"}</span></p>
                            <p className="text-[10px] text-white/50">Categories: <span className="text-white/80">{(p.categories || []).join(", ") || "—"}</span></p>
                            <p className="text-[10px] text-white/50">Hourly rate: <span className="text-white/80">{p.hourlyRate ? `KES ${p.hourlyRate.toLocaleString()}` : "Not set"}</span></p>
                            <p className="text-[10px] text-white/50">Completed projects: <span className="text-white/80">{p.completedProjects ?? 0}</span></p>
                            <p className="text-[10px] text-white/50">Total earned: <span className="text-white/80">KES {(p.totalEarnings ?? 0).toLocaleString()}</span></p>
                            <p className="text-[10px] text-white/50">Success rate: <span className="text-white/80">{p.successRate ?? 0}%</span></p>
                            <p className="text-[10px] text-white/50">Role mode: <span className="text-white/80">{p.roleMode || "freelancer"}</span></p>
                            {p.accountSuspended && (
                              <p className="text-[10px] text-red-300">⚠ The linked Nexora account is suspended (see All Users)</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-xs text-white/70">{p.title || "—"}</p>
                        <div className="flex flex-wrap gap-1 mt-1 max-w-[220px]">
                          {(p.skills || []).slice(0, 4).map((s: string) => (
                            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {p.avgRating > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-amber-300">
                            <Star className="w-3.5 h-3.5 fill-amber-300" /> {p.avgRating.toFixed(1)}
                            <span className="text-white/25">({p.totalReviews})</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/20">No ratings</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-white/60">{p.completedProjects ?? 0}</td>
                      <td className="px-4 py-3.5">{statusPill(p.status)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : p._id)}
                            className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                            title={isExpanded ? "Hide details" : "View profile details"}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => toggleSuspend(p)}
                            disabled={busyId === p._id}
                            className={`p-1.5 rounded transition-colors disabled:opacity-40 ${
                              p.status === "suspended"
                                ? "text-white/20 hover:text-nx-emerald hover:bg-nx-emerald/10"
                                : "text-white/20 hover:text-red-400 hover:bg-red-400/10"
                            }`}
                            title={p.status === "suspended" ? "Reactivate freelancer" : "Suspend freelancer"}
                          >
                            {busyId === p._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : p.status === "suspended" ? (
                              <RotateCcw className="w-3.5 h-3.5" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspend modal */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSuspendTarget(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0A12] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" /> Suspend {suspendTarget.name}?
            </h3>
            <p className="text-xs text-white/40 mt-2">
              Their freelance profile stops appearing in search and they cannot apply for work until reactivated.
              The marketplace account itself is managed on the All Users page.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (shared with the freelancer)..."
              rows={3}
              className="mt-3 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-red-400/40 placeholder:text-white/20"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSuspendTarget(null)} className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={confirmSuspend} disabled={busyId === suspendTarget.id} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-400 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                {busyId === suspendTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
