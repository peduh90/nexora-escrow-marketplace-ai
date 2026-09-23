import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import NavigationBar from "@/components/layout/NavigationBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import SupportDock from "@/components/SupportDock";
import {
  Megaphone, Loader2, MapPin, Clock, Handshake, MessageSquare, X, Plus, BadgeCheck, Package, Wrench, Building2,
  ShoppingBasket, Landmark,
} from "lucide-react";

// ─── Phase 2: Community Requests (#88/#89) ──────────────────────────────────
// "Post what you need" — buyers describe demand, sellers/providers respond
// with offers, buyer picks. Simple English, mobile-first.

const KIND_TABS = [
  { id: "all", label: "All requests", icon: null },
  { id: "product", label: "Products", icon: ShoppingBasket },
  { id: "service", label: "Services", icon: Wrench },
  { id: "procurement", label: "Business & Bulk", icon: Landmark },
] as const;

export default function CommunityRequests() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const requests = useQuery(api.community.listOpenRequests, { limit: 60 });
  const myRequests = useQuery(api.community.listMyRequests, isAuthenticated ? {} : "skip");

  const createRequest = useMutation(api.community.createRequest);
  const submitOffer = useMutation(api.community.submitOffer);
  const acceptOffer = useMutation(api.community.acceptOffer);
  const closeRequest = useMutation(api.community.closeRequest);

  const [tab, setTab] = useState<(typeof KIND_TABS)[number]["id"]>("all");
  const [postOpen, setPostOpen] = useState(false);
  const [offerFor, setOfferFor] = useState<string | null>(null);
  const [offersFor, setOffersFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Post form
  const [pTitle, setPTitle] = useState("");
  const [pKind, setPKind] = useState<"product" | "service" | "procurement">("product");
  const [pDetails, setPDetails] = useState("");
  const [pCounty, setPCounty] = useState("");
  const [pTown, setPTown] = useState("");
  const [pBudget, setPBudget] = useState("");
  const [pNeeded, setPNeeded] = useState("");
  const [pQuantity, setPQuantity] = useState("");
  // Offer form
  const [oAmount, setOAmount] = useState("");
  const [oMessage, setOMessage] = useState("");

  const offers = useQuery(
    api.community.listOffersForMyRequest,
    offersFor ? { requestId: offersFor as any } : "skip",
  );

  async function run(fn: () => Promise<any>, ok: string) {
    setBusy(true);
    try {
      await fn();
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handlePost() {
    if (!isAuthenticated) {
      navigate("/auth?returnTo=%2Fcommunity");
      return;
    }
    if (!pTitle.trim()) return;
    const ok = await run(async () => {
      await createRequest({
        title: pTitle,
        details: pDetails || undefined,
        kind: pKind,
        county: pCounty || undefined,
        town: pTown || undefined,
        budget: pBudget ? Number(pBudget) : undefined,
        neededBy: pNeeded || undefined,
        quantity: pQuantity || undefined,
      });
      setPostOpen(false);
      setPTitle(""); setPDetails(""); setPCounty(""); setPTown(""); setPBudget(""); setPNeeded(""); setPQuantity("");
    }, "Request posted — sellers and providers can now respond");
    if (ok) setTab("all");
  }

  async function handleOffer(requestId: string) {
    if (!isAuthenticated) {
      navigate("/auth?returnTo=%2Fcommunity");
      return;
    }
    if (!oAmount) return;
    await run(async () => {
      await submitOffer({ requestId: requestId as any, amount: Number(oAmount), message: oMessage || undefined });
      setOfferFor(null);
      setOAmount(""); setOMessage("");
    }, "Offer sent");
  }

  const filtered = (requests ?? []).filter((r: any) => tab === "all" || r.kind === tab);

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-24 md:pb-8">
      <NavigationBar />

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-14 md:pt-24 pb-28 md:pb-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2.5">
              <Megaphone className="w-7 h-7 text-nx-cyan" /> What do you need?
            </h1>
            <p className="text-sm text-white/45 mt-1.5 max-w-lg">
              Post what you're looking for — sellers and service providers near you respond with offers. You compare and choose.
            </p>
          </div>
          <button
            onClick={() => (isAuthenticated ? setPostOpen(true) : navigate("/auth?returnTo=%2Fcommunity"))}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nx-cyan text-black text-sm font-bold hover:bg-nx-cyan/85"
          >
            <Plus className="w-4 h-4" /> Post a Request
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {KIND_TABS.map((t) => {
            const TabIcon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  tab === t.id ? "bg-nx-cyan/10 border-nx-cyan/30 text-nx-cyan" : "bg-white/[0.02] border-white/8 text-white/45 hover:text-white/70"
                }`}
              >
                {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Post form */}
        {postOpen && (
          <div className="rounded-2xl border border-nx-cyan/25 bg-nx-cyan/[0.03] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Post what you need</h2>
              <button onClick={() => setPostOpen(false)} className="p-1 text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <input value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="e.g. Looking for a second-hand fridge under KSh 20,000" className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-nx-cyan/50" />
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={pKind} onChange={(e) => setPKind(e.target.value as any)} className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none">
                <option value="product">A product to buy</option>
                <option value="service">A service provider</option>
                <option value="procurement">Business / bulk supply (B2B)</option>
              </select>
              <input value={pBudget} onChange={(e) => setPBudget(e.target.value)} type="number" placeholder="Your budget in KES (optional)" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
              {pKind === "procurement" && (
                <input value={pQuantity} onChange={(e) => setPQuantity(e.target.value)} placeholder="Quantity e.g. 500 × 50kg cement" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none sm:col-span-2" />
              )}
              <input value={pCounty} onChange={(e) => setPCounty(e.target.value)} placeholder="County (optional)" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
              <input value={pTown} onChange={(e) => setPTown(e.target.value)} placeholder="Town / estate (optional)" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
              <input value={pNeeded} onChange={(e) => setPNeeded(e.target.value)} placeholder="Needed by? e.g. today, this week (optional)" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none sm:col-span-2" />
            </div>
            <textarea value={pDetails} onChange={(e) => setPDetails(e.target.value)} rows={2} placeholder="More details (optional)" className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-nx-cyan/50" />
            <button onClick={handlePost} disabled={busy || !pTitle.trim()} className="w-full py-3 rounded-xl bg-nx-cyan text-black font-bold text-sm hover:bg-nx-cyan/85 disabled:opacity-40">
              {busy ? "Posting…" : "Post my request"}
            </button>
          </div>
        )}

        {/* My requests */}
        {myRequests && myRequests.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
            <h2 className="text-sm font-bold mb-3">My requests</h2>
            <div className="space-y-2">
              {myRequests.map((r: any) => (
                <div key={r._id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-[11px] text-white/35 mt-0.5 capitalize">
                      {r.status}{r.status === "open" && r.offerCount ? ` · ${r.offerCount} offer${r.offerCount > 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {r.status === "open" && (
                      <>
                        <button onClick={() => setOffersFor(offersFor === r._id ? null : r._id)} className="px-3 py-1.5 rounded-lg bg-nx-cyan/10 border border-nx-cyan/25 text-nx-cyan text-xs font-medium">View offers</button>
                        <button onClick={() => run(() => closeRequest({ requestId: r._id }), "Request closed")} className="px-3 py-1.5 rounded-lg border border-white/10 text-white/45 text-xs hover:text-white">Close</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {offersFor && offers && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-white/60">Offers on "{(myRequests as any[]).find((r) => r._id === offersFor)?.title}"</p>
                {offers.length === 0 ? (
                  <p className="text-xs text-white/35 p-3 rounded-lg bg-white/[0.02]">No offers yet — check back soon.</p>
                ) : (
                  offers.map((o: any) => (
                    <div key={o._id} className={`p-3 rounded-xl border ${o.status === "accepted" ? "border-emerald-400/30 bg-emerald-500/[0.05]" : "border-white/8 bg-white/[0.02]"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-1.5">
                            {o.responderName}
                            {o.responderVerified && <BadgeCheck className="w-3.5 h-3.5 text-nx-cyan" />}
                          </p>
                          {o.message && <p className="text-xs text-white/45 mt-0.5">{o.message}</p>}
                        </div>
                        <p className="text-sm font-bold text-emerald-300 shrink-0">KES {o.amount.toLocaleString()}</p>
                      </div>
                      {o.status === "pending" && (
                        <button
                          onClick={() => run(() => acceptOffer({ offerId: o._id }), "Offer accepted — open a chat to arrange payment")}
                          disabled={busy}
                          className="mt-2.5 w-full py-2.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 disabled:opacity-40"
                        >
                          Accept this offer
                        </button>
                      )}
                      {o.status === "accepted" && (
                        <button onClick={() => navigate("/chat")} className="mt-2.5 w-full py-2.5 rounded-lg bg-nx-violet text-white text-xs font-bold flex items-center justify-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" /> Go to chat — arrange payment safely
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Open requests feed */}
        <div>
          <h2 className="text-sm font-bold text-white/85 mb-3">Open requests from the community</h2>
          {requests === undefined ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border border-white/8 bg-white/[0.02]">
              <Megaphone className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/50">No open requests here yet.</p>
              <p className="text-xs text-white/30 mt-1">Be the first — post what you need and let sellers come to you.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map((r: any) => (
                <div key={r._id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 flex flex-col">
                  <div className="flex items-start gap-2.5">
                    {r.kind === "product" ? <Package className="w-4 h-4 text-nx-cyan shrink-0 mt-0.5" /> : r.kind === "service" ? <Wrench className="w-4 h-4 text-nx-violet shrink-0 mt-0.5" /> : <Building2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug">{r.title}</p>
                      {r.quantity && <p className="text-[11px] text-amber-200/70 mt-0.5">Qty: {r.quantity}</p>}
                      {r.details && <p className="text-xs text-white/40 mt-1 line-clamp-2">{r.details}</p>}
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/35">
                    {(r.town || r.county) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[r.town, r.county].filter(Boolean).join(", ")}</span>}
                    {r.budget ? <span className="text-emerald-300 font-semibold">~KES {r.budget.toLocaleString()}</span> : null}
                    {r.neededBy && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.neededBy}</span>}
                    <span className="flex items-center gap-1"><Handshake className="w-3 h-3" />{r.offerCount || 0} offer{(r.offerCount || 0) === 1 ? "" : "s"}</span>
                  </div>
                  {user && r.customerName !== user.name && (
                    <button
                      onClick={() => { setOfferFor(offerFor === r._id ? null : r._id); setOAmount(""); setOMessage(""); }}
                      className="mt-3 w-full py-2.5 rounded-xl border border-nx-cyan/30 bg-nx-cyan/[0.06] text-nx-cyan text-xs font-bold hover:bg-nx-cyan/15"
                    >
                      {offerFor === r._id ? "Hide offer form" : "Make an offer"}
                    </button>
                  )}
                  {offerFor === r._id && (
                    <div className="mt-2.5 space-y-2">
                      <input type="number" value={oAmount} onChange={(e) => setOAmount(e.target.value)} placeholder="Your price in KES" className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-nx-cyan/50" />
                      <input value={oMessage} onChange={(e) => setOMessage(e.target.value)} placeholder="Short message (optional)" className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none" />
                      <button onClick={() => handleOffer(r._id)} disabled={busy || !oAmount} className="w-full py-2.5 rounded-lg bg-nx-cyan text-black text-xs font-bold disabled:opacity-40">
                        {busy ? "Sending…" : "Send my offer"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MobileBottomNav />
      {/* Help icons on every surface: WhatsApp + NexoraAI */}
      <SupportDock panel="market" stacked message="Hello Nexora Support 👋 I need help posting a request." />
    </div>
  );
}
