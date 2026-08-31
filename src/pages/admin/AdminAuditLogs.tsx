import AdminLayout from "./AdminLayout";
import { Eye, Clock, User, Shield, Settings, CreditCard, Package } from "lucide-react";

const logs = [
  { id: "LOG-0892", action: "KYC Approved", user: "admin@nexora.com", target: "TechZone Kenya", time: "2 hours ago", ip: "192.168.1.1" },
  { id: "LOG-0891", action: "Escrow Released", user: "system", target: "TXN-4825 — KES 195,000", time: "3 hours ago", ip: "—" },
  { id: "LOG-0890", action: "Product Suspended", user: "admin@nexora.com", target: "Counterfeit Charger", time: "5 hours ago", ip: "192.168.1.1" },
  { id: "LOG-0889", action: "Withdrawal Approved", user: "finance@nexora.com", target: "WD-2844 — KES 250,000", time: "1 day ago", ip: "10.0.0.1" },
  { id: "LOG-0888", action: "Seller Banned", user: "admin@nexora.com", target: "CheapDeals254", time: "2 days ago", ip: "192.168.1.1" },
  { id: "LOG-0887", action: "Delivery Zone Updated", user: "ops@nexora.com", target: "Mombasa — KES 800", time: "3 days ago", ip: "10.0.0.2" },
];

const actionIcons: Record<string, typeof Shield> = {
  "KYC Approved": Shield, "Escrow Released": CreditCard, "Product Suspended": Package,
  "Withdrawal Approved": CreditCard, "Seller Banned": Shield, "Delivery Zone Updated": Settings,
};

export default function AdminAuditLogs() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-white/40 mt-1">Complete record of all administrative actions</p>
      </div>
      <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
        <div className="divide-y divide-white/[0.03]">
          {logs.map(log => {
            const Icon = actionIcons[log.action] || Clock;
            return (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-white/60 font-medium">{log.action}</span>
                  </div>
                  <p className="text-[11px] text-white/30">{log.target}</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-[10px] text-white/25">{log.user}</p>
                  <p className="text-[10px] text-white/15">{log.ip}</p>
                </div>
                <span className="text-[10px] text-white/20 shrink-0">{log.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
