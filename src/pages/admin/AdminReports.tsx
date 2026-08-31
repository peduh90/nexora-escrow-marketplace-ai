import AdminLayout from "./AdminLayout";
import { AlertTriangle, Search, Eye, CheckCircle2, XCircle, Clock } from "lucide-react";

const reports = [
  { id: "RPT-089", reporter: "Edwin Kamau", target: "CheapDeals254", type: "Counterfeit Product", product: "Phone Charger", status: "Open", date: "Apr 5, 2025" },
  { id: "RPT-088", reporter: "Lucy Wambui", target: "LuxForLess", type: "Fake Product", product: "Designer Bags", status: "Under Review", date: "Apr 3, 2025" },
  { id: "RPT-087", reporter: "Peter Mwangi", target: "user_8823", type: "Suspicious Seller", product: "N/A", status: "Resolved", date: "Apr 1, 2025" },
];

export default function AdminReports() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Reports & Safety</h1>
        <p className="text-sm text-white/40 mt-1">Manage user reports and platform safety</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open Reports", value: "12" },
          { label: "Under Review", value: "5" },
          { label: "Resolved This Month", value: "28" },
          { label: "Banned Sellers", value: "8" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-nx-gold" />
          <h3 className="text-sm font-semibold text-white">Recent Reports</h3>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {reports.map(r => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.type.includes("Counterfeit") || r.type.includes("Fake") ? "bg-red-400/10" : "bg-nx-gold/10"}`}>
                <AlertTriangle className={`w-4 h-4 ${r.type.includes("Counterfeit") || r.type.includes("Fake") ? "text-red-400" : "text-nx-gold"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono text-white/30">{r.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${r.status === "Resolved" ? "bg-nx-emerald/10 text-nx-emerald" : r.status === "Under Review" ? "bg-nx-gold/10 text-nx-gold" : "bg-red-400/10 text-red-400"}`}>{r.status}</span>
                </div>
                <p className="text-xs text-white/60">{r.type} — {r.product}</p>
                <p className="text-[10px] text-white/25">Reported by {r.reporter} against {r.target}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-white/20">{r.date}</p>
              </div>
              <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
