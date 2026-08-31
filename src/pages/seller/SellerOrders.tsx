import SellerLayout from "./SellerLayout";
import { useState } from "react";
import {
  Package,
  Check,
  X,
  Truck,
  RotateCcw,
  MessageSquare,
  Clock,
  AlertTriangle,
  ChevronDown,
  Filter,
  Search,
  MapPin,
} from "lucide-react";

const mockOrders = [
  {
    id: "NX-4521", buyer: "James Mwangi", buyerVerified: true,
    product: "MacBook Pro 14\" M3 Max", amount: 285000, commission: 14250,
    status: "pending", paymentStatus: "in_escrow",
    pickup: "Westlands, Nairobi", dropoff: "Kisumu Town, Kisumu",
    transport: true, transportFee: 1850, insurance: true,
    createdAt: "2h ago", escrowId: "ESC-7821",
    condition: "New", quantity: 1,
  },
  {
    id: "NX-4519", buyer: "Sarah Kimani", buyerVerified: true,
    product: "iPhone 15 Pro Max 256GB", amount: 142000, commission: 7100,
    status: "accepted", paymentStatus: "in_escrow",
    pickup: "CBD, Nairobi", dropoff: "Westlands, Nairobi",
    transport: true, transportFee: 500, insurance: true,
    createdAt: "4h ago", escrowId: "ESC-7819",
    condition: "New", quantity: 1,
  },
  {
    id: "NX-4515", buyer: "David Odhiambo", buyerVerified: false,
    product: "Samsung Galaxy S24 Ultra", amount: 165000, commission: 8250,
    status: "shipped", paymentStatus: "in_escrow",
    pickup: "Nyali, Mombasa", dropoff: "CBD, Mombasa",
    transport: true, transportFee: 800, insurance: false,
    estimatedDelivery: "Tomorrow 2PM", trackingCode: "TRK-2025-NX",
    createdAt: "1d ago", escrowId: "ESC-7815",
    condition: "New", quantity: 1,
  },
  {
    id: "NX-4510", buyer: "Grace Wanjiku", buyerVerified: true,
    product: "Nike Air Max 90 (x2)", amount: 25000, commission: 1250,
    status: "completed", paymentStatus: "released",
    pickup: "Karen, Nairobi", dropoff: "CBD, Nairobi",
    transport: true, transportFee: 500, insurance: false,
    createdAt: "2d ago", escrowId: "ESC-7810",
    condition: "New", quantity: 2,
  },
  {
    id: "NX-4505", buyer: "Peter Njoroge", buyerVerified: true,
    product: "Italian Leather Sofa Set", amount: 85000, commission: 4250,
    status: "refunded", paymentStatus: "refunded",
    pickup: "CBD, Nakuru", dropoff: "Thika, Kiambu",
    transport: true, transportFee: 3500, insurance: true,
    createdAt: "5d ago", escrowId: "ESC-7805",
    condition: "New", quantity: 1, refundReason: "Item damaged during transit",
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: "New Order", color: "bg-amber-400/10 text-amber-400", icon: Clock },
  accepted: { label: "Accepted", color: "bg-nx-cyan/10 text-nx-cyan", icon: Check },
  shipped: { label: "In Transit", color: "bg-blue-400/10 text-blue-400", icon: Truck },
  delivered: { label: "Delivered", color: "bg-purple-400/10 text-purple-400", icon: Package },
  completed: { label: "Completed", color: "bg-emerald-400/10 text-emerald-400", icon: Check },
  refunded: { label: "Refunded", color: "bg-red-400/10 text-red-400", icon: RotateCcw },
  disputed: { label: "Disputed", color: "bg-red-400/10 text-red-400", icon: AlertTriangle },
};

export default function SellerOrders() {
  const [filterStatus, setFilterStatus] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockOrders.filter((o) => {
    const matchStatus = filterStatus === "All" || o.status === filterStatus;
    const matchSearch = o.product.toLowerCase().includes(searchQuery.toLowerCase()) || o.buyer.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    All: mockOrders.length,
    pending: mockOrders.filter((o) => o.status === "pending").length,
    accepted: mockOrders.filter((o) => o.status === "accepted").length,
    shipped: mockOrders.filter((o) => o.status === "shipped").length,
    completed: mockOrders.filter((o) => o.status === "completed").length,
  };

  return (
    <SellerLayout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Orders</h2>
        <p className="text-xs text-white/30 mt-0.5">Manage incoming orders, shipments, and refunds</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {Object.entries(counts).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`p-3 rounded-xl border text-left transition-all ${
              filterStatus === key
                ? "border-nx-violet/30 bg-nx-violet/5"
                : "border-white/5 bg-white/[0.02] hover:border-white/10"
            }`}
          >
            <p className="text-lg font-bold text-white">{val}</p>
            <p className="text-[11px] text-white/30 capitalize">{key === "All" ? "Total" : key}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search orders..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30"
        />
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map((order) => {
          const status = statusConfig[order.status] || statusConfig.pending;
          const isExpanded = expandedOrder === order.id;
          return (
            <div key={order.id} className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden transition-all hover:border-white/10">
              {/* Main row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                  <status.icon className={`w-5 h-5 ${status.color.split(" ")[1]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-white/40 font-mono">{order.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {order.buyerVerified && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">Verified</span>
                    )}
                  </div>
                  <p className="text-sm text-white truncate mt-0.5">{order.product}</p>
                  <p className="text-xs text-white/30 mt-0.5">{order.buyer} • {order.createdAt}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">KES {order.amount.toLocaleString()}</p>
                  <p className="text-[11px] text-white/30">-{order.commission.toLocaleString()} fee</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/20 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Delivery Info */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Delivery</h4>
                      <div className="flex items-start gap-2 text-xs text-white/40">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                        <div>
                          <p>From: {order.pickup}</p>
                          <p>To: {order.dropoff}</p>
                        </div>
                      </div>
                      {order.transport && (
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <Truck className="w-3 h-3" />
                          <span>Transport: KES {order.transportFee.toLocaleString()}</span>
                          {order.insurance && <span className="text-blue-400">+Insured</span>}
                        </div>
                      )}
                      {order.trackingCode && (
                        <p className="text-xs text-nx-cyan font-mono">{order.trackingCode}</p>
                      )}
                      {order.estimatedDelivery && (
                        <p className="text-xs text-amber-400">ETA: {order.estimatedDelivery}</p>
                      )}
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Payment</h4>
                      <div className="space-y-1 text-xs text-white/40">
                        <p>Amount: <span className="text-white/60">KES {order.amount.toLocaleString()}</span></p>
                        <p>Commission: <span className="text-nx-violet">KES {order.commission.toLocaleString()}</span></p>
                        <p>Net: <span className="text-emerald-400">KES {(order.amount - order.commission).toLocaleString()}</span></p>
                        <p>Payment: <span className={order.paymentStatus === "released" ? "text-emerald-400" : "text-nx-cyan"}>{order.paymentStatus === "in_escrow" ? "🔒 In Escrow" : order.paymentStatus === "released" ? "✅ Released" : "↩️ Refunded"}</span></p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Actions</h4>
                      <div className="flex flex-col gap-2">
                        {order.status === "pending" && (
                          <>
                            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-400/10 text-emerald-400 text-xs font-medium hover:bg-emerald-400/20 transition-colors">
                              <Check className="w-3.5 h-3.5" /> Accept Order
                            </button>
                            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-400/10 text-red-400 text-xs font-medium hover:bg-red-400/20 transition-colors">
                              <X className="w-3.5 h-3.5" /> Decline
                            </button>
                          </>
                        )}
                        {order.status === "accepted" && (
                          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-nx-cyan/10 text-nx-cyan text-xs font-medium hover:bg-nx-cyan/20 transition-colors">
                            <Truck className="w-3.5 h-3.5" /> Ship & Arrange Transport
                          </button>
                        )}
                        {order.status === "shipped" && (
                          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-400/10 text-blue-400 text-xs font-medium hover:bg-blue-400/20 transition-colors">
                            <Package className="w-3.5 h-3.5" /> Track Shipment
                          </button>
                        )}
                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] text-white/40 text-xs font-medium hover:bg-white/[0.05] hover:text-white/60 transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" /> Message Buyer
                        </button>
                      </div>
                    </div>
                  </div>

                  {order.refundReason && (
                    <div className="p-3 rounded-lg bg-red-400/5 border border-red-400/10">
                      <p className="text-xs text-red-400/80">
                        <span className="font-medium">Refund reason:</span> {order.refundReason}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No orders found</p>
        </div>
      )}
    </SellerLayout>
  );
}
