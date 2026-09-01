import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { getDeliveryFee } from "@/lib/delivery-config";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import {
  Shield, Heart, Share2, MessageSquare, ShoppingCart, ArrowLeft, Star, MapPin, Clock,
  CheckCircle2, Truck, ChevronRight, Package, Eye, X, Minus, Plus, Loader2, Send,
} from "lucide-react";

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
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const listing = useQuery(api.listings.getListing, id ? { listingId: id as any } : "skip");
  const incrementViews = useMutation(api.listings.incrementViews);
  const createOrder = useMutation(api.wallet.createOrder);
  const startConversation = useMutation(api.messages.startConversation);
  const sendMessage = useMutation(api.messages.sendMessage);

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
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "mpesa">("wallet");
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Increment views on first load
  if (id && listing) {
    incrementViews({ listingId: id as any }).catch(() => {});
  }

  if (listing === undefined) {
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

  const delivery = getDeliveryFee(listing.originCounty);
  const totalAmount = listing.price;
  const platformFee = Math.round(totalAmount * 0.03);
  const deliveryFee = delivery.free ? 0 : delivery.fee;
  const grandTotal = totalAmount + platformFee + deliveryFee;

  const handleBuyNow = async () => {
    if (!user) {
      navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!deliveryCounty || !deliveryTown || !deliveryAddress) return;
    setOrdering(true);
    try {
      await createOrder({
        listingId: listing._id,
        sellerId: listing.sellerId,
        amount: totalAmount,
        deliveryCounty,
        deliveryTown,
        deliveryAddress,
        paymentMethod,
      });
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
      const conversationId = await startConversation({
        sellerId: listing.sellerId,
        listingId: listing._id,
      });
      await sendMessage({
        conversationId,
        content: `💰 Offer: KES ${Number(offerPrice).toLocaleString()} for "${listing.title}" (Listed at KES ${listing.price.toLocaleString()})`,
      });
      setShowOffer(false);
      setOfferPrice("");
      navigate("/buyer/orders");
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
      const conversationId = await startConversation({
        sellerId: listing.sellerId,
        listingId: listing._id,
      });
      await sendMessage({
        conversationId,
        content: `Hi, I'm interested in "${listing.title}" (KES ${listing.price.toLocaleString()}). Is it still available?`,
      });
      navigate("/buyer/orders");
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
              {listing.images && listing.images.length > 0 ? (
                <img src={listing.images[selectedImage]} alt={listing.title} className="w-full h-full object-cover" />
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
              {listing.images && listing.images.length > 1 && (
                <div className="absolute bottom-4 right-4 text-xs text-white/30 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                  {selectedImage + 1} / {listing.images.length}
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {listing.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border shrink-0 transition-all ${selectedImage === i ? "border-nx-violet/50 ring-1 ring-nx-violet/30" : "border-white/5 hover:border-white/10"}`}>
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Info */}
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{listing.title}</h1>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-3xl font-bold text-white">KES {listing.price.toLocaleString()}</span>
                {listing.negotiable && (
                  <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Negotiable</span>
                )}
              </div>
            </div>

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
            </div>

            {/* Seller Info */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
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
                    {listing.sellerReputation > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-white/60">{listing.sellerReputation.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleChatSeller}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-nx-violet/10 text-nx-violet text-xs font-medium hover:bg-nx-violet/20 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" /> Chat Seller
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button onClick={() => { if (!user) { navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname)); return; } setShowCheckout(true); }}
                className="w-full py-3.5 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" /> BUY NOW — KES {listing.price.toLocaleString()}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { if (!user) { navigate("/auth?returnTo=" + encodeURIComponent(window.location.pathname)); return; } setShowCheckout(true); }}
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
              <button onClick={handleChatSeller}
                className="w-full py-3 rounded-xl bg-nx-cyan/10 text-nx-cyan text-sm font-medium hover:bg-nx-cyan/20 transition-colors flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> Chat with {listing.sellerName}
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-white/25">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {listing.views.toLocaleString()} views</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {listing.favorites} favorites</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(listing.createdAt)}</span>
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
            <p className="text-xs text-white/30 mb-4">Listed price: KES {listing.price.toLocaleString()}</p>
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
                {listing.images && listing.images[0] ? (
                  <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                ) : <Package className="w-6 h-6 text-white/10" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{listing.title}</p>
                <p className="text-xs text-white/40">{listing.sellerName}</p>
                <p className="text-sm font-bold text-white mt-0.5">KES {listing.price.toLocaleString()}</p>
              </div>
            </div>

            {/* Delivery Location */}
            <div className="space-y-3 mb-4">
              <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Delivery Location</h4>
              <input type="text" value={deliveryCounty} onChange={(e) => setDeliveryCounty(e.target.value)} placeholder="County *"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              <input type="text" value={deliveryTown} onChange={(e) => setDeliveryTown(e.target.value)} placeholder="Town / Area *"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Street / Building / Apartment *"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
              <p className="text-[11px] text-white/20">🚚 Delivery is handled by Nexora Market</p>
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
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'mpesa' ? 'border-nx-violet/30 bg-nx-violet/5' : 'border-white/5 bg-white/[0.02]'}">
                <input type="radio" name="payment" value="mpesa" checked={paymentMethod === "mpesa"} onChange={() => setPaymentMethod("mpesa")} className="text-nx-violet" />
                <div>
                  <p className="text-sm text-white">M-Pesa</p>
                  <p className="text-[11px] text-white/30">Pay via M-Pesa STK Push</p>
                </div>
              </label>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 mb-4 text-sm p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex justify-between text-white/40"><span>Product Price</span><span>KES {totalAmount.toLocaleString()}</span></div>
              <div className="flex justify-between text-white/40"><span>Platform Fee (3%)</span><span>KES {platformFee.toLocaleString()}</span></div>
              <div className="flex justify-between text-white/40"><span>Delivery Fee</span><span className="text-nx-cyan">{deliveryFee === 0 ? "FREE" : `KES ${deliveryFee.toLocaleString()}`}</span></div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-white/5"><span>Total</span><span>KES {grandTotal.toLocaleString()}</span></div>
            </div>

            <p className="text-[11px] text-white/20 mb-4">🛡️ Payment is held in escrow until you confirm delivery.</p>

            <button onClick={handleBuyNow} disabled={ordering || !deliveryCounty || !deliveryTown || !deliveryAddress}
              className="w-full py-3 rounded-xl bg-nx-violet text-white font-semibold text-sm hover:bg-nx-violet/80 transition-colors disabled:opacity-30 flex items-center justify-center gap-2">
              {ordering ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Pay KES ${grandTotal.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
