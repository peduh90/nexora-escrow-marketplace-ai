import SellerLayout from "./SellerLayout";
import { Bell, ShoppingCart, MessageSquare, TrendingUp, Shield, Package, CheckCircle2, AlertTriangle, Star, Download, Truck } from "lucide-react";

const notifications = [
  { id: "n1", type: "order", icon: ShoppingCart, color: "text-emerald-400", text: "New order received — HP EliteBook 840 G3", time: "2 min ago", unread: true },
  { id: "n2", type: "message", icon: MessageSquare, color: "text-nx-cyan", text: "New message from James Kamau", time: "15 min ago", unread: true },
  { id: "n3", type: "offer", icon: TrendingUp, color: "text-amber-400", text: "New offer on iPhone 15 Pro Max — KSh 150,000", time: "1 hour ago", unread: true },
  { id: "n4", type: "escrow", icon: Shield, color: "text-nx-violet", text: "KSh 18,500 released from escrow — Order #NX-20475", time: "3 hours ago", unread: false },
  { id: "n5", type: "delivery", icon: Truck, color: "text-blue-400", text: "Order #NX-20485 is now in transit", time: "5 hours ago", unread: false },
  { id: "n6", type: "product", icon: Package, color: "text-white/40", text: "Your product 'Samsung Galaxy S24' has been approved", time: "1 day ago", unread: false },
  { id: "n7", type: "review", icon: Star, color: "text-amber-400", text: "New 5-star review from Sarah Wanjiku", time: "1 day ago", unread: false },
  { id: "n8", type: "withdrawal", icon: Download, color: "text-emerald-400", text: "Withdrawal of KSh 20,000 completed", time: "2 days ago", unread: false },
  { id: "n9", type: "dispute", icon: AlertTriangle, color: "text-red-400", text: "Dispute opened on Order #NX-20470", time: "3 days ago", unread: false },
];

export default function SellerNotifications() {
  return (
    <SellerLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-white/40 mt-1">{notifications.filter(n => n.unread).length} unread</p>
          </div>
          <button className="text-xs text-nx-violet hover:text-nx-violet/80">Mark all as read</button>
        </div>
        <div className="space-y-1">
          {notifications.map(n => (
            <div key={n.id} className={`flex items-start gap-3 p-4 rounded-xl transition-colors ${n.unread ? "bg-nx-violet/5 border border-nx-violet/10" : "hover:bg-white/[0.02]"}`}>
              <div className={`w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0`}>
                <n.icon className={`w-4 h-4 ${n.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.unread ? "text-white" : "text-white/60"}`}>{n.text}</p>
                <p className="text-[10px] text-white/25 mt-1">{n.time}</p>
              </div>
              {n.unread && <div className="w-2 h-2 rounded-full bg-nx-violet shrink-0 mt-2" />}
            </div>
          ))}
        </div>
      </div>
    </SellerLayout>
  );
}
