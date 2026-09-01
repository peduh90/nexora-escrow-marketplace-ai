import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { AlertTriangle, Eye } from "lucide-react";

export default function AdminReports() {
  const disputes = useQuery(api.admin.getAllDisputes);
  const allDisputes = disputes ?? [];

  // Reports are modeled as disputes in the current schema
  const openReports = allDisputes.filter((d: any) => d.status === "open").length;
  const underReview = allDisputes.filter((d: any) => d.status === "under_review").length;
  const resolved = allDisputes.filter((d: any) => d.status === "resolved").length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Reports & Safety</h1>
        <p className="text-sm text-white/40 mt-1">Manage user reports and platform safety</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open Reports", value: openReports.toString() },
          { label: "Under Review", value: underReview.toString() },
          { label: "Resolved", value: resolved.toString() },
          { label: "Total", value: allDisputes.length.toString() },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      {allDisputes.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <AlertTriangle className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No reports yet</p>
          <p className="text-[11px] text-white/15 mt-1">User reports and safety concerns will appear here</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-nx-gold" />
            <h3 className="text-sm font-semibold text-white">Recent Reports</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {allDisputes.map((r: any) => (
              <div key={r._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-nx-gold/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-nx-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-white/30">DSP-{r._id.slice(-6)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${r.status === "resolved" ? "bg-nx-emerald/10 text-nx-emerald" : r.status === "under_review" ? "bg-nx-gold/10 text-nx-gold" : "bg-red-400/10 text-red-400"}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/60">{r.reason}</p>
                  {r.description && <p className="text-[10px] text-white/25 truncate">{r.description}</p>}
                </div>
                <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
