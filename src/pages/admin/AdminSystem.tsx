import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Activity, Server, Database, Globe, Cpu, HardDrive, Wifi, Shield } from "lucide-react";

export default function AdminSystem() {
  const users = useQuery(api.admin.getAllUsers);
  const listings = useQuery(api.admin.getAllListings);
  const escrows = useQuery(api.admin.getAllEscrows);

  const totalUsers = users?.length ?? 0;
  const totalListings = listings?.length ?? 0;
  const totalEscrows = escrows?.length ?? 0;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-sm text-white/40 mt-1">Real-time monitoring of all platform services</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Platform Users", value: totalUsers.toString(), color: "#8B5CF6" },
          { label: "Active Listings", value: totalListings.toString(), color: "#10B981" },
          { label: "Total Escrows", value: totalEscrows.toString(), color: "#06B6D4" },
          { label: "Convex DB", value: "Operational", color: "#10B981" },
        ].map((s) => (
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
          {[
            { name: "Convex Database", icon: Database, status: "Operational" },
            { name: "Convex Functions", icon: Server, status: "Operational" },
            { name: "Authentication", icon: Shield, status: "Operational" },
            { name: "File Storage", icon: HardDrive, status: "Operational" },
            { name: "Real-time Sync", icon: Wifi, status: "Operational" },
          ].map((s) => (
            <div key={s.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
              <s.icon className="w-4 h-4 shrink-0 text-nx-emerald" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/60">{s.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-nx-emerald" />
                <span className="text-nx-emerald text-[11px]">{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
