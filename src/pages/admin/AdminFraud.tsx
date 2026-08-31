import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Brain, Search, AlertTriangle, Eye, Shield, TrendingUp, Activity, Zap, BarChart3 } from "lucide-react";

const fraudEvents = [
  { id: "FRD-089", type: "Suspicious Pattern", user: "user_8823", description: "Multiple high-value orders from new account within 10 minutes", risk: "High", status: "Flagged", time: "12 min ago", score: 92 },
  { id: "FRD-088", type: "Velocity Check", user: "user_7712", description: "5 payment attempts with different cards in rapid succession", risk: "Critical", status: "Blocked", time: "45 min ago", score: 98 },
  { id: "FRD-087", type: "IP Anomaly", user: "seller_332", description: "Login from new country without prior travel history", risk: "Medium", status: "Monitoring", time: "1 hour ago", score: 67 },
  { id: "FRD-086", type: "Identity Mismatch", user: "user_9941", description: "KYC photo does not match selfie verification", risk: "High", status: "Flagged", time: "2 hours ago", score: 89 },
  { id: "FRD-085", type: "Transaction Pattern", user: "seller_441", description: "Unusual refund request pattern from multiple buyers", risk: "Medium", status: "Under Review", time: "3 hours ago", score: 74 },
];

export default function AdminFraud() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI & Fraud Detection</h1>
        <p className="text-sm text-white/40 mt-1">Real-time AI-powered risk monitoring and fraud prevention</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Fraud Score", value: "97.4%", sub: "Detection Accuracy", color: "#10B981" },
          { label: "Blocked Today", value: "3", sub: "99.8% block rate", color: "#EF4444" },
          { label: "Flagged", value: "12", sub: "Awaiting review", color: "#F59E0B" },
          { label: "Models Active", value: "4", sub: "All operational", color: "#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            <p className="text-[10px] text-white/25 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* AI Models Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-nx-violet" />
            <h3 className="text-sm font-semibold text-white">AI Models</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: "Fraud Detection v2.4.1", accuracy: "97.4%", status: "active" },
              { name: "NLP Dispute Analyzer", accuracy: "94.2%", status: "active" },
              { name: "Behavioral Analysis", accuracy: "91.8%", status: "active" },
              { name: "Identity Verification", accuracy: "99.1%", status: "active" },
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
          <div className="space-y-3">
            {[
              { label: "Low Risk", count: "49,201", pct: 93, color: "#10B981" },
              { label: "Medium Risk", count: "2,893", pct: 5.5, color: "#F59E0B" },
              { label: "High Risk", count: "678", pct: 1.3, color: "#EF4444" },
              { label: "Critical", count: "75", pct: 0.2, color: "#DC2626" },
            ].map(r => (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/40">{r.label}</span>
                  <span className="text-[10px] text-white/25">{r.count} ({r.pct}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-nx-gold" />
          <h3 className="text-sm font-semibold text-white">Recent Fraud Events</h3>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {fraudEvents.map(e => (
            <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${e.risk === "Critical" ? "bg-red-500/10" : e.risk === "High" ? "bg-orange-500/10" : "bg-nx-gold/10"}`}>
                <AlertTriangle className={`w-4 h-4 ${e.risk === "Critical" ? "text-red-500" : e.risk === "High" ? "text-orange-500" : "text-nx-gold"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-white/60 font-medium">{e.type}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${e.risk === "Critical" ? "bg-red-500/10 text-red-400" : e.risk === "High" ? "bg-orange-500/10 text-orange-400" : "bg-nx-gold/10 text-nx-gold"}`}>{e.risk}</span>
                </div>
                <p className="text-[11px] text-white/30 truncate">{e.description}</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <div className="text-xs font-mono text-white/40">Score: {e.score}</div>
                <div className="text-[10px] text-white/20">{e.time}</div>
              </div>
              <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors shrink-0">
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
