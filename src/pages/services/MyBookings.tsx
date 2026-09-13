import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import NavigationBar from "@/components/layout/NavigationBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import SupportDock from "@/components/SupportDock";
import { ArrowLeft, Loader2, Phone, Star, Lock } from "lucide-react";

/** Customer's local-service bookings: request → funded → accepted → done. */
export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mine = useQuery(api.services.getMyService);
  const fund = useMutation(api.services.fundServiceRequest);
  const cancel = useMutation(api.services.cancelServiceRequest);
  const complete = useMutation(api.services.completeServiceRequest);
  const rate = useMutation(api.services.rateServiceRequest);
  const [busy, setBusy] = useState(false);

  // getMyService returns the provider view; for the customer side we reuse the
  // same table through the provider dashboard when the user is a provider.
  // Here we need the customer's own requests:
  const requests = useQuery(api.services.getMyBookings);

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

  if (requests === undefined) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  const active = (requests as any[]).filter((r) => ["pending", "funded", "accepted", "in_progress"].includes(r.status));
  const past = (requests as any[]).filter((r) => ["completed", "cancelled", "declined"].includes(r.status));

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-24 md:pb-8">
      <NavigationBar />
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-10 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/services")} className="p-2 rounded-lg bg-white/[0.04] border border-white/8 text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">My Bookings</h1>
            <p className="text-xs text-white/40 mt-0.5">Your service requests — money stays in escrow until you confirm.</p>
          </div>
        </div>

        {active.length === 0 && past.length === 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-10 text-center">
            <p className="text-sm text-white/55">No bookings yet.</p>
            <button onClick={() => navigate("/services")} className="mt-3 px-5 py-2.5 rounded-xl bg-nx-cyan text-black text-sm font-bold hover:bg-nx-cyan/85">
              Find a Service
            </button>
          </div>
        )}

        {active.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-white/85 mb-2">Active ({active.length})</h2>
            <div className="space-y-2">
              {active.map((r) => (
                <div key={r._id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">"{r.title}"</p>
                      <p className="text-xs text-white/45 mt-0.5">{r.providerName} · {r.serviceType}</p>
                      {r.providerPhone && ["accepted", "in_progress"].includes(r.status) && (
                        <a href={`tel:${r.providerPhone}`} className="mt-1.5 inline-flex items-center gap-1 text-xs text-nx-cyan"><Phone className="w-3 h-3" /> Call provider</a>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-300">KES {r.amount.toLocaleString()}</p>
                      <span className={`text-[10px] font-semibold uppercase ${r.status === "funded" ? "text-emerald-300" : "text-amber-300"}`}>{r.status}</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {r.status === "pending" && (
                      <button onClick={() => run(() => fund({ requestId: r._id }), "Payment secured — the provider is notified")} disabled={busy} className="w-full py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 disabled:opacity-40 flex items-center justify-center gap-1.5">
                        <Lock className="w-4 h-4" /> Pay KES {r.amount.toLocaleString()} to Escrow
                      </button>
                    )}
                    {r.status === "funded" && (
                      <p className="text-[11px] text-white/45 bg-white/[0.03] rounded-lg p-2.5">💰 Money is safely held. Waiting for {r.providerName} to accept.</p>
                    )}
                    {r.status === "accepted" && (
                      <p className="text-[11px] text-nx-violet bg-nx-violet/10 rounded-lg p-2.5">✅ Accepted! Waiting for the provider to start.</p>
                    )}
                    {r.status === "in_progress" && (
                      <button onClick={() => run(() => complete({ requestId: r._id }), "Thank you! Payment released to the provider")} disabled={busy} className="w-full py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 disabled:opacity-40">
                        Job done — Release KES {r.amount.toLocaleString()}
                      </button>
                    )}
                    {["pending", "funded", "accepted"].includes(r.status) && (
                      <button onClick={() => run(() => cancel({ requestId: r._id, reason: "Customer cancelled" }), r.customerFunded ? "Cancelled — money refunded" : "Cancelled")} disabled={busy} className="w-full py-2 rounded-lg border border-white/10 text-xs text-white/50 hover:text-white hover:bg-white/5">
                        Cancel{r.customerFunded ? " & get refund" : ""}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-white/85 mb-2">Past</h2>
            <div className="space-y-1.5">
              {past.slice(0, 10).map((r) => (
                <div key={r._id} className="rounded-xl border border-white/6 bg-white/[0.02] px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white/75 truncate">"{r.title}" — {r.providerName}</p>
                      <p className="text-[10px] text-white/35">{new Date(r.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-white/60">KES {r.amount.toLocaleString()}</p>
                      <span className={`text-[10px] ${r.status === "completed" ? "text-emerald-300" : "text-white/35"}`}>{r.status}</span>
                    </div>
                  </div>
                  {r.status === "completed" && !r.rating && (
                    <div className="mt-2 flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => run(() => rate({ requestId: r._id, rating: n }), `Rated ${n}★ — asante!`)}
                          className="flex-1 py-1.5 rounded-lg border border-amber-400/25 bg-amber-500/5 text-amber-300 text-xs hover:bg-amber-500/15"
                        >
                          {"★".repeat(n)}
                        </button>
                      ))}
                    </div>
                  )}
                  {!!r.rating && <p className="mt-1.5 text-[10px] text-amber-300">Your rating: {"★".repeat(r.rating)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <MobileBottomNav />
      {/* Help icons on every surface: WhatsApp + NexoraAI */}
      <SupportDock panel="services" stacked message="Hello Nexora Support 👋 I need help with my bookings." />
    </div>
  );
}
