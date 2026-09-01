import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Scale, Search, Eye, MessageSquare, AlertTriangle, FileText } from "lucide-react";

export default function AdminDisputes() {
  const allDisputes = useQuery(api.admin.getAllDisputes);
  const allUsers = useQuery(api.users.getAllUsers);
  const [tab, setTab] = useState("All");

  const disputes = allDisputes ?? [];
  const users = allUsers ?? [];
  const getUser = (id: string) => users.find((u: any) => u._id === id);

  const filtered = disputes.filter((d: any) => {
    if (tab === "Open" && d.status !== "open") return false;
    if (tab === "Under Review" && d.status !== "under_review") return false;
    if (tab === "Resolved" && d.status !== "resolved") return false;
    return true;
  });

  const openDisputes = disputes.filter((d: any) => d.status === "open").length;
  const underReview = disputes.filter((d: any) => d.status === "under_review").length;
  const resolved = disputes.filter((d: any) => d.status === "resolved").length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dispute Resolution</h1>
        <p className="text-sm text-white/40 mt-1">AI-assisted dispute management and resolution</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open Disputes", value: openDisputes.toString(), color: "#EF4444" },
          { label: "Under Review", value: underReview.toString(), color: "#F59E0B" },
          { label: "Resolved", value: resolved.toString(), color: "#10B981" },
          { label: "Total", value: disputes.length.toString(), color: "#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4">
        {["All", "Open", "Under Review", "Resolved"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"}`}>{t}</button>
        ))}
      </div>

      {disputes.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Scale className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No disputes yet</p>
          <p className="text-[11px] text-white/15 mt-1">Disputes will appear here when buyers file issues</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d: any) => {
            const filer = getUser(d.filedBy);
            return (
              <div key={d._id} className="p-5 rounded-xl border border-white/5 bg-[#0A0A12] hover:border-white/10 transition-all">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${d.status === "resolved" ? "bg-nx-emerald/10 text-nx-emerald" : d.status === "under_review" ? "bg-nx-gold/10 text-nx-gold" : "bg-red-400/10 text-red-400"}`}>{d.status}</span>
                    </div>
                    <p className="text-white/70 font-medium mb-1">{d.reason}</p>
                    {d.description && <p className="text-[11px] text-white/30 mb-2">{d.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/25">
                      <span>Filed by: {filer?.name || "Unknown"}</span>
                      {d.resolution && <span>Resolution: {d.resolution}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {d.aiRecommendation && (
                      <div className="p-3 rounded-lg bg-nx-violet/5 border border-nx-violet/10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-3 h-3 text-nx-violet" />
                          <span className="text-[10px] font-medium text-nx-violet">AI Recommendation</span>
                        </div>
                        <p className="text-xs text-white/60">{d.aiRecommendation}</p>
                      </div>
                    )}
                    <button className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
