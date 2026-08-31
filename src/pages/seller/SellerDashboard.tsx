import SellerLayout from "./SellerLayout";
import { Package, ShoppingCart, Wallet, TrendingUp, Eye, Star, ArrowUpRight, ArrowDownRight } from "lucide-react";

const stats = [
  { label: "Total Revenue", value: "KES 847,500", change: "+12.4%", up: true, icon: Wallet, color: "text-emerald-400" },
  { label: "Active Products", value: "34", change: "+3 this week", up: true, icon: Package, color: "text-nx-cyan" },
  { label: "Pending Orders", value: "12", change: "5 need attention", up: false, icon: ShoppingCart, color: "text-nx-violet" },
  { label: "Total Views", value: "8,432", change: "+22% this month", up: true, icon: Eye, color: "text-amber-400" },
];

const recentOrders = [
  { id: "NX-4521", buyer: "James M.", product: "MacBook Pro 14\"", amount: "KES 185,000", status: "pending", time: "2h ago" },
  { id: "NX-4519", buyer: "Sarah K.", product: "iPhone 15 Pro", amount: "KES 142,000", status: "in_escrow", time: "4h ago" },
  { id: "NX-4515", buyer: "David O.", product: "Samsung Galaxy S24", amount: "KES 98,000", status: "delivered", time: "1d ago" },
  { id: "NX-4510", buyer: "Grace W.", product: "Nike Air Max 90", amount: "KES 12,500", status: "completed", time: "2d ago" },
  { id: "NX-4508", buyer: "Peter N.", product: "Sony WH-1000XM5", amount: "KES 38,000", status: "completed", time: "3d ago" },
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-400/10 text-amber-400",
  in_escrow: "bg-nx-cyan/10 text-nx-cyan",
  delivered: "bg-blue-400/10 text-blue-400",
  completed: "bg-emerald-400/10 text-emerald-400",
  disputed: "bg-red-400/10 text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "Awaiting Shipment",
  in_escrow: "In Escrow",
  delivered: "Delivered",
  completed: "Completed",
  disputed: "Disputed",
};

export default function SellerDashboard() {
  return (
    <SellerLayout>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div className={`flex items-center gap-1 text-xs ${stat.up ? "text-emerald-400" : "text-amber-400"}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
            <p className="text-xs text-white/30 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
            <a href="/seller/orders" className="text-xs text-nx-violet hover:text-nx-violet/80 transition-colors">
              View All →
            </a>
          </div>
          <div className="divide-y divide-white/5">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.01] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center text-white/20 text-xs font-mono">
                  {order.id.split("-")[1]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{order.product}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {order.buyer} • {order.time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{order.amount}</p>
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 ${statusColors[order.status] || "bg-white/5 text-white/40"}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* KYC Status */}
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Business Verification</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-400/10 flex items-center justify-center">
                  <span className="text-emerald-400 text-[10px]">✓</span>
                </div>
                <span className="text-white/60">Business registered</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-amber-400/10 flex items-center justify-center">
                  <span className="text-amber-400 text-[10px]">○</span>
                </div>
                <span className="text-white/40">ID verification pending</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-white/20 text-[10px]">○</span>
                </div>
                <span className="text-white/30">Business certificate</span>
              </div>
            </div>
            <a href="/seller/kyc" className="mt-3 block text-center text-xs text-nx-violet hover:text-nx-violet/80 transition-colors">
              Complete Verification →
            </a>
          </div>

          {/* Quick Stats */}
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <h3 className="text-sm font-semibold text-white mb-3">Store Performance</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/40">Conversion Rate</span>
                  <span className="text-white/60">4.2%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[42%] rounded-full bg-nx-violet/60" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/40">Response Time</span>
                  <span className="text-white/60">~2 hours</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[75%] rounded-full bg-emerald-400/60" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/40">Rating</span>
                  <span className="text-white/60 flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> 4.8
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[96%] rounded-full bg-amber-400/60" />
                </div>
              </div>
            </div>
          </div>

          {/* AI Alert */}
          <div className="p-5 rounded-xl bg-nx-violet/5 border border-nx-violet/10">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-nx-violet shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">AI Insight</p>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">
                  Your electronics category has 3x higher demand this week. Consider adding more listings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
