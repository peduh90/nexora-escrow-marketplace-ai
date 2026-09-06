import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { ScrollText, Shield, Clock, CheckCircle2 } from "lucide-react";

export default function AdminAudit() {
  const auditData = useQuery(api.admin.getAuditLogs);

  const entries = (auditData?.entries ?? []).slice(0, 200);
  const legacyCount = auditData?.legacyCount ?? 0;
  const total = auditData?.total ?? 0;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-sm text-white/40 mt-1">
          WHO DID WHAT, AND WHEN — platform admin action history
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
          <ScrollText className="w-5 h-5 text-nx-cyan mb-2" />
          <p className="text-[10px] text-white/30 uppercase">Total Logged</p>
          <p className="text-xl font-bold text-white mt-1">{total}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-[10px] text-white/30 uppercase">Audit Table</p>
          <p className="text-xl font-bold text-white mt-1">{entries.length}</p>
        </div>
        {legacyCount > 0 && (
          <div className="p-4 rounded-xl border border-amber-400/10 bg-amber-400/5">
            <Clock className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-[10px] text-white/30 uppercase">Legacy Fallback</p>
            <p className="text-xl font-bold text-amber-400 mt-1">{legacyCount}</p>
          </div>
        )}
        <div className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
          <Shield className="w-5 h-5 text-nx-violet mb-2" />
          <p className="text-[10px] text-white/30 uppercase">Admin Role</p>
          <p className="text-xl font-bold text-white mt-1">admin</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <ScrollText className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No audit log entries yet</p>
          <p className="text-[11px] text-white/15 mt-1">
            Admin actions will appear here once the platform is used
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">
                    Action
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">
                    Admin
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">
                    Resource
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">
                    Resource ID
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">
                    Details
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {entries.map((entry: any) => (
                  <tr key={`${entry._id}-${entry.createdAt}`} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-nx-cyan/10 text-nx-cyan font-medium">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-white/50 truncate max-w-[160px]">
                        {entry.adminName || "Unknown"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-white/60">{entry.target}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-xs text-white/30 font-mono truncate max-w-[180px]">
                        {entry.targetId || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-white/40 truncate max-w-[220px]">
                        {entry.details || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-white/40">
                        {typeof entry.createdAt === "number" && entry.createdAt
                          ? new Date(entry.createdAt).toLocaleString()
                          : "—"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {entries.length >= 200 && (
            <div className="px-4 py-3 border-t border-white/5 text-center text-xs text-white/30">
              Showing first 200 entries. Use Convex dashboard for full export.
            </div>
          )}
        </div>
      )}

      {legacyCount > 0 && (
        <div className="mt-4 p-4 rounded-xl border border-amber-400/10 bg-amber-400/5 text-xs text-amber-400">
          <p className="mb-1">Legacy audit fallback ({legacyCount} entries) detected.</p>
          <p>
            Older audit events were stored as admin notifications before the dedicated auditLogs
            table existed. They are included in the total above.
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
