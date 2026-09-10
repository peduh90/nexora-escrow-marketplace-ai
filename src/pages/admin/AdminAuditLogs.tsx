import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Clock, Shield, Settings, CreditCard, Package, FileText, User, ShieldCheck, Ban } from "lucide-react";

const actionIcons: Record<string, typeof Shield> = {
  "kyc_approved": ShieldCheck,
  "kyc_rejected": Ban,
  "escrow_released": CreditCard,
  "product_suspended": Package,
  "withdrawal_approved": CreditCard,
  "seller_banned": Ban,
  "user_suspended": Ban,
  "dispute_resolved": FileText,
  "settings_updated": Settings,
  "freelancer_suspended": Ban,
  "platform_shutdown": Shield,
  "platform_reactivated": ShieldCheck,
};

const fallbackIcons: Record<string, typeof Shield> = {
  "User Registered": User,
  "Product Listed": Package,
  "Escrow Released": CreditCard,
};

/**
 * Audit Logs — the REAL administrative action trail.
 *
 * Previously this page fabricated "audit entries" from recent escrows, users,
 * and listings (with a dead sort function and always-"unknown" timestamps,
 * because it read a `createdAt` field users don't even have). Now it renders
 * the actual `auditLogs` table that every admin mutation writes to, with the
 * legacy pre-migration entries surfaced as a note instead of fake data.
 */
export default function AdminAuditLogs() {
  const audit = useQuery(api.admin.getAuditLogs);
  const allUsers = useQuery(api.admin.getAllUsers);

  const entries = (audit as any)?.entries ?? [];
  const legacyCount = (audit as any)?.legacyCount ?? 0;
  const total = (audit as any)?.total ?? 0;

  const getUser = (id: string) => allUsers?.find((u: any) => u._id === id);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-white/40 mt-1">Complete record of all administrative actions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Entries", value: total.toString() },
          { label: "Admin Actions", value: entries.length.toString() },
          { label: "Legacy (pre-migration)", value: legacyCount.toString() },
          { label: "Retention", value: "Permanent" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {!audit ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Clock className="w-8 h-8 text-white/10 mb-3 animate-pulse" />
          <p className="text-sm text-white/30">Loading audit trail...</p>
        </div>
      ) : entries.length === 0 && legacyCount === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Clock className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No audit entries yet</p>
          <p className="text-[11px] text-white/15 mt-1">
            Every admin action (approvals, suspensions, releases) is recorded here automatically
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
          {legacyCount > 0 && (
            <div className="px-5 py-2.5 border-b border-white/5 bg-nx-gold/[0.03]">
              <p className="text-[11px] text-nx-gold/70">
                {legacyCount} legacy entr{legacyCount === 1 ? "y" : "ies"} from before the audit-table migration are counted in totals but not listed.
              </p>
            </div>
          )}
          <div className="divide-y divide-white/[0.03]">
            {entries.map((log: any) => {
              const actor = getUser(log.adminId);
              const Icon = actionIcons[log.action] || fallbackIcons[log.action] || FileText;
              return (
                <div key={log._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-nx-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-white/70 font-medium">{log.action}</span>
                      <span className="text-[10px] text-white/25">on {log.target}</span>
                    </div>
                    {log.details && <p className="text-[11px] text-white/30 truncate">{log.details}</p>}
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-[10px] text-white/25">{actor?.name || log.adminName}</p>
                    <p className="text-[10px] text-white/15">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
