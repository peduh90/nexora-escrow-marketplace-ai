import SellerLayout from "./SellerLayout";
import { Package, ShoppingCart, Wallet, TrendingUp, Plus, Search, Shield, Store, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
          <p className="text-[10px] text-white/25 mt-0.5">Manage listings</p>
        </button>
        <button onClick={() => navigate("/seller/orders")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-left group">
          <ShoppingCart className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">Orders</p>
          <p className="text-[10px] text-white/25 mt-0.5">Manage orders</p>
        </button>
        <button onClick={() => navigate("/seller/earnings")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-left group">
          <Wallet className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">Earnings</p>
          <p className="text-[10px] text-white/25 mt-0.5">Withdraw funds</p>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Available Balance", value: "KES 0", icon: Wallet, color: "text-emerald-400" },
          { label: "In Escrow", value: "KES 0", icon: Shield, color: "text-nx-cyan" },
          { label: "Active Products", value: "0", icon: Package, color: "text-nx-violet" },
          { label: "Total Orders", value: "0", icon: ShoppingCart, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-white/25">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Empty State */}
      <div className="rounded-xl bg-white/[0.02] border border-white/5 p-8 text-center">
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
          {!user?.kycStatus || user.kycStatus === "not_started" ? (
            <button
              onClick={() => navigate("/seller/kyc")}
              className="px-6 py-2.5 rounded-lg border border-nx-gold/20 text-nx-gold text-sm font-medium hover:bg-nx-gold/5 transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" /> Complete KYC Verification
            </button>
          ) : null}
        </div>
      </div>

      {/* Seller Tips */}
      <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Tips to Start Selling</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Complete KYC", desc: "Verify your business to build buyer trust and unlock selling features", icon: Shield, color: "text-nx-gold" },
            { title: "Add Quality Photos", desc: "Products with multiple photos sell 3x faster on average", icon: Package, color: "text-nx-cyan" },
            { title: "Competitive Pricing", desc: "Research similar products to price competitively while maintaining margins", icon: BarChart3, color: "text-nx-violet" },
          ].map((tip) => (
            <div key={tip.title} className="p-3 rounded-lg bg-white/[0.02]">
              <tip.icon className={`w-4 h-4 ${tip.color} mb-2`} />
              <p className="text-xs font-medium text-white mb-0.5">{tip.title}</p>
              <p className="text-[10px] text-white/25">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SellerLayout>
  );
}
