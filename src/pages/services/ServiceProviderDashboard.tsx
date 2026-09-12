import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import NavigationBar from "@/components/layout/NavigationBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import {
  ArrowLeft, Loader2, Power, Star, Phone, Wallet, Check, X, Play,
  ShieldCheck, Clock, AlertTriangle,
} from "lucide-react";

/**
 * One simple dashboard for local providers:
 *  • Local service (salon, plumber, …): profile + prices + availability + bookings.
 *  • Transport (boda/matatu/tuktuk/taxi/delivery): verified registration + trips.
 *  • Bookings list for customers ("My Bookings").
 */
export default function ServiceProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const myService = useQuery(api.services.getMyService);
  const myTransport = useQuery(api.transport.getMyTransport);
  const categories = useQuery(api.services.getCategories);
  const wallet = useQuery(api.wallet.getWalletBalance);
  const openTrips = useQuery(api.transport.getTransportProviders, { availableNow: true });

  const upsertService = useMutation(api.services.upsertMyService);
  const setAvailability = useMutation(api.services.setMyAvailability);
  const acceptReq = useMutation(api.services.acceptServiceRequest);
  const declineReq = useMutation(api.services.declineServiceRequest);
  const startReq = useMutation(api.services.startServiceRequest);

  const upsertTransport = useMutation(api.transport.upsertTransportProfile);
  const setTransportAvail = useMutation(api.transport.setTransportAvailability);
  const acceptTrip = useMutation(api.transport.acceptTrip);
  const markArriving = useMutation(api.transport.markArriving);
  const startTrip = useMutation(api.transport.startTrip);

  const [form, setForm] = useState<any>(null); // service profile editor
  const [tform, setTForm] = useState<any>(null); // transport registration editor
  const [busy, setBusy] = useState(false);

  const svc = (myService as any)?.profile;
  const requests = ((myService as any)?.requests ?? []) as any[];
  const tp = (myTransport as any)?.profile;
  const trips = ((myTransport as any)?.trips ?? []) as any[];

  async function run(fn: () => Promise<any>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    setForm({
      displayName: svc?.displayName || user?.name || "",
      category: svc?.category || "beauty",
      serviceType: svc?.serviceType || "",
      tagline: svc?.tagline || "",
      county: svc?.county || user?.county || "Nairobi",
      town: svc?.town || user?.town || "",
      pricingMode: svc?.pricingMode || "fixed",
      basePrice: svc?.basePrice ?? "",
      phone: svc?.phone || user?.phone || "",
      workingHours: svc?.workingHours || "",
      description: svc?.description || "",
    });
  }

  async function saveService() {
    if (!form.displayName.trim() || !form.town.trim()) {
      toast.error("Add your business name and town");
      return;
    }
    setBusy(true);
    try {
      await upsertService({
        displayName: form.displayName,
        category: form.category,
        serviceType: form.serviceType || "Other",
        tagline: form.tagline || undefined,
        description: form.description || undefined,
        county: form.county,
        town: form.town,
        pricingMode: form.pricingMode,
        basePrice: form.pricingMode !== "quote" ? Number(form.basePrice) || 0 : undefined,
        phone: form.phone || undefined,
        workingHours: form.workingHours || undefined,
      });
      toast.success("Service saved");
      setForm(null);
    } catch (err: any) {
      toast.error(err?.message || "Could not save");
    } finally {
      setBusy(false);
    }
  }

  function startTransportReg() {
    setTForm({
      displayName: user?.name || "",
      serviceType: "boda",
      vehicleModel: "",
      plateNumber: "",
      licenseNumber: "",
      county: "Nairobi",
      town: "",
      baseStage: "",
      routeCodes: "",
      schedule: "",
      phone: user?.phone || "",
      idDocumentUrl: "",
      vehicleDocumentUrl: "",
    });
  }

  async function saveTransport() {
    if (!tform.displayName.trim() || !tform.town.trim()) {
      toast.error("Add your name and stage/town");
      return;
    }
    if (!tform.idDocumentUrl.trim() || !tform.vehicleDocumentUrl.trim()) {
      toast.error("Paste the link (URL) of your ID photo and vehicle document — admin verifies these");
      return;
    }
    setBusy(true);
    try {
      await upsertTransport({
        displayName: tform.displayName,
        serviceType: tform.serviceType,
        vehicleModel: tform.vehicleModel || undefined,
        plateNumber: tform.serviceType === "matatu" ? undefined : tform.plateNumber,
        licenseNumber: tform.licenseNumber || undefined,
        county: tform.county,
        town: tform.town,
        baseStage: tform.baseStage || undefined,
        routeCodes: tform.serviceType === "matatu" && tform.routeCodes
          ? tform.routeCodes.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean)
          : undefined,
        schedule: tform.schedule || undefined,
        phone: tform.phone || undefined,
        idDocumentUrl: tform.idDocumentUrl.trim(),
        vehicleDocumentUrl: tform.vehicleDocumentUrl.trim(),
      });
      toast.success("Submitted — Nexora admin will verify your documents");
      setTForm(null);
    } catch (err: any) {
      toast.error(err?.message || "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  if (myService === undefined || myTransport === undefined) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  const activeRequests = requests.filter((r) => ["pending", "funded", "accepted", "in_progress"].includes(r.status));
  const history = requests.filter((r) => ["completed", "declined", "cancelled"].includes(r.status));

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-24 md:pb-8">
      <NavigationBar />

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-24 pb-10 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/services")}
            className="p-2 rounded-lg bg-white/[0.04] border border-white/8 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">My Service Business</h1>
            <p className="text-xs text-white/40 mt-0.5">Your bookings, prices and earnings — all in one place.</p>
          </div>
        </div>

        {/* Wallet strip */}
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.04] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs text-white/40">Wallet balance</p>
              <p className="text-lg font-bold text-white">KES {(wallet?.walletBalance ?? 0).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={() => navigate("/buyer/wallet")} className="text-xs text-emerald-300 hover:text-emerald-200 font-medium">
            View earnings →
          </button>
        </div>

        {/* ── LOCAL SERVICE ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          {!svc && !form ? (
            <div className="text-center py-4">
              <p className="text-sm text-white/60 font-medium">Offer a local service (salon, plumbing, mechanic…)</p>
              <p className="text-xs text-white/35 mt-1">Free to list. You set your price. Get paid to your wallet when the job is done.</p>
              <button onClick={startEdit} className="mt-3 px-5 py-2.5 rounded-xl bg-nx-cyan text-black text-sm font-bold hover:bg-nx-cyan/85">
                List My Service
              </button>
            </div>
          ) : form ? (
            <div className="space-y-3">
              <h2 className="text-sm font-bold">{svc ? "Edit my service" : "Register my service"}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Business name e.g. Mama Akinyi Salon" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-nx-cyan/50" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, serviceType: "" })} className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none">
                  {(categories ?? []).map((c: any) => <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>)}
                </select>
                <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none">
                  <option value="">What exactly do you do?</option>
                  {(categories ?? []).find((c: any) => c.slug === form.category)?.types.map((t: string) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} placeholder="Town e.g. Kawangware" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
                <input value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} placeholder="County" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
                <select value={form.pricingMode} onChange={(e) => setForm({ ...form, pricingMode: e.target.value })} className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none">
                  <option value="fixed">Fixed price</option>
                  <option value="starting_from">Starting from…</option>
                  <option value="quote">Customer asks first</option>
                </select>
                {form.pricingMode !== "quote" && (
                  <input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} placeholder="Price in KES (min 50)" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
                )}
                <input value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} placeholder="Hours e.g. Mon–Sat 8am–7pm" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none sm:col-span-2" />
                <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Short line e.g. Quick, clean, friendly" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none sm:col-span-2" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveService} disabled={busy} className="flex-1 py-3 rounded-xl bg-nx-cyan text-black font-bold text-sm hover:bg-nx-cyan/85 disabled:opacity-40">
                  {busy ? "Saving…" : "Save my service"}
                </button>
                <button onClick={() => setForm(null)} className="px-5 py-3 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">{svc.displayName}</p>
                  <p className="text-xs text-white/45 mt-0.5">{svc.serviceType} · {svc.town}, {svc.county}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs">
                    {svc.adminVerified ? (
                      <span className="text-nx-cyan font-semibold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Verified</span>
                    ) : (
                      <span className="text-amber-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Verification pending</span>
                    )}
                    {!!svc.ratingCount && (
                      <span className="text-amber-300 flex items-center gap-0.5"><Star className="w-3 h-3" /> {Math.round(((svc.ratingSum || 0) / svc.ratingCount) * 10) / 10} ({svc.ratingCount})</span>
                    )}
                    <span className="text-white/40">{svc.completedJobs} jobs done</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-300">
                    {svc.pricingMode === "quote" ? "Ask first" : `KES ${svc.basePrice?.toLocaleString()}`}
                  </p>
                  <button onClick={() => run(() => setAvailability({ availability: svc.availability === "available_now" ? "off" : "available_now" }), svc.availability === "available_now" ? "You're now offline" : "You're Available Now!")} className={`mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${svc.availability === "available_now" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border-white/15 text-white/60 hover:text-white"}`}>
                    <Power className="w-3 h-3" /> {svc.availability === "available_now" ? "ON — tap to go off" : "Go Available Now"}
                  </button>
                </div>
              </div>
              <button onClick={startEdit} className="mt-3 text-xs text-white/45 hover:text-white underline">Edit service details</button>
            </div>
          )}
        </div>

        {/* Incoming bookings */}
        {svc && (
          <div>
            <h2 className="text-sm font-bold text-white/85 mb-2">Bookings {activeRequests.length > 0 && `(${activeRequests.length})`}</h2>
            {activeRequests.length === 0 ? (
              <p className="text-xs text-white/35 bg-white/[0.02] rounded-xl p-4">
                No open bookings. Go "Available Now" so customers see you on the homepage.
              </p>
            ) : (
              <div className="space-y-2">
                {activeRequests.map((r) => (
                  <div key={r._id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">"{r.title}"</p>
                        <p className="text-xs text-white/45 mt-0.5">{r.customerName}{r.location ? ` · ${r.location}` : ""}</p>
                        {r.description && <p className="text-xs text-white/50 mt-1.5">{r.description}</p>}
                        {r.customerPhone && ["funded", "accepted", "in_progress"].includes(r.status) && (
                          <a href={`tel:${r.customerPhone}`} className="mt-1.5 inline-flex items-center gap-1 text-xs text-nx-cyan"><Phone className="w-3 h-3" /> Call customer</a>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-300">KES {r.amount.toLocaleString()}</p>
                        <span className={`text-[10px] font-semibold uppercase ${r.status === "funded" ? "text-emerald-300" : r.status === "pending" ? "text-amber-300" : "text-nx-violet"}`}>{r.status}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {r.status === "pending" && (
                        <>
                          <button onClick={() => run(() => declineReq({ requestId: r._id }), "Request declined")} disabled={busy} className="flex-1 py-2 rounded-lg border border-white/10 text-xs text-white/55 hover:text-white">Decline</button>
                          <span className="flex-1 py-2 rounded-lg bg-white/[0.03] text-[10px] text-white/35 text-center px-2">Waiting for customer payment</span>
                        </>
                      )}
                      {r.status === "funded" && (
                        <button onClick={() => run(() => acceptReq({ requestId: r._id }), "Accepted — money is secured in escrow")} disabled={busy} className="flex-1 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Accept (paid & secured)
                        </button>
                      )}
                      {r.status === "accepted" && (
                        <button onClick={() => run(() => startReq({ requestId: r._id }), "Marked as started")} disabled={busy} className="flex-1 py-2 rounded-lg bg-nx-violet text-white text-xs font-bold hover:bg-nx-violet/85 flex items-center justify-center gap-1.5">
                          <Play className="w-3.5 h-3.5" /> Start the job
                        </button>
                      )}
                      {r.status === "in_progress" && (
                        <span className="flex-1 py-2 rounded-lg bg-nx-violet/10 text-[11px] text-nx-violet text-center font-medium">Working — customer will confirm & release pay</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TRANSPORT ── */}
        <div className="rounded-2xl border border-nx-violet/20 bg-nx-violet/[0.04] p-5">
          {!tp && !tform ? (
            <div className="text-center py-2">
              <p className="text-sm text-white/60 font-medium">Ride & earn — Boda, Tuk-Tuk, Taxi, Matatu or Delivery</p>
              <p className="text-xs text-white/35 mt-1">Register with your ID + vehicle documents. Nexora verifies you before you take trips.</p>
              <button onClick={startTransportReg} className="mt-3 px-5 py-2.5 rounded-xl bg-nx-violet text-white text-sm font-bold hover:bg-nx-violet/85">
                Register as Driver / Rider
              </button>
            </div>
          ) : tform ? (
            <div className="space-y-3">
              <h2 className="text-sm font-bold">Driver / Rider registration</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={tform.displayName} onChange={(e) => setTForm({ ...tform, displayName: e.target.value })} placeholder="Your name" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
                <select value={tform.serviceType} onChange={(e) => setTForm({ ...tform, serviceType: e.target.value })} className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none">
                  <option value="boda">🏍️ Boda Boda</option>
                  <option value="tuktuk">🛺 Tuk-Tuk</option>
                  <option value="taxi">🚕 Taxi</option>
                  <option value="matatu">🚐 Matatu</option>
                  <option value="delivery">📦 Delivery</option>
                </select>
                <input value={tform.vehicleModel} onChange={(e) => setTForm({ ...tform, vehicleModel: e.target.value })} placeholder="Vehicle e.g. Boxer 150" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
                {tform.serviceType !== "matatu" && (
                  <input value={tform.plateNumber} onChange={(e) => setTForm({ ...tform, plateNumber: e.target.value })} placeholder="Number plate e.g. KMDA 123X" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
                )}
                <input value={tform.town} onChange={(e) => setTForm({ ...tform, town: e.target.value })} placeholder="Base town / stage" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
                <input value={tform.county} onChange={(e) => setTForm({ ...tform, county: e.target.value })} placeholder="County" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
                {tform.serviceType === "matatu" && (
                  <>
                    <input value={tform.routeCodes} onChange={(e) => setTForm({ ...tform, routeCodes: e.target.value })} placeholder="Route codes e.g. 11A, 125" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
                    <input value={tform.schedule} onChange={(e) => setTForm({ ...tform, schedule: e.target.value })} placeholder="Schedule e.g. 5:30am–9pm daily" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none" />
                  </>
                )}
                <input value={tform.idDocumentUrl} onChange={(e) => setTForm({ ...tform, idDocumentUrl: e.target.value })} placeholder="Link (URL) to your ID photo" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none sm:col-span-2" />
                <input value={tform.vehicleDocumentUrl} onChange={(e) => setTForm({ ...tform, vehicleDocumentUrl: e.target.value })} placeholder="Link (URL) to vehicle logbook / inspection" className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-sm outline-none sm:col-span-2" />
              </div>
              <p className="text-[10px] text-white/35 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Documents are reviewed by Nexora admin only, for verification and safety.</p>
              <div className="flex gap-2">
                <button onClick={saveTransport} disabled={busy} className="flex-1 py-3 rounded-xl bg-nx-violet text-white font-bold text-sm hover:bg-nx-violet/85 disabled:opacity-40">{busy ? "Submitting…" : "Submit for verification"}</button>
                <button onClick={() => setTForm(null)} className="px-5 py-3 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold capitalize">{tp.serviceType === "boda" ? "🏍️ Boda Rider" : tp.serviceType === "matatu" ? "🚐 Matatu" : tp.serviceType === "tuktuk" ? "🛺 Tuk-Tuk" : tp.serviceType === "taxi" ? "🚕 Taxi" : "📦 Delivery"} — {tp.displayName}</p>
                  <p className="text-xs text-white/45 mt-0.5">{tp.vehicleModel || ""}{tp.plateNumber ? ` · ${tp.plateNumber}` : ""} · {tp.town}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs">
                    {tp.verificationStatus === "verified" ? (
                      <span className="text-nx-cyan font-semibold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Verified</span>
                    ) : (
                      <span className="text-amber-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {tp.verificationStatus}</span>
                    )}
                    {!!tp.ratingCount && <span className="text-amber-300 flex items-center gap-0.5"><Star className="w-3 h-3" /> {Math.round(((tp.ratingSum || 0) / tp.ratingCount) * 10) / 10}</span>}
                    <span className="text-white/40">{tp.completedTrips} trips</span>
                  </div>
                </div>
                {tp.verificationStatus === "verified" && (
                  <button onClick={() => run(() => setTransportAvail({ availability: tp.availability === "available_now" ? "off" : "available_now" }), tp.availability === "available_now" ? "You're offline" : "You're Available Now!")} className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${tp.availability === "available_now" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border-white/15 text-white/60 hover:text-white"}`}>
                    <Power className="w-3 h-3" /> {tp.availability === "available_now" ? "ON" : "Go Available"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* My trips (provider side) */}
        {tp && (
          <div>
            <h2 className="text-sm font-bold text-white/85 mb-2">Trips {trips.length > 0 && `(${trips.length})`}</h2>
            {trips.length === 0 ? (
              <p className="text-xs text-white/35 bg-white/[0.02] rounded-xl p-4">No trips yet. Go "Available Now" — customers see you instantly on the homepage.</p>
            ) : (
              <div className="space-y-2">
                {trips.slice(0, 10).map((t) => (
                  <div key={t._id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{t.pickup} → {t.destination}</p>
                        <p className="text-xs text-white/45 mt-0.5">{t.customerName} · {t.distanceKm} km</p>
                        {t.customerPhone && ["accepted", "arriving", "in_progress"].includes(t.status) && (
                          <a href={`tel:${t.customerPhone}`} className="mt-1 inline-flex items-center gap-1 text-xs text-nx-cyan"><Phone className="w-3 h-3" /> Call</a>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-300">KES {t.fare.toLocaleString()}</p>
                        <span className="text-[10px] uppercase font-semibold text-amber-300">{t.status.replace("_", " ")}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {t.status === "requested" && (
                        <button onClick={() => run(() => acceptTrip({ tripId: t._id }), "Trip accepted")} disabled={busy} className="flex-1 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400">Accept trip</button>
                      )}
                      {t.status === "funded" && (
                        <button onClick={() => run(() => acceptTrip({ tripId: t._id }), "Trip accepted — fare secured")} disabled={busy} className="flex-1 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400">Accept (fare secured)</button>
                      )}
                      {t.status === "accepted" && (
                        <button onClick={() => run(() => markArriving({ tripId: t._id }), "Customer notified — you're on the way")} disabled={busy} className="flex-1 py-2 rounded-lg bg-nx-violet text-white text-xs font-bold hover:bg-nx-violet/85">I'm heading to pickup</button>
                      )}
                      {t.status === "arriving" && (
                        <button onClick={() => run(() => startTrip({ tripId: t._id }), "Trip started")} disabled={busy} className="flex-1 py-2 rounded-lg bg-nx-violet text-white text-xs font-bold hover:bg-nx-violet/85">Start trip (customer aboard)</button>
                      )}
                      {t.status === "in_progress" && (
                        <span className="flex-1 py-2 rounded-lg bg-nx-violet/10 text-[11px] text-nx-violet text-center font-medium">On the trip — customer confirms arrival to release pay</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-white/85 mb-2">History</h2>
            <div className="space-y-1.5">
              {history.slice(0, 8).map((r) => (
                <div key={r._id} className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white/75 truncate">"{r.title}"</p>
                    <p className="text-[10px] text-white/35">{new Date(r.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-white/60">KES {(r.payout ?? r.amount).toLocaleString()}</p>
                    <span className={`text-[10px] ${r.status === "completed" ? "text-emerald-300" : "text-white/35"}`}>{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
