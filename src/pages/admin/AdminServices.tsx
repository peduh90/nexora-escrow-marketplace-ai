import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import {
  Loader2, ShieldCheck, X, Save, MapPin, Star, Calculator, Route as RouteIcon,
} from "lucide-react";

/** Admin control for Local Services & Transport: verification + pricing. */
export default function AdminServices() {
  const data = useQuery(api.transport.adminGetTransportData);
  const providers = useQuery(api.services.adminListProviders);

  const verifyProvider = useMutation(api.services.adminVerifyProvider);
  const verifyTransport = useMutation(api.transport.adminVerifyTransportProvider);
  const updateRules = useMutation(api.transport.adminUpdateFareRules);
  const upsertRoute = useMutation(api.transport.adminUpsertRoute);

  const [rules, setRules] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [busy, setBusy] = useState(false);

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

  if (data === undefined || providers === undefined) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      </AdminLayout>
    );
  }

  const pendingSvc = providers.filter((p: any) => !p.adminVerified);
  const verifiedSvc = providers.filter((p: any) => p.adminVerified);
  const pendingTrp = data.providers.filter((p: any) => p.verificationStatus === "pending");
  const verifiedTrp = data.providers.filter((p: any) => p.verificationStatus === "verified");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-cyan-400" /> Local Services & Transport
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Verify providers, control the fare engine and manage matatu routes — every real transaction feeds the fee engine.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Service providers", value: providers.length, sub: `${verifiedSvc.length} verified` },
            { label: "Transport providers", value: data.providers.length, sub: `${verifiedTrp.length} verified` },
            { label: "Pending verifications", value: pendingSvc.length + pendingTrp.length, sub: "need review" },
            { label: "Matatu routes", value: data.routes.length, sub: "active" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs text-white/40">{s.label}</p>
              <p className="mt-1 text-xl font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-white/35">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Fare engine */}
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/[0.04] p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2"><Calculator className="w-4 h-4 text-cyan-300" /> Fare engine rules</h2>
              <p className="text-xs text-white/40 mt-1">Applied to every new quote instantly. Riders can never set their own price.</p>
            </div>
            {!rules && (
              <button onClick={() => setRules({ ...data.rules })} className="rounded-lg border border-white/12 px-3.5 py-2 text-sm text-white/75 hover:bg-white/5">
                Edit rules
              </button>
            )}
          </div>
          {rules ? (
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {([
                ["baseFare", "Base fare (KES)"],
                ["pricePerKm", "Per km (KES)"],
                ["pricePerMinute", "Per minute (KES)"],
                ["minimumFare", "Minimum fare (KES)"],
                ["routeFactor", "Route factor (1–2.5)"],
                ["maxSurgeMultiplier", "Max surge (1–3)"],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-white/50 mb-1">{label}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rules[key]}
                    onChange={(e) => setRules({ ...rules, [key]: Number(e.target.value) })}
                    className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
              ))}
              <label className="flex items-center gap-2 text-xs text-white/60 mt-1">
                <input type="checkbox" checked={rules.surgeEnabled} onChange={(e) => setRules({ ...rules, surgeEnabled: e.target.checked })} className="accent-cyan-400" />
                Peak-hour surge
              </label>
              <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                <button
                  onClick={() => run(async () => {
                    await updateRules(rules);
                    setRules(null);
                  }, "Fare rules updated — next quote uses them")}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 text-black px-4 py-2 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Save rules
                </button>
                <button onClick={() => setRules(null)} className="text-sm text-white/45 hover:text-white/80">Close</button>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-white/50">
              <p>Base: <span className="text-white font-semibold">KES {data.rules.baseFare}</span></p>
              <p>Per km: <span className="text-white font-semibold">KES {data.rules.pricePerKm}</span></p>
              <p>Per min: <span className="text-white font-semibold">KES {data.rules.pricePerMinute}</span></p>
              <p>Minimum: <span className="text-white font-semibold">KES {data.rules.minimumFare}</span></p>
              <p>Route factor: <span className="text-white font-semibold">×{data.rules.routeFactor}</span></p>
              <p>Surge: <span className="text-white font-semibold">{data.rules.surgeEnabled ? `up to ×${data.rules.maxSurgeMultiplier}` : "off"}</span></p>
            </div>
          )}
        </div>

        {/* Matatu routes */}
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2"><RouteIcon className="w-4 h-4 text-violet-300" /> Matatu routes (stage fares)</h2>
              <p className="text-xs text-white/40 mt-1">Cumulative fares: fare(A→B) = fares[B] − fares[A]. Never on-demand pricing.</p>
            </div>
            <button
              onClick={() => setRoute({ name: "", code: "", stages: "", fares: "", notes: "", active: true })}
              className="rounded-lg border border-white/12 px-3.5 py-2 text-sm text-white/75 hover:bg-white/5"
            >
              Add route
            </button>
          </div>

          {route && (
            <div className="mt-4 rounded-lg border border-violet-400/20 bg-violet-500/[0.04] p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={route.name} onChange={(e) => setRoute({ ...route, name: e.target.value })} placeholder="Route name e.g. CBD ↔ Kawangware" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none" />
                <input value={route.code} onChange={(e) => setRoute({ ...route, code: e.target.value })} placeholder="Code e.g. 125" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none" />
                <input value={route.stages} onChange={(e) => setRoute({ ...route, stages: e.target.value })} placeholder="Stages comma-separated: CBD, Lavington, Kawangware" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none sm:col-span-2" />
                <input value={route.fares} onChange={(e) => setRoute({ ...route, fares: e.target.value })} placeholder="Cumulative fares: 0, 60, 100" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none sm:col-span-2" />
                <input value={route.notes} onChange={(e) => setRoute({ ...route, notes: e.target.value })} placeholder="Schedule e.g. 5:30am–9pm daily" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none sm:col-span-2" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => run(async () => {
                    const stages = route.stages.split(",").map((s: string) => s.trim()).filter(Boolean);
                    const fares = route.fares.split(",").map((s: string) => Number(s.trim())).filter((n: number) => isFinite(n));
                    await upsertRoute({ name: route.name, code: route.code, stages, fares, notes: route.notes || undefined, active: true });
                    setRoute(null);
                  }, "Route saved")}
                  disabled={busy}
                  className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
                >
                  Save route
                </button>
                <button onClick={() => setRoute(null)} className="text-sm text-white/45 hover:text-white/80">Cancel</button>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {data.routes.length === 0 && <p className="text-xs text-white/35">No routes yet — add the first one above.</p>}
            {data.routes.map((r: any) => (
              <div key={r._id} className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-black/25 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{r.name} <span className="text-white/35">({r.code})</span></p>
                  <p className="text-[11px] text-white/40 truncate">{r.stages.join(" → ")}{r.notes ? ` · ${r.notes}` : ""}</p>
                </div>
                <p className="text-xs text-white/50 shrink-0">KES {(r.fares[r.fares.length - 1] || 0).toLocaleString()} end-to-end</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transport verifications */}
        <div>
          <h2 className="font-semibold text-white mb-2">Transport providers — pending ({pendingTrp.length})</h2>
          {pendingTrp.length === 0 ? (
            <p className="text-xs text-white/35 bg-white/[0.02] rounded-xl p-4">No pending transport verifications.</p>
          ) : (
            <div className="space-y-2">
              {pendingTrp.map((p: any) => (
                <div key={p._id} className="rounded-xl border border-amber-400/20 bg-amber-500/[0.04] p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white capitalize">{p.serviceType} — {p.displayName}</p>
                    <p className="text-xs text-white/45 mt-0.5">{p.plateNumber || p.routeCodes?.join(", ") || "—"} · {p.town}, {p.county}</p>
                    <div className="mt-1.5 flex gap-3 text-[11px]">
                      {p.idDocumentUrl && <a href={p.idDocumentUrl} target="_blank" rel="noreferrer" className="text-cyan-300 underline">View ID doc</a>}
                      {p.vehicleDocumentUrl && <a href={p.vehicleDocumentUrl} target="_blank" rel="noreferrer" className="text-cyan-300 underline">View vehicle doc</a>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => run(() => verifyTransport({ providerId: p._id, decision: "verified" }), `${p.displayName} verified — can now accept trips`)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Verify
                    </button>
                    <button
                      onClick={() => {
                        const note = window.prompt("Reason for declining (sent to the provider):") || "";
                        run(() => verifyTransport({ providerId: p._id, decision: "rejected", note }), "Verification declined");
                      }}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-400/25 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service verifications */}
        <div>
          <h2 className="font-semibold text-white mb-2">Local service providers — pending ({pendingSvc.length})</h2>
          {pendingSvc.length === 0 ? (
            <p className="text-xs text-white/35 bg-white/[0.02] rounded-xl p-4">No pending service verifications.</p>
          ) : (
            <div className="space-y-2">
              {pendingSvc.map((p: any) => (
                <div key={p._id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{p.displayName} <span className="text-white/40 text-xs">· {p.serviceType}</span></p>
                    <p className="text-xs text-white/45 mt-0.5">{p.town}, {p.county} · {p.ownerName} {p.ownerPhone ? `· ${p.ownerPhone}` : ""}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      {p.pricingMode === "quote" ? "Ask-first pricing" : `KES ${p.basePrice?.toLocaleString()}`} · {p.completedJobs} jobs
                      {!!p.rating && <span className="text-amber-300"> · {p.rating}★</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => run(() => verifyProvider({ providerId: p._id, verified: true }), `${p.displayName} verified`)}
                    disabled={busy}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Verify
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All providers table */}
        <div>
          <h2 className="font-semibold text-white mb-2">All providers ({providers.length + data.providers.length})</h2>
          <div className="rounded-xl border border-white/8 overflow-hidden overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-white/[0.03] text-white/40 uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2.5 px-3">Name</th>
                  <th className="text-left py-2.5 px-3">Type</th>
                  <th className="text-left py-2.5 px-3">Area</th>
                  <th className="text-left py-2.5 px-3">Jobs/Trips</th>
                  <th className="text-left py-2.5 px-3">Rating</th>
                  <th className="text-left py-2.5 px-3">Status</th>
                  <th className="text-right py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p: any) => (
                  <tr key={`s-${p._id}`} className="border-t border-white/5">
                    <td className="py-2.5 px-3 text-white/85">{p.displayName}</td>
                    <td className="py-2.5 px-3 text-white/55">{p.serviceType}</td>
                    <td className="py-2.5 px-3 text-white/45">{p.town}</td>
                    <td className="py-2.5 px-3 text-white/55">{p.completedJobs}</td>
                    <td className="py-2.5 px-3 text-amber-300">{p.rating ? `${p.rating}★` : "—"}</td>
                    <td className="py-2.5 px-3">
                      <span className={p.adminVerified ? "text-emerald-300" : "text-amber-300"}>{p.adminVerified ? "verified" : "pending"}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {p.adminVerified && (
                        <button
                          onClick={() => run(() => verifyProvider({ providerId: p._id, verified: false, note: "Removed by admin" }), "Verification removed")}
                          className="text-red-300 hover:text-red-200 text-[11px] underline"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.providers.map((p: any) => (
                  <tr key={`t-${p._id}`} className="border-t border-white/5">
                    <td className="py-2.5 px-3 text-white/85">{p.displayName}</td>
                    <td className="py-2.5 px-3 text-white/55 capitalize">{p.serviceType}</td>
                    <td className="py-2.5 px-3 text-white/45">{p.town}</td>
                    <td className="py-2.5 px-3 text-white/55">{p.completedTrips}</td>
                    <td className="py-2.5 px-3 text-amber-300">{p.rating ? `${p.rating}★` : "—"}</td>
                    <td className="py-2.5 px-3">
                      <span className={p.verificationStatus === "verified" ? "text-emerald-300" : p.verificationStatus === "pending" ? "text-amber-300" : "text-red-300"}>{p.verificationStatus}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {p.verificationStatus === "verified" && (
                        <button
                          onClick={() => run(() => verifyTransport({ providerId: p._id, decision: "rejected", note: "Revoked by admin" }), "Verification revoked")}
                          className="text-red-300 hover:text-red-200 text-[11px] underline"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
