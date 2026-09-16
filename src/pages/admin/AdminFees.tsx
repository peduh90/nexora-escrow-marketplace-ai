import { useMemo, useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import {
  Percent, Calculator, History, TrendingUp, Plus, Save, ToggleLeft, ToggleRight,
  Loader2, ShieldCheck, Landmark, Layers, BadgeCheck, AlertTriangle, Users,
  Banknote, ArrowUpRight, CheckCircle2, XCircle, Phone, Building2, Lock, Clock, Zap,
} from "lucide-react";

/**
 * ─── PLATFORM FEES & COMMISSIONS — control center ──────────────────────────
 * Under Money. The owner configures every fee the platform charges: who pays,
 * percentage vs fixed, tiered thresholds, caps, effective dates, active state.
 * A live calculator previews any amount against the CURRENT rule; a full
 * transaction breakdown shows exactly what buyer and seller each carry.
 * History is immutable — every change records who, what and when, and fee
 * snapshots mean completed transactions are never repriced.
 */

const MARKETPLACES = [
  { id: "product", label: "Marketplace", tint: "text-nx-violet bg-nx-violet/10 border-nx-violet/30" },
  { id: "freelance", label: "Freelance", tint: "text-cyan-300 bg-cyan-400/10 border-cyan-400/30" },
  { id: "services", label: "Services", tint: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30" },
  { id: "transport", label: "Transport", tint: "text-amber-300 bg-amber-400/10 border-amber-400/30" },
] as const;

const FEE_TYPES = [
  { id: "seller_commission", label: "Seller / Provider / Freelancer Commission", payer: "seller" },
  { id: "buyer_protection", label: "Buyer / Employer Protection Fee", payer: "buyer" },
] as const;

type Tier = { min: string; max: string; rate: string; fixed: string };

const emptyTier: Tier = { min: "", max: "", rate: "", fixed: "" };

const pct = (r?: number | null) => (r == null ? "—" : `${(r * 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`);
const kes = (n: number | null | undefined) => (n == null ? "—" : `KES ${(n || 0).toLocaleString()}`);
const dt = (t?: number) => (t ? new Date(t).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export default function AdminFees() {
  const rules = useQuery(api.feeRules.listRules);
  const history = useQuery(api.feeRules.listRulesHistory, {});
  const summary = useQuery(api.feeRules.earningsSummary, {});
  const recent = useQuery(api.feeRules.listEarnings, { limit: 25 });

  const upsertRule = useMutation(api.feeRules.upsertRule);
  const setRuleActive = useMutation(api.feeRules.setRuleActive);
  const seedDefaults = useMutation(api.feeRules.seedDefaultRules);
  const [seeding, setSeeding] = useState(false);

  // Deep-link support: /admin/fees?tab=payouts jumps straight to withdrawals
  // (linked from Revenue Analytics and the Money overview).
  const [searchParams, setSearchParams] = useSearchParams();
  type FeeTab = "rules" | "calculator" | "earnings" | "payouts" | "history";
  const urlTab = searchParams.get("tab") as FeeTab | null;
  const [tab, setTab] = useState<FeeTab>(
    urlTab && ["rules", "calculator", "earnings", "payouts", "history"].includes(urlTab) ? urlTab : "rules",
  );
  const switchTab = (t: "rules" | "calculator" | "earnings" | "payouts" | "history") => {
    setTab(t);
    setSearchParams(t === "rules" ? {} : { tab: t }, { replace: true });
  };
  const [editorMarketplace, setEditorMarketplace] = useState<string>("product");
  const [editorFeeType, setEditorFeeType] = useState<string>("seller_commission");
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<"percentage" | "fixed">("percentage");
  const [tiers, setTiers] = useState<Tier[]>([{ ...emptyTier }]);
  const [minThreshold, setMinThreshold] = useState("");
  const [maxCap, setMaxCap] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const [calcMarket, setCalcMarket] = useState<string>("product");
  const [calcAmount, setCalcAmount] = useState("5000");
  const [earningsFilter, setEarningsFilter] = useState<string>("all");

  // ── Owner payout state (system earnings → M-Pesa / bank) ──
  const payoutOverview = useQuery(api.feeRules.payoutOverview, {});
  const createPayout = useMutation(api.feeRules.createOwnerPayout);
  const completePayout = useMutation(api.feeRules.completeOwnerPayout);
  const cancelPayout = useMutation(api.feeRules.cancelOwnerPayout);
  const disburseB2C = useAction(api.mpesa.disburseOwnerPayoutB2C as any);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"mpesa" | "bank">("mpesa");
  const [payoutDestination, setPayoutDestination] = useState("");
  const [payoutNote, setPayoutNote] = useState("");
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [completeRefFor, setCompleteRefFor] = useState<string | null>(null);
  const [providerRef, setProviderRef] = useState("");
  const [b2cBusyFor, setB2cBusyFor] = useState<string | null>(null);

  // Live preview (computed in the browser from the rules list — no writes).
  const preview = useMemo(() => {
    const amount = Number(calcAmount) || 0;
    const key = `${calcMarket}.seller_commission`;
    const bKey = `${calcMarket}.buyer_protection`;
    const ruleFor = (k: string) => (rules || []).find((r: any) => r.key === k);
    const eff = (rule: any): { rate: number; fee: number } | null => {
      if (!rule || !rule.active || (rule.effectiveFrom || 0) > Date.now()) return null;
      const tier = (rule.tiers || []).find((t: any) => amount >= t.min && (t.max == null || amount <= t.max)) || (rule.tiers || [])[(rule.tiers || []).length - 1];
      if (!tier) return null;
      const fee = rule.mode === "fixed" ? Math.round(tier.fixed || 0) : Math.round(amount * (tier.rate || 0));
      const capped = rule.maxCap != null ? Math.min(fee, rule.maxCap) : fee;
      const rate = rule.mode === "fixed" ? (amount > 0 ? capped / amount : 0) : tier.rate || 0;
      return { rate, fee: capped };
    };
    const commission = eff(ruleFor(key));
    const protection = eff(ruleFor(bKey));
    return { amount, commission, protection };
  }, [rules, calcMarket, calcAmount]);

  const ruleForEditor = useMemo(
    () => (rules || []).find((r: any) => r.key === `${editorMarketplace}.${editorFeeType}`),
    [rules, editorMarketplace, editorFeeType],
  );

  // Load the existing rule into the editor when the target changes.
  const loadRule = (r: any) => {
    setLabel(r?.label || "");
    setMode(r?.mode || "percentage");
    setTiers(
      r?.tiers?.length
        ? r.tiers.map((t: any) => ({ min: String(t.min ?? ""), max: t.max == null ? "" : String(t.max), rate: t.rate == null ? "" : String(t.rate), fixed: t.fixed == null ? "" : String(t.fixed) }))
        : [{ ...emptyTier }],
    );
    setMinThreshold(r?.minThreshold != null ? String(r.minThreshold) : "");
    setMaxCap(r?.maxCap != null ? String(r.maxCap) : "");
    setEffectiveFrom(r?.effectiveFrom ? new Date(r.effectiveFrom).toISOString().slice(0, 10) : "");
    setNote("");
  };

  const pickEditorTarget = (m: string, f: string) => {
    setEditorMarketplace(m);
    setEditorFeeType(f);
    loadRule((rules || []).find((r: any) => r.key === `${m}.${f}`));
  };

  const saveRule = async () => {
    setBusy(true);
    try {
      const parsedTiers = tiers.map((t) => ({
        min: Number(t.min),
        max: t.max === "" ? undefined : Number(t.max),
        rate: mode === "percentage" ? Number(t.rate) : undefined,
        fixed: mode === "fixed" ? Number(t.fixed) : undefined,
      }));
      await upsertRule({
        marketplace: editorMarketplace,
        feeType: editorFeeType,
        label: label.trim() || FEE_TYPES.find((f) => f.id === editorFeeType)!.label,
        payer: FEE_TYPES.find((f) => f.id === editorFeeType)!.payer as "seller" | "buyer",
        mode,
        tiers: parsedTiers,
        minThreshold: minThreshold === "" ? undefined : Number(minThreshold),
        maxCap: maxCap === "" ? undefined : Number(maxCap),
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom + "T00:00:00").getTime() : undefined,
        active: true,
        note: note.trim() || undefined,
      });
      toast.success("Fee rule saved — applies to NEW transactions only. Existing escrows keep their snapshot.");
      setNote("");
    } catch (e: any) {
      toast.error(e?.message || "Could not save the rule");
    } finally {
      setBusy(false);
    }
  };

  const toggleRule = async (key: string, active: boolean) => {
    try {
      await setRuleActive({ key, active, note: active ? "Re-enabled from control center" : "Paused from control center" });
      toast.success(active ? "Rule activated" : "Rule paused — engine falls back to the documented tiers");
    } catch (e: any) {
      toast.error(e?.message || "Could not update the rule");
    }
  };

  const runSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedDefaults({});
      toast.success(res.created.length ? `Seeded ${res.created.length} default rules` : "All default rules already exist");
    } catch (e: any) {
      toast.error(e?.message || "Could not seed rules");
    } finally {
      setSeeding(false);
    }
  };

  const filteredEarnings = (recent || []).filter((r: any) => earningsFilter === "all" || r.marketplace === earningsFilter);

  const requestPayout = async () => {
    setPayoutBusy(true);
    try {
      await createPayout({
        amount: Number(payoutAmount),
        method: payoutMethod,
        destination: payoutDestination.trim(),
        note: payoutNote.trim() || undefined,
      });
      toast.success("Payout reserved. Complete it once the money has actually been sent.");
      setPayoutAmount("");
      setPayoutNote("");
    } catch (e: any) {
      toast.error(e?.message || "Could not create the payout");
    } finally {
      setPayoutBusy(false);
    }
  };

  const confirmPayout = async (payoutId: string) => {
    setPayoutBusy(true);
    try {
      await completePayout({ payoutId: payoutId as any, providerReference: providerRef.trim() });
      toast.success("Payout marked as sent and reconciled.");
      setCompleteRefFor(null);
      setProviderRef("");
    } catch (e: any) {
      toast.error(e?.message || "Could not complete the payout");
    } finally {
      setPayoutBusy(false);
    }
  };

  const sendB2C = async (payoutId: string) => {
    setB2cBusyFor(payoutId);
    try {
      const res = await disburseB2C({ payoutId: payoutId as any });
      toast.success(res.message || "B2C accepted by Safaricom");
    } catch (e: any) {
      toast.error(e?.message || "Could not send the B2C payout");
    } finally {
      setB2cBusyFor(null);
    }
  };

  const summaryMarket = (summary as any)?.byMarketplace ?? [];
  const sp30 = (summary as any)?.byDay ?? [];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-nx-gold/15 border border-nx-gold/25 flex items-center justify-center"><Percent className="w-5 h-5 text-nx-gold" /></span>
            Platform Fees & Commissions
          </h1>
          <p className="text-white/40 text-sm mt-1.5 max-w-2xl">
            Configure every fee Nexora charges — marketplace, freelance, services and transport.
            Rules apply to <span className="text-white/70 font-medium">new transactions only</span>; completed escrows keep their original snapshot, always.
          </p>
        </div>
        <button
          onClick={runSeed}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.07] transition-colors"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
          Seed documented tier schedule
        </button>
      </div>

      {/* KPI strip — fees that have actually ACCUMULATED */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { l: "Total fee earnings", v: kes((summary as any)?.total ?? 0), i: TrendingUp, tint: "text-emerald-300 bg-emerald-400/10" },
          { l: "Commissions collected", v: kes((summary as any)?.commissions ?? 0), i: Percent, tint: "text-nx-gold bg-nx-gold/10" },
          { l: "Protection fees collected", v: kes((summary as any)?.protections ?? 0), i: ShieldCheck, tint: "text-cyan-300 bg-cyan-400/10" },
          { l: "Ledger entries", v: String((summary as any)?.count ?? 0), i: Layers, tint: "text-white bg-white/10" },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-white/40 uppercase tracking-wide">{k.l}</p>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.tint}`}><k.i className="w-4 h-4" /></span>
            </div>
            <p className="text-xl font-bold text-white mt-2">{k.v}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/5 w-fit mb-6">
        {([
          ["rules", "Fee rules", Layers],
          ["calculator", "Calculator & breakdown", Calculator],
          ["earnings", "Earnings ledger", TrendingUp],
          ["payouts", "Owner payouts", Banknote],
          ["history", "Change history", History],
        ] as const).map(([id, lbl, Icon]) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab === id ? "bg-nx-gold/15 text-nx-gold" : "text-white/40 hover:text-white/70"}`}
          >
            <Icon className="w-3.5 h-3.5" /> {lbl}
          </button>
        ))}
      </div>

      {/* ── RULES ── */}
      {tab === "rules" && (
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          {/* Editor */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Plus className="w-4 h-4 text-nx-gold" /> Create / edit a fee rule</h2>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-wide text-white/40">Marketplace</span>
                <select value={editorMarketplace} onChange={(e) => pickEditorTarget(e.target.value, editorFeeType)} className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white [&>option]:bg-[#0B0B14]">
                  {MARKETPLACES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wide text-white/40">Fee type</span>
                <select value={editorFeeType} onChange={(e) => pickEditorTarget(editorMarketplace, e.target.value)} className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white [&>option]:bg-[#0B0B14]">
                  {FEE_TYPES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </label>
            </div>
            {ruleForEditor && (
              <div className="flex items-center justify-between rounded-xl bg-nx-gold/5 border border-nx-gold/20 px-3 py-2 mb-4">
                <p className="text-[11px] text-white/60">Editing existing rule · last updated {dt(ruleForEditor.updatedAt || ruleForEditor.createdAt)}</p>
                <button onClick={() => toggleRule(ruleForEditor.key, !ruleForEditor.active)} className={`flex items-center gap-1.5 text-xs font-semibold ${ruleForEditor.active ? "text-emerald-300" : "text-white/40"}`}>
                  {ruleForEditor.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />} {ruleForEditor.active ? "Active" : "Paused"}
                </button>
              </div>
            )}
            <label className="block mb-3">
              <span className="text-[10px] uppercase tracking-wide text-white/40">Rule label</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={FEE_TYPES.find((f) => f.id === editorFeeType)!.label} className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25" />
            </label>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-wide text-white/40">Fee mode</span>
                <select value={mode} onChange={(e) => setMode(e.target.value as "percentage" | "fixed")} className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white [&>option]:bg-[#0B0B14]">
                  <option value="percentage">Percentage of amount</option>
                  <option value="fixed">Fixed KES amount</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wide text-white/40">Effective from</span>
                <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white" />
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-wide text-white/40">Min threshold (below: no fee)</span>
                <input type="number" value={minThreshold} onChange={(e) => setMinThreshold(e.target.value)} placeholder="e.g. 100" className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wide text-white/40">Max cap (KES)</span>
                <input type="number" value={maxCap} onChange={(e) => setMaxCap(e.target.value)} placeholder="e.g. 5000" className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25" />
              </label>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide text-white/40">
                  Tiers — {mode === "percentage" ? "rate is a % (enter 2.5 for 2.5%)" : "fixed KES per tier"}
                </span>
                <button onClick={() => setTiers((t) => [...t, { ...emptyTier }])} className="text-[11px] text-nx-gold hover:underline">+ Add tier</button>
              </div>
              {tiers.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <input type="number" value={t.min} onChange={(e) => setTiers((arr) => arr.map((x, j) => (j === i ? { ...x, min: e.target.value } : x)))} placeholder="From KES" className="rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-white/25" />
                  <input type="number" value={t.max} onChange={(e) => setTiers((arr) => arr.map((x, j) => (j === i ? { ...x, max: e.target.value } : x)))} placeholder="To (blank = ∞)" className="rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-white/25" />
                  <input type="number" step="0.01" value={mode === "percentage" ? t.rate : t.fixed} onChange={(e) => setTiers((arr) => arr.map((x, j) => (j === i ? { ...x, [mode === "percentage" ? "rate" : "fixed"]: e.target.value } : x)))} placeholder={mode === "percentage" ? "e.g. 2.5" : "e.g. 50"} className="rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-white/25" />
                  {tiers.length > 1 && (
                    <button onClick={() => setTiers((arr) => arr.filter((_, j) => j !== i))} className="text-white/25 hover:text-red-400 text-xs px-1" title="Remove tier">✕</button>
                  )}
                </div>
              ))}
            </div>

            <label className="block mb-4">
              <span className="text-[10px] uppercase tracking-wide text-white/40">Change note (recorded in history)</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Q3 promo: reduced commission for new sellers" className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25" />
            </label>
            <button onClick={saveRule} disabled={busy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-nx-gold text-black text-sm font-bold hover:bg-nx-gold/85 transition-colors disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save rule (applies to new transactions)
            </button>
          </div>

          {/* Active rules list */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><BadgeCheck className="w-4 h-4 text-emerald-300" /> Active fee rules</h2>
            {rules === undefined ? (
              <p className="text-white/30 text-sm py-6 text-center"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</p>
            ) : rules.length === 0 ? (
              <p className="text-white/40 text-sm py-6 text-center">No rules configured — the engine uses the documented tier schedule. Seed defaults above.</p>
            ) : (
              <div className="space-y-2.5">
                {rules.map((r: any) => {
                  const mp = MARKETPLACES.find((m) => m.id === r.marketplace);
                  return (
                    <div key={r.key} className="rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${mp?.tint}`}>{mp?.label || r.marketplace}</span>
                            <p className="text-sm font-semibold text-white truncate">{r.label}</p>
                          </div>
                          <p className="text-[11px] text-white/40 mt-1">
                            {r.mode === "fixed" ? "Fixed" : "Percentage"} · paid by {r.payer} · {r.tiers.length} tier{r.tiers.length > 1 ? "s" : ""}
                            {r.minThreshold != null ? ` · under ${kes(r.minThreshold)} free` : ""}
                            {r.maxCap != null ? ` · capped at ${kes(r.maxCap)}` : ""}
                          </p>
                          <p className="text-[10px] text-white/25 mt-0.5">Effective {dt(r.effectiveFrom)} · by {r.createdByName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button onClick={() => toggleRule(r.key, !r.active)} className={`text-xs font-semibold ${r.active ? "text-emerald-300" : "text-white/35"}`}>
                            {r.active ? "● Active" : "○ Paused"}
                          </button>
                          <button onClick={() => pickEditorTarget(r.marketplace, r.feeType)} className="text-[11px] text-nx-violet hover:underline">Edit</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {r.tiers.map((t: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[10px] text-white/55">
                            {kes(t.min)}–{t.max == null ? "∞" : kes(t.max)}: <span className="text-white font-semibold">{r.mode === "fixed" ? kes(t.fixed) : pct(t.rate)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CALCULATOR ── */}
      {tab === "calculator" && (
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Calculator className="w-4 h-4 text-nx-gold" /> Fee calculator</h2>
            <label className="block mb-3">
              <span className="text-[10px] uppercase tracking-wide text-white/40">Marketplace</span>
              <select value={calcMarket} onChange={(e) => setCalcMarket(e.target.value)} className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white [&>option]:bg-[#0B0B14]">
                {MARKETPLACES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
            <label className="block mb-4">
              <span className="text-[10px] uppercase tracking-wide text-white/40">Transaction amount (KES)</span>
              <input type="number" value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white" />
            </label>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-2.5">
              <div className="flex justify-between text-sm"><span className="text-white/50">Listing / job amount</span><span className="text-white font-semibold">{kes(preview.amount)}</span></div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Seller commission {preview.commission ? `(${pct(preview.commission.rate)})` : ""}</span>
                <span className="text-amber-300 font-semibold">− {kes(preview.commission?.fee ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Buyer protection {preview.protection ? `(${pct(preview.protection.rate)})` : ""}</span>
                <span className="text-cyan-300 font-semibold">+ {kes(preview.protection?.fee ?? 0)}</span>
              </div>
              <div className="border-t border-white/5 pt-2.5 flex justify-between">
                <span className="text-white/70 text-sm font-medium">Buyer pays total</span>
                <span className="text-white font-bold">{kes(preview.amount + (preview.protection?.fee ?? 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70 text-sm font-medium">Seller receives</span>
                <span className="text-emerald-300 font-bold">{kes(preview.amount - (preview.commission?.fee ?? 0))}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-nx-gold/10 px-3 py-2">
                <span className="text-nx-gold text-sm font-semibold">Nexora earns on this transaction</span>
                <span className="text-nx-gold font-bold">{kes((preview.commission?.fee ?? 0) + (preview.protection?.fee ?? 0))}</span>
              </div>
            </div>
            {preview.commission == null && preview.protection == null && (
              <p className="flex items-start gap-2 text-[11px] text-amber-300/80 mt-3"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> No active admin rule for this marketplace — the engine falls back to the documented tier schedule. The preview above shows only configured rules.</p>
            )}
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><ShieldCheck className="w-4 h-4 text-cyan-300" /> Complete transaction breakdown</h2>
            <div className="space-y-2.5 text-sm">
              {[
                { n: "1. Buyer opens checkout", d: `Amount ${kes(preview.amount)}. Buyer protection fee is computed from the CURRENT active rule at that moment.` },
                { n: "2. Buyer pays into escrow", d: `Escrow holds ${kes(preview.amount + (preview.protection?.fee ?? 0))} = amount + protection. The protection fee is logged to the earnings ledger immediately.` },
                { n: "3. Delivery & inspection", d: "AI monitors the transaction through delivery and the 7-day inspection window." },
                { n: "4. Buyer approves (or auto-release)", d: `Seller receives ${kes(preview.amount - (preview.commission?.fee ?? 0))} — amount minus commission. The commission is logged to the earnings ledger at release.` },
                { n: "5. Fees are permanent", d: "Both fee amounts were snapshotted onto the escrow at creation. Editing rules later can never reprice this transaction." },
              ].map((s) => (
                <div key={s.n} className="flex gap-3 rounded-xl bg-white/[0.03] border border-white/5 p-3.5">
                  <span className="w-6 h-6 rounded-full bg-nx-gold/15 text-nx-gold text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n.slice(0, 1)}</span>
                  <div>
                    <p className="text-white font-medium text-[13px]">{s.n.slice(3)}</p>
                    <p className="text-white/45 text-xs mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── EARNINGS LEDGER ── */}
      {tab === "earnings" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {summaryMarket.map((m: any) => {
              const mp = MARKETPLACES.find((x) => x.id === m.marketplace);
              return (
                <div key={m.marketplace} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${mp?.tint}`}>{mp?.label || m.marketplace}</span>
                  <p className="text-lg font-bold text-white mt-2">{kes(m.total)}</p>
                  <p className="text-[10px] text-white/35">accumulated fees</p>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-300" /> Recent fee collections</h2>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setEarningsFilter("all")} className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${earningsFilter === "all" ? "border-nx-gold/40 bg-nx-gold/10 text-nx-gold" : "border-white/10 text-white/40"}`}>All</button>
                {MARKETPLACES.map((m) => (
                  <button key={m.id} onClick={() => setEarningsFilter(m.id)} className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${earningsFilter === m.id ? m.tint : "border-white/10 text-white/40"}`}>{m.label}</button>
                ))}
              </div>
            </div>
            {recent === undefined ? (
              <p className="text-white/30 text-sm py-6 text-center"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</p>
            ) : filteredEarnings.length === 0 ? (
              <p className="text-white/40 text-sm py-6 text-center">No fee collections yet — earnings appear here the moment transactions fund or release.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/30 uppercase tracking-wide text-[10px] border-b border-white/5">
                      <th className="text-left py-2 pr-3">When</th><th className="text-left py-2 pr-3">Source</th><th className="text-left py-2 pr-3">Fee</th>
                      <th className="text-right py-2 pr-3">Base</th><th className="text-right py-2 pr-3">Earned</th><th className="text-right py-2">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEarnings.map((r: any) => (
                      <tr key={r._id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-2 pr-3 text-white/45 whitespace-nowrap">{dt(r.createdAt)}</td>
                        <td className="py-2 pr-3 text-white/70 max-w-[260px] truncate">{r.description || r.sourceType}</td>
                        <td className="py-2 pr-3"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${r.feeType === "seller_commission" ? "bg-amber-400/10 text-amber-300" : "bg-cyan-400/10 text-cyan-300"}`}>{r.feeType === "seller_commission" ? "Commission" : "Protection"}</span></td>
                        <td className="py-2 pr-3 text-right text-white/50">{kes(r.baseAmount)}</td>
                        <td className="py-2 pr-3 text-right text-nx-gold font-bold">{kes(r.amount)}</td>
                        <td className="py-2 text-right text-white/40">{r.ruleRate != null ? pct(r.ruleRate) : "tier"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── OWNER PAYOUTS (system earnings → M-Pesa / bank) ── */}
      {tab === "payouts" && (
        <div className="space-y-5">
          {/* Balance cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { l: "Fees earned (all time)", v: kes((payoutOverview as any)?.totalEarned ?? 0), i: TrendingUp, tint: "text-emerald-300 bg-emerald-400/10" },
              { l: "Available to withdraw", v: kes((payoutOverview as any)?.available ?? 0), i: Banknote, tint: "text-nx-gold bg-nx-gold/10" },
              { l: "Paid out to M-Pesa / bank", v: kes((payoutOverview as any)?.paidOut ?? 0), i: CheckCircle2, tint: "text-cyan-300 bg-cyan-400/10" },
              { l: "Reserved (pending/processing)", v: kes(((payoutOverview as any)?.pendingAmount ?? 0) + ((payoutOverview as any)?.processingAmount ?? 0)), i: Clock, tint: "text-amber-300 bg-amber-400/10" },
            ].map((k) => (
              <div key={k.l} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-white/40 uppercase tracking-wide">{k.l}</p>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.tint}`}><k.i className="w-4 h-4" /></span>
                </div>
                <p className="text-xl font-bold text-white mt-2">{k.v}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5 items-start">
            {/* Request form */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Banknote className="w-4 h-4 text-nx-gold" /> Withdraw system earnings
              </h2>
              <p className="text-[11px] text-white/35 mb-4">
                Pay the platform's accumulated fees to your own M-Pesa or bank account.
                You confirm the money actually left — with the M-Pesa receipt or bank reference — before it counts as paid.
              </p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setPayoutMethod("mpesa")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                    payoutMethod === "mpesa" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  <Phone className="w-4 h-4" /> M-Pesa
                </button>
                <button
                  onClick={() => setPayoutMethod("bank")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                    payoutMethod === "bank" ? "border-nx-violet/40 bg-nx-violet/10 text-nx-violet" : "border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  <Building2 className="w-4 h-4" /> Bank transfer
                </button>
              </div>
              <label className="block mb-3">
                <span className="text-[10px] uppercase tracking-wide text-white/40">
                  {payoutMethod === "mpesa" ? "M-Pesa number" : "Bank account (bank · account name · no.)"}
                </span>
                <input
                  value={payoutDestination}
                  onChange={(e) => setPayoutDestination(e.target.value)}
                  placeholder={payoutMethod === "mpesa" ? "0712 345 678" : "Equity · NEXORA LTD · 1234567890"}
                  className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25"
                />
              </label>
              <label className="block mb-3">
                <span className="text-[10px] uppercase tracking-wide text-white/40">Amount (KES) — available: {kes((payoutOverview as any)?.available ?? 0)}</span>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25"
                />
              </label>
              <label className="block mb-4">
                <span className="text-[10px] uppercase tracking-wide text-white/40">Note (optional)</span>
                <input
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  placeholder="e.g. Weekly sweep to operations account"
                  className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25"
                />
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPayoutAmount(String(Math.floor((payoutOverview as any)?.available ?? 0)));
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-medium text-white/60 hover:text-white transition-colors"
                >
                  Withdraw all available
                </button>
                <button
                  onClick={requestPayout}
                  disabled={payoutBusy || !payoutAmount || Number(payoutAmount) <= 0 || !payoutDestination.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-nx-gold text-black text-sm font-bold hover:bg-nx-gold/85 transition-colors disabled:opacity-50"
                >
                  {payoutBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                  Request payout
                </button>
              </div>
            </div>

            {/* Payout history */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Landmark className="w-4 h-4 text-cyan-300" /> Payout history</h2>
              {payoutOverview === undefined ? (
                <p className="text-white/30 text-sm py-6 text-center"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</p>
              ) : !(payoutOverview as any)?.recent?.length ? (
                <p className="text-white/40 text-sm py-6 text-center">No payouts yet. Your first withdrawal appears here with its M-Pesa/bank reference.</p>
              ) : (
                <div className="space-y-2">
                  {(payoutOverview as any).recent.map((p: any) => (
                    <div key={p._id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-white">{kes(p.amount)}</p>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              p.status === "completed" ? "bg-emerald-400/10 text-emerald-300" :
                              p.status === "rejected" || p.status === "failed" ? "bg-red-400/10 text-red-300" :
                              "bg-amber-400/10 text-amber-300"
                            }`}>{p.status}</span>
                            <span className="text-[10px] text-white/40">via {p.method === "mpesa" ? "M-Pesa" : "Bank"}</span>
                          </div>
                          <p className="text-[11px] text-white/40 mt-0.5 truncate">
                            {p.method === "mpesa" ? <Phone className="w-3 h-3 inline mr-1 -mt-0.5" /> : <Building2 className="w-3 h-3 inline mr-1 -mt-0.5" />}
                            {p.destination}
                          </p>
                          {p.providerReference && (
                            <p className="text-[10px] text-white/30 mt-0.5">
                              Ref: <span className="text-white/60 font-medium">{p.providerReference}</span>
                              {p.sentViaB2C && <span className="ml-1.5 text-emerald-300/80">· M-Pesa B2C ✓</span>}
                            </p>
                          )}
                          {p.status === "failed" && p.sentViaB2C && p.resultDesc && (
                            <p className="text-[10px] text-red-300/70 mt-0.5">M-Pesa said: {p.resultDesc}</p>
                          )}
                          {p.failReason && <p className="text-[10px] text-red-300/70 mt-0.5">{p.failReason}</p>}
                          <p className="text-[10px] text-white/25 mt-0.5">
                            Requested {dt(p.createdAt)} by {p.createdByName}
                            {p.completedAt ? ` · completed ${dt(p.completedAt)}` : ""}
                          </p>
                        </div>
                        {p.status !== "completed" && p.status !== "rejected" && p.status !== "failed" && (
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {p.method === "mpesa" && p.status === "pending" && (
                              <button
                                onClick={() => sendB2C(p._id)}
                                disabled={b2cBusyFor === p._id || payoutBusy}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                              >
                                {b2cBusyFor === p._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                Send via M-Pesa B2C
                              </button>
                            )}
                            {p.status === "processing" && (
                              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/10 text-[10px] font-semibold text-amber-300">
                                <Loader2 className="w-3 h-3 animate-spin" /> Awaiting M-Pesa confirmation…
                              </span>
                            )}
                            <button
                              onClick={() => { setCompleteRefFor(p._id); setProviderRef(""); }}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-[10px] font-semibold text-white/60 hover:text-white hover:bg-white/[0.08]"
                            >
                              {p.method === "mpesa" ? "Mark as sent manually" : "Mark as sent"}
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await cancelPayout({ payoutId: p._id, reason: "Cancelled from payout center" });
                                  toast.success("Payout cancelled — amount released back to available");
                                } catch (e: any) {
                                  toast.error(e?.message || "Could not cancel");
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-[10px] text-white/40 hover:text-white/70"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      {completeRefFor === p._id && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
                          <input
                            value={providerRef}
                            onChange={(e) => setProviderRef(e.target.value)}
                            placeholder={p.method === "mpesa" ? "M-Pesa receipt e.g. SJ71HK2LMN" : "Bank transaction reference"}
                            className="flex-1 min-w-[180px] rounded-lg bg-white/[0.04] border border-white/10 px-3 py-1.5 text-xs text-white placeholder:text-white/25"
                          />
                          <button
                            onClick={() => confirmPayout(p._id)}
                            disabled={!providerRef.trim() || payoutBusy}
                            className="px-3 py-1.5 rounded-lg bg-emerald-400 text-black text-xs font-bold hover:bg-emerald-300 disabled:opacity-50"
                          >
                            Confirm sent
                          </button>
                          <button onClick={() => setCompleteRefFor(null)} className="text-[11px] text-white/30 hover:text-white/60">Cancel</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><Lock className="w-4 h-4 text-white/40" /> How owner payouts work</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { n: "1. Real balance", d: "Available = every fee actually collected (commission + protection) minus every payout already sent or reserved. Nothing virtual." },
                { n: "2. Reserved on request", d: "Requesting locks the amount so two payouts can never claim the same fees. Cancel any time before it's sent." },
                { n: "3. Auto-send with M-Pesa B2C", d: "One tap sends the money from the paybill to your M-Pesa. Safaricom's result callback completes the payout with the real TransactionID — no typing receipts." },
                { n: "4. Or confirm manually", d: "Bank transfers (or B2C without callbacks configured): send yourself, paste the M-Pesa receipt or bank reference, and it's reconciled permanently." },
              ].map((s) => (
                <div key={s.n} className="flex gap-3 rounded-xl bg-white/[0.03] border border-white/5 p-3.5">
                  <span className="w-6 h-6 rounded-full bg-nx-gold/15 text-nx-gold text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n.slice(0, 1)}</span>
                  <div>
                    <p className="text-white font-medium text-[13px]">{s.n.slice(3)}</p>
                    <p className="text-white/45 text-xs mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === "history" && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1"><History className="w-4 h-4 text-nx-violet" /> Fee rule change history</h2>
          <p className="text-[11px] text-white/35 mb-4">Immutable audit trail — every create, update, activation and pause with admin identity and timestamp. Historical records are never edited.</p>
          {history === undefined ? (
            <p className="text-white/30 text-sm py-6 text-center"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-white/40 text-sm py-6 text-center">No changes yet. Saving your first rule starts the trail.</p>
          ) : (
            <div className="space-y-2">
              {[...history].sort((a: any, b: any) => b.at - a.at).map((h: any) => (
                <div key={h._id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${h.action === "created" ? "bg-emerald-400/10 text-emerald-300" : h.action === "updated" ? "bg-nx-violet/15 text-nx-violet" : h.action === "activated" ? "bg-cyan-400/10 text-cyan-300" : "bg-amber-400/10 text-amber-300"}`}>{h.action}</span>
                  <span className="text-xs text-white font-medium">{h.ruleKey}</span>
                  <span className="text-[11px] text-white/40">by {h.adminName}</span>
                  {h.note && <span className="text-[11px] text-white/50 italic">“{h.note}”</span>}
                  <span className="ml-auto text-[10px] text-white/30 whitespace-nowrap">{dt(h.at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
