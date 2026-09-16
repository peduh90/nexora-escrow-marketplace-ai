import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { TrendingUp, BarChart3 } from "lucide-react";

export default function AdminRevenue() {
  const escrows = useQuery(api.admin.getAllEscrows);
  const transactions = useQuery(api.wallet.getWalletTransactions);
  // REAL accumulated fee revenue from every marketplace (products, freelance,
  // services, transport) — the ledger written at charge time by the engines.
  const feeSummary = useQuery(api.feeRules.earningsSummary, {});

  const allEscrows = escrows ?? [];
  const allTxs = transactions ?? [];

  // Calculate real revenue from escrow commission
  const completedEscrows = allEscrows.filter((e: any) => ["released", "completed"].includes(e.status));
  const totalGMV = allEscrows.reduce((sum: number, e: any) => sum + e.amount, 0);
  const escrowCommission = completedEscrows.reduce((sum: number, e: any) => sum + (e.platformFee || 0), 0);
  // The authoritative revenue number: every fee actually collected.
  const totalRevenue = (feeSummary as any)?.total ?? escrowCommission;
  const pendingEscrow = allEscrows
    .filter((e: any) => ["funded", "active", "delivery", "inspection"].includes(e.status))
    .reduce((sum: number, e: any) => sum + e.amount, 0);

  // Build simple weekly revenue from completed escrows
  const now = Date.now();
  const weekData: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
    const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
    const weekRevenue = completedEscrows
      .filter((e: any) => {
        const ts = e.completedAt || e.releasedAt || 0;
        return ts >= weekStart && ts < weekEnd;
      })
      .reduce((sum: number, e: any) => sum + (e.platformFee || 0), 0);
    weekData.push(weekRevenue);
  }

  const maxWeek = Math.max(...weekData, 1);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Platform revenue, commissions, and financial metrics</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total GMV", value: `KES ${totalGMV.toLocaleString()}` },
          { label: "Fee Revenue (all marketplaces)", value: `KES ${totalRevenue.toLocaleString()}` },
          { label: "Escrow Commissions", value: `KES ${escrowCommission.toLocaleString()}` },
          { label: "Pending Escrow", value: `KES ${pendingEscrow.toLocaleString()}` },
          { label: "Completed Orders", value: completedEscrows.length.toString() },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-nx-violet" />
          <h3 className="text-sm font-semibold text-white">Revenue Trend (12 weeks)</h3>
        </div>
        {totalRevenue === 0 ? (
          <div className="py-12 flex flex-col items-center">
            <TrendingUp className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">No revenue data yet</p>
            <p className="text-[11px] text-white/15 mt-1">Revenue will appear after completed transactions</p>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-1 h-48">
              {weekData.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${Math.max((h / maxWeek) * 100, 2)}%`,
                    background:
                      h > maxWeek * 0.8
                        ? "linear-gradient(to top,rgba(139,92,246,0.3),rgba(139,92,246,0.6))"
                        : h > maxWeek * 0.4
                          ? "linear-gradient(to top,rgba(6,182,212,0.2),rgba(6,182,212,0.4))"
                          : "linear-gradient(to top,rgba(255,255,255,0.03),rgba(255,255,255,0.08))",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-white/20">
              <span>12 weeks ago</span>
              <span>Today</span>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
