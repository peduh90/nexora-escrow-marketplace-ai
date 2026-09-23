import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { getWhatsAppSupportUrl, getWhatsAppSellerUrl, openWhatsApp } from "@/lib/whatsapp";
import { getViewerKey } from "@/lib/viewer";
import { buyerProtectionFee, rateLabel } from "@/lib/fees";
import {
  FREELANCE_CATEGORY_GRADIENTS,
  freelanceCategoryName,
  getFreelanceCategory,
  getFreelanceCategoryIcon,
  normalizeFreelanceCategory,
  formatSlug,
} from "@/lib/freelance-marketplace";
import { shortKES } from "@/lib/fees";
import FreelanceNav from "./FreelanceNav";
import {
  Shield, Heart, Share2, MessageSquare, Star, CheckCircle2,
  Truck, Package, X, Loader2, Send, MessageCircle, Briefcase, Wrench, FileText, Lock,
} from "lucide-react";

export default function FreelanceServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const listing = useQuery(
    api.listings.getListing,
    id ? ({ listingId: id as any } as const) : "skip",
  );
  const sellerContact = useQuery(
    api.listings.getSellerWhatsApp,
    id ? ({ listingId: id as any } as const) : "skip",
  );
  const similar = useQuery(api.listings.searchFreelanceListings, {
    query: "",
    category: listing?.category || undefined,
    limit: 6,
  });

  const incrementViews = useMutation(api.listings.incrementViews);
  const createOrder = useMutation(api.wallet.createOrder);
  const startConversation = useMutation(api.messages.startConversation);
  const initiateStkPush = useAction(api.mpesa.initiateStkPush as any);
  // Server-verified payment gate: the backend re-queries Safaricom and stamps
  // verifiedStkPayments; createOrder refuses to fund an escrow without it.
  const verifyStkPayment = useAction(api.mpesa.verifyStkPayment as any);

  const [selectedImage, setSelectedImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showHire, setShowHire] = useState(false);
  const [brief, setBrief] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "mpesa">("wallet");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaStep, setMpesaStep] = useState<"idle" | "sending" | "waiting" | "confirming" | "done" | "error">("idle");
  const [mpesaError, setMpesaError] = useState("");
  const [hiring, setHiring] = useState(false);
  const [hireError, setHireError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  // Conversation opened automatically when the order is placed, so the buyer
  // lands with a direct chat line to the provider and the provider is notified
  // with the actual order brief.
  const [orderConvoId, setOrderConvoId] = useState<string | null>(null);

  useEffect(() => {
    if (listing) {
      incrementViews({
        listingId: listing._id as any,
        viewerKey: getViewerKey(),
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?._id]);

  // Only freelance-marketplace listings live on this page.
  const notFreelance =
    listing !== undefined && listing !== null && (listing as any).marketplace === "product";

  if (listing === undefined) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nx-violet animate-spin" />
      </div>
    );
  }

  if (!listing || notFreelance) {
    return (
      <div className="min-h-screen bg-[#05050A]">
        <FreelanceNav active="services" />
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
          <Package className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {notFreelance ? "This is a product listing" : "Service Not Found"}
          </h2>
          <p className="text-white/40 text-sm mb-6">
            {notFreelance
              ? "Physical products live in the Main Marketplace."
              : "This service may have been removed or completed."}
          </p>
          <button
            onClick={() => navigate(notFreelance ? "/marketplace" : "/freelance")}
            className="px-6 py-2.5 rounded-lg bg-nx-violet text-white text-sm"
          >
            {notFreelance ? "Go to Main Marketplace" : "Browse Freelance Services"}
          </button>
        </div>
      </div>
    );
  }

  const fl = listing as any;
  const category = getFreelanceCategory(fl.category);
  const gradient =
    FREELANCE_CATEGORY_GRADIENTS[fl.category] || FREELANCE_CATEGORY_GRADIENTS["other-services"];
  // Employer protection fee — tiered per Nexora fee schedule (src/lib/fees.ts).
  const buyerFee = buyerProtectionFee("freelance", fl.price);
  const platformFee = buyerFee.fee;
  const grandTotal = fl.price + platformFee;

  const sameCategory = (similar ?? []).filter((s: any) => s._id !== fl._id).slice(0, 4);

  const handleChat = async () => {
    if (!isAuthenticated) {
      navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }
    try {
      const result = await startConversation({
        sellerId: fl.sellerId,
        listingId: fl._id,
        firstMessage: `Hi! I'm interested in your freelance service "${fl.title}" (KES ${fl.price.toLocaleString()}). Can we discuss the details?`,
      });
      if ((result as any)?.conversationId) {
        navigate(`/chat/${(result as any).conversationId}`);
      } else {
        navigate("/chat");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start conversation.");
    }
  };

  const handleHireNow = async () => {
    if (!isAuthenticated) {
      navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!brief.trim()) {
      setHireError("Please briefly describe what you need done.");
      return;
    }

    if (paymentMethod === "mpesa") {
      const phone = mpesaPhone || user?.phone || "";
      if (!phone) {
        setMpesaError("Please enter your M-Pesa phone number.");
        return;
      }
      setHiring(true);
      setMpesaStep("sending");
      setHireError("");
      try {
        const stkResult = await initiateStkPush({
          phoneNumber: phone,
          amount: grandTotal,
          accountReference: `NX-SVC-${fl.title.slice(0, 18)}`,
          description: `Hire: ${fl.title}`,
        });
        setMpesaStep("waiting");
        const checkoutId = (stkResult as any).checkoutRequestId;
        let attempts = 0;
        const poll = async () => {
          attempts++;
          if (attempts > 12) {
            setMpesaStep("error");
            setMpesaError("Payment timed out. Please try again.");
            setHiring(false);
            return;
          }
          try {
            const status = await verifyStkPayment({ checkoutRequestId: checkoutId });
            if (status.paid) {
              setMpesaStep("confirming");
              await finalizeHire("mpesa", checkoutId);
              setMpesaStep("done");
              setHiring(false);
            } else if (status.failed) {
              setMpesaStep("error");
              setMpesaError(status.resultDesc || "Payment failed. Please try again.");
              setHiring(false);
            } else {
              setTimeout(poll, 5000);
            }
          } catch {
            setTimeout(poll, 5000);
          }
        };
        setTimeout(poll, 5000);
      } catch (err: any) {
        setMpesaStep("error");
        setMpesaError(err.message || "Failed to initiate M-Pesa payment.");
        setHiring(false);
      }
      return;
    }

    setHiring(true);
    setHireError("");
    try {
      await finalizeHire("wallet");
    } catch (err: any) {
      setHireError(err.message || "Failed to place order. Please try again.");
    } finally {
      setHiring(false);
    }
  };

  // Shared with the M-Pesa success path. Escrow-backed order for digital work:
  // the "delivery" location is normalized to Online/Digital.
  //
  // Payment method MUST match how the money actually arrived:
  //  - "mpesa"  → STK push succeeded, funds are on the paybill; createOrder
  //               funds the escrow WITHOUT debiting the (uncredited) wallet.
  //  - "wallet" → pre-funded wallet path; createOrder debits the balance.
  // Passing "wallet" after an STK payment threw "Insufficient wallet balance"
  // right after the buyer had already paid — that bug is why this is explicit.
  const finalizeHire = async (
    method: "wallet" | "mpesa",
    stkCheckoutRequestId?: string,
  ) => {
    await createOrder({
      listingId: fl._id,
      sellerId: fl.sellerId,
      amount: fl.price,
      deliveryCounty: "Online",
      deliveryTown: "Digital",
      deliveryAddress: brief.trim(),
      paymentMethod: method,
      // Server-verified payment reference — required for the mpesa path;
      // createOrder will not fund the escrow without a verified stamp.
      stkCheckoutRequestId,
    });

    // Open the order chat with the provider right away — the provider gets a
    // notification containing the real brief, and the buyer has a direct line
    // to coordinate delivery. Best-effort: the order itself is already placed.
    try {
      const result = await startConversation({
        sellerId: fl.sellerId,
        listingId: fl._id,
        firstMessage: `Order confirmed — "${fl.title}" (KES ${fl.price.toLocaleString()}) is paid and held in escrow. My brief: ${brief.trim().slice(0, 400)}`,
      });
      setOrderConvoId((result as any)?.conversationId ?? null);
    } catch {
      setOrderConvoId(null);
    }

    setOrderSuccess(true);
    setShowHire(false);
    setBrief("");
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Plain computation (not a hook): this sits after the loading/not-found early
  // returns, so any hook here would change the render's hook count and crash
  // with React error #310 when the listing data arrived. Object.entries on a
  // small spec object is trivially cheap, so memoization was never needed.
  const entries = Object.entries(fl.attributes || {})
    .filter(
      ([k, v]) =>
        v && k !== "Marketplace" && k !== "Delivery Time" && k !== "Revisions" && k !== "SellerPhone" && k !== "BusinessName",
    )
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#05050A]">
      <FreelanceNav active="services" />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-white/30 mb-5">
          <button onClick={() => navigate("/")} className="hover:text-white/60">Home</button>
          <span>/</span>
          <button onClick={() => navigate("/freelance")} className="hover:text-white/60">Freelance</button>
          <span>/</span>
          <span className="text-white/50">{fl.title}</span>
        </div>

        {orderSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-400">Service booked successfully!</p>
              <p className="text-xs text-white/40 mt-0.5">
                Your payment is protected by escrow until the provider delivers the work.
              </p>
            </div>
            <button
              onClick={() => navigate(orderConvoId ? `/chat/${orderConvoId}` : "/chat")}
              className="ml-auto shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-400/10 text-emerald-300 text-xs font-semibold hover:bg-emerald-400/20 border border-emerald-400/20 transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Chat with provider
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT */}
          <div>
            <div
              className={`aspect-square rounded-2xl border border-white/5 overflow-hidden relative flex items-center justify-center bg-gradient-to-br ${gradient}`}
            >
              {fl.images && fl.images.length > 0 ? (
                <img src={fl.images[selectedImage]} alt={fl.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-white/20">
                  <CategoryBadge slug={fl.category} className="w-16 h-16 text-white/25 mb-3" />
                  <span className="text-xs font-medium uppercase tracking-widest">{freelanceCategoryName(fl.category)}</span>
                </div>
              )}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="text-[11px] px-3 py-1 rounded-full font-semibold bg-black/50 backdrop-blur-sm border border-white/10 text-white flex items-center gap-1.5">
                  <CategoryBadge slug={fl.category} /> {freelanceCategoryName(fl.category)}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setSaved(!saved)}
                  className={`p-2 rounded-full bg-black/40 backdrop-blur-sm ${saved ? "text-red-400" : "text-white/60 hover:text-white"}`}
                >
                  <Heart className={`w-4 h-4 ${saved ? "fill-red-400" : ""}`} />
                </button>
              </div>
            </div>
            {fl.images && fl.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
                {fl.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border shrink-0 transition-all ${
                      selectedImage === i ? "border-nx-violet/50 ring-1 ring-nx-violet/30" : "border-white/5 hover:border-white/15"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Service documents — portfolios, samples, credentials */}
            {Array.isArray(fl.documents) && fl.documents.length > 0 && (
              <div className="mt-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h3 className="text-xs font-semibold text-white/70 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-nx-violet" /> Service documents ({fl.documents.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {fl.documents.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer"
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-nx-violet/10 text-nx-violet hover:bg-nx-violet/20 transition-colors border border-nx-violet/15">
                      {/\.(pdf|docx?|xlsx?|txt|csv)(\?|$)/i.test(url) ? `Document ${i + 1}` : `Sample ${i + 1}`} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-white/30 mb-2">
                <Briefcase className="w-3.5 h-3.5" />
                Freelance Marketplace
                <span className="text-white/10">•</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-nx-emerald" /> Escrow protected</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{fl.title}</h1>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-white">KES {fl.price.toLocaleString()}</span>
                {fl.negotiable && (
                  <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Negotiable</span>
                )}
              </div>
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/50">
                <Package className="w-3.5 h-3.5 text-nx-emerald" /> Digital delivery
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/50">
                {fl.subcategory ? formatSlug(fl.subcategory) : "Online"}
              </span>
            </div>

            {/* Provider */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-nx-violet/10 flex items-center justify-center text-nx-violet text-base font-bold">
                  {(fl.sellerName || "S").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">{fl.sellerName}</span>
                    {fl.sellerVerified && <CheckCircle2 className="w-4 h-4 text-nx-cyan shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/30 mt-0.5">
                    {fl.sellerReputation > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {fl.sellerReputation.toFixed(1)}
                      </span>
                    )}
                    <span>{fl.views} views</span>
                    <span>· {timeAgo(fl.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/freelancer/${fl.sellerId}`)}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-white/50 hover:text-white transition-colors"
                >
                  View Provider
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleChat}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-nx-violet/10 text-nx-violet text-xs font-semibold hover:bg-nx-violet/20 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> Message Provider
                </button>
                <button
                  onClick={() =>
                    sellerContact?.phone
                      ? openWhatsApp(
                          getWhatsAppSellerUrl(
                            sellerContact.phone,
                            fl.title,
                            fl.price,
                          ),
                        )
                      : openWhatsApp(
                          getWhatsAppSupportUrl(
                            `I'm interested in "${fl.title}" (KES ${fl.price.toLocaleString()}). Is it still available?`,
                          ),
                        )
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors border border-emerald-500/15"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
              </div>
            </div>

            {/* Hire CTA */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
                  return;
                }
                setShowHire(true);
              }}
              className="w-full py-3.5 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Wrench className="w-5 h-5" /> Hire Now — KES {fl.price.toLocaleString()}
            </button>
            <p className="text-[11px] text-white/25 text-center -mt-2 flex items-center justify-center gap-1.5">
              <Shield className="w-3 h-3 text-nx-emerald" />
              Money held in escrow. Released only when you approve the delivered work.
            </p>

            {/* Key facts */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">Protection</p>
                <p className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Escrow + Disputes
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">Category</p>
                <p className="text-sm font-medium text-white flex items-center gap-1.5">
                  <CategoryBadge slug={fl.category} /> {freelanceCategoryName(fl.category)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description + specs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-6">
              <h2 className="text-lg font-bold text-white mb-4">About this service</h2>
              <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">{fl.description}</p>
            </div>

            {entries.length > 0 && (
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-6">
                <h2 className="text-lg font-bold text-white mb-4">What you get</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {entries.map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.01]">
                      <CheckCircle2 className="w-4 h-4 text-nx-emerald shrink-0" />
                      <span className="text-xs text-white/60">
                        <span className="text-white/30">{key}: </span>
                        <span className="text-white/80 font-medium">{String(val)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* How it works card */}
          <div className="space-y-3 h-fit rounded-xl bg-white/[0.02] border border-white/5 p-6">
            <h3 className="text-sm font-bold text-white">How hiring works</h3>
            {[
              { n: "1", t: "Book & pay", d: "Funds are held securely in escrow." },
              { n: "2", t: "Provider delivers", d: "Work is delivered online within the agreed time." },
              { n: "3", t: "You approve", d: "Review the work and confirm — funds are released." },
            ].map((s) => (
              <div key={s.n} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-nx-violet/15 text-nx-violet text-[11px] font-bold flex items-center justify-center shrink-0">
                  {s.n}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{s.t}</p>
                  <p className="text-[11px] text-white/35 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
            <p className="text-[11px] text-white/25 pt-2 border-t border-white/5">
              Not satisfied? Open a dispute and Nexora's AI helps review the evidence.
            </p>
          </div>
        </div>

        {/* Similar services */}
        {sameCategory.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-white mb-4">Similar services</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sameCategory.map((svc: any) => (
                <button
                  key={svc._id}
                  onClick={() => {
                    setSelectedImage(0);
                    setShowHire(false);
                    navigate(`/freelance/service/${svc._id}`);
                  }}
                  className="text-left rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-nx-violet/20 hover:bg-white/[0.03] transition-all group"
                >
                  <div className={`aspect-[4/3] bg-gradient-to-br ${FREELANCE_CATEGORY_GRADIENTS[svc.category] || FREELANCE_CATEGORY_GRADIENTS["other-services"]} flex items-center justify-center`}>
                    {svc.images?.[0] ? (
                      <img src={svc.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <CategoryBadge slug={svc.category} className="w-10 h-10 text-white/25" />
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs text-white/70 font-medium truncate group-hover:text-white transition-colors">{svc.title}</h4>
                    <p className="text-sm font-bold text-white mt-1">{shortKES(svc.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hire modal */}
      {showHire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHire(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0E0E18] border border-white/5 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Hire this freelancer</h3>
              <button onClick={() => setShowHire(false)} className="p-1 text-white/30 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4">
              <div className="w-12 h-12 rounded-lg bg-nx-violet/10 flex items-center justify-center text-2xl shrink-0">
                <CategoryBadge slug={fl.category} className="w-6 h-6 text-nx-violet" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{fl.title}</p>
                <p className="text-xs text-white/40">by {fl.sellerName}</p>
                <p className="text-sm font-bold text-white mt-0.5">KES {fl.price.toLocaleString()}</p>
              </div>
            </div>

            <label className="block text-xs font-medium text-white/60 mb-1.5">Describe your project *</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              placeholder="What do you need done? Include scope, deadlines, references..."
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none resize-none mb-4"
            />

            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Payment method</h4>
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors border-white/5 bg-white/[0.02]">
                <input type="radio" name="pay" checked={paymentMethod === "wallet"} onChange={() => setPaymentMethod("wallet")} className="text-nx-violet" />
                <div>
                  <p className="text-sm text-white">Nexora Wallet</p>
                  <p className="text-[11px] text-white/30">Pay from your wallet balance</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "mpesa" ? "border-nx-violet/30 bg-nx-violet/5" : "border-white/5 bg-white/[0.02]"}`}>
                <input type="radio" name="pay" checked={paymentMethod === "mpesa"} onChange={() => setPaymentMethod("mpesa")} className="text-nx-violet" />
                <div>
                  <p className="text-sm text-white">M-Pesa</p>
                  <p className="text-[11px] text-white/30">Pay via M-Pesa STK Push</p>
                </div>
              </label>
            </div>

            {paymentMethod === "mpesa" && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-white/50 mb-1.5">M-Pesa Phone Number</label>
                <input type="tel" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="0712 345 678"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              </div>
            )}

            {mpesaStep !== "idle" && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                mpesaStep === "error" ? "bg-red-400/5 border border-red-400/10 text-red-400" :
                mpesaStep === "done" ? "bg-emerald-400/5 border border-emerald-400/10 text-emerald-400" :
                "bg-nx-cyan/5 border border-nx-cyan/10 text-nx-cyan"
              }`}>
                {mpesaStep === "sending" && <><Loader2 className="w-4 h-4 animate-spin" /> Sending M-Pesa prompt...</>}
                {mpesaStep === "waiting" && <><Loader2 className="w-4 h-4 animate-spin" /> Enter your M-Pesa PIN...</>}
                {mpesaStep === "confirming" && <><Loader2 className="w-4 h-4 animate-spin" /> Booking your service...</>}
                {mpesaStep === "done" && <><CheckCircle2 className="w-4 h-4" /> Payment successful!</>}
                {mpesaStep === "error" && <>{mpesaError}</>}
              </div>
            )}
            {hireError && <p className="text-sm text-red-400 mb-3">{hireError}</p>}

            <div className="space-y-2 mb-4 text-sm p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex justify-between text-white/40"><span>Service price</span><span>KES {fl.price.toLocaleString()}</span></div>
              <div className="flex justify-between text-white/40"><span>Employer Protection ({rateLabel(buyerFee.rate)}) — escrow included</span><span>KES {platformFee.toLocaleString()}</span></div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-white/5"><span>Total</span><span>KES {grandTotal.toLocaleString()}</span></div>
            </div>

            <button
              onClick={handleHireNow}
              disabled={hiring || !brief.trim() || (paymentMethod === "mpesa" && mpesaStep !== "idle")}
              className="w-full py-3 rounded-xl bg-nx-violet text-white font-semibold text-sm hover:bg-nx-violet/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {hiring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {hiring
                ? "Processing..."
                : paymentMethod === "mpesa"
                ? `Pay KES ${grandTotal.toLocaleString()} via M-Pesa`
                : `Book & Pay KES ${grandTotal.toLocaleString()}`}
            </button>
            <p className="text-[11px] text-white/20 text-center mt-2 inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 shrink-0" /> Funds are held in escrow until you approve the work.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Lucide category icon resolved through the shared taxonomy (legacy-safe). */
function CategoryBadge({ slug, className = "w-4 h-4" }: { slug: string; className?: string }) {
  const Icon = getFreelanceCategoryIcon(normalizeFreelanceCategory(slug));
  return <Icon className={className} />;
}
