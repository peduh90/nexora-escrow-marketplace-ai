import SellerLayout from "./SellerLayout";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
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
  Search,
  MapPin,
} from "lucide-react";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: typeof Package }
> = {
  funded: {
    label: "New Order",
    color: "bg-amber-400/10 text-amber-400",
    bg: "bg-amber-400/10",
    icon: Clock,
  },
  active: {
    label: "Processing",
    color: "bg-nx-cyan/10 text-nx-cyan",
    bg: "bg-nx-cyan/10",
    icon: Check,
  },
  delivery: {
    label: "In Transit",
    color: "bg-blue-400/10 text-blue-400",
    bg: "bg-blue-400/10",
    icon: Truck,
  },
  inspection: {
    label: "Delivered",
    color: "bg-purple-400/10 text-purple-400",
    bg: "bg-purple-400/10",
    icon: Package,
  },
  released: {
    label: "Completed",
    color: "bg-emerald-400/10 text-emerald-400",
    bg: "bg-emerald-400/10",
    icon: Check,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-400/10 text-emerald-400",
    bg: "bg-emerald-400/10",
    icon: Check,
  },
  refunded: {
    label: "Refunded",
    color: "bg-red-400/10 text-red-400",
    bg: "bg-red-400/10",
    icon: RotateCcw,
  },
  disputed: {
    label: "Disputed",
    color: "bg-red-400/10 text-red-400",
    bg: "bg-red-400/10",
    icon: AlertTriangle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-white/5 text-white/40",
    bg: "bg-white/5",
    icon: X,
  },
};

export default function SellerOrders() {
  const { user } = useAuth();
  // Scoped query: returns only this seller's escrow orders (with buyer names).
  const escrows = useQuery(api.wallet.getEscrowBySeller);
  const markDelivered = useMutation(api.wallet.markDelivered);
  const refundEscrow = useMutation(api.wallet.refundEscrow);

  const [filterStatus, setFilterStatus] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string>("");
  const [refundDone, setRefundDone] = useState<string | null>(null);

  const sellerId = user?._id ?? "";
  const myOrders = (escrows ?? []) as unknown as Array<{
    _id: string;
    sellerId: string;
    amount: number;
    status: string;
    title: string;
    commissionRate: number;
    transportRequired?: boolean;
    transportFee?: number;
    deliveryCounty?: string;
    deliveryTown?: string;
    originCounty?: string;
    originTown?: string;
  }>;

  const filtered = myOrders.filter((o) => {
    const matchStatus = filterStatus === "All" || o.status === filterStatus;
    const matchSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts: Record<string, number> = { All: myOrders.length };
  myOrders.forEach((o) => {
    counts[o.status] = (counts[o.status] || 0) + 1;
  });

  const handleMarkDelivered = async (escrowId: string) => {
    try {
      await markDelivered({ escrowId });
    } catch {}
  };

  const openRefund = (escrowId: string) => {
    setRefundingId(escrowId);
    setRefundAmount("");
    setRefundError("");
    setRefundDone(null);
  };

  const submitRefund = async () => {
    if (!refundingId || !refundAmount.trim()) return;
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setRefundError("Enter a valid refund amount");
      return;
    }
    setRefundError("");
    try {
      await refundEscrow({ escrowId: refundingId, reason: `Seller refund: ${amount.toLocaleString()} KES` });
      setRefundDone(refundingId);
      setRefundAmount("");
    } catch (err: any) {
      setRefundError(err.message || "Failed to refund");
    }
  };

  return (
    <SellerLayout>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Orders</h2>
        <p className="text-xs text-white/30 mt-0.5">
          Manage incoming orders and escrow transactions
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {["All", "funded", "active", "delivery", "released"].map((key) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`p-3 rounded-xl border text-left transition-all ${
              filterStatus === key
                ? "border-nx-violet/30 bg-nx-violet/5"
                : "border-white/5 bg-white/[0.02] hover:border-white/10"
            }`}
          >
            <p className="text-lg font-bold text-white">{counts[key] || 0}</p>
            <p className="text-[11px] text-white/30 capitalize">
              {key === "All"
                ? "Total"
                : statusConfig[key]?.label || key}
            </p>
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
          const status = statusConfig[order.status] || statusConfig.funded;
          const StatusIcon = status.icon;
          const isExpanded = expandedOrder === order._id;
          const commission = Math.round((order.amount || 0) * ((order.commissionRate || 0) / 100));
          const canMarkDelivered =
            order.status === "active" && order.sellerId === sellerId;
          const canRefund =
            ["active", "delivery", "funded"].includes(order.status) &&
            order.sellerId === sellerId;

          return (
            <div
              key={order._id}
              className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden transition-all hover:border-white/10"
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() =>
                  setExpandedOrder(isExpanded ? null : order._id)
                }
              >
                <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
                  <StatusIcon
                    className={`w-5 h-5 ${status.bg}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                    {order.transportRequired && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nx-cyan/10 text-nx-cyan">
                        Transport
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white truncate mt-0.5">
                    {order.title}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {order.deliveryCounty}, {order.deliveryTown}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">
                    KES {order.amount.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-white/30">
                    -{commission.toLocaleString()} fee
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/20 shrink-0 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                        Delivery
                      </h4>
                      <div className="flex items-start gap-2 text-xs text-white/40">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                        <div>
                          <p>
                            From: {order.originCounty}, {order.originTown}
                          </p>
                          <p>
                            To: {order.deliveryCounty}, {order.deliveryTown}
                          </p>
                        </div>
                      </div>
                      {order.transportFee && (
                        <p className="text-xs text-white/40">
                          Transport: KES {(order.transportFee || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                        Payment
                      </h4>
                      <div className="space-y-1 text-xs text-white/40">
                        <p>
                          Amount:{" "}
                          <span className="text-white/60">
                            {" "}
                            KES {order.amount.toLocaleString()}
                          </span>
                        </p>
                        <p>
                          Commission:{" "}
                          <span className="text-nx-violet">
                            {order.commissionRate}%
                          </span>
                        </p>
                        <p>
                          Escrow:{" "}
                          <span className="text-nx-cyan">{order.status}</span>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                        Actions
                      </h4>
                      <div className="flex flex-col gap-2">
                        {canMarkDelivered && (
                          <button
                            onClick={() => handleMarkDelivered(order._id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-400/10 text-emerald-400 text-xs font-medium hover:bg-emerald-400/20 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Mark Delivered
                          </button>
                        )}
                        {canRefund && !refundDone && (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => openRefund(order._id)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-400/10 text-amber-400 text-xs font-medium hover:bg-amber-400/20 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Refund Buyer
                            </button>
                          </div>
                        )}
                        {refundDone === order._id && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-400/10 text-emerald-400 text-xs font-medium">
                            <Check className="w-3.5 h-3.5" />
                            Refund initiated
                          </div>
                        )}
                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] text-white/40 text-xs font-medium hover:bg-white/[0.05] hover:text-white/60 transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Contact Support
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Refund form */}
                  {refundingId === order._id && (
                    <div className="pt-3 border-t border-white/5 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="font-medium">Refund the buyer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">
                          Amount (KES):
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="e.g. 5000"
                          className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/30 w-40"
                        />
                      </div>
                      {refundError && (
                        <p className="text-xs text-red-400">{refundError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRefundingId(null)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs font-medium hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitRefund}
                          disabled={!refundAmount.trim()}
                          className="px-3 py-1.5 rounded-lg bg-amber-400/10 text-amber-400 text-xs font-medium hover:bg-amber-400/20 transition-colors disabled:opacity-50"
                        >
                          Submit Refund
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">
            {searchQuery ? "No orders match your search" : "No orders yet"}
          </p>
          <p className="text-[11px] text-white/15 mt-1">
            Orders will appear when buyers purchase your products
          </p>
        </div>
      )}
    </SellerLayout>
  );
}
