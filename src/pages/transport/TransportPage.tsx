import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import NavigationBar from "@/components/layout/NavigationBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import SupportDock from "@/components/SupportDock";
import {
  ArrowLeft, MapPin, Navigation, Loader2, Lock, Star, ShieldCheck, Phone, AlertTriangle,
  Bike, CarFront, CarTaxiFront, Package,
} from "lucide-react";

/**
 * Transport & Rides — price BEFORE you request.
 *  • On-demand (boda/tuktuk/taxi/delivery): pickup + destination → the fare
 *    engine quotes server-side; funding locks it in escrow.
 *  • Matatu: stage-based route fares & schedules — never on-demand pricing.
 */
export default function TransportPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();

  const tab = params.get("tab") || "ride"; // ride | matatu | trips
  const presetType = params.get("type") || "boda";

  // Ride form state (declared before the reactive fare quote below).
  const [rideType, setRideType] = useState(presetType);
  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestedTripId, setRequestedTripId] = useState<string | null>(null);

  const places = useQuery(api.transport.getPlaces);
  const providers = useQuery(api.transport.getTransportProviders, { availableNow: true });
  const routes = useQuery(api.transport.getRoutes);
  const myTrips = useQuery(api.transport.getMyTrips);

  const quoteFare = useQuery(
    api.transport.quoteFare,
    tab === "ride" && fromPlace && toPlace && fromPlace !== toPlace
      ? { serviceType: rideType as any, fromPlace, toPlace }
      : "skip",
  );

  const requestTrip = useMutation(api.transport.requestTrip);
  const fundTrip = useMutation(api.transport.fundTrip);
  const completeTrip = useMutation(api.transport.completeTrip);
  const cancelTrip = useMutation(api.transport.cancelTrip);
  const rateTrip = useMutation(api.transport.rateTrip);
  const raiseEmergency = useMutation(api.transport.raiseEmergency);

  // Matatu stage selection
  const [routeCode, setRouteCode] = useState<string>("");
  const [fromStage, setFromStage] = useState<number | null>(null);
  const [toStage, setToStage] = useState<number | null>(null);

  const activeRoute = useMemo(
    () => (routes as any[] | undefined)?.find((r) => r.code === routeCode),
    [routes, routeCode],
  );

  const matatuQuote = useQuery(
    api.transport.quoteMatatuFare,
    tab === "matatu" && routeCode && fromStage !== null && toStage !== null
      ? { routeCode, fromStageIndex: fromStage, toStageIndex: toStage }
      : "skip",
  );

  const placeList = (places ?? []) as any[];

  function switchTab(t: string) {
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next);
  }

  async function handleRequestTrip() {
    if (!user) {
      navigate("/auth?returnTo=" + encodeURIComponent("/transport"));
      return;
    }
    if (!fromPlace || !toPlace || fromPlace === toPlace) {
      toast.error("Choose pickup and destination");
      return;
    }
    setBusy(true);
    try {
      const fromLabel = placeList.find((p) => p.key === fromPlace)?.label || fromPlace;
      const toLabel = placeList.find((p) => p.key === toPlace)?.label || toPlace;
      const res = await requestTrip({
        serviceType: rideType as any,
        fromPlace,
        fromLabel,
        toPlace,
        toLabel,
      });
      setRequestedTripId(res.tripId);
      toast.success(`Trip requested — KES ${res.fare.toLocaleString()} will be held safely`);
    } catch (err: any) {
      toast.error(err?.message || "Could not request the trip");
    } finally {
      setBusy(false);
    }
  }

  async function handleFundTrip() {
    if (!requestedTripId) return;
    setBusy(true);
    try {
      await fundTrip({ tripId: requestedTripId as any });
      toast.success("Fare secured in escrow — a verified rider/driver will accept");
      setRequestedTripId(null);
      switchTab("trips");
    } catch (err: any) {
      toast.error(err?.message || "Could not secure the fare");
    } finally {
      setBusy(false);
    }
  }

  async function tripAction(fn: () => Promise<any>, ok: string) {
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

  const q = quoteFare as any;
  const activeTrips = (myTrips ?? []).filter((t: any) =>
    ["requested", "funded", "accepted", "arriving", "in_progress"].includes(t.status),
  );

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-24 md:pb-8">
      <NavigationBar />

      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg bg-white/[0.04] border border-white/8 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Transport & Rides</h1>
            <p className="text-xs text-white/40 mt-0.5">See the price first. Pay safely after the ride.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1 border-b border-white/8">
          {[
            ["ride", "Get a Ride"],
            ["matatu", "Matatu Routes"],
            ["trips", `My Trips${activeTrips.length ? ` (${activeTrips.length})` : ""}`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key ? "border-nx-violet text-white" : "border-transparent text-white/45 hover:text-white/75"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── RIDE TAB ── */}
        {tab === "ride" && (
          <div className="mt-5 space-y-4">
            {/* Vehicle type */}
            <div className="grid grid-cols-4 gap-2">
              {([
                { value: "boda", Icon: Bike, label: "Boda", tint: "text-nx-violet" },
                { value: "tuktuk", Icon: CarFront, label: "Tuk-Tuk", tint: "text-amber-400" },
                { value: "taxi", Icon: CarTaxiFront, label: "Taxi", tint: "text-nx-cyan" },
                { value: "delivery", Icon: Package, label: "Delivery", tint: "text-orange-400" },
              ] as const).map(({ value, Icon, label, tint }) => (
                <button
                  key={value}
                  onClick={() => setRideType(value)}
                  className={`rounded-2xl border p-3 text-center transition-all ${
                    rideType === value
                      ? "border-nx-violet bg-nx-violet/10"
                      : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <span className={`flex w-9 h-9 mx-auto items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 ${tint}`}>
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                  <p className="text-[11px] font-semibold mt-1">{label}</p>
                </button>
              ))}
            </div>

            {/* Pickup & destination */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-3">
              <div>
                <label className="text-xs text-white/45 flex items-center gap-1 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Pickup
                </label>
                <select
                  value={fromPlace}
                  onChange={(e) => setFromPlace(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-3 text-sm outline-none focus:border-nx-violet/50"
                >
                  <option value="">Where are you?</option>
                  {placeList.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/45 flex items-center gap-1 mb-1.5">
                  <Navigation className="w-3.5 h-3.5 text-nx-violet" /> Destination
                </label>
                <select
                  value={toPlace}
                  onChange={(e) => setToPlace(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-3 text-sm outline-none focus:border-nx-violet/50"
                >
                  <option value="">Where to?</option>
                  {placeList.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live quote — always shown BEFORE requesting */}
            {q && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-white/45">Your fare</p>
                    <p className="text-3xl font-bold text-emerald-300">KES {q.fare.toLocaleString()}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      ~{q.distanceKm} km · ~{q.durationMin} min
                      {q.surge > 1 ? ` · peak ×${q.surge}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-white/45 space-y-0.5">
                    <p>Base KES {q.breakdown.baseFare}</p>
                    <p>Distance KES {Math.round(q.breakdown.perKm * q.breakdown.distanceKm).toLocaleString()}</p>
                    <p>Protection KES {q.protectionFee}</p>
                    <p className="text-white font-semibold pt-1 border-t border-white/10">
                      Total KES {q.total.toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-[10px] text-white/35">
                  Price is fixed by Nexora's engine from distance & time — riders cannot change it.
                </p>

                {!requestedTripId ? (
                  <button
                    onClick={handleRequestTrip}
                    disabled={busy}
                    className="mt-3 w-full py-3.5 rounded-xl bg-nx-violet font-bold text-sm hover:bg-nx-violet/85 disabled:opacity-40"
                  >
                    {busy ? "Requesting…" : `Request at KES ${q.fare.toLocaleString()}`}
                  </button>
                ) : (
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3.5">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-300" /> Secure your fare
                    </p>
                    <p className="text-xs text-white/45 mt-1">
                      Pay into escrow now — the rider is paid only after you confirm arrival.
                    </p>
                    <button
                      onClick={handleFundTrip}
                      disabled={busy}
                      className="mt-2.5 w-full py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 disabled:opacity-40"
                    >
                      {busy ? "Securing…" : `Pay KES ${q.total.toLocaleString()} to Escrow`}
                    </button>
                  </div>
                )}
              </div>
            )}
            {fromPlace && toPlace && fromPlace === toPlace && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
                Pickup and destination must be different places.
              </p>
            )}

            {/* Riders available now */}
            {providers && providers.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white/85 flex items-center gap-2 mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  {rideType === "boda" ? "Riders" : "Drivers"} available now
                </h3>
                <div className="space-y-2">
                  {(providers as any[])
                    .filter((p) => p.serviceType === rideType)
                    .slice(0, 4)
                    .map((p) => (
                      <div key={p._id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
                        <div className="w-9 h-9 rounded-full bg-nx-violet/15 border border-nx-violet/25 flex items-center justify-center text-nx-violet">
                          {p.serviceType === "boda" ? <Bike className="w-4 h-4" /> : p.serviceType === "taxi" ? <CarTaxiFront className="w-4 h-4" /> : p.serviceType === "tuktuk" ? <CarFront className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{p.displayName}</p>
                          <p className="text-[11px] text-white/40">{p.vehicleModel || p.serviceType} · {p.town}</p>
                        </div>
                        {p.verificationStatus === "verified" && <ShieldCheck className="w-4 h-4 text-nx-cyan shrink-0" />}
                        {!!p.rating && (
                          <span className="text-xs text-amber-300 flex items-center gap-0.5 shrink-0">
                            <Star className="w-3 h-3" /> {p.rating}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MATATU TAB ── */}
        {tab === "matatu" && (
          <div className="mt-5 space-y-4">
            {routes === undefined ? (
              <Loader2 className="w-5 h-5 animate-spin text-white/30 mx-auto my-10" />
            ) : !routes.length ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-8 text-center">
                <p className="text-sm text-white/55">No matatu routes published yet.</p>
                <p className="text-xs text-white/35 mt-1.5">Route fares and schedules are managed by Nexora admin — they'll appear here once live.</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-2">
                  {(routes as any[]).map((r) => (
                    <button
                      key={r._id}
                      onClick={() => { setRouteCode(r.code); setFromStage(null); setToStage(null); }}
                      className={`rounded-2xl border p-3.5 text-left transition-all ${
                        routeCode === r.code ? "border-nx-violet bg-nx-violet/10" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <p className="text-sm font-bold">{r.name}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">Route {r.code} · {r.stages.length} stages</p>
                      {r.notes && <p className="text-[10px] text-white/35 mt-1">{r.notes}</p>}
                    </button>
                  ))}
                </div>

                {activeRoute && (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/45 mb-1.5 block">From stage</label>
                        <select
                          value={fromStage ?? ""}
                          onChange={(e) => setFromStage(Number(e.target.value))}
                          className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm outline-none"
                        >
                          <option value="">Select…</option>
                          {activeRoute.stages.map((s: string, i: number) => (
                            <option key={i} value={i}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-white/45 mb-1.5 block">To stage</label>
                        <select
                          value={toStage ?? ""}
                          onChange={(e) => setToStage(Number(e.target.value))}
                          className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm outline-none"
                        >
                          <option value="">Select…</option>
                          {activeRoute.stages.map((s: string, i: number) => (
                            <option key={i} value={i}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {matatuQuote && (
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.05] p-3.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-white/45">Stage fare</p>
                            <p className="text-2xl font-bold text-emerald-300">KES {matatuQuote.fare.toLocaleString()}</p>
                            <p className="text-[11px] text-white/40">{matatuQuote.fromStage} → {matatuQuote.toStage}</p>
                          </div>
                          <div className="text-right text-[11px] text-white/45">
                            <p>Protection KES {matatuQuote.protectionFee}</p>
                            <p className="text-white font-semibold pt-1 border-t border-white/10">Total KES {matatuQuote.total.toLocaleString()}</p>
                          </div>
                        </div>
                        {matatuQuote.schedule && (
                          <p className="mt-2 text-[11px] text-white/40">🕐 {matatuQuote.schedule}</p>
                        )}
                        <p className="mt-2 text-[10px] text-white/35">
                          Matatu fares are stage-based (official route pricing) — pay the crew or secure via escrow when booking.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── MY TRIPS TAB ── */}
        {tab === "trips" && (
          <div className="mt-5 space-y-3">
            {myTrips === undefined ? (
              <Loader2 className="w-5 h-5 animate-spin text-white/30 mx-auto my-10" />
            ) : !myTrips.length ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-8 text-center">
                <p className="text-sm text-white/55">No trips yet.</p>
                <button onClick={() => switchTab("ride")} className="mt-3 px-5 py-2.5 rounded-xl bg-nx-violet text-sm font-bold hover:bg-nx-violet/85">
                  Get a Ride
                </button>
              </div>
            ) : (
              (myTrips as any[]).map((t) => (
                <div key={t._id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {t.pickup} <span className="text-nx-violet">→</span> {t.destination}
                      </p>
                      <p className="text-[11px] text-white/40 mt-0.5 capitalize">
                        {t.serviceType} · {t.distanceKm} km · {new Date(t.requestedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                      </p>
                      {t.providerName && (
                        <p className="text-xs text-white/60 mt-1.5">
                          {t.providerName}
                          {t.providerVehicle ? ` · ${t.providerVehicle}` : ""}
                          {t.providerPlate ? ` · ${t.providerPlate}` : ""}
                        </p>
                      )}
                      {t.providerPhone && ["accepted", "arriving", "in_progress"].includes(t.status) && (
                        <a href={`tel:${t.providerPhone}`} className="mt-1.5 inline-flex items-center gap-1 text-xs text-nx-cyan">
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-300">KES {t.fare.toLocaleString()}</p>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                        t.status === "completed" ? "text-emerald-300"
                        : t.status === "cancelled" ? "text-red-300"
                        : "text-amber-300"
                      }`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Emergency button for active trips */}
                  {["accepted", "arriving", "in_progress"].includes(t.status) && (
                    <button
                      onClick={() => tripAction(() => raiseEmergency({ tripId: t._id }), "Emergency alert sent — help is being notified")}
                      className="mt-3 w-full py-2 rounded-lg border border-red-400/30 bg-red-500/10 text-xs font-semibold text-red-300 hover:bg-red-500/15 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Emergency / SOS
                    </button>
                  )}

                  {/* Customer actions */}
                  {t.status === "in_progress" && t.customerId === user?._id && (
                    <button
                      onClick={() => tripAction(() => completeTrip({ tripId: t._id }), "Arrival confirmed — payment released to the driver")}
                      disabled={busy}
                      className="mt-3 w-full py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 disabled:opacity-40"
                    >
                      I've arrived — Release KES {t.fare.toLocaleString()}
                    </button>
                  )}
                  {["requested", "funded", "accepted", "arriving"].includes(t.status) && t.customerId === user?._id && (
                    <button
                      onClick={() => tripAction(() => cancelTrip({ tripId: t._id, reason: "Customer cancelled" }), "Trip cancelled" + (t.customerFunded ? " — refunded" : ""))}
                      disabled={busy}
                      className="mt-2 w-full py-2 rounded-lg border border-white/10 text-xs text-white/50 hover:text-white hover:bg-white/5"
                    >
                      Cancel trip{t.customerFunded ? " & refund" : ""}
                    </button>
                  )}
                  {t.status === "completed" && t.customerId === user?._id && !t.rating && t.providerId && (
                    <div className="mt-3 flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => tripAction(() => rateTrip({ tripId: t._id, rating: n }), `Rated ${n}★ — asante!`)}
                          className="flex-1 py-2 rounded-lg border border-amber-400/25 bg-amber-500/5 text-amber-300 text-sm hover:bg-amber-500/15"
                        >
                          {"★".repeat(n)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <MobileBottomNav />
      {/* Help icons on every surface: WhatsApp + NexoraAI */}
      <SupportDock panel="services" stacked message="Hello Nexora Support 👋 I need help with a transport trip." />
    </div>
  );
}
