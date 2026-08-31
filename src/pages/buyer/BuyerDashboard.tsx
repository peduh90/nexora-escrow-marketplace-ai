import BuyerLayout from "./BuyerLayout";
import { Package, ShoppingCart, Wallet, Shield, Search, ArrowRight, Plus, Store } from "lucide-react";
import { useNavigate } from "react-router";

export default function BuyerDashboard() {
  const navigate = useNavigate();

  return (
    <BuyerLayout>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Welcome to Nexora 👋</h2>
        <p className="text-xs text-white/30 mt-0.5">Your secure marketplace — every purchase is protected</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <button onClick={() => navigate("/marketplace")} className="p-4 rounded-xl bg-nx-violet/5 border border-nx-violet/10 hover:border-nx-violet/30 transition-all text-left group">
          <Search className="w-5 h-5 text-nx-violet mb-2" />
          <p className="text-sm font-medium text-white group-hover:text-nx-violet transition-colors">Browse Marketplace</p>
          <p className="text-[10px] text-white/25 mt-0.5">Find products</p>
        </button>
        <button onClick={() => navigate("/buyer/orders")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-left group">
          <ShoppingCart className="w-5 h-5 text-nx-cyan mb-2" />
          <p className="text-sm font-medium text-white group-hover:text-nx-cyan transition-colors">My Orders</p>
          <p className="text-[10px] text-white/25 mt-0.5">Track purchases</p>
        </button>
        <button onClick={() => navigate("/buyer/wallet")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-left group">
          <Wallet className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">Market Wallet</p>
          <p className="text-[10px] text-white/25 mt-0.5">Deposit & manage funds</p>
        </button>
        <button onClick={() => navigate("/marketplace")} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-left group">
          <Shield className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">Escrow Protection</p>
          <p className="text-[10px] text-white/25 mt-0.5">Every transaction safe</p>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Wallet Balance", value: "KES 0", icon: Wallet, color: "text-nx-cyan" },
          { label: "Active Orders", value: "0", icon: ShoppingCart, color: "text-nx-violet" },
          { label: "Protected Purchases", value: "0", icon: Shield, color: "text-emerald-400" },
          { label: "Items Purchased", value: "0", icon: Package, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-white/25">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Empty State — Getting Started */}
      <div className="rounded-xl bg-white/[0.02] border border-white/5 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-nx-violet/10 flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-nx-violet" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Start Your First Purchase</h3>
        <p className="text-sm text-white/30 max-w-md mx-auto mb-6">
          Browse thousands of verified products across Kenya. Every purchase is protected by escrow — your money is safe until you confirm delivery.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/marketplace")}
            className="px-6 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" /> Browse Marketplace
          </button>
          <button
            onClick={() => navigate("/buyer/wallet")}
            className="px-6 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm font-medium hover:border-white/20 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Fund Wallet
          </button>
        </div>
      </div>

      {/* How Escrow Works */}
      <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">How Escrow Protection Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Browse & Choose", desc: "Find products you want to buy" },
            { step: "2", title: "Pay Securely", desc: "Funds held in escrow, not sent to seller" },
            { step: "3", title: "Receive & Inspect", desc: "Check the product meets expectations" },
            { step: "4", title: "Confirm & Release", desc: "Approve delivery — seller gets paid" },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-8 h-8 rounded-full bg-nx-violet/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-xs font-bold text-nx-violet">{s.step}</span>
              </div>
              <p className="text-xs font-medium text-white mb-0.5">{s.title}</p>
              <p className="text-[10px] text-white/25">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </BuyerLayout>
  );
}
