import BuyerLayout from "./BuyerLayout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import {
  Package, ShoppingCart, Wallet, Heart, MessageSquare, TrendingUp,
  Search, ArrowRight, Shield, Loader2,
} from "lucide-react";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const walletBalance = useQuery(api.wallet.getWalletBalance);
  const walletTransactions = useQuery(api.wallet.getWalletTransactions);
  const conversations = useQuery(api.messages.getConversations);

  const isLoading = walletBalance === undefined || walletTransactions === undefined || conversations === undefined;

  if (isLoading) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-nx-violet animate-spin" />
        </div>
      </BuyerLayout>
    );
  }

  const recentTransactions = (walletTransactions ?? []).slice(0, 3);
  const totalSpent = (walletTransactions ?? [])
    .filter((t) => t.type === "escrow_fund")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <BuyerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome, {user?.name || "Buyer"}
          </h1>
          <p className="text-sm text-white/40 mt-1">Your Nexora Market dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-white/40">Balance</span>
            </div>
            <p className="text-xl font-bold text-white">KES {(walletBalance?.walletBalance || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-nx-cyan/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-nx-cyan" />
              </div>
              <span className="text-xs text-white/40">In Escrow</span>
            </div>
            <p className="text-xl font-bold text-white">KES {(walletBalance?.escrowBalance || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-nx-violet/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-nx-violet" />
              </div>
              <span className="text-xs text-white/40">Total Spent</span>
            </div>
            <p className="text-xl font-bold text-white">KES {totalSpent.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs text-white/40">Messages</span>
            </div>
            <p className="text-xl font-bold text-white">{(conversations ?? []).length}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => navigate("/marketplace")}
            className="flex items-center gap-3 p-4 rounded-xl bg-nx-violet/10 border border-nx-violet/10 hover:bg-nx-violet/15 transition-colors text-left">
            <Search className="w-5 h-5 text-nx-violet" />
            <div>
              <p className="text-sm font-medium text-white">Browse</p>
              <p className="text-[11px] text-white/30">Find products</p>
            </div>
          </button>
          <button onClick={() => navigate("/buyer/orders")}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
            <ShoppingCart className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-sm font-medium text-white">Orders</p>
              <p className="text-[11px] text-white/30">Track purchases</p>
            </div>
          </button>
          <button onClick={() => navigate("/buyer/wallet")}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
            <Wallet className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-sm font-medium text-white">Wallet</p>
              <p className="text-[11px] text-white/30">Manage funds</p>
            </div>
          </button>
          <button onClick={() => navigate("/marketplace")}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-left">
            <Heart className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-sm font-medium text-white">Wishlist</p>
              <p className="text-[11px] text-white/30">Saved items</p>
            </div>
          </button>
        </div>

        {/* Recent transactions */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
            <button onClick={() => navigate("/buyer/wallet")} className="text-xs text-nx-violet hover:text-nx-violet/80 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-sm text-white/30">No transactions yet</p>
              <p className="text-[11px] text-white/15 mt-1">Deposit funds or make a purchase to see your transaction history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div key={tx._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.01]">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-white/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{tx.description}</p>
                    <p className="text-[11px] text-white/30 capitalize">{tx.type.replace("_", " ")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-medium ${tx.type === "deposit" || tx.type === "escrow_release" ? "text-emerald-400" : "text-white"}`}>
                      {tx.type === "deposit" || tx.type === "escrow_release" ? "+" : "-"}KES {tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-white/20 capitalize">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty state for new buyers */}
        {!totalSpent && !recentTransactions.length && (
          <div className="p-6 rounded-xl bg-nx-violet/5 border border-nx-violet/10 text-center">
            <Search className="w-10 h-10 text-nx-violet/30 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Start Shopping</h3>
            <p className="text-sm text-white/40 mb-4 max-w-md mx-auto">
              Browse thousands of products from verified sellers with escrow protection.
            </p>
            <button onClick={() => navigate("/marketplace")} className="px-5 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors">
              Browse Marketplace
            </button>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
