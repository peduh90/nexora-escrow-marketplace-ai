import AdminLayout from "./AdminLayout";
import { Brain, Shield, Zap, BarChart3, AlertTriangle } from "lucide-react";

export default function AdminFraud() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI & Fraud Detection</h1>
        <p className="text-sm text-white/40 mt-1">Real-time AI-powered risk monitoring and fraud prevention</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Fraud Score", value: "N/A", sub: "No transactions to analyze", color: "#10B981" },
          { label: "Blocked Today", value: "0", sub: "No blocked transactions", color: "#EF4444" },
          { label: "Flagged", value: "0", sub: "No flagged accounts", color: "#F59E0B" },
          { label: "Models Active", value: "4", sub: "All operational", color: "#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            <p className="text-[10px] text-white/25 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-nx-violet" />
            <h3 className="text-sm font-semibold text-white">AI Models</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: "Fraud Detection v2.4.1", accuracy: "Active", status: "active" },
              { name: "NLP Dispute Analyzer", accuracy: "Active", status: "active" },
              { name: "Behavioral Analysis", accuracy: "Active", status: "active" },
              { name: "Identity Verification", accuracy: "Active", status: "active" },
            ].map(m => (
              <div key={m.name} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-nx-emerald" />
                  <span className="text-xs text-white/50">{m.name}</span>
                </div>
                <span className="text-[10px] text-white/30">{m.accuracy}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-nx-cyan" />
            <h3 className="text-sm font-semibold text-white">Risk Distribution</h3>
          </div>
          <div className="py-8 text-center">
            <Shield className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/20">No risk data yet</p>
            <p className="text-[10px] text-white/15 mt-1">Risk distribution will appear once transactions are processed</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-nx-gold" />
          <h3 className="text-sm font-semibold text-white">Recent Fraud Events</h3>
        </div>
        <div className="py-16 flex flex-col items-center">
          <AlertTriangle className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No fraud events detected</p>
          <p className="text-[11px] text-white/15 mt-1">Fraud events will appear here when the system detects suspicious activity</p>
        </div>
      </div>
    </AdminLayout>
  );
}
