import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { FileCheck, Search, Eye, CheckCircle2, XCircle, Clock, AlertTriangle, Upload } from "lucide-react";

const kycApplications = [
  { id: "KYC-089", name: "Sarah Wanjiku", business: "Wanjiku Traders", type: "Sole Proprietor", county: "Nairobi", submitted: "2 hours ago", docs: 4, status: "Pending" },
  { id: "KYC-088", name: "James Odhiambo", business: "Odhiambo Farm Supplies", type: "Partnership", county: "Kisumu", submitted: "5 hours ago", docs: 3, status: "Pending" },
  { id: "KYC-087", name: "Grace Njeri", business: "Grace Fashion House", type: "Individual", county: "Nakuru", submitted: "1 day ago", docs: 5, status: "Pending" },
  { id: "KYC-086", name: "Peter Kimani", business: "Kimani Electronics", type: "Limited Company", county: "Kiambu", submitted: "1 day ago", docs: 6, status: "Pending" },
  { id: "KYC-085", name: "TechZone Kenya", business: "TechZone Kenya Ltd", type: "Limited Company", county: "Nairobi", submitted: "3 days ago", docs: 8, status: "Approved" },
  { id: "KYC-084", name: "CheapDeals254", business: "Cheap Deals", type: "Individual", county: "Nairobi", submitted: "5 days ago", docs: 2, status: "Rejected" },
];

export default function AdminKYC() {
  const [tab, setTab] = useState("Pending");

  const filtered = kycApplications.filter(k => {
    if (tab === "Pending" && k.status !== "Pending") return false;
    if (tab === "Approved" && k.status !== "Approved") return false;
    if (tab === "Rejected" && k.status !== "Rejected") return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">KYC Verification</h1>
        <p className="text-sm text-white/40 mt-1">Review and verify seller business applications</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pending Review", value: "12", color: "#F59E0B" },
          { label: "Approved", value: "3,245", color: "#10B981" },
          { label: "Rejected", value: "89", color: "#EF4444" },
          { label: "Approval Rate", value: "97.3%", color: "#8B5CF6" },
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

      <div className="space-y-3">
        {filtered.map(app => (
          <div key={app.id} className="p-5 rounded-xl border border-white/5 bg-[#0A0A12] hover:border-white/10 transition-all">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-nx-violet">{app.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-white/30">{app.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${app.status === "Approved" ? "bg-nx-emerald/10 text-nx-emerald" : app.status === "Rejected" ? "bg-red-400/10 text-red-400" : "bg-nx-gold/10 text-nx-gold"}`}>{app.status}</span>
                </div>
                <p className="text-white/70 font-medium">{app.name}</p>
                <p className="text-[11px] text-white/30">{app.business} · {app.type} · {app.county}</p>
                <p className="text-[10px] text-white/20 mt-1">{app.docs} documents uploaded · Submitted {app.submitted}</p>
              </div>
              {app.status === "Pending" && (
                <div className="flex gap-2 shrink-0">
                  <button className="px-4 py-2 rounded-lg text-xs font-medium bg-nx-emerald/10 text-nx-emerald hover:bg-nx-emerald/20 transition-colors flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button className="px-4 py-2 rounded-lg text-xs font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
