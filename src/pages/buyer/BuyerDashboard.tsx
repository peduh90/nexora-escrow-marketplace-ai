import BuyerLayout from "./BuyerLayout";
import { Package, ShoppingCart, Wallet, Shield, ArrowUpRight, Clock, Truck, CheckCircle2, Star } from "lucide-react";

const stats = [
  { label: "Total Spent", value: "KES 423,000", icon: Wallet, color: "text-nx-cyan" },
  { label: "Active Orders", value: "3", icon: ShoppingCart, color: "text-nx-violet" },
  { label: "Protected Transactions", value: "18", icon: Shield, color: "text-emerald-400" },
  { label: "Items Purchased", value: "22", icon: Package, color: "text-amber-400" },
];

const activeOrders = [
  { id: "NX-4521", product: "MacBook Pro 14\" M3 Max", seller: "TechHub Kenya", amount: 285000, status: "in_escrow", eta: "2 days" },
  { id: "NX-4519", product: "iPhone 15 Pro Max", seller: "AppleStore KE", amount: 142000, status: "shipped", eta: "Tomorrow" },
  { id: "NX-4515", product: "Nike Air Max 90", seller: "SneakerVault", amount: 12500, status: "pending", eta: "3 days" },
];

const recentPurchases = [
  { product: "Samsung Galaxy S24", seller: "Samsung KE", amount: 165000, date: "Jan 20", rating: 5 },
  { product: "Sony WH-1000XM5", seller: "AudioPro", amount: 38000, date: "Jan 15", rating: 5 },
  { product: "Dell Monitor 27\"", seller: "TechHub Kenya", amount: 45000, date: "Jan 10", rating: 4 },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  in_escrow: { label: "In Escrow", color: "bg-nx-cyan/10 text-nx-cyan", icon: Shield },
  shipped: { label: "In Transit", color: "bg-blue-400/10 text-blue-400", icon: Truck },
  pending: { label: "Processing", color: "bg-amber-400/10 text-amber-400", icon: Clock },
  delivered: { label: "Delivered", color: "bg-emerald-400/10 text-emerald-400", icon: CheckCircle2 },
};

export default function BuyerDashboard() {
  return (
    <BuyerLayout>
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Welcome Back 👋</h2>
        <p className="text-xs text-white/30 mt-0.5">Your protected marketplace dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
            <p className="text-xl font-bold text-white tracking-tight">{stat.value}</p>
            <p className="text-xs text-white/30 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders */}
        <div className="lg:col-span-2 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Active Orders</h3>
            <a href="/buyer/orders" className="text-xs text-nx-cyan hover:text-nx-cyan/80 transition-colors">View All →</a>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {activeOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <div key={order.id} className="px-5 py-4 hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${status.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-white/40 font-mono">{order.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                      </div>
                      <p className="text-sm text-white truncate">{order.product}</p>
                      <p className="text-xs text-white/30 mt-0.5">From {order.seller} • ETA: {order.eta}</p>
                    </div>
                    <p className="text-sm font-bold text-white shrink-0">KES {order.amount.toLocaleString()}</p>
                  </div>
                  {/* Escrow protection indicator */}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400/60 ml-13">
                    <Shield className="w-3 h-3" />
                    <span>Funds protected in escrow</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Wallet Quick View */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-nx-cyan/10 to-nx-cyan/5 border border-nx-cyan/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Market Wallet</h3>
              <a href="/buyer/wallet" className="text-[11px] text-nx-cyan hover:text-nx-cyan/80">View →</a>
            </div>
            <p className="text-2xl font-bold text-white">KES 67,500</p>
            <p className="text-xs text-white/30 mt-1">Available balance</p>
            <div className="mt-3 flex items-center gap-2">
              <a href="/buyer/wallet" className="flex-1 text-center py-2 rounded-lg bg-nx-cyan/10 text-nx-cyan text-xs font-medium hover:bg-nx-cyan/20 transition-colors">
                Deposit
              </a>
              <a href="/buyer/wallet" className="flex-1 text-center py-2 rounded-lg bg-white/[0.03] text-white/40 text-xs font-medium hover:bg-white/[0.05] transition-colors">
                Send
              </a>
            </div>
          </div>

          {/* Protection Status */}
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Protection Status</h3>
            <div className="space-y-2.5">
              {[
                { label: "Escrow Active", count: 3, color: "text-emerald-400" },
                { label: "Insurance Coverage", count: 2, color: "text-nx-cyan" },
                { label: "AI Risk Monitoring", count: 18, color: "text-nx-violet" },
                { label: "Disputes Open", count: 0, color: "text-white/40" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-white/40">{item.label}</span>
                  <span className={`font-medium ${item.color}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Purchases */}
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Recent Purchases</h3>
            <div className="space-y-3">
              {recentPurchases.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white/[0.03] flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-white/10" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{item.product}</p>
                    <p className="text-[10px] text-white/30">{item.seller} • {item.date}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: item.rating }).map((_, j) => (
                      <Star key={j} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}
