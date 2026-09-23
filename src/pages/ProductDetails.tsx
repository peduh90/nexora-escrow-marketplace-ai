import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { getDeliveryFee } from "@/lib/delivery-config";
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react";
import { shareListing } from "@/lib/share";
import {
  Shield, Heart, Share2, MessageSquare, ShoppingCart, ArrowLeft, Star, MapPin, Clock,
  CheckCircle2, Truck, ChevronRight, Package, Eye, X, Minus, Plus, Loader2, Send, MessageCircle, Phone, FileText,
  Boxes, Hammer, Gift, Lock,
} from "lucide-react";
import { getWhatsAppSellerUrl, getWhatsAppSupportUrl, openWhatsApp, normalizeKenyanPhone } from "@/lib/whatsapp";
import { getViewerKey } from "@/lib/viewer";
import { buyerProtectionFee, rateLabel } from "@/lib/fees";
import { setMeta, listingMeta } from "@/lib/seo";

/**
 * useQuery that degrades to `null` on error instead of re-throwing during
 * render. A single failed query (bad id format from a stale share link, a
 * transient backend error, an auth hiccup) must show the graceful
 * "Product Not Found" screen — never the crash boundary.
 */
function useSafeQuery<T = any>(query: any, args: any): T | undefined | null {
  try {
    return useQuery(query, args) as T | undefined;
  } catch {
    return null;
  }
}

/** Show the most relevant attributes per category */
function CategoryAttributes({ category, attributes }: { category: string; attributes?: Record<string, string> }) {
  if (!attributes || Object.keys(attributes).length === 0) return null;
  const entries = Object.entries(attributes).filter(([, v]) => v);
  if (entries.length === 0) return null;

  const relevantKeys: Record<string, string[]> = {
    vehicles: ["Make", "Model", "Year", "Transmission", "Fuel", "Mileage", "Engine"],
    "phones-tablets": ["Storage", "RAM", "Camera", "Battery Health"],
    electronics: ["Processor", "RAM", "Storage", "Screen Size", "Brand"],
    "home-furniture": ["Material", "Colour", "Dimensions", "Type"],
    fashion: ["Size", "Colour", "Material", "Style", "Brand"],
    property: ["Bedrooms", "Bathrooms", "Size", "Type"],
  };

  const preferred = relevantKeys[category] || [];
  const display = entries
    .sort((a, b) => {
      const ai = preferred.indexOf(a[0]);
      const bi = preferred.indexOf(b[0]);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return 0;
    })
    .slice(0, 6);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {display.map(([key, val]) => (
        <div key={key} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01]">
          <span className="text-xs text-white/30">{key}</span>
          <span className="text-xs text-white/70 font-medium">{val}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProductDetails() {
  // Guard the route param: a malformed/stale share link must produce the
  // graceful "Product Not Found" screen — never a Convex client-side
  // argument-validation crash that kills the whole page.
  const { id: rawId } = useParams();
  const id =
    typeof rawId === "string" && rawId.trim().length > 0 ? rawId.trim() : undefined;
  const navigate = useNavigate();
  const { user } = useAuth();
  const listing = useSafeQuery(api.listings.getListing, id ? { listingId: id as any } : "skip");
  // The seller's registered WhatsApp number for this listing (falls back to
  // platform support when the seller has no phone on file).
  const sellerContact = useSafeQuery(
    api.listings.getSellerWhatsApp,
    id ? { listingId: id as any } : "skip"
  );
  const sellerPhone = (listing?.attributes as any)?.SellerPhone || sellerContact?.phone || null;
  const incrementViews = useMutation(api.listings.incrementViews);
  const createOrder = useMutation(api.wallet.createOrder);
  const initiateStkPush = useAction(api.mpesa.initiateStkPush as any);
  // Server-verified payment gate: the backend re-queries Safaricom and stamps
  // verifiedStkPayments; createOrder refuses to fund an escrow without it.
  const verifyStkPayment = useAction(api.mpesa.verifyStkPayment as any);
  const startConversation = useMutation(api.messages.startConversation);
  // sendMessage removed - startConversation handles the first message internally
  const sendMessage = useMutation(api.messages.sendMessage);
  const allListings = useSafeQuery(api.listings.getActiveListings, { limit: 100 });

  const [selectedImage, setSelectedImage] = useState(0);
  const [showOffer, setShowOffer] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [deliveryCounty, setDeliveryCounty] = useState("");
  const [deliveryTown, setDeliveryTown] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "mpesa" | "airtel_money" | "card">("wallet");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [mpesaStep, setMpesaStep] = useState<"idle" | "sending" | "waiting" | "confirming" | "done" | "error">("idle");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaError, setMpesaError] = useState("");
  // ── Unified payment engine (Airtel Money / Card) ──
  const providerAvailability = useSafeQuery(api.paymentStore.providerAvailability, {});
  const initiatePayment = useAction(api.payments.initiatePayment as any);
  const verifyUnifiedPayment = useAction(api.payments.verifyPayment as any);
  const [airtelPhone, setAirtelPhone] = useState("");
  const [upStep, setUpStep] = useState<"idle" | "sending" | "waiting" | "confirming" | "done" | "error">("idle");
  const [upError, setUpError] = useState("");

  // ── Structured landmark delivery (#72) + saved addresses (#73) ──
  const [deliveryArea, setDeliveryArea] = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [deliveryBuilding, setDeliveryBuilding] = useState("");
  const [deliveryFloorUnit, setDeliveryFloorUnit] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [deliveryPin, setDeliveryPin] = useState("");
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressBookOpen, setAddressBookOpen] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const savedAddresses = useSafeQuery(api.addresses.listAddresses, user ? {} : "skip");
  const saveAddress = useMutation(api.addresses.saveAddress);
  // Phase 2: pickup hubs (#71) + recurring orders (#65)
  const hubs = useSafeQuery(api.hubs.listActiveHubs, {});
  const startRecurring = useMutation(api.recurring.startRecurring);
  const [collectAtHub, setCollectAtHub] = useState(false);
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const [repeatOrder, setRepeatOrder] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<"weekly" | "monthly">("monthly");
  // ── Phase 3: gift/diaspora (#106/#107), rental days (#67) ──
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientCounty, setRecipientCounty] = useState("");
  const [recipientTown, setRecipientTown] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [rentalDays, setRentalDays] = useState("");
  const isRentalListing = !!(listing as any)?.rental;
  const rentalPrice = isRentalListing && rentalDays
    ? Math.max(
        Number((listing as any).minRentalDays ?? 1),
        Number(rentalDays),
      ) * (listing as any).ratePerDay + ((listing as any).depositAmount ?? 0)
    : 0;
  const selectedHub = hubs?.find((h: any) => h._id === selectedHubId);

  // ── SEO / social preview: WhatsApp-shared links show real product info ──
  useEffect(() => {
    if (listing) {
      setMeta(listingMeta(listing as any, (listing as any).marketplace === "freelance" ? "freelance" : "product"));
    }
  }, [listing?.title, listing?.price, (listing as any)?.images?.length]);

  // ── Card checkout return handler ──
  // Flutterwave redirects back to ?paid=1&ref=NX-TX-...; the order payload was
  // stashed in sessionStorage before the redirect. Verify server-side, then
  // create the escrow order exactly like the in-app flows do.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!params.get("paid") || !ref) return;
    const key = "nx_pending_order:" + ref;
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      // Unknown session (e.g. paid on another device) — payment reconciles via
      // webhook + admin view; show success but no order to avoid double-charge.
      setOrderSuccess(true);
      return;
    }
    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.removeItem(key);
    let cancelled = false;
    (async () => {
      try {
        const status = await verifyUnifiedPayment({ reference: ref });
        if (cancelled) return;
        if (status.status !== "paid") {
          if (status.status === "failed") {
            alert("Your card payment failed — no order was created. Please try again.");
          }
          return;
        }
        await createOrder({
          listingId: payload.listingId,
          sellerId: payload.sellerId,
          amount: payload.amount,
          deliveryCounty: payload.deliveryCounty,
          deliveryTown: payload.deliveryTown,
          deliveryAddress: payload.deliveryAddress,
          paymentMethod: "card",
          paymentReference: ref,
          deliveryFee: payload.deliveryFee,
          deliveryArea: payload.deliveryArea,
          deliveryLandmark: payload.deliveryLandmark,
          deliveryBuilding: payload.deliveryBuilding,
          deliveryFloorUnit: payload.deliveryFloorUnit,
          deliveryInstructions: payload.deliveryInstructions,
          deliveryPin: payload.deliveryPin,
          deliveryAddressId: payload.deliveryAddressId,
          ...(payload.recipientName ? {
            recipientName: payload.recipientName,
            recipientPhone: payload.recipientPhone,
            recipientCounty: payload.recipientCounty,
            recipientTown: payload.recipientTown,
            giftNote: payload.giftNote,
          } : {}),
        });
        if (cancelled) return;
        setOrderSuccess(true);
        // Clean the URL so refresh can't re-trigger.
        window.history.replaceState({}, "", window.location.pathname);
      } catch (err: any) {
        console.error("Card return order failed:", err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = async () => {
    if (!listing) return;
    const result = await shareListing({
      title: listing.title,
      price: price,
      sellerName: listing.sellerName,
      listingId: id as string,
      location: [listing.originTown, listing.originCounty].filter(Boolean).join(", "),
    });
    if (result === "copied") {
      setShareNote("Link copied — share on WhatsApp, SMS or anywhere");
      setTimeout(() => setShareNote(""), 2600);
    }
  };

  /** Apply a saved address to the checkout form (#73: "Deliver to Home"). */
  const applySavedAddress = (a: any) => {
    setSelectedAddressId(a._id);
    setDeliveryCounty(a.county ?? "");
    setDeliveryTown(a.town ?? "");
    setDeliveryAddress([a.area, a.building, a.floorUnit].filter(Boolean).join(", "));
    setDeliveryArea(a.area ?? "");
    setDeliveryLandmark(a.landmark ?? "");
    setDeliveryBuilding(a.building ?? "");
    setDeliveryFloorUnit(a.floorUnit ?? "");
    setDeliveryInstructions(a.instructions ?? "");
    setDeliveryPin(a.pin ?? "");
  };

  const clearAddressForm = () => {
    setSelectedAddressId(null);
    setDeliveryCounty(""); setDeliveryTown(""); setDeliveryAddress("");
    setDeliveryArea(""); setDeliveryLandmark(""); setDeliveryBuilding("");
    setDeliveryFloorUnit(""); setDeliveryInstructions(""); setDeliveryPin("");
  };

  /** Opt-in subscription after a successful order (#65) — best-effort. */
  const startRecurringIfRequested = async () => {
    if (!repeatOrder || !user || !listing) return;
    try {
      await startRecurring({
        listingId: listing._id,
        quantity,
        frequency: repeatFrequency,
      });
    } catch {
      // Non-fatal — the paid order already succeeded.
    }
  };

  /**
   * Save the entered address to the user's private address book (#73).
   * Best-effort: a failed save must never block a paid order.
   */
  const persistAddressIfRequested = async () => {
    if (!saveThisAddress || selectedAddressId || !user) return;
    if (!deliveryCounty.trim() || !deliveryTown.trim()) return;
    try {
      const res = await saveAddress({
        label: addressLabel,
        county: deliveryCounty.trim(),
        town: deliveryTown.trim(),
        area: deliveryArea.trim() || undefined,
        landmark: deliveryLandmark.trim() || undefined,
        direction: deliveryInstructions.trim() || undefined,
        building: deliveryBuilding.trim() || undefined,
        floorUnit: deliveryFloorUnit.trim() || undefined,
        instructions: deliveryInstructions.trim() || undefined,
        pin: deliveryPin.trim() || undefined,
        isDefault: false,
      });
      setSelectedAddressId(res.addressId as unknown as string);
      setSaveThisAddress(false);
    } catch {
      // Non-fatal — the order itself already succeeded.
    }
  };

  // Freelance (digital service) listings live on the Freelance Marketplace
  // detail page — never render the physical-goods flow for them here.
  const isFreelanceListing = !!listing && (listing as any).marketplace === "freelance";
  useEffect(() => {
    if (isFreelanceListing && id) {
      navigate(`/freelance/service/${id}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFreelanceListing, id]);

  // Record one real view per viewer per listing (deduped server-side).
  // Runs in an effect — never during render — so reactive updates can't loop.
  useEffect(() => {
    if (id && listing && !isFreelanceListing) {
      incrementViews({
        listingId: id as any,
        viewerKey: getViewerKey(),
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, (listing as any)?._id]);

  if (listing === undefined || isFreelanceListing) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nx-violet animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Product Not Found</h2>
          <p className="text-white/40 text-sm mb-6">This product may have been removed or sold.</p>
          <button onClick={() => navigate("/marketplace")} className="px-6 py-2.5 rounded-lg bg-nx-violet text-white text-sm">
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  // ── Defensive data guard ─────────────────────────────────────────────
  // Older/edited rows can carry weak or missing fields. Normalise once so
  // no rendering path below can ever throw on undefined/null values.
  const price = Number(listing.price) || 0;
  const views = Number(listing.views) || 0;
  const favorites = Number(listing.favorites) || 0;
  const sellerReputation = Number(listing.sellerReputation) || 0;
  const createdAt =
    typeof listing.createdAt === "number" && listing.createdAt > 0
      ? listing.createdAt
      : Date.now();
  const images = (Array.isArray(listing.images) ? listing.images : []).filter(
    (img: any): img is string => typeof img === "string" && img.length > 0,
  );
  const mainImage = images[selectedImage] ?? images[0];

  const originalPrice = Number((listing as any).originalPrice) || 0;
  const delivery = getDeliveryFee(listing.originCounty);
  // Rental (#67): the charged amount is days × rate + refundable deposit.
  // Wholesale (#63): bulk buyers pay the tier unit price for their quantity.
  const chargeBase = (() => {
    if (isRentalListing) {
      if (!rentalPrice) return price;
      return rentalPrice;
    }
    if ((listing as any).wholesale && quantity > 1) {
      const tiers = ((listing as any).tierPrices || []) as { minQty: number; price: number }[];
      const eligible = tiers.filter((t) => quantity >= t.minQty).sort((a, b) => b.minQty - a.minQty)[0];
      if (eligible) return eligible.price * quantity;
    }
    return price * quantity;
  })();
  const totalAmount = chargeBase;
  // Buyer protection fee — tiered per Nexora fee schedule (src/lib/fees.ts).
  const buyerFee = buyerProtectionFee("product", totalAmount);
  const platformFee = buyerFee.fee;
  const deliveryFee = delivery.free ? 0 : delivery.fee;
  // With hub collection (#71) the hub's fee replaces the door-delivery fee;
  // declared after the hub state below via hoisted let bindings.
  const grandTotal = totalAmount + platformFee + (collectAtHub && selectedHub ? (selectedHub.fee ?? 0) : deliveryFee);

  const handleBuyNow = async () => {
    if (!user) {
      navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!deliveryCounty || !deliveryTown || !deliveryAddress) return;

    // ── M-Pesa STK Push flow ──
    if (paymentMethod === "mpesa") {
      const phone = mpesaPhone || user.phone || "";
      if (!phone) {
        setMpesaError("Please enter your M-Pesa phone number.");
        return;
      }
      setOrdering(true);
      setMpesaStep("sending");
      setMpesaError("");
      try {
        const stkResult = await initiateStkPush({
          phoneNumber: phone,
          amount: grandTotal,
          accountReference: `NX-${listing.title.slice(0, 20)}`,
          description: `Payment for ${listing.title}`,
        });
        setMpesaStep("waiting");
        // Poll for status every 5 seconds, max 60 seconds
        const checkoutId = stkResult.checkoutRequestId;
        let attempts = 0;
        const poll = async () => {
          attempts++;
          if (attempts > 12) {
            setMpesaStep("error");
            setMpesaError("Payment timed out. Please try again.");
            setOrdering(false);
            return;
          }
          try {
            const status = await verifyStkPayment({ checkoutRequestId: checkoutId });
            if (status.paid) {
              // Payment confirmed SERVER-SIDE — create the order/escrow
              setMpesaStep("confirming");
              await createOrder({
                listingId: listing._id,
                sellerId: listing.sellerId,
                amount: totalAmount,
                deliveryCounty,
                deliveryTown,
                deliveryAddress,
                paymentMethod: "mpesa",
                stkCheckoutRequestId: checkoutId,
                deliveryFee: collectAtHub && selectedHub ? (selectedHub.fee ?? 0) : deliveryFee,
                deliveryArea: deliveryArea || undefined,
                deliveryLandmark: deliveryLandmark || undefined,
                deliveryBuilding: deliveryBuilding || undefined,
                deliveryFloorUnit: deliveryFloorUnit || undefined,
                deliveryInstructions: deliveryInstructions || undefined,
                deliveryPin: deliveryPin || undefined,
                deliveryAddressId: selectedAddressId ?? undefined,
                // Phase 3: gift/diaspora recipient rides with the order.
                ...(isGift ? {
                  recipientName: recipientName || undefined,
                  recipientPhone: recipientPhone || undefined,
                  recipientCounty: recipientCounty || undefined,
                  recipientTown: recipientTown || undefined,
                  giftNote: giftNote || undefined,
                } : {}),
              });
              await persistAddressIfRequested();
              await startRecurringIfRequested();
              setMpesaStep("done");
              setOrderSuccess(true);
              setShowCheckout(false);
            } else if (status.failed) {
              setMpesaStep("error");
              setMpesaError(status.resultDesc || "Payment failed. Please try again.");
              setOrdering(false);
            } else {
              // Still processing
              setTimeout(poll, 5000);
            }
          } catch {
            setTimeout(poll, 5000);
          }
        };
        setTimeout(poll, 5000);
      } catch (err: any) {
        setMpesaStep("error");
        setMpesaError(err.message || "Failed to initiate M-Pesa payment. Please try again.");
        setOrdering(false);
      }
      return;
    }

    // ── Unified payment engine: Airtel Money & Card ──
    if (paymentMethod === "airtel_money" || paymentMethod === "card") {
      const provider = paymentMethod;
      if (provider === "airtel_money" && !airtelPhone) {
        setUpError("Please enter your Airtel Money number.");
        return;
      }
      // Provider availability comes from the server (env-driven, reactive).
      if (providerAvailability && !providerAvailability[provider]) {
        setUpError(
          provider === "airtel_money"
            ? "Airtel Money is coming soon — not configured yet."
            : "Card payments are coming soon — not configured yet.",
        );
        return;
      }
      setOrdering(true);
      setUpStep("sending");
      setUpError("");
      try {
        const initiated = await initiatePayment({
          provider,
          purpose: "order",
          amount: totalAmount,
          marketplace: (listing as any).marketplace === "freelance" ? "freelance" : "product",
          msisdn: provider === "airtel_money" ? airtelPhone : undefined,
          listingTitle: listing.title,
          extraCharge:
            (collectAtHub && selectedHub ? (selectedHub.fee ?? 0) : deliveryFee) || 0,
          redirectUrl:
            provider === "card"
              ? `${window.location.origin}/product/${listing._id}?paid=1`
               : undefined,
        });

        // ── Card: hosted checkout — stash order payload, open Flutterwave ──
        if (provider === "card" && initiated.checkoutUrl) {
          sessionStorage.setItem(
            "nx_pending_order:" + initiated.reference,
            JSON.stringify({
              listingId: listing._id,
              sellerId: listing.sellerId,
              amount: totalAmount,
              deliveryCounty,
              deliveryTown,
              deliveryAddress,
              deliveryFee: collectAtHub && selectedHub ? (selectedHub.fee ?? 0) : deliveryFee,
              deliveryArea: deliveryArea || undefined,
              deliveryLandmark: deliveryLandmark || undefined,
              deliveryBuilding: deliveryBuilding || undefined,
              deliveryFloorUnit: deliveryFloorUnit || undefined,
              deliveryInstructions: deliveryInstructions || undefined,
              deliveryPin: deliveryPin || undefined,
              deliveryAddressId: selectedAddressId ?? undefined,
              recipientName: recipientName || undefined,
              recipientPhone: recipientPhone || undefined,
              recipientCounty: recipientCounty || undefined,
              recipientTown: recipientTown || undefined,
              giftNote: giftNote || undefined,
            }),
          );
          window.location.href = initiated.checkoutUrl;
          return;
        }

        // ── Airtel: USSD push — poll server-verified status ──
        setUpStep("waiting");
        let attempts = 0;
        const pollUnified = async () => {
          attempts++;
          if (attempts > 24) {
            setUpStep("error");
            setUpError("Payment timed out — if you completed the payment, the order will be created automatically within minutes.");
            setOrdering(false);
            return;

          }
          try {
            const status = await verifyUnifiedPayment({ reference: initiated.reference });
            if (status.status === "paid") {
              setUpStep("confirming");
              await createOrder({
                listingId: listing._id,
                sellerId: listing.sellerId,
                amount: totalAmount,
                deliveryCounty,
                deliveryTown,
                deliveryAddress,
                paymentMethod: provider,
                paymentReference: initiated.reference,
                deliveryFee: collectAtHub && selectedHub ? (selectedHub.fee ?? 0) : deliveryFee,
                deliveryArea: deliveryArea || undefined,
                deliveryLandmark: deliveryLandmark || undefined,
                deliveryBuilding: deliveryBuilding || undefined,
                deliveryFloorUnit: deliveryFloorUnit || undefined,
                deliveryInstructions: deliveryInstructions || undefined,
                deliveryPin: deliveryPin || undefined,
                deliveryAddressId: selectedAddressId ?? undefined,
                ...(isGift ? { recipientName: recipientName || undefined, recipientPhone: recipientPhone || undefined, recipientCounty: recipientCounty || undefined, recipientTown: recipientTown || undefined, giftNote: giftNote || undefined } : {}),
              });
              await persistAddressIfRequested();
              await startRecurringIfRequested();
              setUpStep("done");
              setOrderSuccess(true);
              setShowCheckout(false);
              setOrdering(false);
            } else if (status.status === "failed") {
              setUpStep("error");
              setUpError(status.reason || "Payment failed — please try again.");
              setOrdering(false);
            } else {
              setTimeout(pollUnified, 5000);
           }
          } catch {
            setTimeout(pollUnified, 5000);
          }
        };
        setTimeout(pollUnified, 5000);
      } catch (err: any) {
        setUpStep("error");
        setUpError(err.message || "Failed to start the payment. Please try again.");
        setOrdering(false);
      }
      return;
    }

    // ── Wallet flow ──
    setOrdering(true);
    try {
      const landmarkFields = {
        deliveryArea: deliveryArea || undefined,
        deliveryLandmark: deliveryLandmark || undefined,
        deliveryBuilding: deliveryBuilding || undefined,
        deliveryFloorUnit: deliveryFloorUnit || undefined,
        deliveryInstructions: deliveryInstructions || undefined,
        deliveryPin: deliveryPin || undefined,
        deliveryAddressId: selectedAddressId ?? undefined,
        // Phase 3: gift/diaspora recipient rides with the order.
        ...(isGift ? {
          recipientName: recipientName || undefined,
          recipientPhone: recipientPhone || undefined,
          recipientCounty: recipientCounty || undefined,
          recipientTown: recipientTown || undefined,
          giftNote: giftNote || undefined,
        } : {}),
      };
      await createOrder({
        listingId: listing._id,
        sellerId: listing.sellerId,
        amount: totalAmount,
        deliveryCounty,
        deliveryTown,
        deliveryAddress,
        paymentMethod: "wallet",
        deliveryFee: collectAtHub && selectedHub ? (selectedHub.fee ?? 0) : deliveryFee,
        ...landmarkFields,
      });
      await persistAddressIfRequested();
      await startRecurringIfRequested();
      setOrderSuccess(true);
      setShowCheckout(false);
    } catch (err: any) {
      alert(err.message || "Failed to place order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  const handleSendOffer = async () => {
    if (!user) {
      navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!offerPrice) return;
    try {
      const result = await startConversation({
        sellerId: listing.sellerId,
        listingId: listing._id as any,
        firstMessage: `💰 Offer: KES ${Number(offerPrice).toLocaleString()} for "${listing.title}" (Listed at KES ${price.toLocaleString()})`,
      });
      setShowOffer(false);
      setOfferPrice("");
      if (result?.conversationId) {
        navigate(`/chat/${result.conversationId}`);
      } else {
        navigate("/chat");
      }
    } catch (err: any) {
      alert(err.message || "Failed to send offer.");
    }
  };

  const handleChatSeller = async () => {
    if (!user) {
      navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }
    try {
      const result = await startConversation({
        sellerId: listing.sellerId,
        listingId: listing._id as any,
        firstMessage: `Hi, I'm interested in "${listing.title}" (KES ${price.toLocaleString()}). Is it still available?`,
      });
      if (result?.conversationId) {
        navigate(`/chat/${result.conversationId}`);
      } else {
        navigate("/chat");
      }
    } catch (err: any) {
      alert(err.message || "Failed to start conversation.");
    }
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

  return (
    <div className="min-h-screen bg-[#05050A]">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[#0A0A12]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h3 className="text-sm text-white/60 truncate">{listing.title}</h3>
          </div>
          <button onClick={handleShare} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors" title="Share">
            <Share2 className="w-5 h-5" />
            {shareNote && <span className="sr-only">{shareNote}</span>}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-white/30 mb-6">
          <button onClick={() => navigate("/")} className="hover:text-white/60">Home</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate("/marketplace")} className="hover:text-white/60">Marketplace</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/50">{listing.title}</span>
        </div>

        {/* Order success banner */}
        {orderSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Order placed successfully!</p>
                <p className="text-xs text-white/40 mt-0.5">Your payment is now protected by escrow. The seller has been notified.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Images */}
          <div>
            <div className="aspect-square rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden flex items-center justify-center mb-4">
              {mainImage ? (
                <img src={mainImage} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-32 h-32 text-white/5" />
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-white/5 text-white/60">
                  {listing.condition || "New"}
                </span>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button onClick={() => setSaved(!saved)} className={`p-2 rounded-full bg-black/40 backdrop-blur-sm ${saved ? "text-red-400" : "text-white/60 hover:text-white"}`}>
                  <Heart className={`w-4 h-4 ${saved ? "fill-red-400" : ""}`} />
                </button>
              </div>
              {images && images.length > 1 && (
                <div className="absolute bottom-4 right-4 text-xs text-white/30 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                  {selectedImage + 1} / {images.length}
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {images && images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border shrink-0 transition-all ${selectedImage === i ? "border-nx-violet/50 ring-1 ring-nx-violet/30" : "border-white/5 hover:border-white/10"}`}>
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Documents — spec sheets, invoices, warranties uploaded by the seller */}
            {Array.isArray(listing.documents) && listing.documents.length > 0 && (
              <div className="mt-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h3 className="text-xs font-semibold text-white/70 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-nx-violet" /> Documents ({listing.documents.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.documents.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer"
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-nx-violet/10 text-nx-violet hover:bg-nx-violet/20 transition-colors border border-nx-violet/15">
                      {/\.(pdf|docx?|xlsx?|txt|csv)(\?|$)/i.test(url) ? `Document ${i + 1}` : `Attachment ${i + 1}`} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Info */}
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{listing.title}</h1>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl font-bold text-white">KES {price.toLocaleString()}</span>
                {originalPrice > price && (
                  <span className="text-sm text-white/30 line-through">KES {originalPrice.toLocaleString()}</span>
                )}
                {listing.negotiable && (
                  <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Negotiable</span>
                )}
              </div>
            </div>

            {/* ── Phase 3: Wholesale tiers (#63) ── */}
            {(listing as any).wholesale && (
              <div className="p-4 rounded-xl bg-nx-violet/[0.05] border border-nx-violet/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-nx-violet" /> Wholesale pricing (B2B)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-nx-violet/15 text-nx-violet font-bold">MOQ {(listing as any).moq}</span>
                </div>
                <div className="space-y-1">
                  {((listing as any).tierPrices || []).map((t: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
                      <span className="text-white/45">Buy {t.minQty}+ units</span>
                      <span className="text-white font-semibold">KES {t.price.toLocaleString()} / unit</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-white/35 mt-2">Order in bulk at checkout — or chat with the seller for a custom quote.</p>
              </div>
            )}

            {/* ── Phase 3: Rental (#67) ── */}
            {(listing as any).rental && (
              <div className="p-4 rounded-xl bg-amber-300/[0.05] border border-amber-300/20">
                <span className="text-sm font-semibold text-white flex items-center gap-2 mb-1.5">
                  <Hammer className="w-4 h-4 text-amber-300" /> Also available for hire
                </span>
                <p className="text-xs text-white/50">
                  <span className="text-amber-300 font-bold">KES {(listing as any).ratePerDay?.toLocaleString()}</span> per day
                  {((listing as any).minRentalDays ?? 1) > 1 && <> · minimum {(listing as any).minRentalDays} days</>}
                  {((listing as any).depositAmount ?? 0) > 0 && <> · refundable deposit KES {(listing as any).depositAmount.toLocaleString()}</>}
                </p>
                <p className="text-[11px] text-white/35 mt-1.5">Hire fee + deposit are held in escrow — the deposit comes back when the item returns in good shape. Choose days at checkout.</p>
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {listing.escrowProtection && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/5 border border-emerald-400/10 text-xs text-emerald-400">
                  <Shield className="w-3.5 h-3.5" /> Escrow Protected
                </div>
              )}
              {listing.transportAvailable && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-cyan/5 border border-nx-cyan/10 text-xs text-nx-cyan">
                  <Truck className="w-3.5 h-3.5" /> Delivery Available
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/40">
                <MapPin className="w-3.5 h-3.5" /> {listing.originTown}, {listing.originCounty}
              </div>
              {listing.sellerVerified && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-cyan/5 border border-nx-cyan/10 text-xs text-nx-cyan">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Seller
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-nx-cyan" />
                <span className="text-sm font-medium text-white">Delivery</span>
              </div>
              <p className="text-xs text-white/40">Delivery is handled by Nexora Market. Select your delivery location at checkout.</p>
              <p className="text-xs text-white/30 mt-1">Estimated: {delivery.estimatedDays}</p>
            </div>              {/* Seller Info */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              {/* Gas seller branded banner */}
              {listing.attributes?.BusinessName?.includes("Gas") && (
                <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <span className="text-base font-extrabold text-emerald-400 tracking-tight">Gas! Gas! Gas!</span>
                  <span className="text-sm text-white/50">|</span>
                  <span className="text-sm font-semibold text-white">{listing.attributes.BusinessName}</span>
                  <span className="text-xs text-emerald-400 ml-auto">FREE DELIVERY</span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-nx-violet/10 flex items-center justify-center text-nx-violet text-lg font-bold">
                  {listing.sellerName?.charAt(0) || "S"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">{listing.sellerName}</span>
                    {listing.sellerVerified && <CheckCircle2 className="w-4 h-4 text-nx-cyan shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {sellerReputation > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-white/60">{sellerReputation.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Direct seller phone for gas sellers */}
              {sellerPhone && (
                <div className="flex gap-2 mb-3">
                  <a
                    href={`https://wa.me/${normalizeKenyanPhone(sellerPhone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp: {sellerPhone}
                  </a>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleChatSeller}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-nx-violet/10 text-nx-violet text-xs font-medium hover:bg-nx-violet/20 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" /> Chat Seller
                </button>
                <button
                  onClick={() => {
                    if (sellerPhone) {
                      openWhatsApp(getWhatsAppSellerUrl(sellerPhone, listing.title, price));
                    } else {
                      openWhatsApp(getWhatsAppSupportUrl(`I'm interested in "${listing.title}" (KES ${price.toLocaleString()}). Is it still available?`));
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button onClick={() => navigate(`/seller/${listing.sellerId}`)}
                  className="flex items-center justify-center px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/50 text-xs font-medium hover:text-white/70 transition-colors">
                  View Profile
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button onClick={() => { if (!user) { navigate("/auth?intent=buy&returnTo=" + encodeURIComponent(window.location.pathname + window.location.search)); return; } setShowCheckout(true); }}
                className="w-full py-3.5 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" /> BUY NOW — KES {price.toLocaleString()}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { if (!user) { navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname + window.location.search)); return; } setShowCheckout(true); }}
                  className="py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/70 text-sm font-medium hover:bg-white/[0.05] transition-colors">
                  Add to Cart
                </button>
                {listing.negotiable && (
                  <button onClick={() => { if (!user) { navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname)); return; } setShowOffer(true); }}
                    className="py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/70 text-sm font-medium hover:bg-white/[0.05] transition-colors">
                    Make Offer
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleChatSeller}
                  className="py-3 rounded-xl bg-nx-cyan/10 text-nx-cyan text-sm font-medium hover:bg-nx-cyan/20 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Chat with Seller
                </button>
                <button
                  onClick={() => {
                    if (sellerPhone) {
                      openWhatsApp(getWhatsAppSellerUrl(sellerPhone, listing.title, price));
                    } else {
                      openWhatsApp(getWhatsAppSupportUrl(`I'm interested in "${listing.title}" (KES ${price.toLocaleString()}). Is it still available?`));
                    }
                  }}
                  className="py-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2 border border-emerald-500/20"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Seller
                </button>
              </div>
              <button
                onClick={() => {
                  if (sellerPhone) {
                    openWhatsApp(getWhatsAppSellerUrl(sellerPhone, listing.title, price));
                  } else {
                    openWhatsApp(getWhatsAppSupportUrl(`I need help with: ${listing.title} (KES ${price.toLocaleString()})`));
                  }
                }}
                className="w-full py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> {sellerPhone && listing.attributes?.BusinessName ? `Contact ${listing.attributes.BusinessName} on WhatsApp` : "Contact Nexora Support"}
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-white/25">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {views.toLocaleString()} views</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {favorites} favorites</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Category-specific Specifications */}
        {listing.attributes && Object.keys(listing.attributes).length > 0 && (
          <div className="mt-10 rounded-xl bg-white/[0.02] border border-white/5 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Product Specifications</h2>
            <CategoryAttributes category={listing.category} attributes={listing.attributes} />
          </div>
        )}

        {/* Description */}
        <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/5 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Description</h2>
          <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
        </div>

        {/* Safety notice */}
        <div className="mt-6 p-4 rounded-xl bg-nx-violet/5 border border-nx-violet/10">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-nx-violet shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Buyer Protection Active</p>
              <p className="text-xs text-white/40 mt-1">All payments are held in escrow until you confirm delivery. If something goes wrong, Nexora Market will help resolve it.</p>
            </div>
          </div>
        </div>

        {/* Similar Items */}
        {allListings && allListings.length > 0 && (() => {
          const similar = allListings
            .filter((l: any) => l._id !== listing._id && (l.category === listing.category || l.sellerId === listing.sellerId))
            .slice(0, 4);
          if (similar.length === 0) return null;
          return (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-white mb-4">Similar Items</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {similar.map((item: any) => (
                  <button key={item._id} onClick={() => navigate(`/product/${item._id}`)}
                    className="text-left rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-all group">
                    <div className="aspect-[4/3] bg-white/[0.03] overflow-hidden">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-white/10" /></div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm text-white/70 font-medium truncate group-hover:text-white transition-colors">{item.title}</h4>
                      <p className="text-sm font-bold text-white mt-0.5">KES {(item.price || 0).toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Make Offer Modal */}
      {showOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOffer(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-[#0E0E18] border border-white/5 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Make an Offer</h3>
              <button onClick={() => setShowOffer(false)} className="p-1 text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-white/30 mb-4">Listed price: KES {price.toLocaleString()}</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-white/60 mb-1.5">Your Offer (KES)</label>
              <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="Enter your offer"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 text-lg text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30 font-bold" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowOffer(false)} className="flex-1 py-2.5 rounded-lg text-sm text-white/40 hover:bg-white/[0.03]">Cancel</button>
              <button onClick={handleSendOffer} disabled={!offerPrice}
                className="flex-1 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 disabled:opacity-30 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Send Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0E0E18] border border-white/5 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Checkout</h3>
              <button onClick={() => setShowCheckout(false)} className="p-1 text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Product summary */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4">
              <div className="w-14 h-14 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0 overflow-hidden">
                {images && images[0] ? (
                  <img src={images[0]} alt="" className="w-full h-full object-cover" />
                ) : <Package className="w-6 h-6 text-white/10" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{listing.title}</p>
                <p className="text-xs text-white/40">{listing.sellerName}</p>
                <p className="text-sm font-bold text-white mt-0.5">KES {price.toLocaleString()}</p>
              </div>
            </div>

            {/* Delivery Location — structured landmark addressing (#72/#73) */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Delivery Location</h4>
                {savedAddresses && savedAddresses.length > 0 && (
                  <button type="button" onClick={() => setAddressBookOpen((v) => !v)} className="text-[11px] text-nx-cyan hover:underline">
                    {addressBookOpen ? "Hide saved" : `📍 Saved (${savedAddresses.length})`}
                  </button>
                )}
              </div>

              {addressBookOpen && savedAddresses && savedAddresses.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {savedAddresses.map((a: any) => (
                    <button key={a._id} type="button" onClick={() => applySavedAddress(a)}
                      className={`text-left p-2.5 rounded-lg border text-xs transition-colors ${
                        selectedAddressId === a._id
                          ? "border-nx-violet/40 bg-nx-violet/10 text-white"
                          : "border-white/5 bg-white/[0.02] text-white/60 hover:border-white/15"
                      }`}>
                      <p className="font-medium text-white/90 flex items-center gap-1">
                        {a.label}
                        {a.isDefault && <span className="text-[9px] px-1 rounded bg-nx-cyan/15 text-nx-cyan">default</span>}
                        {a.verifiedDelivery && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      </p>
                      <p className="text-white/40 truncate mt-0.5">{[a.town, a.area || a.landmark].filter(Boolean).join(", ")}</p>
                    </button>
                  ))}
                  <button type="button" onClick={clearAddressForm} className="p-2.5 rounded-lg border border-dashed border-white/10 text-white/40 text-xs hover:text-white/70 hover:border-white/20">
                    + New address
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={deliveryCounty} onChange={(e) => setDeliveryCounty(e.target.value)} placeholder="County *"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
                <input type="text" value={deliveryTown} onChange={(e) => setDeliveryTown(e.target.value)} placeholder="Town *"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              </div>
              <input type="text" value={deliveryArea} onChange={(e) => { setDeliveryArea(e.target.value); setSelectedAddressId(null); }} placeholder="Estate / Village / Area (e.g. Kimathi Estate)"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={deliveryLandmark} onChange={(e) => { setDeliveryLandmark(e.target.value); setSelectedAddressId(null); }} placeholder="Nearby landmark (e.g. Total station)"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
                <input type="text" value={deliveryBuilding} onChange={(e) => { setDeliveryBuilding(e.target.value); setSelectedAddressId(null); }} placeholder="Building / Gate *"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={deliveryFloorUnit} onChange={(e) => { setDeliveryFloorUnit(e.target.value); setSelectedAddressId(null); }} placeholder="Floor / Unit / House (optional)"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
                <input type="text" value={deliveryPin} onChange={(e) => { setDeliveryPin(e.target.value); setSelectedAddressId(null); }} placeholder="Map pin / GPS (optional)"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              </div>
              <input type="text" value={deliveryInstructions} onChange={(e) => { setDeliveryInstructions(e.target.value); setSelectedAddressId(null); }} placeholder="Directions for the rider (optional)"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              <input type="text" value={deliveryAddress} onChange={(e) => { setDeliveryAddress(e.target.value); setSelectedAddressId(null); }} placeholder="Full address line (auto-filled) *"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />

              {/* Save this address for next time (#73) */}
              {!selectedAddressId && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={saveThisAddress} onChange={(e) => setSaveThisAddress(e.target.checked)} className="accent-nx-violet" />
                  <span className="text-xs text-white/50">Save this address for next time</span>
                </label>
              )}
              {saveThisAddress && !selectedAddressId && (
                <div className="flex flex-wrap gap-1.5">
                  {["Home", "Work", "Shop", "Farm", "Other"].map((l) => (
                    <button key={l} type="button" onClick={() => setAddressLabel(l)}
                      className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                        addressLabel === l ? "border-nx-violet/40 bg-nx-violet/15 text-white" : "border-white/10 text-white/40 hover:text-white/70"
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-white/20">🚚 Delivery is handled by Nexora Market. Landmarks help your rider find you fast.</p>

              {/* Pickup hubs (#71): collect instead of door delivery */}
              {hubs && hubs.length > 0 && (
                <div className="p-3 rounded-lg bg-nx-cyan/[0.04] border border-nx-cyan/15 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={collectAtHub} onChange={(e) => setCollectAtHub(e.target.checked)} className="accent-nx-cyan" />
                    <span className="text-xs text-white/70 font-medium">Collect at a Nexora pickup hub instead</span>
                  </label>
                  {collectAtHub && (
                    <select value={selectedHubId ?? ""} onChange={(e) => setSelectedHubId(e.target.value)}
                      className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-nx-cyan/50">
                      <option value="">Choose a hub…</option>
                      {hubs.map((h: any) => (
                        <option key={h._id} value={h._id}>
                          {h.name} — {h.town}, {h.county}{h.fee ? ` (KES ${h.fee})` : " (FREE)"}
                        </option>
                      ))}
                    </select>
                  )}
                  {collectAtHub && selectedHub && (
                    <p className="text-[11px] text-white/40">
                      {[selectedHub.landmark, selectedHub.directions, selectedHub.hours].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              )}

              {/* ── Phase 3: Gift / Diaspora delivery (#106/#107) ── */}
              <div className="p-3 rounded-lg bg-nx-violet/[0.04] border border-nx-violet/15 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} className="accent-nx-violet" />
                  <span className="text-xs text-white/70 font-medium flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-nx-violet" /> Deliver to someone else (gift / family / diaspora)</span>
                </label>
                {isGift && (
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Recipient name *"
                      className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-nx-violet/50" />
                    <input type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="Recipient phone *"
                      className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-nx-violet/50" />
                    <input type="text" value={recipientCounty} onChange={(e) => setRecipientCounty(e.target.value)} placeholder="Their county"
                      className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-nx-violet/50" />
                    <input type="text" value={recipientTown} onChange={(e) => setRecipientTown(e.target.value)} placeholder="Their town / estate"
                      className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-nx-violet/50" />
                    <input type="text" value={giftNote} onChange={(e) => setGiftNote(e.target.value)} placeholder="Note on the delivery e.g. Birthday gift 🎂"
                      className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-nx-violet/50 sm:col-span-2" />
                    <p className="text-[11px] text-white/30 sm:col-span-2">You pay; they receive. We only share their details with the delivery team.</p>
                  </div>
                )}
              </div>

              {/* ── Phase 3: Rental days (#67) ── */}
              {isRentalListing && (
                <div className="p-3 rounded-lg bg-amber-300/[0.05] border border-amber-300/15 space-y-2">
                  <label className="text-xs text-white/70 font-medium flex items-center gap-1.5"><Hammer className="w-3.5 h-3.5 text-amber-300" /> Hire days</label>
                  <input type="number" min={1} value={rentalDays} onChange={(e) => setRentalDays(e.target.value)}
                    placeholder={`Days (min ${(listing as any).minRentalDays ?? 1})`}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-amber-300/50" />
                  {rentalPrice > 0 && (
                    <p className="text-[11px] text-amber-200/80">
                      {Number(rentalDays || 0)} day(s) × KES {(listing as any).ratePerDay?.toLocaleString()} + refundable deposit KES {((listing as any).depositAmount ?? 0).toLocaleString()} = <span className="font-bold">KES {rentalPrice.toLocaleString()}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Repeat this order (#65): opt-in subscription */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={repeatOrder} onChange={(e) => setRepeatOrder(e.target.checked)} className="accent-nx-cyan" />
                <span className="text-xs text-white/50">Repeat this order every {repeatFrequency === "weekly" ? "week" : "month"}</span>
              </label>
              {repeatOrder && (
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setRepeatFrequency("weekly")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] border ${repeatFrequency === "weekly" ? "border-nx-cyan/40 bg-nx-cyan/15 text-white" : "border-white/10 text-white/40"}`}>Weekly</button>
                  <button type="button" onClick={() => setRepeatFrequency("monthly")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] border ${repeatFrequency === "monthly" ? "border-nx-cyan/40 bg-nx-cyan/15 text-white" : "border-white/10 text-white/40"}`}>Monthly</button>
                  <p className="text-[11px] text-white/25 self-center">Reminders only — you confirm every order.</p>
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Payment Method</h4>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'wallet' ? 'border-nx-violet/30 bg-nx-violet/5' : 'border-white/5 bg-white/[0.02]'}">
                <input type="radio" name="payment" value="wallet" checked={paymentMethod === "wallet"} onChange={() => setPaymentMethod("wallet")} className="text-nx-violet" />
                <div>
                  <p className="text-sm text-white">Nexora Wallet</p>
                  <p className="text-[11px] text-white/30">Pay from your wallet balance</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'mpesa' ? 'border-nx-violet/30 bg-nx-violet/5' : 'border-white/5 bg-white/[0.02]'}`}>
                <input type="radio" name="payment" value="mpesa" checked={paymentMethod === "mpesa"} onChange={() => setPaymentMethod("mpesa")} className="text-nx-violet" />
                <div>
                  <p className="text-sm text-white">M-Pesa</p>
                  <p className="text-[11px] text-white/30">Pay via M-Pesa STK Push</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "airtel_money" ? "border-nx-violet/30 bg-nx-violet/5" : "border-white/5 bg-white/[0.02]"} ${providerAvailability && !providerAvailability.airtel_money ? "opacity-50" : ""}`}>
                <input type="radio" name="payment" value="airtel_money" checked={paymentMethod === "airtel_money"} onChange={() => setPaymentMethod("airtel_money")} className="text-nx-violet" />
                <div>
                  <p className="text-sm text-white">Airtel Money</p>
                  <p className="text-[11px] text-white/30">{providerAvailability && !providerAvailability.airtel_money ? "Coming soon" : "Pay via Airtel Money push"}</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "card" ? "border-nx-violet/30 bg-nx-violet/5" : "border-white/5 bg-white/[0.02]"} ${providerAvailability && !providerAvailability.card ? "opacity-50" : ""}`}>
                <input type="radio" name="payment" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} className="text-nx-violet" />
                <div>
                  <p className="text-sm text-white">Visa / Mastercard</p>
                  <p className="text-[11px] text-white/30">{providerAvailability && !providerAvailability.card ? "Coming soon" : "Secure card checkout · 3D Secure"}</p>
                </div>
              </label>
            </div>

            {/* Airtel Money phone input */}
            {paymentMethod === "airtel_money" && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-white/50 mb-1.5">Airtel Money Phone Number</label>
                <input type="tel" value={airtelPhone} onChange={(e) => setAirtelPhone(e.target.value)} placeholder="0732 345 678"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
                <p className="text-[11px] text-white/20 mt-1">You'll receive a payment prompt on this number</p>
              </div>
            )}

            {/* Card notice */}
            {paymentMethod === "card" && (
              <div className="mb-4 p-3 rounded-lg text-sm bg-nx-cyan/5 border border-nx-cyan/10 text-nx-cyan flex items-center gap-2">
                <Lock className="w-4 h-4" /> You'll complete payment on a secure hosted page — your card details never touch Nexora.
              </div>
            )}

            {/* Unified payment status (Airtel) */}
            {paymentMethod === "airtel_money" && upStep !== "idle" && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                upStep === "error" ? "bg-red-400/5 border border-red-400/10 text-red-400" :
                upStep === "done" ? "bg-emerald-400/5 border border-emerald-400/10 text-emerald-400" :
                "bg-nx-cyan/5 border border-nx-cyan/10 text-nx-cyan"
              }`}>
                {upStep === "sending" && <><Loader2 className="w-4 h-4 animate-spin" /> Sending Airtel Money prompt to your phone...</>}
                {upStep === "waiting" && <><Loader2 className="w-4 h-4 animate-spin" /> Enter your Airtel Money PIN on your phone...</>}
                {upStep === "confirming" && <><Loader2 className="w-4 h-4 animate-spin" /> Payment confirmed! Creating your order...</>}
                {upStep === "done" && <><CheckCircle2 className="w-4 h-4" /> Payment successful! Order placed.</>}
                {upStep === "error" && <>{upError}</>}
              </div>
            )}

            {/* M-Pesa phone input */}
            {paymentMethod === "mpesa" && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-white/50 mb-1.5">M-Pesa Phone Number</label>
                <input type="tel" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} placeholder="0712 345 678"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
                <p className="text-[11px] text-white/20 mt-1">You'll receive an STK Push prompt on this number</p>
              </div>
            )}

            {/* M-Pesa status messages */}
            {paymentMethod === "mpesa" && mpesaStep !== "idle" && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                mpesaStep === "error" ? "bg-red-400/5 border border-red-400/10 text-red-400" :
                mpesaStep === "done" ? "bg-emerald-400/5 border border-emerald-400/10 text-emerald-400" :
                "bg-nx-cyan/5 border border-nx-cyan/10 text-nx-cyan"
              }`}>
                {mpesaStep === "sending" && <><Loader2 className="w-4 h-4 animate-spin" /> Sending M-Pesa prompt to your phone...</>}
                {mpesaStep === "waiting" && <><Loader2 className="w-4 h-4 animate-spin" /> Enter your M-Pesa PIN on your phone...</>}
                {mpesaStep === "confirming" && <><Loader2 className="w-4 h-4 animate-spin" /> Payment confirmed! Creating your order...</>}
                {mpesaStep === "done" && <><CheckCircle2 className="w-4 h-4" /> Payment successful! Order placed.</>}
                {mpesaStep === "error" && <>{mpesaError}</>}
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-2 mb-4 text-sm p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex justify-between text-white/40"><span>Product Price</span><span>KES {totalAmount.toLocaleString()}</span></div>
              <div className="flex justify-between text-white/40"><span>Buyer Protection ({rateLabel(buyerFee.rate)}) — escrow included</span><span>KES {platformFee.toLocaleString()}</span></div>
              <div className="flex justify-between text-white/40"><span>{collectAtHub ? "Hub collection" : "Delivery Fee"}</span><span className="text-nx-cyan">{(collectAtHub && selectedHub ? (selectedHub.fee ?? 0) : deliveryFee) === 0 ? "FREE" : `KES ${(collectAtHub && selectedHub ? (selectedHub.fee ?? 0) : deliveryFee).toLocaleString()}`}</span></div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-white/5"><span>Total</span><span>KES {grandTotal.toLocaleString()}</span></div>
            </div>

            <p className="text-[11px] text-white/20 mb-4">🛡️ Payment is held in escrow until you confirm delivery.</p>

            <button onClick={handleBuyNow} disabled={ordering || !deliveryCounty || !deliveryTown || !deliveryAddress || (paymentMethod === "mpesa" && mpesaStep !== "idle") || (paymentMethod === "airtel_money" && upStep !== "idle" && upStep !== "error")}
              className="w-full py-3 rounded-xl bg-nx-violet text-white font-semibold text-sm hover:bg-nx-violet/80 transition-colors disabled:opacity-30 flex items-center justify-center gap-2">
              {ordering ? <><Loader2 className="w-4 h-4 animate-spin" /> {paymentMethod === "airtel_money" && upStep === "waiting" ? "Waiting for Airtel Money..." : mpesaStep === "waiting" ? "Waiting for M-Pesa..." : "Processing..."}</> : paymentMethod === "mpesa" ? `Pay KES ${grandTotal.toLocaleString()} via M-Pesa` : paymentMethod === "airtel_money" ? `Pay KES ${grandTotal.toLocaleString()} via Airtel Money` : paymentMethod === "card" ? `Pay KES ${grandTotal.toLocaleString()} by Card` : `Pay KES ${grandTotal.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
