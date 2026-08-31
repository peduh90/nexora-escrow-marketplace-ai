import AdminLayout from "./AdminLayout";
import { Activity, Server, Database, Globe, Cpu, HardDrive, Wifi, Shield } from "lucide-react";

const services = [
  { name: "API Gateway", status: "Operational", latency: "45ms", uptime: "99.99%", icon: Globe, color: "#10B981" },
  { name: "PostgreSQL Database", status: "Operational", latency: "12ms", uptime: "99.99%", icon: Database, color: "#10B981" },
  { name: "Redis Cache", status: "Operational", latency: "2ms", uptime: "99.99%", icon: Server, color: "#10B981" },
  { name: "M-Pesa Gateway", status: "Operational", latency: "120ms", uptime: "99.95%", icon: Wifi, color: "#10B981" },
  { name: "Stripe Gateway", status: "Operational", latency: "85ms", uptime: "99.98%", icon: Wifi, color: "#10B981" },
  { name: "AI Fraud Model v2.4.1", status: "Operational", latency: "23ms", uptime: "99.99%", icon: Cpu, color: "#10B981" },
  { name: "NLP Dispute Analyzer", status: "Operational", latency: "156ms", uptime: "99.97%", icon: Cpu, color: "#10B981" },
  { name: "AWS S3 Storage", status: "Operational", latency: "34ms", uptime: "99.99%", icon: HardDrive, color: "#10B981" },
  { name: "CloudFront CDN", status: "Operational", latency: "8ms", uptime: "99.99%", icon: Globe, color: "#10B981" },
  { name: "SendGrid Email", status: "Operational", latency: "200ms", uptime: "99.95%", icon: Globe, color: "#10B981" },
  { name: "Auth Service", status: "Operational", latency: "35ms", uptime: "99.99%", icon: Shield, color: "#10B981" },
];

export default function AdminSystem() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-sm text-white/40 mt-1">Real-time monitoring of all platform services</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Overall Uptime", value: "99.99%", color: "#10B981" },
          { label: "Avg Response", value: "45ms", color: "#8B5CF6" },
          { label: "Active Connections", value: "2,847", color: "#06B6D4" },
          { label: "Errors Today", value: "0", color: "#10B981" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
          <Activity className="w-4 h-4 text-nx-emerald" />
          <h3 className="text-sm font-semibold text-white">Service Status</h3>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {services.map(s => (
            <div key={s.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
              <s.icon className="w-4 h-4 shrink-0" style={{ color: s.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/60">{s.name}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-xs">
                <span className="text-white/30 hidden sm:block">{s.latency}</span>
                <span className="text-white/25 hidden sm:block">{s.uptime}</span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-nx-emerald" />
                  <span className="text-nx-emerald text-[11px]">{s.status}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
