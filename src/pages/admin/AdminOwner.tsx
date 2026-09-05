import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import {
  Brain, Shield, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  Users, FileText, Zap, Eye, Settings, BarChart3, RefreshCw, Search,
  Bot, Target, Activity, BookOpen, Flag, XCircle, ArrowUpRight,
  Loader2, Power, PowerOff, ChevronDown, ChevronRight, Lock, Unlock,
  AlertOctagon, ShieldCheck, ShieldAlert, MessageSquare, Package,
  Wallet, ShoppingCart, Truck, Ban, Check, X, ToggleLeft, ToggleRight,
  Crown, Sparkles, Layers, PieChart, UserCheck, UserX, TrendingDown,
  CircleDot, BarChart, DollarSign, Percent, Hash, Calendar, Flame,
} from "lucide-react";

type Tab = "overview" | "permissions" | "automation" | "support" | "moderation" | "kyc" | "fraud" | "disputes" | "audit" | "shutdown";

export default function AdminOwner() {
  const [tab, setTab] = useState<Tab>("overview");
  const dashboard = useQuery(api.ownerControl.getOwnerDashboard);
  const systemStatus = useQuery(api.ownerControl.getAiSystemStatus);

  const aiActive = !systemStatus?.isShutdown;

  return (
    <AdminLayout>
      {/* Owner Authority Banner */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-nx-violet/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Owner Control Center</h1>
              <p className="text-sm text-white/40">100% authority · AI automates up to 90% of routine operations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge active={aiActive} label={aiActive ? "AI Active" : "AI SHUTDOWN"} />
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {dashboard && dashboard.alerts.length > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.03]">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400">ATTENTION REQUIRED</span>
          </div>
          <div className="space-y-1">
            {dashboard.alerts.map((alert, i) => (
              <p key={i} className="text-xs text-red-400/70">• {alert}</p>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Quick Access */}
      <WhatsAppQuickAccess />

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {([
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "permissions", label: "AI Permissions", icon: Shield },
          { id: "automation", label: "Automation Log", icon: Zap },
          { id: "support", label: "Support", icon: MessageSquare },
          { id: "moderation", label: "Moderation", icon: Package },
          { id: "kyc", label: "KYC", icon: UserCheck },
          { id: "fraud", label: "Fraud", icon: ShieldAlert },
          { id: "disputes", label: "Disputes", icon: ScaleIcon },
          { id: "audit", label: "Audit Log", icon: FileText },
          { id: "shutdown", label: "Emergency", icon: AlertOctagon },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? t.id === "shutdown" ? "bg-red-400/10 text-red-400 border border-red-400/20" : "bg-nx-cyan/10 text-nx-cyan border border-nx-cyan/20"
                : "text-white/30 hover:text-white/60 bg-white/[0.02]"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OwnerOverview />}
      {tab === "permissions" && <PermissionsManager />}
      {tab === "automation" && <AutomationLog />}
      {tab === "support" && <SupportCenter />}
      {tab === "moderation" && <ModerationCenter />}
      {tab === "kyc" && <KycCenter />}
      {tab === "fraud" && <FraudCenter />}
      {tab === "disputes" && <DisputesCenter />}
      {tab === "audit" && <AuditCenter />}
      {tab === "shutdown" && <EmergencyShutdown />}
    </AdminLayout>
  );
}

// ─── HELPER COMPONENTS ───

// ─── WHATSAPP QUICK ACCESS ───

function WhatsAppQuickAccess() {
  return (
    <div className="p-4 rounded-xl border border-nx-gold/10 bg-nx-gold/[0.02]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-nx-gold" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a11.03 11.03 0 01-5.34 2.16c-.362.149-1.187.149-1.55-.074-.363-.198-.487-.462-.636-.644-.149-.198-.223-.298-.298-.497-.074-.223-.074-.396-.074-.545 0-.273.074-.52.149-.743.074-.248.223-.397.397-.596.223-.198.52-.298.743-.397.223-.124.497-.198.792-.223.297-.025.52-.074.694-.149.149-.074.248-.174.298-.298.124-.198.074-.462.074-.686 0-.223-.074-.446-.223-.644-.149-.198-.371-.347-.644-.52-.273-.174-.62-.298-.965-.347-.345-.074-.79-.074-1.18-.049l-.003-.002a12.5 12.5 0 00-2.058.298c-.571.223-1.115.644-1.361 1.04a6.78 6.78 0 01-.372 1.115c-.099.297-.248.62-.397.868-.149.223-.372.446-.596.644-.223.223-.497.397-.743.596-.248.198-.497.298-.82.298-.298 0-.596-.099-.894-.298-.324-.223-.596-.644-.596-1.163-.025-.644.272-1.314.694-1.825.424-.527 1.02-.867 1.55-.967.248-.046.497-.046.743-.046.52 0 .965.149 1.314.398.349.25 1.04.884 1.36 1.288.32.404.497.673.497.995.024.67.149 1.363.372 2.012.224.644.497 1.289.792 1.635.297.347.669.596 1.115.744.446.149.82.149 1.115.149z"/></svg>
          <div className="">
            <p className="text-sm font-semibold text-nx-gold">Admin WhatsApp Access</p>
            <p className="text-[10px] text-white/30">+254 769 739 216 — 24/7 Support</p>
          </div>
        </div>
        <a
          href="https://wa.me/254769739216?text=Hello%20Nexora%20Admin%2C%20I%20need%20help%20with%20the%20Owner%20Control%20Center"
          target="_blank"
          className="px-4 py-2 rounded-lg bg-nx-gold/10 border border-nx-gold/20 text-nx-gold hover:bg-nx-gold/20 transition-colors text-sm font-medium"
        >
          Open WhatsApp
        </a>
      </div>
    </div>
  );
}

// ─── HELPERS ───

function ScaleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
      active ? "bg-nx-emerald/10 text-nx-emerald border border-nx-emerald/20" : "bg-red-400/10 text-red-400 border border-red-400/20"
    }`}>
      <span className={`w-2 h-2 rounded-full ${active ? "bg-nx-emerald animate-pulse" : "bg-red-400"}`} />
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-[10px] text-white/30 uppercase">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-[10px] text-white/20 mt-1">{sub}</p>}
    </div>
  );
}

// ─── OVERVIEW ───

function OwnerOverview() {
  const dashboard = useQuery(api.ownerControl.getOwnerDashboard);

  if (!dashboard) return <LoadingState />;

  const { platform, ai, operations } = dashboard;

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className={`p-5 rounded-xl border ${ai.isShutdown ? "border-red-500/20 bg-red-500/[0.03]" : "border-nx-emerald/10 bg-nx-emerald/[0.02]"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ai.isShutdown ? "bg-red-500/10" : "bg-nx-emerald/10"}`}>
            {ai.isShutdown ? <PowerOff className="w-6 h-6 text-red-400" /> : <Activity className="w-6 h-6 text-nx-emerald" />}
          </div>
          <div>
            <h3 className={`text-base font-semibold ${ai.isShutdown ? "text-red-400" : "text-nx-emerald"}`}>
              {ai.isShutdown ? "⚠ AI SYSTEM IN EMERGENCY SHUTDOWN" : "System Status: All Systems Operational"}
            </h3>
            <p className="text-sm text-white/40">
              {ai.isShutdown ? "All AI automation is paused. Manual operations continue." : `AI handling ${ai.todayAutomations} automations today · ${ai.enabledPermissions}/${ai.totalPermissions} permissions active`}
            </p>
          </div>
        </div>
      </div>

      {/* Core Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total GMV" value={`KES ${(platform.totalGMV / 1000).toFixed(0)}K`} icon={DollarSign} color="#10B981" sub={`Revenue: KES ${platform.platformRevenue.toLocaleString()}`} />
        <StatCard label="AI Automation" value={`${ai.automationRate.toFixed(1)}%`} icon={Zap} color="#8B5CF6" sub="Target: 90%" />
        <StatCard label="Quality Score" value={`${ai.qualityScore.toFixed(1)}%`} icon={Target} color="#06B6D4" sub="Target: 95%+" />
        <StatCard label="Active Users" value={platform.totalUsers} icon={Users} color="#F59E0B" sub={`${platform.sellers} sellers · ${platform.buyers} buyers`} />
        <StatCard label="AI Actions" value={ai.totalAutoActions} icon={Bot} color="#10B981" sub={`${ai.todayAutomations} today`} />
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Marketplace */}
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-nx-violet" /> Marketplace
          </h3>
          <div className="space-y-2.5">
            {[
              { label: "Active Products", value: platform.activeListings, color: "text-white" },
              { label: "Active Orders", value: platform.activeOrders, color: "text-nx-cyan" },
              { label: "Completed Orders", value: platform.completedOrders, color: "text-nx-emerald" },
              { label: "Held in Escrow", value: `KES ${(platform.heldInEscrow / 1000).toFixed(0)}K`, color: "text-amber-400" },
              { label: "Today's Orders", value: platform.todayNewOrders, color: "text-white" },
              { label: "Today's Revenue", value: `KES ${platform.todayRevenue.toLocaleString()}`, color: "text-nx-emerald" },
            ].map((s) => (
              <div key={s.label} className="flex justify-between text-xs">
                <span className="text-white/40">{s.label}</span>
                <span className={`font-medium ${s.color}`}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Operations */}
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-nx-cyan" /> AI Operations
          </h3>
          <div className="space-y-2.5">
            {[
              { label: "Total Conversations", value: ai.totalConversations, color: "text-white" },
              { label: "AI Resolved", value: ai.aiResolved, color: "text-nx-emerald" },
              { label: "Human Escalated", value: ai.humanEscalated, color: "text-amber-400" },
              { label: "Today Automations", value: ai.todayAutomations, color: "text-nx-cyan" },
              { label: "Today Overrides", value: ai.todayOverrides, color: ai.todayOverrides > 0 ? "text-red-400" : "text-white/30" },
              { label: "Permissions Active", value: `${ai.enabledPermissions}/${ai.totalPermissions}`, color: "text-white" },
            ].map((s) => (
              <div key={s.label} className="flex justify-between text-xs">
                <span className="text-white/40">{s.label}</span>
                <span className={`font-medium ${s.color}`}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</span>
              </div>
            ))}
          </div>
          {/* Automation by Category */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <p className="text-[10px] text-white/20 mb-2 uppercase">AI by Category</p>
            <div className="space-y-1.5">
              {Object.entries(ai.permissionsByCategory).map(([cat, data]) => (
                <div key={cat} className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                    <div className="h-full rounded-full bg-nx-cyan/40" style={{ width: `${data.total > 0 ? (data.enabled / data.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-[10px] text-white/30 w-16">{cat}</span>
                  <span className="text-[10px] text-white/40">{data.actions}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operations */}
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" /> Operations
          </h3>
          <div className="space-y-2.5">
            {[
              { label: "Open Tickets", value: operations.openTickets, color: operations.openTickets > 0 ? "text-nx-cyan" : "text-white/30", icon: MessageSquare },
              { label: "AI-Handled Tickets", value: operations.aiHandledTickets, color: "text-nx-emerald", icon: Bot },
              { label: "Escalated Tickets", value: operations.escalatedTickets, color: operations.escalatedTickets > 0 ? "text-red-400" : "text-white/30", icon: AlertTriangle },
              { label: "Pending KYC", value: operations.pendingKyc, color: operations.pendingKyc > 0 ? "text-amber-400" : "text-white/30", icon: UserCheck },
              { label: "Open Disputes", value: operations.openDisputes, color: operations.openDisputes > 0 ? "text-red-400" : "text-white/30", icon: ScaleIcon },
              { label: "High-Value Disputes", value: operations.highValueDisputes, color: operations.highValueDisputes > 0 ? "text-red-400" : "text-white/30", icon: Flame },
              { label: "New Fraud Alerts", value: operations.newFraudAlerts, color: operations.newFraudAlerts > 0 ? "text-red-400" : "text-white/30", icon: ShieldAlert },
              { label: "Critical Fraud", value: operations.criticalFraudAlerts, color: operations.criticalFraudAlerts > 0 ? "text-red-400" : "text-white/30", icon: AlertOctagon },
              { label: "Pending Wallet Tx", value: operations.pendingWalletTx, color: "text-white/40", icon: Wallet },
            ].map((s) => (
              <div key={s.label} className="flex justify-between text-xs">
                <span className="text-white/40 flex items-center gap-1.5">
                  <s.icon className="w-3 h-3" /> {s.label}
                </span>
                <span className={`font-medium ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Audit Log */}
      {dashboard.recentAuditLogs.length > 0 && (
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/30" /> Recent AI Activity
          </h3>
          <div className="divide-y divide-white/[0.03]">
            {dashboard.recentAuditLogs.slice(0, 10).map((log: any) => (
              <div key={log._id} className="flex items-center gap-3 py-2.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                  log.action.includes("shutdown") || log.action.includes("override") ? "bg-red-400/10 text-red-400" :
                  log.action.includes("auto") || log.action.includes("approve") ? "bg-nx-emerald/10 text-nx-emerald" :
                  "bg-nx-cyan/10 text-nx-cyan"
                }`}>
                  {log.action.replace(/_/g, " ")}
                </span>
                <span className="text-[11px] text-white/40 flex-1 truncate">{log.reasoning || log.details || ""}</span>
                <span className="text-[10px] text-white/20">{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PERMISSIONS MANAGER ───

function PermissionsManager() {
  const permissions = useQuery(api.ownerControl.getAiPermissions, {});
  const stats = useQuery(api.ownerControl.getPermissionStats);
  const updatePerm = useMutation(api.ownerControl.updatePermission);
  const initPerms = useMutation(api.ownerControl.initializePermissions);
  const toggleAll = useMutation(api.ownerControl.toggleAllPermissions);
  const [category, setCategory] = useState<string>("all");
  const [showStats, setShowStats] = useState(false);

  if (!permissions) return <LoadingState />;

  const filtered = category === "all" ? permissions : permissions.filter((p) => p.category === category);
  const categories = [...new Set(permissions.map((p) => p.category))];

  const riskColors: Record<string, string> = {
    low: "text-nx-emerald bg-nx-emerald/10",
    medium: "text-amber-400 bg-amber-400/10",
    high: "text-orange-400 bg-orange-400/10",
    critical: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">AI Permissions Engine</h2>
          <p className="text-xs text-white/30 mt-1">Control exactly what AI can and cannot do. Toggle individual permissions, set confidence thresholds, and require owner approval for sensitive actions.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => initPerms()} className="px-3 py-2 rounded-lg bg-white/[0.03] text-xs text-white/40 hover:text-white/60 border border-white/5">
            Init Defaults
          </button>
          <button onClick={() => toggleAll({ enabled: false })} className="px-3 py-2 rounded-lg bg-red-400/10 text-xs text-red-400 hover:bg-red-400/20 border border-red-400/10">
            Disable All
          </button>
          <button onClick={() => toggleAll({ enabled: true })} className="px-3 py-2 rounded-lg bg-nx-emerald/10 text-xs text-nx-emerald hover:bg-nx-emerald/20 border border-nx-emerald/10">
            Enable All
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setCategory("all")} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap ${category === "all" ? "bg-nx-cyan/10 text-nx-cyan" : "text-white/30 bg-white/[0.02]"}`}>
          All ({permissions.length})
        </button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap ${category === c ? "bg-nx-cyan/10 text-nx-cyan" : "text-white/30 bg-white/[0.02]"}`}>
            {c} ({permissions.filter((p) => p.category === c).length})
          </button>
        ))}
      </div>

      {/* Permission Cards */}
      <div className="space-y-2">
        {filtered.map((perm) => {
          const permStats = stats?.find((s) => s.key === perm.key);
          return (
            <div key={perm._id} className={`p-4 rounded-xl border bg-[#0A0A12] transition-colors ${perm.enabled ? "border-white/5" : "border-white/[0.02] opacity-60"}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white">{perm.label}</h4>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${riskColors[perm.riskLevel] || ""}`}>
                      {perm.riskLevel.toUpperCase()}
                    </span>
                    {perm.requiresOwnerApproval && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400">OWNER APPROVAL</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mb-2">{perm.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-white/25">
                    <span>Confidence: {perm.maxConfidence}%</span>
                    <span>Auto-actions: {perm.autoActionCount}</span>
                    {permStats && <>
                      <span>Today: {permStats.todayCount}</span>
                      <span>Success: {permStats.successRate}%</span>
                    </>}
                    {perm.lastTriggeredAt && <span>Last: {new Date(perm.lastTriggeredAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Confidence slider */}
                  <div className="text-right">
                    <label className="text-[10px] text-white/30 block mb-1">Min Confidence</label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={perm.maxConfidence}
                      onChange={(e) => updatePerm({ permissionId: perm._id, maxConfidence: parseInt(e.target.value) || 80 })}
                      className="w-16 px-2 py-1 rounded bg-white/[0.03] border border-white/5 text-xs text-white text-center focus:outline-none focus:border-nx-cyan/30"
                    />
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => updatePerm({ permissionId: perm._id, enabled: !perm.enabled })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${perm.enabled ? "bg-nx-emerald" : "bg-white/10"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${perm.enabled ? "left-[26px]" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AUTOMATION LOG ───

function AutomationLog() {
  const logs = useQuery(api.ownerControl.getAutomationLogs, { limit: 100 });
  const overrideLog = useMutation(api.ownerControl.overrideAutomation);

  if (!logs) return <LoadingState />;

  const resultColors: Record<string, string> = {
    approved: "text-nx-emerald bg-nx-emerald/10",
    rejected: "text-red-400 bg-red-400/10",
    escalated: "text-amber-400 bg-amber-400/10",
    failed: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">AI Automation Log</h2>
          <p className="text-xs text-white/30 mt-1">Every automated AI action is logged. Override any decision with owner authority.</p>
        </div>
        <span className="text-xs text-white/30">{logs.length} entries</span>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16">
          <Zap className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No automations recorded yet</p>
          <p className="text-xs text-white/15 mt-1">AI actions will appear here as they execute</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => (
            <div key={log._id} className="p-3 rounded-xl border border-white/5 bg-[#0A0A12] hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/20 w-20 shrink-0">{log.permissionKey.replace(/_/g, " ")}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${resultColors[log.result] || "bg-white/5 text-white/30"}`}>
                  {log.result}
                </span>
                <span className="text-[10px] text-nx-cyan">{log.aiConfidence}%</span>
                <span className="text-[10px] text-white/25 flex-1 truncate">{log.entityType}: {log.entityId.slice(0, 12)}...</span>
                {log.reasoning && <span className="text-[10px] text-white/30 truncate max-w-[200px]">{log.reasoning}</span>}
                {log.overriddenBy ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400">OVERRIDDEN</span>
                ) : (
                  <button
                    onClick={() => overrideLog({ logId: log._id, overrideReason: "Owner override" })}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
                  >
                    Override
                  </button>
                )}
                <span className="text-[10px] text-white/20 shrink-0">{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SUPPORT CENTER ───

function SupportCenter() {
  const dashboard = useQuery(api.ownerControl.getOwnerDashboard);
  const tickets = useQuery(api.aiOps.getAllTickets, {});
  const bulkResolve = useMutation(api.ownerControl.bulkResolveLowTickets);

  if (!tickets) return <LoadingState />;

  const open = tickets.filter((t) => ["open", "escalated", "human_review"].includes(t.status));
  const aiHandled = tickets.filter((t) => t.status === "ai_handling");
  const resolved = tickets.filter((t) => ["resolved", "ai_resolved", "closed"].includes(t.status));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Support Operations</h2>
        <button onClick={() => bulkResolve({ resolution: "Auto-resolved by owner bulk action" })} className="px-3 py-2 rounded-lg bg-nx-emerald/10 text-xs text-nx-emerald hover:bg-nx-emerald/20">
          Bulk Resolve Low Priority
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Open" value={open.length} icon={MessageSquare} color="#06B6D4" />
        <StatCard label="AI Handling" value={aiHandled.length} icon={Bot} color="#10B981" />
        <StatCard label="Escalated" value={open.filter((t) => t.status === "escalated").length} icon={AlertTriangle} color="#F59E0B" />
        <StatCard label="Resolved" value={resolved.length} icon={CheckCircle2} color="#10B981" />
      </div>

      <div className="space-y-1.5">
        {open.slice(0, 30).map((ticket) => (
          <div key={ticket._id} className="p-3 rounded-xl border border-white/5 bg-[#0A0A12]">
            <div className="flex items-center gap-3">
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                ticket.priority === "critical" ? "bg-red-400/10 text-red-400" :
                ticket.priority === "high" ? "bg-orange-400/10 text-orange-400" :
                ticket.priority === "medium" ? "bg-amber-400/10 text-amber-400" : "bg-white/5 text-white/30"
              }`}>
                {ticket.priority}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                ticket.status === "escalated" ? "bg-red-400/10 text-red-400" : "bg-nx-cyan/10 text-nx-cyan"
              }`}>
                {ticket.status.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-white/60 flex-1 truncate">{ticket.subject}</span>
              <span className="text-[10px] text-white/25">{ticket.category.replace(/_/g, " ")}</span>
              {ticket.aiConfidence !== undefined && ticket.aiConfidence !== null && (
                <span className="text-[10px] text-nx-cyan">{Math.round(ticket.aiConfidence * 100)}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MODERATION CENTER ───

function ModerationCenter() {
  const listings = useQuery(api.admin.getAllListings);
  const updateStatus = useMutation(api.admin.updateListingStatus);

  if (!listings) return <LoadingState />;

  const active = listings.filter((l) => l.status === "active");
  const paused = listings.filter((l) => l.status === "paused");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Marketplace Moderation</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active" value={active.length} icon={Package} color="#10B981" />
        <StatCard label="Paused" value={paused.length} icon={Clock} color="#F59E0B" />
        <StatCard label="Total" value={listings.length} icon={Layers} color="#8B5CF6" />
      </div>
    </div>
  );
}

// ─── KYC CENTER ───

function KycCenter() {
  const kyc = useQuery(api.admin.getAllKYC);
  const bulkApprove = useMutation(api.ownerControl.bulkApproveKyc);

  if (!kyc) return <LoadingState />;

  const pending = kyc.filter((a) => a.status === "pending");
  const approved = kyc.filter((a) => a.status === "approved");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">KYC Verification</h2>
        <button onClick={() => bulkApprove({ notes: "Bulk approved by owner" })} className="px-3 py-2 rounded-lg bg-nx-emerald/10 text-xs text-nx-emerald hover:bg-nx-emerald/20">
          Bulk Approve Pending
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Pending" value={pending.length} icon={Clock} color="#F59E0B" />
        <StatCard label="Approved" value={approved.length} icon={CheckCircle2} color="#10B981" />
      </div>
    </div>
  );
}

// ─── FRAUD CENTER ───

function FraudCenter() {
  const alerts = useQuery(api.aiOps.getFraudAlerts, {});
  const reviewAlert = useMutation(api.aiOps.reviewFraudAlert);
  const dismissLow = useMutation(api.ownerControl.dismissLowFraudAlerts);

  if (!alerts) return <LoadingState />;

  const critical = alerts.filter((a) => a.riskLevel === "critical" && a.status !== "dismissed");
  const high = alerts.filter((a) => a.riskLevel === "high" && a.status !== "dismissed");
  const newAlerts = alerts.filter((a) => a.status === "new");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Fraud Detection</h2>
        <button onClick={() => dismissLow()} className="px-3 py-2 rounded-lg bg-white/[0.03] text-xs text-white/40 hover:text-white/60 border border-white/5">
          Dismiss Low/Medium Alerts
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="New Alerts" value={newAlerts.length} icon={ShieldAlert} color={newAlerts.length > 0 ? "#EF4444" : "#10B981"} />
        <StatCard label="Critical" value={critical.length} icon={AlertOctagon} color="#EF4444" />
        <StatCard label="High Risk" value={high.length} icon={ShieldAlert} color="#F59E0B" />
        <StatCard label="Total" value={alerts.length} icon={Shield} color="#8B5CF6" />
      </div>

      {critical.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/[0.03]">
          <h3 className="text-sm font-semibold text-red-400 mb-3">Critical Fraud Alerts — Owner Review Required</h3>
          <div className="space-y-2">
            {critical.map((alert) => (
              <div key={alert._id} className="p-3 rounded-lg bg-[#0A0A12] border border-red-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-red-400 font-bold">RISK: {alert.riskScore}/100</span>
                  <span className="text-[10px] text-white/30">{alert.entityType}</span>
                </div>
                {alert.flags.map((f, i) => <p key={i} className="text-[11px] text-red-400/60">• {f}</p>)}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => reviewAlert({ alertId: alert._id, status: "confirmed" })} className="px-2 py-1 rounded bg-red-400/10 text-[10px] text-red-400">Confirm Fraud</button>
                  <button onClick={() => reviewAlert({ alertId: alert._id, status: "dismissed" })} className="px-2 py-1 rounded bg-white/5 text-[10px] text-white/40">Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DISPUTES CENTER ───

function DisputesCenter() {
  const disputes = useQuery(api.admin.getAllDisputes);
  const resolveDispute = useMutation(api.admin.resolveDispute);

  if (!disputes) return <LoadingState />;

  const open = disputes.filter((d) => ["open", "under_review"].includes(d.status));
  const escalated = disputes.filter((d) => d.status === "escalated");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Dispute Resolution</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Open" value={open.length} icon={ScaleIcon} color="#06B6D4" />
        <StatCard label="Escalated" value={escalated.length} icon={AlertTriangle} color="#EF4444" />
        <StatCard label="Resolved" value={disputes.filter((d) => d.status === "resolved").length} icon={CheckCircle2} color="#10B981" />
        <StatCard label="Total" value={disputes.length} icon={FileText} color="#8B5CF6" />
      </div>
    </div>
  );
}

// ─── AUDIT CENTER ───

function AuditCenter() {
  const logs = useQuery(api.ownerControl.getAutomationLogs, { limit: 100 });
  const aiAudit = useQuery(api.aiOps.getAiAuditLogs, { limit: 50 });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white">Complete Audit Trail</h2>
      <p className="text-xs text-white/30">Every AI decision, owner override, and system action is permanently logged.</p>

      {/* AI Audit */}
      {aiAudit && aiAudit.length > 0 && (
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4">AI Decision Log</h3>
          <div className="divide-y divide-white/[0.03]">
            {aiAudit.map((log) => (
              <div key={log._id} className="flex items-center gap-3 py-2.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-nx-cyan/10 text-nx-cyan">{log.action.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-white/30">{log.entityType}</span>
                <span className="text-[10px] text-nx-cyan">{Math.round(log.aiConfidence * 100)}%</span>
                <span className="text-[10px] text-white/40 flex-1 truncate">{log.aiDecision}</span>
                {log.humanOverride && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400">OVERRIDE</span>}
                <span className="text-[10px] text-white/20">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automation Log */}
      {logs && logs.length > 0 && (
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4">Automation Log</h3>
          <div className="divide-y divide-white/[0.03]">
            {logs.slice(0, 50).map((log) => (
              <div key={log._id} className="flex items-center gap-3 py-2.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                  log.result === "approved" ? "bg-nx-emerald/10 text-nx-emerald" :
                  log.result === "rejected" ? "bg-red-400/10 text-red-400" :
                  log.result === "escalated" ? "bg-amber-400/10 text-amber-400" : "bg-white/5 text-white/30"
                }`}>{log.result}</span>
                <span className="text-[10px] text-white/30">{log.permissionKey.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-white/40 flex-1 truncate">{log.reasoning || ""}</span>
                {log.overriddenBy && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400">OVERRIDE</span>}
                <span className="text-[10px] text-white/20">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EMERGENCY SHUTDOWN ───

function EmergencyShutdown() {
  const systemStatus = useQuery(api.ownerControl.getAiSystemStatus);    const shutdown = useMutation(api.ownerControl.emergencyShutdown);
  const reactivate = useMutation(api.ownerControl.reactivateAi);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (!systemStatus) return <LoadingState />;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <AlertOctagon className="w-5 h-5 text-red-400" /> Emergency AI Controls
      </h2>

      <div className={`p-6 rounded-xl border-2 ${systemStatus.isShutdown ? "border-red-500/30 bg-red-500/[0.03]" : "border-white/5 bg-[#0A0A12]"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-lg font-bold ${systemStatus.isShutdown ? "text-red-400" : "text-nx-emerald"}`}>
              {systemStatus.isShutdown ? "AI SYSTEM: SHUTDOWN" : "AI SYSTEM: ACTIVE"}
            </h3>
            {systemStatus.isShutdown && systemStatus.shutdownAt && (
              <p className="text-xs text-white/30 mt-1">
                Shutdown at {new Date(systemStatus.shutdownAt).toLocaleString()}
                {systemStatus.shutdownReason && ` — Reason: ${systemStatus.shutdownReason}`}
              </p>
            )}
          </div>
          {systemStatus.isShutdown ? (
            <button
              onClick={() => reactivate()}
              className="px-4 py-2.5 rounded-lg bg-nx-emerald text-white text-sm font-semibold hover:bg-nx-emerald/80 flex items-center gap-2"
            >
              <Power className="w-4 h-4" /> Reactivate AI
            </button>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-500/80 flex items-center gap-2"
            >
              <PowerOff className="w-4 h-4" /> Emergency Shutdown
            </button>
          )}
        </div>

        {confirming && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/[0.05]">
            <h4 className="text-sm font-semibold text-red-400 mb-2">⚠ Confirm Emergency Shutdown</h4>
            <p className="text-xs text-white/40 mb-3">This will immediately stop ALL AI automation. All AI-resolved tickets, auto-moderation, auto-KYC, and fraud detection will cease. Manual operations continue normally.</p>
            <div className="mb-3">
              <label className="text-xs text-white/40 block mb-1">Reason (required)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you shutting down AI?"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-400/30 resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (reason.trim()) {
                    shutdown({ reason: reason.trim() });
                    setConfirming(false);
                    setReason("");
                  }
                }}
                disabled={!reason.trim()}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-500/80 disabled:opacity-40"
              >
                SHUTDOWN AI NOW
              </button>
              <button onClick={() => setConfirming(false)} className="px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white/60">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* What Emergency Shutdown Does */}
      <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
        <h3 className="text-sm font-semibold text-white mb-4">What Emergency Shutdown Does</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "Stops all AI auto-responses", icon: Bot, active: !systemStatus.isShutdown },
            { label: "Stops auto-moderation", icon: Package, active: !systemStatus.isShutdown },
            { label: "Stops auto-KYC screening", icon: UserCheck, active: !systemStatus.isShutdown },
            { label: "Stops auto-fraud scoring", icon: ShieldAlert, active: !systemStatus.isShutdown },
            { label: "Stops auto-dispute analysis", icon: ScaleIcon, active: !systemStatus.isShutdown },
            { label: "Stops auto-ticket routing", icon: MessageSquare, active: !systemStatus.isShutdown },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
              <item.icon className={`w-4 h-4 ${item.active ? "text-nx-emerald" : "text-red-400"}`} />
              <span className={`text-xs ${item.active ? "text-white/60" : "text-red-400"}`}>{item.label}</span>
              <span className={`ml-auto text-[9px] ${item.active ? "text-nx-emerald" : "text-red-400"}`}>
                {item.active ? "ACTIVE" : "STOPPED"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-white/[0.02]">
          <p className="text-xs text-white/30">
            <strong className="text-white/50">Continues operating:</strong> Login, payments, escrow, orders, product browsing, wallet, M-Pesa — all normal app functions work. Only AI automation stops.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── LOADING STATE ───

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-nx-cyan animate-spin" />
    </div>
  );
}
