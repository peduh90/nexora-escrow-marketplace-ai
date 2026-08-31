import { useParams, useNavigate } from "react-router";
import { getProductById, formatPrice, getConditionColor } from "@/lib/sample-products";
import { getDeliveryFee } from "@/lib/delivery-config";
import { useState } from "react";
import {
  Shield, Heart, Share2, MessageSquare, ShoppingCart, ArrowLeft, Star, MapPin, Clock,
  CheckCircle2, Truck, ChevronRight, Package, Eye, Copy, Flag, MoreVertical, X, Minus, Plus,
} from "lucide-react";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = getProductById(id || "p1");
  const [selectedImage, setSelectedImage] = useState(0);
  const [showOffer, setShowOffer] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showShare, setShowShare] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Product Not Found</h2>
          <p className="text-white/40 text-sm mb-6">This product may have been removed or sold.</p>
          <button onClick={() => navigate("/buyer/marketplace")} className="px-6 py-2.5 rounded-lg bg-nx-violet text-white text-sm">
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  const delivery = getDeliveryFee(product.location.county);
  const specKeys = Object.keys(product.specifications);

  return (
    <div className="min-h-screen bg-[#05050A]">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[#0A0A12]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input type="text" placeholder="Search products..." className="w-full pl-4 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30" />
          </div>
          <button onClick={() => navigate("/buyer/orders")} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-white/30 mb-6">
          <button onClick={() => navigate("/")} className="hover:text-white/60">Home</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate("/buyer/marketplace")} className="hover:text-white/60">Marketplace</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/50">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Images */}
          <div>
            {/* Main image */}
            <div className="aspect-square rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden flex items-center justify-center mb-4">
              <Package className="w-32 h-32 text-white/5" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getConditionColor(product.condition)}`}>
                  {product.condition}
                </span>
                {product.status === "featured" && (
                  <span className="text-xs px-3 py-1 rounded-full bg-nx-violet/10 text-nx-violet font-medium">Featured</span>
                )}
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button onClick={() => setShowShare(true)} className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white/60 hover:text-white">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSaved(!saved)} className={`p-2 rounded-full bg-black/40 backdrop-blur-sm ${saved ? "text-red-400" : "text-white/60 hover:text-white"}`}>
                  <Heart className={`w-4 h-4 ${saved ? "fill-red-400" : ""}`} />
                </button>
              </div>
              <div className="absolute bottom-4 right-4 text-xs text-white/30 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                {selectedImage + 1} / {product.images}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: product.images }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg bg-white/[0.03] border flex items-center justify-center shrink-0 transition-all ${
                    selectedImage === i ? "border-nx-violet/50 ring-1 ring-nx-violet/30" : "border-white/5 hover:border-white/10"
                  }`}
                >
                  <Package className="w-8 h-8 text-white/10" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Info */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{product.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-white">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-lg text-white/30 line-through">{formatPrice(product.originalPrice)}</span>
                )}
                {product.originalPrice && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 font-medium">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                )}
              </div>
              {product.negotiable && (
                <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Negotiable</span>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.escrowProtected && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/5 border border-emerald-400/10 text-xs text-emerald-400">
                  <Shield className="w-3.5 h-3.5" /> Escrow Protected
                </div>
              )}
              {product.deliveryAvailable && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-cyan/5 border border-nx-cyan/10 text-xs text-nx-cyan">
                  <Truck className="w-3.5 h-3.5" /> Delivery Available
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-white/40">
                <MapPin className="w-3.5 h-3.5" /> {product.location.town}, {product.location.county}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-nx-cyan" />
                <span className="text-sm font-medium text-white">Delivery</span>
              </div>
              <p className="text-xs text-white/40 mb-2">Delivery is handled by Nexora Market. Select your delivery location at checkout.</p>
              {delivery.free ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-400">FREE DELIVERY</span>
                  <span className="text-xs text-white/30">• {delivery.estimatedDays}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Delivery: {formatPrice(delivery.fee)}</span>
                  <span className="text-xs text-white/30">• {delivery.estimatedDays}</span>
                </div>
              )}
              <p className="text-[11px] text-white/20 mt-1">Select your location at checkout to see the exact delivery fee.</p>
            </div>

            {/* Seller Info */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-nx-violet/10 flex items-center justify-center text-nx-violet text-lg font-bold">
                  {product.seller.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">{product.seller.name}</span>
                    {product.seller.verified && (
                      <CheckCircle2 className="w-4 h-4 text-nx-cyan shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-white/60">{product.seller.rating}</span>
                    </div>
                    <span className="text-[10px] text-white/20">•</span>
                    <span className="text-xs text-white/30">{product.seller.reviews} reviews</span>
                    <span className="text-[10px] text-white/20">•</span>
                    <span className="text-xs text-white/30">{product.seller.sales} sales</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-white/30 mb-3">
                <div>Response: {product.seller.responseRate}</div>
                <div>Time: {product.seller.responseTime}</div>
                <div>Products: {product.seller.products}</div>
                <div>Member since: {product.seller.memberSince}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/buyer/marketplace")}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-nx-violet/10 text-nx-violet text-xs font-medium hover:bg-nx-violet/20 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat Seller
                </button>
                <button
                  onClick={() => navigate("/buyer/marketplace")}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] text-white/40 text-xs font-medium hover:bg-white/[0.05] transition-colors"
                >
                  View Profile
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setShowCart(true)}
                className="w-full py-3.5 rounded-xl bg-nx-violet hover:bg-nx-violet/80 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" /> BUY NOW
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowCart(true)}
                  className="py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/70 text-sm font-medium hover:bg-white/[0.05] transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => setShowOffer(true)}
                  className="py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/70 text-sm font-medium hover:bg-white/[0.05] transition-colors"
                >
                  Make Offer
                </button>
              </div>
              <button
                onClick={() => navigate("/buyer/marketplace")}
                className="w-full py-3 rounded-xl bg-nx-cyan/10 text-nx-cyan text-sm font-medium hover:bg-nx-cyan/20 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Chat with {product.seller.name}
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-white/25">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {product.views.toLocaleString()} views</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {product.favorites} favorites</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Posted {product.postedAt}</span>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-10 rounded-xl bg-white/[0.02] border border-white/5 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Product Specifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {specKeys.map((key) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.01]">
                <span className="text-xs text-white/30">{key}</span>
                <span className="text-xs text-white/70 font-medium">{product.specifications[key]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/5 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Description</h2>
          <p className="text-sm text-white/50 leading-relaxed">{product.description}</p>
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
            <p className="text-xs text-white/30 mb-4">Listed price: {formatPrice(product.price)}</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-white/60 mb-1.5">Your Offer (KSh)</label>
              <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="Enter your offer" className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 text-lg text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30 font-bold" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowOffer(false)} className="flex-1 py-2.5 rounded-lg text-sm text-white/40 hover:bg-white/[0.03]">Cancel</button>
              <button className="flex-1 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80">Send Offer</button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-[#0E0E18] border border-white/5 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add to Cart</h3>
              <button onClick={() => setShowCart(false)} className="p-1 text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-4">
              <div className="w-16 h-16 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                <Package className="w-8 h-8 text-white/10" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{product.title}</p>
                <p className="text-xs text-white/40 mt-0.5">{product.seller.name}</p>
                <p className="text-sm font-bold text-white mt-1">{formatPrice(product.price)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-white/[0.02]">
              <span className="text-sm text-white/60">Quantity</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white"><Minus className="w-4 h-4" /></button>
                <span className="text-sm font-medium text-white w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-white/40"><span>Subtotal</span><span>{formatPrice(product.price * quantity)}</span></div>
              <div className="flex justify-between text-white/40"><span>Delivery</span><span className="text-nx-cyan">{delivery.free ? "FREE" : formatPrice(delivery.fee)}</span></div>
              <div className="flex justify-between text-white/40"><span>Platform Fee</span><span>{formatPrice(Math.round(product.price * 0.025))}</span></div>
              <div className="flex justify-between text-white font-bold pt-2 border-t border-white/5"><span>Total</span><span>{formatPrice(product.price * quantity + (delivery.free ? 0 : delivery.fee) + Math.round(product.price * 0.025))}</span></div>
            </div>
            <button onClick={() => { setShowCart(false); navigate("/buyer/orders"); }} className="w-full py-3 rounded-xl bg-nx-violet text-white font-semibold text-sm hover:bg-nx-violet/80 transition-colors">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
