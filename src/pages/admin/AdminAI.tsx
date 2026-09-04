import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import {
  Brain, Shield, MessageSquare, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, Users, FileText, Zap, Eye, Settings,
  BarChart3, RefreshCw, Search, ChevronDown, X, Loader2,
  Bot, Target, Activity, BookOpen, Flag, XCircle, ArrowUpRight,
  ArrowDownRight, Minus,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// NEXORA AI CONTROL CENTER — Admin Dashboard
// ═══════════════════════════════════════════════════════════════

type Tab = "overview" | "tickets" | "knowledge" | "fraud" | "audit" | "metrics";

export default function AdminAI() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nx-cyan/20 to-nx-violet/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-nx-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Operations Center</h1>
            <p className="text-sm text-white/40">Intelligent automation & operations management</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {([
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "tickets", label: "Support Tickets", icon: MessageSquare },
          { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
          { id: "fraud", label: "Fraud Alerts", icon: Shield },
          { id: "audit", label: "AI Audit Log", icon: FileText },
          { id: "metrics", label: "Metrics", icon: TrendingUp },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? "bg-nx-cyan/10 text-nx-cyan border border-nx-cyan/20"
                : "text-white/30 hover:text-white/60 bg-white/[0.02]"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <AIOverview />}
      {tab === "tickets" && <AITickets />}
      {tab === "knowledge" && <AIKnowledgeBase />}
      {tab === "fraud" && <AIFraudAlerts />}
      {tab === "audit" && <AIAuditLog />}
      {tab === "metrics" && <AIMetrics />}
    </AdminLayout>
  );
}

// ─── OVERVIEW ───

function AIOverview() {
  const briefData = useQuery(api.aiOps.getDailyBriefData);
  const metrics = useQuery(api.aiOps.getTodayMetrics);
  const tickets = useQuery(api.aiOps.getAllTickets, {});
  const fraudAlerts = useQuery(api.aiOps.getFraudAlerts, {});

  if (!briefData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-nx-cyan animate-spin" />
      </div>
    );
  }

  const automationRate = metrics?.automationRate || briefData.aiOperations.automationRate || 0;
  const qualityScore = metrics?.qualityScore || briefData.aiOperations.qualityScore || 0;

  // Workload reduction metric
  const totalRoutine = briefData.aiOperations.totalConversations || 1;
  const aiHandled = briefData.aiOperations.aiResolved || 0;
  const workloadReduction = Math.round((aiHandled / totalRoutine) * 100) || 0;

  return (
    <div className="space-y-6">
      {/* System Status Banner */}
      <div className="p-5 rounded-xl border border-nx-emerald/10 bg-nx-emerald/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-nx-emerald/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-nx-emerald" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-nx-emerald">AI System: Operational</h3>
            <p className="text-sm text-white/40">
              {briefData.aiOperations.totalConversations} interactions today • {workloadReduction}% automation rate
            </p>
          </div>
        </div>
      </div>

      {/* Core AI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Automation Rate", value: `${automationRate.toFixed(1)}%`, icon: Zap, color: "#10B981", target: "75-80%" },
          { label: "Quality Score", value: `${qualityScore.toFixed(1)}%`, icon: Target, color: "#8B5CF6", target: "90%+" },
          { label: "AI Resolved", value: String(briefData.aiOperations.aiResolved || 0), icon: CheckCircle2, color: "#06B6D4", target: "Daily" },
          { label: "Human Escalations", value: String(briefData.aiOperations.humanEscalated || 0), icon: Users, color: "#F59E0B", target: "Minimize" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-[10px] text-white/30 uppercase">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-white/20 mt-1">Target: {s.target}</p>
          </div>
        ))}
      </div>

      {/* Marketplace + Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Marketplace */}
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-nx-violet" />
            Marketplace
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Active Sellers", value: briefData.marketplace.activeSellers },
              { label: "Active Products", value: briefData.marketplace.activeProducts },
              { label: "Today's Orders", value: briefData.marketplace.todayOrders },
              { label: "Total Orders", value: briefData.marketplace.totalOrders },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-[10px] text-white/30">{s.label}</p>
                <p className="text-lg font-bold text-white mt-1">{s.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Operations */}
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-nx-cyan" />
            AI Operations
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Conversations", value: briefData.aiOperations.totalConversations },
              { label: "AI Resolved", value: briefData.aiOperations.aiResolved },
              { label: "Escalated", value: briefData.aiOperations.humanEscalated },
              { label: "Automation %", value: `${automationRate.toFixed(1)}%` },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-[10px] text-white/30">{s.label}</p>
                <p className="text-lg font-bold text-white mt-1">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* KYC */}
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            KYC
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Pending Review</span>
              <span className="text-amber-400 font-medium">{briefData.kyc.pending}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Submitted Today</span>
              <span className="text-white/60 font-medium">{briefData.kyc.todaySubmitted}</span>
            </div>
          </div>
        </div>

        {/* Fraud */}
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            Fraud Alerts
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">New Alerts</span>
              <span className="text-red-400 font-medium">{briefData.fraud.newAlerts}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Critical</span>
              <span className="text-red-400 font-medium">{briefData.fraud.critical}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">High Risk</span>
              <span className="text-amber-400 font-medium">{briefData.fraud.highRisk}</span>
            </div>
          </div>
        </div>

        {/* Disputes & Support */}
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-nx-violet" />
            Disputes & Support
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Open Tickets</span>
              <span className="text-nx-violet font-medium">{briefData.support.openTickets}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Escalated</span>
              <span className="text-red-400 font-medium">{briefData.support.escalated}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Open Disputes</span>
              <span className="text-amber-400 font-medium">{briefData.disputes.open}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">High-Value</span>
              <span className="text-red-400 font-medium">{briefData.disputes.highValue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUPPORT TICKETS ───

function AITickets() {
  const [filter, setFilter] = useState<string>("all");
  const tickets = useQuery(api.aiOps.getAllTickets, {});

  if (!tickets) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-nx-cyan animate-spin" />
      </div>
    );
  }

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  const statusColors: Record<string, string> = {
    open: "bg-blue-400/10 text-blue-400",
    ai_handling: "bg-nx-cyan/10 text-nx-cyan",
    ai_resolved: "bg-nx-emerald/10 text-nx-emerald",
    escalated: "bg-red-400/10 text-red-400",
    human_review: "bg-amber-400/10 text-amber-400",
    resolved: "bg-nx-emerald/10 text-nx-emerald",
    closed: "bg-white/5 text-white/30",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-white/5 text-white/30",
    medium: "bg-blue-400/10 text-blue-400",
    high: "bg-amber-400/10 text-amber-400",
    critical: "bg-red-400/10 text-red-400",
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total", value: tickets.length, color: "text-white" },
          { label: "Open", value: tickets.filter((t) => t.status === "open").length, color: "text-blue-400" },
          { label: "AI Handling", value: tickets.filter((t) => t.status === "ai_handling").length, color: "text-nx-cyan" },
          { label: "Escalated", value: tickets.filter((t) => t.status === "escalated").length, color: "text-red-400" },
          { label: "Resolved", value: tickets.filter((t) => ["resolved", "ai_resolved"].includes(t.status)).length, color: "text-nx-emerald" },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-lg border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", "open", "ai_handling", "escalated", "human_review", "resolved", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
              filter === s ? "bg-nx-cyan/10 text-nx-cyan" : "text-white/30 hover:text-white/50 bg-white/[0.02]"
            }`}
          >
            {s === "all" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 50).map((ticket) => (
            <div
              key={ticket._id}
              className="p-4 rounded-xl border border-white/5 bg-[#0A0A12] hover:bg-white/[0.01] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white truncate">{ticket.subject}</h4>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${statusColors[ticket.status] || "bg-white/5 text-white/30"}`}>
                      {ticket.status.replace(/_/g, " ")}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${priorityColors[ticket.priority] || "bg-white/5 text-white/30"}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-xs text-white/30 mb-1">{ticket.category.replace(/_/g, " ")} • {ticket.userName || ticket.userEmail || ticket.userId}</p>
                  {ticket.aiSummary && (
                    <p className="text-xs text-white/40 line-clamp-2">{ticket.aiSummary}</p>
                  )}
                  {ticket.escalationReason && (
                    <p className="text-xs text-red-400/60 mt-1">⚠ {ticket.escalationReason}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {ticket.aiConfidence !== undefined && ticket.aiConfidence !== null && (
                    <div className="flex items-center gap-1 mb-1">
                      <Bot className="w-3 h-3 text-nx-cyan" />
                      <span className="text-[10px] text-nx-cyan">{Math.round(ticket.aiConfidence * 100)}%</span>
                    </div>
                  )}
                  <p className="text-[10px] text-white/20">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── KNOWLEDGE BASE ───

function AIKnowledgeBase() {
  const articles = useQuery(api.aiOps.getKnowledgeBase, {});
  const upsertArticle = useMutation(api.aiOps.upsertKnowledgeArticle);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "faq",
    content: "",
    tags: "",
    active: true,
  });

  const categories = ["escrow", "payments", "kyc", "seller_rules", "buyer_rules", "delivery", "disputes", "faq", "account", "general"];

  if (!articles) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-nx-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30">{articles.length} articles in knowledge base</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-2 rounded-lg bg-nx-cyan/10 text-nx-cyan text-xs font-medium hover:bg-nx-cyan/20 transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Article"}
        </button>
      </div>

      {showForm && (
        <div className="p-5 rounded-xl border border-nx-cyan/20 bg-[#0A0A12] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Article title..."
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-cyan/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white focus:outline-none focus:border-nx-cyan/30"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Article content..."
              rows={6}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-cyan/30 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Tags (comma separated)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="escrow, payment, how-to..."
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-cyan/30"
            />
          </div>
          <button
            onClick={async () => {
              if (!form.title || !form.content) return;
              await upsertArticle({
                title: form.title,
                category: form.category,
                content: form.content,
                tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
                active: form.active,
              });
              setForm({ title: "", category: "faq", content: "", tags: "", active: true });
              setShowForm(false);
            }}
            disabled={!form.title || !form.content}
            className="px-4 py-2 rounded-lg bg-nx-cyan text-white text-sm font-medium hover:bg-nx-cyan/80 transition-colors disabled:opacity-40"
          >
            Save Article
          </button>
        </div>
      )}

      {articles.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No knowledge base articles yet</p>
          <p className="text-xs text-white/15 mt-1">Add articles to help AI answer customer questions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map((article) => (
            <div key={article._id} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white">{article.title}</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-nx-violet/10 text-nx-violet font-medium">
                      {article.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 line-clamp-2">{article.content}</p>
                  {article.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {article.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-white/20 shrink-0">
                  {new Date(article.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FRAUD ALERTS ───

function AIFraudAlerts() {
  const [filter, setFilter] = useState<string>("all");
  const alerts = useQuery(api.aiOps.getFraudAlerts, {});
  const reviewAlert = useMutation(api.aiOps.reviewFraudAlert);

  if (!alerts) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-nx-cyan animate-spin" />
      </div>
    );
  }

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.status === filter);

  const riskColors: Record<string, string> = {
    low: "text-nx-emerald bg-nx-emerald/10",
    medium: "text-amber-400 bg-amber-400/10",
    high: "text-orange-400 bg-orange-400/10",
    critical: "text-red-400 bg-red-400/10",
  };

  const statusColors: Record<string, string> = {
    new: "text-red-400 bg-red-400/10",
    reviewing: "text-amber-400 bg-amber-400/10",
    confirmed: "text-red-400 bg-red-400/10",
    dismissed: "text-white/30 bg-white/5",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", "new", "reviewing", "confirmed", "dismissed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
              filter === s ? "bg-red-400/10 text-red-400" : "text-white/30 hover:text-white/50 bg-white/[0.02]"
            }`}
          >
            {s === "all" ? `All (${alerts.length})` : `${s} (${alerts.filter((a) => a.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No fraud alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 50).map((alert) => (
            <div key={alert._id} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${riskColors[alert.riskLevel] || ""}`}>
                      {alert.riskLevel.toUpperCase()}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${statusColors[alert.status] || ""}`}>
                      {alert.status}
                    </span>
                    <span className="text-[10px] text-white/20">{alert.entityType}: {alert.entityId.slice(0, 12)}...</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${alert.riskScore}%`,
                          background: alert.riskScore >= 70 ? "#EF4444" : alert.riskScore >= 45 ? "#F59E0B" : "#10B981",
                        }}
                      />
                    </div>
                    <span className="text-xs text-white/40 font-medium">{alert.riskScore}/100</span>
                  </div>
                  <p className="text-xs text-white/40 mb-1">{alert.recommendation}</p>
                  {alert.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {alert.flags.map((flag, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-red-400/5 text-red-400/60">
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {alert.status === "new" && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => reviewAlert({ alertId: alert._id, status: "dismissed" })}
                      className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                      title="Dismiss"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reviewAlert({ alertId: alert._id, status: "reviewing" })}
                      className="p-1.5 rounded text-white/20 hover:text-amber-400 hover:bg-amber-400/5 transition-colors"
                      title="Review"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI AUDIT LOG ───

function AIAuditLog() {
  const logs = useQuery(api.aiOps.getAiAuditLogs, { limit: 100 });

  if (!logs) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-nx-cyan animate-spin" />
      </div>
    );
  }

  const actionColors: Record<string, string> = {
    create_ticket: "text-blue-400 bg-blue-400/10",
    intent_classification: "text-nx-cyan bg-nx-cyan/10",
    auto_resolve: "text-nx-emerald bg-nx-emerald/10",
    escalate: "text-red-400 bg-red-400/10",
    fraud_score: "text-amber-400 bg-amber-400/10",
    moderation_review: "text-nx-violet bg-nx-violet/10",
    kyc_review: "text-blue-400 bg-blue-400/10",
    dispute_analysis: "text-orange-400 bg-orange-400/10",
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/30">{logs.length} audit entries</p>

      {logs.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No audit logs yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="divide-y divide-white/[0.03]">
            {logs.map((log) => (
              <div key={log._id} className="px-5 py-3 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${actionColors[log.action] || "bg-white/5 text-white/30"}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-white/30">{log.entityType}</span>
                  <span className="text-[10px] text-white/20 truncate flex-1">{log.aiDecision}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Bot className="w-3 h-3 text-nx-cyan" />
                    <span className="text-[10px] text-nx-cyan">{Math.round(log.aiConfidence * 100)}%</span>
                  </div>
                  {log.humanOverride && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400">Override</span>
                  )}
                  <span className="text-[10px] text-white/20 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                {log.reasoning && (
                  <p className="text-[11px] text-white/25 mt-1 ml-20">{log.reasoning}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI METRICS ───

function AIMetrics() {
  const todayMetrics = useQuery(api.aiOps.getTodayMetrics);

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-nx-cyan" />
          AI Performance Metrics
        </h3>

        {todayMetrics ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Conversations", value: todayMetrics.totalConversations },
              { label: "AI Resolved", value: todayMetrics.aiResolved },
              { label: "Human Escalated", value: todayMetrics.humanEscalated },
              { label: "AI Assisted", value: todayMetrics.aiAssisted },
              { label: "Automation Rate", value: `${todayMetrics.automationRate.toFixed(1)}%` },
              { label: "Quality Score", value: `${todayMetrics.qualityScore.toFixed(1)}%` },
              { label: "Avg Resolution", value: `${(todayMetrics.avgResolutionTime / 1000).toFixed(1)}s` },
              { label: "Customer Satisfaction", value: `${todayMetrics.customerSatisfaction.toFixed(0)}%` },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-lg bg-white/[0.02]">
                <p className="text-[10px] text-white/30">{m.label}</p>
                <p className="text-lg font-bold text-white mt-1">
                  {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/30">No metrics recorded today yet</p>
            <p className="text-[10px] text-white/15 mt-1">Metrics are recorded as AI processes customer interactions</p>
          </div>
        )}
      </div>

      {/* Target vs Actual */}
      <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
        <h3 className="text-sm font-semibold text-white mb-4">Automation Targets</h3>
        <div className="space-y-4">
          {[
            { label: "Routine Case Automation", target: "75-80%", current: todayMetrics?.automationRate, color: "#10B981" },
            { label: "AI Quality Score", target: "90%+", current: todayMetrics?.qualityScore, color: "#8B5CF6" },
            { label: "Customer Satisfaction", target: "90%+", current: todayMetrics?.customerSatisfaction, color: "#06B6D4" },
            { label: "Hallucination Rate", target: "<2%", current: todayMetrics ? (todayMetrics.hallucinationReports / Math.max(todayMetrics.aiRequests, 1)) * 100 : undefined, color: "#EF4444", invert: true },
          ].map((t) => (
            <div key={t.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60">{t.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30">Target: {t.target}</span>
                  {t.current !== undefined && t.current !== null && (
                    <span className="text-xs font-medium" style={{ color: t.color }}>
                      {t.invert ? `${t.current.toFixed(1)}%` : `${t.current.toFixed(1)}%`}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(t.current || 0, 100)}%`,
                    background: t.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workload Reduction Formula */}
      <div className="p-5 rounded-xl border border-nx-cyan/10 bg-nx-cyan/[0.02]">
        <h3 className="text-sm font-semibold text-nx-cyan mb-3">Workload Reduction Calculation</h3>
        <div className="space-y-2 text-xs text-white/40">
          <p><strong className="text-white/60">AI Automation Rate</strong> = AI-resolved routine cases / Total eligible routine cases × 100</p>
          <p><strong className="text-white/60">Human Workload Reduction</strong> = (Baseline - Current) / Baseline × 100</p>
          <p className="text-white/25 mt-3">Target: 75-80% reduction in routine operational workload. Quality and safety take priority over automation percentage.</p>
        </div>
      </div>
    </div>
  );
}
