import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { serviceImage } from "@/lib/service-images";
import NavigationBar from "@/components/layout/NavigationBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import {
  ArrowLeft, Star, MapPin, Loader2, MessageCircle, ShieldCheck, Clock, Lock, Phone,
} from "lucide-react";

/** Normalize a Kenyan phone number into wa.me digits (2547XXXXXXXX). */
function waDigits(raw?: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/[^0-9]/g, "");
  if (d.length < 9) return null;
  if (d.startsWith("254")) return d;
  if (d.startsWith("0")) return `254${d.slice(1)}`;
  if (d.startsWith("7") || d.startsWith("1")) return `254${d}`;
  return d;
}

/**
 * One provider: what they do, where, how much, what others say — and the
 * two-tap booking flow (request → fund escrow) with the price visible first.
 */
export default function ProviderProfile() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const provider = useQuery(
    api.services.getProvider,
    providerId ? { providerId: providerId as any } : "skip",
  );
  const reviews = useQuery(
    api.services.getProviderReviews,
    providerId ? { providerId: providerId as any } : "skip",
  );
  const wallet = useQuery(api.wallet.getWalletBalance);

  const requestService = useMutation(api.services.requestService);
  const fundRequest = useMutation(api.services.fundServiceRequest);
  const startConversation = useMutation(api.messages.startConversation);

  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const p = provider as any;

  async function handleBook() {
    if (!user) {
      navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!providerId || !p) return;
    setBusy(true);
    try {
      const res = await requestService({
        providerId: providerId as any,
        title: title.trim() || `${p.serviceType} service`,
        description: when.trim() ? `Preferred time: ${when.trim()}` : undefined,
      });
      setPendingId(res.requestId);
      toast.success("Request sent — now secure it with escrow");
    } catch (err: any) {
      toast.error(err?.message || "Could not send the request");
    } finally {
      setBusy(false);
    }
  }

  async function handleFund() {
    if (!pendingId) return;
    setBusy(true);
    try {
      await fundRequest({ requestId: pendingId as any });
      toast.success("Payment secured! The provider has been notified.");
      setPendingId(null);
      navigate("/services/bookings");
    } catch (err: any) {
      toast.error(err?.message || "Could not secure the payment");
    } finally {
      setBusy(false);
    }
  }

  async function handleChat() {
    if (!user) {
      navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }
    try {
      const res = await startConversation({
        sellerId: (provider as any).userId ?? providerId!,
        listingId: providerId!,
        firstMessage: `Hi, I'm interested in your ${p?.serviceType} service.`,
      });
      navigate(`/chat/${res.conversationId}`);
    } catch (err: any) {
      toast.error(err?.message || "Could not start the chat");
    }
  }

  if (provider === undefined) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }
  if (!provider) {
    return (
      <div className="min-h-screen bg-[#05050A] text-white flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-white/60">This service doesn't exist (anymore).</p>
        <button onClick={() => navigate("/services")} className="text-nx-cyan text-sm underline">Back to Services</button>
      </div>
    );
  }

  const wa = waDigits(p.whatsapp || p.phone);
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${p.displayName}, I found you on Nexora Market — I'm interested in your ${p.serviceType} service.`)}` : null;

  const price = p.pricingMode !== "quote" && p.basePrice
    ? `${p.pricingMode === "starting_from" ? "from " : ""}KES ${p.basePrice.toLocaleString()}`
    : "Ask price first";
  const protection = p.basePrice ? Math.max(1, Math.round(p.basePrice * 0.01)) : 0;

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-24 md:pb-8">
      <NavigationBar />

      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-10">
        <button
          onClick={() => navigate(`/services/category/${p.category}`)}
          className="p-2 rounded-lg bg-white/[0.04] border border-white/8 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Provider header — big shop/profile cover first, then identity.
            The provider's uploaded photo IS the storefront visual (the same
            weight as a freelance service card), with the category photo as
            fallback so a profile never looks empty. */}
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden">
          <div className="aspect-[21/8] bg-gradient-to-br from-nx-cyan/10 via-nx-violet/10 to-transparent relative">
            {(p.image || serviceImage(p.category)) ? (
              <img
                src={p.image || serviceImage(p.category)}
                alt=""
                className="w-full h-full object-cover opacity-80"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="p-5 -mt-8 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.displayName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-nx-violet/40 shadow-xl shadow-black/50 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-nx-violet/15 border-2 border-nx-violet/40 flex items-center justify-center text-3xl shrink-0">
                  🧑‍🔧
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">{p.displayName}</h1>
                <p className="text-sm text-white/45">{p.serviceType}</p>
              </div>
            </div>
            {p.availability === "available_now" ? (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AVAILABLE NOW
              </span>
            ) : (
              <span className="shrink-0 text-[10px] text-white/35 border border-white/10 rounded-full px-2.5 py-1">
                {p.availability === "busy" ? "BUSY" : "OFFLINE"}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/50">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {p.town}, {p.county}</span>
            {!!p.rating && (
              <span className="flex items-center gap-1 text-amber-300">
                <Star className="w-3.5 h-3.5" /> {p.rating} ({p.ratingCount})
              </span>
            )}
            <span>{p.completedJobs} job{p.completedJobs === 1 ? "" : "s"} completed</span>
            {p.verified && (
              <span className="flex items-center gap-1 text-nx-cyan font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified by Nexora
              </span>
            )}
            {p.workingHours && (
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {p.workingHours}</span>
            )}
            {p.phone && !wa && (
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {p.phone}</span>
            )}
          </div>
          {p.tagline && <p className="mt-3 text-sm text-white/70">{p.tagline}</p>}
          </div>
        </div>

        {/* Price + booking */}
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40">Price</p>
              <p className="text-2xl font-bold text-emerald-300">{price}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/90 px-3.5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.05-.52-.099-.148-.669-1.612-.916-2.207-.242-.579-.487-.487-.669-.487-.173 0-.371-.025-.57-.025-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp
                </a>
              )}
              <button
                onClick={handleChat}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 px-3.5 py-2.5 text-sm text-white/75 hover:bg-white/5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Chat first
              </button>
            </div>
          </div>

          {p.pricingMode !== "quote" ? (
            <div className="mt-4 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`What do you need? e.g. "Cut my hair" or "Fix my sink"`}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-nx-cyan/50 placeholder:text-white/25"
              />
              <input
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                placeholder="When? e.g. Today 4pm (optional)"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-nx-cyan/50 placeholder:text-white/25"
              />

              {p.basePrice ? (
                <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3 text-xs text-white/50 space-y-1">
                  <div className="flex justify-between"><span>Service</span><span className="text-white/80">KES {p.basePrice.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Nexora protection (1%)</span><span className="text-white/80">KES {protection.toLocaleString()}</span></div>
                  <div className="flex justify-between font-semibold text-white pt-1 border-t border-white/8">
                    <span>You pay now (held safely)</span>
                    <span>KES {(p.basePrice + protection).toLocaleString()}</span>
                  </div>
                </div>
              ) : null}

              {!pendingId ? (
                <button
                  onClick={handleBook}
                  disabled={busy || p.availability === "off"}
                  className="w-full py-3.5 rounded-xl bg-nx-cyan text-black font-bold text-sm hover:bg-nx-cyan/85 transition-colors disabled:opacity-40"
                >
                  {busy ? "Sending…" : p.availability === "off" ? "Not accepting requests" : `Request & Pay Safely`}
                </button>
              ) : (
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
                  <p className="text-sm font-semibold text-emerald-200 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" /> Request sent — secure your payment
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    Your money goes to escrow first. The provider is paid only after you confirm the job is done.
                  </p>
                  <button
                    onClick={handleFund}
                    disabled={busy}
                    className="mt-3 w-full py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-40"
                  >
                    {busy ? "Securing…" : `Pay KES ${(p.basePrice + protection).toLocaleString()} to Escrow`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-xs text-white/45 bg-white/[0.03] rounded-xl p-3">
              This provider discusses each job individually — tap "Chat first" to agree on the work and price, then book from your conversation.
            </p>
          )}

          {(wallet?.walletBalance ?? 0) < (p.basePrice ?? 0) + protection && p.pricingMode !== "quote" && (
            <button
              onClick={() => navigate("/buyer/wallet")}
              className="mt-3 w-full text-xs text-amber-300 hover:text-amber-200"
            >
              Wallet low — top up with M-Pesa first →
            </button>
          )}
        </div>

        {/* Reviews */}
        <div className="mt-6">
          <h2 className="text-sm font-bold text-white/85 mb-2">What customers say</h2>
          {reviews === undefined ? (
            <div className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
          ) : !reviews.length ? (
            <p className="text-xs text-white/35 bg-white/[0.02] rounded-xl p-4">
              No ratings yet — completed jobs get real ratings only.
            </p>
          ) : (
            <div className="space-y-2">
              {(reviews as any[]).map((r) => (
                <div key={r._id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/80">{r.authorName}</span>
                    <span className="text-amber-300 text-xs flex items-center gap-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </span>
                  </div>
                  {r.comment && <p className="mt-1.5 text-xs text-white/55">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
