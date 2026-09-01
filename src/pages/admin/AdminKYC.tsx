import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { FileCheck, Eye, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function AdminKYC() {
  const allKYC = useQuery(api.admin.getAllKYC);
  const [tab, setTab] = useState("Pending");

  const applications = allKYC ?? [];
  const filtered = applications.filter((k: any) => {
    if (tab === "Pending" && k.status !== "pending") return false;
    if (tab === "Approved" && k.status !== "approved") return false;
    if (tab === "Rejected" && k.status !== "rejected") return false;
    return true;
  });

  const pending = applications.filter((k: any) => k.status === "pending").length;
  const approved = applications.filter((k: any) => k.status === "approved").length;
  const rejected = applications.filter((k: any) => k.status === "rejected").length;
  const rate = applications.length > 0 ? ((approved / applications.length) * 100).toFixed(1) : "—";

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">KYC Verification</h1>
        <p className="text-sm text-white/40 mt-1">Review and verify seller business applications</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pending Review", value: pending.toString(), color: "#F59E0B" },
          { label: "Approved", value: approved.toString(), color: "#10B981" },
          { label: "Rejected", value: rejected.toString(), color: "#EF4444" },
          { label: "Approval Rate", value: rate === "—" ? "—" : `${rate}%`, color: "#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4">
        {["Pending", "Approved", "Rejected", "All"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"}`}>{t}</button>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <FileCheck className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No KYC applications yet</p>
          <p className="text-[11px] text-white/15 mt-1">Applications will appear here when sellers submit verification</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any) => (
            <div key={app._id} className="p-5 rounded-xl border border-white/5 bg-[#0A0A12] hover:border-white/10 transition-all">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-nx-violet">{(app.businessName || "B").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${app.status === "approved" ? "bg-nx-emerald/10 text-nx-emerald" : app.status === "rejected" ? "bg-red-400/10 text-red-400" : "bg-nx-gold/10 text-nx-gold"}`}>{app.status}</span>
                  </div>
                  <p className="text-white/70 font-medium">{app.businessName}</p>
                  <p className="text-[11px] text-white/30">{app.businessType} · {app.county}, {app.town}</p>
                  {app.reviewNotes && <p className="text-[10px] text-white/20 mt-1">Notes: {app.reviewNotes}</p>}
                </div>
                {app.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button className="px-4 py-2 rounded-lg text-xs font-medium bg-nx-emerald/10 text-nx-emerald hover:bg-nx-emerald/20 transition-colors flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button className="px-4 py-2 rounded-lg text-xs font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
