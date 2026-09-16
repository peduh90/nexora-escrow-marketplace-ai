import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "../convex/_generated/api";
import { ConvexError } from "convex/values";
import NavigationBar from "@/components/layout/NavigationBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import AIChat from "@/components/AIChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  Sparkles, Send, Loader2, Wallet, Check, Handshake,
  PackageCheck, MapPin, Clock, Users,
} from "lucide-react";

// ═════════════════════════════════════════════════════════════════════════
// NEXORA AI TASKER — one hub, both user sides. Poster side: AI drafts the
// task, offers arrive, escrow funding, approve & release. Tasker side: open
// board, AI-drafted offers, assigned work, submit, get paid.
// ═════════════════════════════════════════════════════════════════════════

const TASK_CATEGORIES = [
  { slug: "errands", name: "Errands & Deliveries", emoji: "🏃" },
  { slug: "research", name: "Research & Summaries", emoji: "📚" },
  { slug: "writing", name: "Writing & Translation", emoji: "✍️" },
  { slug: "design", name: "Design & Media", emoji: "🎨" },
  { slug: "data", name: "Data Entry & Web", emoji: "📊" },
  { slug: "tech", name: "Tech & Setup", emoji: "💻" },
  { slug: "home", name: "Home & Handyman", emoji: "🔧" },
  { slug: "events", name: "Events & Promotion", emoji: "📣" },
  { slug: "other", name: "Other Tasks", emoji: "🧩" },
] as const;

function catOf(slug: string) {
  return TASK_CATEGORIES.find((c) => c.slug === slug) || TASK_CATEGORIES[TASK_CATEGORIES.length - 1];
}

function fmtKes(n: number | null | undefined) {
  return n ? `KES ${n.toLocaleString()}` : "—";
}

function errMsg(e: unknown) {
  if (e instanceof ConvexError) return String(e.data ?? e.message);
  return e instanceof Error ? e.message : "Something went wrong — try again";
}

const STATUS_STYLE: Record<string, string> = {
  open: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  assigned: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  in_progress: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  submitted: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  completed: "bg-white/5 text-white/60 border-white/10",
  cancelled: "bg-red-400/10 text-red-300 border-red-400/20",
  disputed: "bg-red-400/10 text-red-300 border-red-400/20",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status] || "bg-white/5 text-white/50 border-white/10"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

// ─── POSTER SIDE ────────────────────────────────────────────────────────────

function PosterSide() {
  const { user } = useAuth();
  const tasks = useQuery(api.tasks.myPostedTasks);
  const createTask = useMutation(api.tasks.createTask);
  const aiDraft = useAction(api.tasks.aiDraftTask);
  const [showForm, setShowForm] = useState(false);
  const [blurb, setBlurb] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "other", location: "", budgetMin: "", budgetMax: "" });
  const [busy, setBusy] = useState(false);

  const runAiDraft = async () => {
    if (blurb.trim().length < 5) { toast.error("Type what you need done — even one line"); return; }
    setAiBusy(true);
    try {
      const d = await aiDraft({ blurb, location: form.location || undefined });
      setForm((f) => ({ ...f, title: d.title, description: d.description, category: d.category }));
      toast.success("AI drafted your task — review and adjust");
      if (d.budgetHint) toast(d.budgetHint, { icon: "💡" });
    } catch (e) { toast.error(errMsg(e)); } finally { setAiBusy(false); }
  };

  const submit = async () => {
    setBusy(true);
    try {
      await createTask({
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location || undefined,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
      });
      toast.success("Task posted — taskers can now send offers");
      setForm({ title: "", description: "", category: "other", location: "", budgetMin: "", budgetMax: "" });
      setBlurb("");
      setShowForm(false);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      {/* Post bar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-nx-violet" /> What do you need done?</h2>
        <p className="text-white/50 text-sm mt-1">Describe it in English, Kiswahili or Sheng — the AI structures it into a clear task. You pay only when you approve the work.</p>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="mt-4 bg-nx-violet hover:bg-nx-violet/85 text-white font-bold">
            <Sparkles className="w-4 h-4 mr-2" /> Post a Task
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <Input value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="e.g. Nataka mtu anibeani parcel kutoka CBD Kasarani leo" className="bg-white/[0.04] border-white/10 text-white" />
              <Button onClick={runAiDraft} disabled={aiBusy} variant="secondary" className="shrink-0 bg-white/10 hover:bg-white/15 text-white border border-white/10">
                {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1" /> AI Draft</>}
              </Button>
            </div>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" className="bg-white/[0.04] border-white/10 text-white" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full details — what exactly should be done?" rows={3} className="w-full rounded-md bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-nx-violet/50" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-md bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white [&>option]:bg-[#0B0B14]">
                {TASK_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>)}
              </select>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Area / town" className="bg-white/[0.04] border-white/10 text-white" />
              <Input value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} type="number" placeholder="Budget from" className="bg-white/[0.04] border-white/10 text-white" />
              <Input value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} type="number" placeholder="Budget to" className="bg-white/[0.04] border-white/10 text-white" />
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} disabled={busy} className="bg-nx-violet hover:bg-nx-violet/85 text-white font-bold">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Task"}
              </Button>
              <Button onClick={() => setShowForm(false)} variant="ghost" className="text-white/60">Cancel</Button>
            </div>
          </div>
        )}
      </div>

      {/* My tasks */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">My Tasks</h3>
        {tasks === undefined ? (
          <div className="text-white/40 text-sm py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading…</div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40 text-sm">No tasks yet. Post your first one above.</div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t: any) => <PosterTaskCard key={t._id} task={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function PosterTaskCard({ task }: { task: any }) {
  const [expanded, setExpanded] = useState(false);
  const detail = useQuery(api.tasks.getTask, expanded ? { taskId: task._id } : "skip");
  const acceptOffer = useMutation(api.tasks.acceptOffer);
  const fundTask = useMutation(api.tasks.fundTask);
  const approveTask = useMutation(api.tasks.approveTask);
  const requestChanges = useMutation(api.tasks.requestChanges);
  const cancelTask = useMutation(api.tasks.cancelTask);
  const [busy, setBusy] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [showChanges, setShowChanges] = useState(false);
  const cat = catOf(task.category);

  const run = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{cat.emoji}</span>
            <h4 className="font-semibold text-white truncate">{task.title}</h4>
            <StatusPill status={task.status} />
          </div>
          <p className="text-white/50 text-xs mt-1 line-clamp-2">{task.description}</p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-white/40 flex-wrap">
            {task.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{task.location}</span>}
            {(task.budgetMin || task.budgetMax) && <span>Budget {fmtKes(task.budgetMin)} – {fmtKes(task.budgetMax)}</span>}
            {task.agreedAmount && <span className="text-emerald-300">Agreed {fmtKes(task.agreedAmount)}</span>}
            {task.payout && <span className="text-emerald-300">Paid out {fmtKes(task.payout)}</span>}
            {task.taskerName && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{task.taskerName}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          {task.status === "open" && !task.taskerId && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-nx-violet hover:text-nx-violet/80 font-medium">
              {task.pendingOffers > 0 ? `${task.pendingOffers} offer${task.pendingOffers > 1 ? "s" : ""}` : "No offers yet"}
            </button>
          )}
        </div>
      </div>

      {/* Offers list */}
      {expanded && detail && (
        <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
          {detail.offers.length === 0 && <p className="text-xs text-white/40">No offers yet — check back soon.</p>}
          {detail.offers.map((o: any) => (
            <div key={o._id} className="flex items-start justify-between gap-3 rounded-xl bg-white/[0.04] border border-white/5 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{o.taskerName} · <span className="text-emerald-300">{fmtKes(o.amount)}</span>{o.days ? ` · ${o.days}d` : ""}</p>
                <p className="text-xs text-white/50 mt-0.5">{o.message}</p>
                {o.taskerRating != null && <p className="text-[10px] text-amber-300 mt-1">★ {o.taskerRating.toFixed(1)}</p>}
              </div>
              {o.status === "pending" && task.status === "open" && !task.taskerId && (
                <Button size="sm" disabled={busy} onClick={() => run(() => acceptOffer({ offerId: o._id }), "Offer accepted — now secure the escrow")} className="bg-emerald-500 hover:bg-emerald-500/85 text-white text-xs shrink-0">Accept</Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Poster actions per status */}
      <div className="mt-3 flex flex-wrap gap-2">
        {task.status === "open" && task.taskerId && task.agreedAmount && (
          <Button size="sm" disabled={busy} onClick={() => run(() => fundTask({ taskId: task._id }), "Escrow funded — the tasker can start")} className="bg-emerald-500 hover:bg-emerald-500/85 text-white text-xs font-bold">
            <Wallet className="w-3.5 h-3.5 mr-1.5" /> Fund Escrow {fmtKes(task.agreedAmount)}
          </Button>
        )}
        {(task.status === "assigned" || task.status === "in_progress") && (
          <span className="text-xs text-emerald-300/80 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {task.taskerName || "Tasker"} is working — funds are safe in escrow</span>
        )}
        {task.status === "submitted" && (
          <>
            <div className="w-full rounded-xl bg-amber-400/5 border border-amber-400/20 p-3">
              <p className="text-xs text-amber-200/90"><span className="font-semibold">Delivered:</span> {task.submittedNote}</p>
            </div>
            {!showChanges ? (
              <>
                <Button size="sm" disabled={busy} onClick={() => run(() => approveTask({ taskId: task._id }), "Approved — payment released to the tasker")} className="bg-emerald-500 hover:bg-emerald-500/85 text-white text-xs font-bold">
                  <Check className="w-3.5 h-3.5 mr-1" /> Approve & Release
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowChanges(true)} className="text-white/60 text-xs">Request changes</Button>
              </>
            ) : (
              <div className="flex gap-2 w-full">
                <Input value={changeNote} onChange={(e) => setChangeNote(e.target.value)} placeholder="What should change?" className="bg-white/[0.04] border-white/10 text-white text-xs" />
                <Button size="sm" disabled={busy} onClick={() => { run(() => requestChanges({ taskId: task._id, note: changeNote }), "Sent back to the tasker"); setShowChanges(false); }} className="bg-white/10 hover:bg-white/15 text-white text-xs shrink-0">Send</Button>
              </div>
            )}
          </>
        )}
        {!["completed", "cancelled"].includes(task.status) && (
          <button disabled={busy} onClick={() => { if (confirm("Cancel this task?")) run(() => cancelTask({ taskId: task._id }), "Task cancelled"); }} className="text-xs text-white/30 hover:text-red-300 ml-auto">Cancel task</button>
        )}
      </div>
    </div>
  );
}

// ─── TASKER SIDE ────────────────────────────────────────────────────────────

function TaskerSide() {
  const [cat, setCat] = useState<string>("");
  const open = useQuery(api.tasks.listOpenTasks, cat ? { category: cat } : {});
  const mine = useQuery(api.tasks.myTaskerWork);
  const sendOffer = useMutation(api.tasks.sendOffer);
  const aiDraft = useAction(api.tasks.aiDraftOffer);
  const submitTask = useMutation(api.tasks.submitTask);
  const [offerFor, setOfferFor] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [pitch, setPitch] = useState("");
  const [days, setDays] = useState("");
  const [msg, setMsg] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitFor, setSubmitFor] = useState<any>(null);
  const [submitNote, setSubmitNote] = useState("");

  const openOffer = (t: any) => {
    setOfferFor(t);
    setAmount(t.budgetMax ? String(t.budgetMax) : t.budgetMin ? String(t.budgetMin) : "");
    setMsg(""); setPitch(""); setDays("");
  };

  const draftOffer = async () => {
    if (pitch.trim().length < 3) { toast.error("Add a few words about your skills or plan first"); return; }
    setAiBusy(true);
    try {
      const d = await aiDraft({ taskTitle: offerFor.title, taskDescription: offerFor.description, taskerPitch: pitch, amount: amount ? Number(amount) : undefined });
      setMsg(d);
      toast.success("AI drafted your proposal — edit it to sound like you");
    } catch (e) { toast.error(errMsg(e)); } finally { setAiBusy(false); }
  };

  const send = async () => {
    setBusy(true);
    try {
      await sendOffer({ taskId: offerFor._id, amount: Number(amount), message: msg, days: days ? Number(days) : undefined });
      toast.success("Offer sent — the poster will review it");
      setOfferFor(null);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const doSubmit = async () => {
    setBusy(true);
    try {
      await submitTask({ taskId: submitFor._id, note: submitNote });
      toast.success("Submitted — the poster will review and release payment");
      setSubmitFor(null);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      {/* Earnings strip */}
      {mine && (
        <div className="grid grid-cols-3 gap-3">
          {[{ l: "Total earned", v: fmtKes(mine.earned) }, { l: "Tasks completed", v: String(mine.completedCount) }, { l: "Active offers", v: String(mine.offers.filter((o: any) => o.status === "pending").length) }].map((s) => (
            <div key={s.l} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-lg font-bold text-white">{s.v}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Open board */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">Open Tasks</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          <button onClick={() => setCat("")} className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${cat === "" ? "border-nx-violet/50 bg-nx-violet/15 text-white" : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"}`}>All</button>
          {TASK_CATEGORIES.map((c) => (
            <button key={c.slug} onClick={() => setCat(c.slug)} className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${cat === c.slug ? "border-nx-violet/50 bg-nx-violet/15 text-white" : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"}`}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
        {open === undefined ? (
          <div className="text-white/40 text-sm py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading…</div>
        ) : open.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40 text-sm">No open tasks in this category right now.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {open.map((t: any) => (
              <div key={t._id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{catOf(t.category).emoji}</span>
                  <h4 className="font-semibold text-white text-sm flex-1 truncate">{t.title}</h4>
                  {t.minOffer != null && <span className="text-[10px] text-white/40 shrink-0">from {fmtKes(t.minOffer)}</span>}
                </div>
                <p className="text-white/50 text-xs mt-1.5 line-clamp-2 flex-1">{t.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-white/40">
                  {t.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.location}</span>}
                  <span>{t.offerCount} offer{t.offerCount === 1 ? "" : "s"}</span>
                </div>
                <Button size="sm" onClick={() => openOffer(t)} className="mt-3 bg-nx-violet hover:bg-nx-violet/85 text-white text-xs font-bold self-start">
                  <Handshake className="w-3.5 h-3.5 mr-1.5" /> Send Offer
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My offers */}
      {mine && mine.offers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">My Offers</h3>
          <div className="space-y-2">
            {mine.offers.map((o: any) => (
              <div key={o._id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{o.taskTitle}</p>
                  <p className="text-xs text-white/40">{fmtKes(o.amount)} · <span className="capitalize">{o.status}</span>{o.taskStatus ? ` · task ${o.taskStatus.replace("_", " ")}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned work */}
      {mine && mine.assigned.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">My Assigned Work</h3>
          <div className="space-y-3">
            {mine.assigned.map((t: any) => (
              <div key={t._id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-white text-sm">{t.title}</h4>
                  <StatusPill status={t.status} />
                </div>
                <p className="text-white/50 text-xs mt-1 line-clamp-2">{t.description}</p>
                {t.status === "submitted" && <p className="text-xs text-amber-300/90 mt-2">Delivered — waiting for the poster to approve and release {fmtKes(t.payout || t.agreedAmount)}.</p>}
                {t.status === "completed" && <p className="text-xs text-emerald-300 mt-2">Paid: {fmtKes(t.payout)} is in your wallet.</p>}
                {(t.status === "assigned" || t.status === "in_progress") && (
                  <Button size="sm" onClick={() => { setSubmitFor(t); setSubmitNote(""); }} className="mt-3 bg-emerald-500 hover:bg-emerald-500/85 text-white text-xs font-bold">
                    <PackageCheck className="w-3.5 h-3.5 mr-1.5" /> Submit Work
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offer drawer */}
      {offerFor && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4" onClick={() => setOfferFor(null)}>
          <div className="w-full md:max-w-lg rounded-t-2xl md:rounded-2xl border border-white/10 bg-[#0B0B14] p-5 space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-white">Offer: {offerFor.title}</h3>
            <p className="text-xs text-white/50">{offerFor.description}</p>
            <div className="grid grid-cols-2 gap-2">
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Your price (KES)" className="bg-white/[0.04] border-white/10 text-white" />
              <Input value={days} onChange={(e) => setDays(e.target.value)} type="number" placeholder="Days to finish" className="bg-white/[0.04] border-white/10 text-white" />
            </div>
            <Input value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Your skills / plan (any language) — AI writes the proposal" className="bg-white/[0.04] border-white/10 text-white" />
            <Button onClick={draftOffer} disabled={aiBusy} variant="secondary" className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs">
              {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1.5" /> AI Draft Proposal</>}
            </Button>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="Your message to the poster" className="w-full rounded-md bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-nx-violet/50" />
            <div className="flex gap-2">
              <Button onClick={send} disabled={busy || !amount || msg.trim().length < 10} className="flex-1 bg-nx-violet hover:bg-nx-violet/85 text-white font-bold">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1.5" /> Send Offer</>}
              </Button>
              <Button onClick={() => setOfferFor(null)} variant="ghost" className="text-white/60">Cancel</Button>
            </div>
            <p className="text-[10px] text-white/30">Payment is held in escrow — you are paid when the poster approves your work. Nexora commission applies on release.</p>
          </div>
        </div>
      )}

      {/* Submit drawer */}
      {submitFor && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4" onClick={() => setSubmitFor(null)}>
          <div className="w-full md:max-w-md rounded-t-2xl md:rounded-2xl border border-white/10 bg-[#0B0B14] p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-white">Submit: {submitFor.title}</h3>
            <textarea value={submitNote} onChange={(e) => setSubmitNote(e.target.value)} rows={4} placeholder="Describe what you delivered (links, receipts, details…)" className="w-full rounded-md bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400/50" />
            <div className="flex gap-2">
              <Button onClick={doSubmit} disabled={busy || submitNote.trim().length < 5} className="flex-1 bg-emerald-500 hover:bg-emerald-500/85 text-white font-bold">Submit for approval</Button>
              <Button onClick={() => setSubmitFor(null)} variant="ghost" className="text-white/60">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE SHELL ─────────────────────────────────────────────────────────────

export default function AITaskerPage() {
  const { user } = useAuth();
  const [side, setSide] = useState<"poster" | "tasker">("poster");

  return (
    <div className="min-h-screen bg-[#0B0B14] text-white">
      <NavigationBar />
      <main className="max-w-5xl mx-auto px-4 pt-24 pb-28 md:pb-16">
        {/* Header */}
        <div className="rounded-3xl border border-nx-violet/20 bg-gradient-to-br from-nx-violet/[0.12] via-transparent to-transparent p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-11 h-11 rounded-xl bg-nx-violet/20 border border-nx-violet/30 flex items-center justify-center text-xl">🤖</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">AI Tasker</h1>
              <p className="text-white/50 text-sm">Your AI-assisted task marketplace — escrow protected, Kenya first.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 text-[11px] text-white/50">
            {["✍️ AI writes your task or proposal", "🔒 Funds held in escrow until you approve", "🇰🇪 English · Kiswahili · Sheng"].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04]">{f}</span>
            ))}
          </div>
        </div>

        {/* Side switcher */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl border border-white/10 bg-white/[0.03] mb-6">
          {(["poster", "tasker"] as const).map((s) => (
            <button key={s} onClick={() => setSide(s)} className={`rounded-xl px-4 py-3 text-sm font-bold transition-all ${side === s ? "bg-nx-violet text-white shadow-lg shadow-nx-violet/20" : "text-white/50 hover:text-white"}`}>
              {s === "poster" ? "I need something done" : "I do tasks"}
            </button>
          ))}
        </div>

        {!user ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <p className="text-white/60 text-sm mb-4">Sign in to post tasks or earn as a tasker.</p>
            <a href="/auth" className="inline-block px-6 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-bold hover:bg-nx-violet/85">Sign in / Register</a>
          </div>
        ) : side === "poster" ? (
          <PosterSide />
        ) : (
          <TaskerSide />
        )}
      </main>
      <MobileBottomNav />
      <AIChat panel="ai_tasker" />
    </div>
  );
}
