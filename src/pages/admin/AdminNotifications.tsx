import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Bell, CheckCircle2, Clock } from "lucide-react";

export default function AdminNotifications() {
  const allUsers = useQuery(api.admin.getAllUsers);
  const allEscrows = useQuery(api.admin.getAllEscrows);
  const allKYC = useQuery(api.admin.getAllKYC);

  const users = allUsers ?? [];
  const escrows = allEscrows ?? [];
  const kyc = allKYC ?? [];

  // Build real notifications from platform activity
  const notifications: Array<{ id: string; type: string; message: string; time: string; read: boolean }> = [];

  // Recent escrow activity
  escrows
    .filter((e: any) => e.status === "released" || e.status === "completed" || e.status === "disputed")
    .sort((a: any, b: any) => (b.completedAt || b.releasedAt || b.createdAt) - (a.completedAt || a.releasedAt || a.createdAt))
    .slice(0, 5)
    .forEach((e: any) => {
      const label = e.status === "disputed" ? "Dispute Opened" : "Escrow Released";
      notifications.push({
        id: `NTF-${e._id.slice(-6)}`,
        type: label,
        message: `${label}: ${e.title} — KES ${e.amount.toLocaleString()}`,
        time: formatTimeAgo(e.completedAt || e.releasedAt || e.createdAt),
        read: true,
      });
    });

  // Recent KYC submissions
  kyc
    .filter((k: any) => k.status === "pending")
    .sort((a: any, b: any) => (b.submittedAt || 0) - (a.submittedAt || 0))
    .slice(0, 3)
    .forEach((k: any) => {
      notifications.push({
        id: `KYC-${k._id.slice(-6)}`,
        type: "KYC Submitted",
        message: `${k.businessName} submitted KYC application`,
        time: formatTimeAgo(k.submittedAt),
        read: false,
      });
    });

  // Recent user registrations
  users
    .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 3)
    .forEach((u: any) => {
      notifications.push({
        id: `REG-${u._id.slice(-6)}`,
        type: "New User",
        message: `${u.name || u.email} registered as ${u.role}`,
        time: formatTimeAgo(u.createdAt),
        read: true,
      });
    });

  notifications.sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0));

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-sm text-white/40 mt-1">Platform notifications and alerts</p>
      </div>
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Bell className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No notifications yet</p>
          <p className="text-[11px] text-white/15 mt-1">Platform alerts will appear here</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="divide-y divide-white/[0.03]">
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.01] transition-colors cursor-pointer ${!n.read ? "bg-nx-violet/[0.02]" : ""}`}>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${!n.read ? "bg-nx-violet" : "bg-white/10"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60">{n.message}</p>
                  <p className="text-[10px] text-white/20 mt-0.5">{n.time}</p>
                </div>
                {!n.read && <span className="text-[9px] px-1.5 py-0.5 rounded bg-nx-violet/20 text-nx-violet font-medium">New</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function formatTimeAgo(ts: number): string {
  if (!ts) return "unknown";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
