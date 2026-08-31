import AdminLayout from "./AdminLayout";
import { Bell, CheckCircle2, Clock, Eye } from "lucide-react";

const notifications = [
  { id: "NTF-089", type: "New Order", message: "New order ORD-2901 placed — KES 22,000", time: "2 min ago", read: false },
  { id: "NTF-088", type: "KYC Submitted", message: "Sarah Wanjiku submitted KYC application", time: "5 min ago", read: false },
  { id: "NTF-087", type: "Escrow Release", message: "KES 195,000 released from escrow TXN-4825", time: "22 min ago", read: true },
  { id: "NTF-086", type: "Dispute Opened", message: "Dispute DSP-182 opened for Toyota Vitz order", time: "1 hour ago", read: true },
  { id: "NTF-085", type: "Fraud Alert", message: "Suspicious pattern detected on user_8823", time: "2 hours ago", read: true },
];

export default function AdminNotifications() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-sm text-white/40 mt-1">Platform notifications and alerts</p>
      </div>
      <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
        <div className="divide-y divide-white/[0.03]">
          {notifications.map(n => (
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
    </AdminLayout>
  );
}
