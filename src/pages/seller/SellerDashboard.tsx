import SellerLayout from "./SellerLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import {
  Package, ShoppingCart, Wallet, TrendingUp, Plus, Shield, Store,
  BarChart3, MessageSquare, Star, Truck,
} from "lucide-react";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const walletBalance = useQuery(api.wallet.getWalletBalance);
  const transactions = useQuery(api.wallet.getWalletTransactions);
  const allEscrows = useQuery(api.users.getAllEscrows);
  const allListings = useQuery(api.users.getAllListings);

  const sellerId = user?._id ?? "";
  const myEscrows = (allEscrows ?? []).filter(e => e.sellerId === sellerId);
  const myListings = (allListings ?? []).filter(l => l.sellerId === sellerId);

  const balance = walletBalance?.walletBalance ?? 0;
  const escrowBalance = walletBalance?.escrowBalance ?? 0;
  const activeEscrows = myEscrows.filter(e => e.status === "funded" || e.status === "active" || e.status === "delivery").length;
  const completedSales = myEscrows.filter(e => e.status === "released" || e.status === "completed").length;
  const totalRevenue = myEscrows.filter(e => e.status === "released" || e.status === "completed").reduce((s, e) => s + e.amount, 0);
  const activeProducts = myListings.filter(l => l.status === "active").length;
  const totalViews = myListings.reduce((s, l) => s + l.views, 0);
  const hasProducts = myListings.length > 0;
  const hasOrders = myEscrows.length > 0;

  return (
    <SellerLayout>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">
          Welcome{user?.name ? `, ${user.name}` : ""} 👋
        </h2>
        <p className="text-xs text-white/30 mt-0.5">Your seller command center</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <button onClick={() => navigate("/seller/add-product")} className="p-4 rounded-xl bg-nx-violet/5 border border-nx-violet/10 hover:border-nx-violet/30 transition-all text-left group">
          <Plus className="w-5 h-5 text-nx-violet mb-2" />
          <p className="text-sm font-medium text-white group-hover:text-nx-violet transition-colors">Add Product</p>
          <p className="text-[10px] text-white/25 mt-0.5">List a new item</p>
        </button>
        <button onClick={() => navigate("/seller/products")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-left group">
          <Package className="w-5 h-5 text-nx-cyan mb-2" />
          <p className="text-sm font-medium text-white group-hover:text-nx-cyan transition-colors">My Products</p>
          <p className="text-[10px] text-white/25 mt-0.5">{activeProducts} active</p>
        </button>
        <button onClick={() => navigate("/seller/orders")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-left group">
          <ShoppingCart className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">Orders</p>
          <p className="text-[10px] text-white/25 mt-0.5">{activeEscrows} active</p>
        </button>
        <button onClick={() => navigate("/seller/earnings")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-left group">
          <Wallet className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">Earnings</p>
          <p className="text-[10px] text-white/25 mt-0.5">KES {balance.toLocaleString()}</p>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/10">
          <Wallet className="w-4 h-4 text-emerald-400 mb-2" />
          <p className="text-lg font-bold text-white">KES {balance.toLocaleString()}</p>
          <p className="text-[10px] text-white/25">Available Balance</p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <Shield className="w-4 h-4 text-nx-cyan mb-2" />
          <p className="text-lg font-bold text-white">KES {escrowBalance.toLocaleString()}</p>
          <p className="text-[10px] text-white/25">In Escrow</p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <Package className="w-4 h-4 text-nx-violet mb-2" />
          <p className="text-lg font-bold text-white">{activeProducts}</p>
          <p className="text-[10px] text-white/25">Active Products</p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <TrendingUp className="w-4 h-4 text-amber-400 mb-2" />
          <p className="text-lg font-bold text-white">KES {totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-white/25">Total Revenue</p>
        </div>
      </div>

      {/* Performance overview - only show if seller has data */}
      {hasProducts && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-white/30 uppercase">Total Views</p>
            <p className="text-base font-bold text-white mt-1">{totalViews.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-white/30 uppercase">Completed Sales</p>
            <p className="text-base font-bold text-white mt-1">{completedSales}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-white/30 uppercase">Active Orders</p>
            <p className="text-base font-bold text-white mt-1">{activeEscrows}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-white/30 uppercase">Listings</p>
            <p className="text-base font-bold text-white mt-1">{myListings.length}</p>
          </div>
        </div>
      )}

      {/* Empty State - only show if no products */}
      {!hasProducts && (
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-8 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-nx-violet/10 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-nx-violet" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Start Selling on Nexora</h3>
          <p className="text-sm text-white/30 max-w-md mx-auto mb-6">
            List your first product to start reaching buyers across Kenya. Every transaction is protected by escrow and AI fraud detection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/seller/add-product")}
              className="px-6 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Your First Product
            </button>
            {(!user?.kycStatus || user.kycStatus === "not_started") && (
              <button
                onClick={() => navigate("/seller/kyc")}
                className="px-6 py-2.5 rounded-lg border border-nx-gold/20 text-nx-gold text-sm font-medium hover:bg-nx-gold/5 transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" /> Complete KYC Verification
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent orders - show if has orders */}
      {hasOrders && (
        <div className="rounded-xl bg-white/[0.02] border border-white/5 mb-6">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
            <button onClick={() => navigate("/seller/orders")} className="text-[11px] text-nx-violet hover:text-nx-violet/80">View All →</button>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {myEscrows.slice(0, 5).map(escrow => (
              <div key={escrow._id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.01] transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  escrow.status === "released" || escrow.status === "completed" ? "bg-emerald-400/10" :
                  escrow.status === "disputed" ? "bg-red-400/10" : "bg-nx-cyan/10"
                }`}>
                  {escrow.status === "released" || escrow.status === "completed" ? (
                    <Shield className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Truck className="w-4 h-4 text-nx-cyan" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{escrow.title}</p>
                  <p className="text-[10px] text-white/25">{escrow.deliveryCounty} — {new Date(escrow.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-white">KES {escrow.amount.toLocaleString()}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    escrow.status === "released" || escrow.status === "completed" ? "bg-emerald-400/10 text-emerald-400" :
                    escrow.status === "disputed" ? "bg-red-400/10 text-red-400" : "bg-nx-cyan/10 text-nx-cyan"
                  }`}>{escrow.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KYC Warning */}
      {(!user?.kycStatus || user.kycStatus === "not_started") && (
        <div className="rounded-xl bg-nx-gold/5 border border-nx-gold/10 p-4 mb-6 flex items-center gap-3">
          <Shield className="w-5 h-5 text-nx-gold shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-white font-medium">Complete KYC Verification</p>
            <p className="text-[11px] text-white/30">Verify your business to build trust and unlock all selling features</p>
          </div>
          <button onClick={() => navigate("/seller/kyc")} className="px-4 py-2 rounded-lg bg-nx-gold/10 text-nx-gold text-xs font-medium hover:bg-nx-gold/20 transition-colors shrink-0">
            Verify Now
          </button>
        </div>
      )}

      {/* Tips - only show to new sellers */}
      {!hasProducts && (
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Tips to Start Selling</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Complete KYC", desc: "Verify your business to build buyer trust", icon: Shield, color: "text-nx-gold" },
              { title: "Add Quality Photos", desc: "Products with photos sell 3x faster", icon: Package, color: "text-nx-cyan" },
              { title: "Competitive Pricing", desc: "Price competitively while maintaining margins", icon: BarChart3, color: "text-nx-violet" },
            ].map((tip) => (
              <div key={tip.title} className="p-3 rounded-lg bg-white/[0.02]">
                <tip.icon className={`w-4 h-4 ${tip.color} mb-2`} />
                <p className="text-xs font-medium text-white mb-0.5">{tip.title}</p>
                <p className="text-[10px] text-white/25">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </SellerLayout>
  );
}
