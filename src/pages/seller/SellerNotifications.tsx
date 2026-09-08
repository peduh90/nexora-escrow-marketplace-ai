import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router";
import SellerLayout from "./SellerLayout";
import { Bell, MessageCircle, ShoppingCart, ShieldCheck, ArrowLeft } from "lucide-react";

const iconFor = (type: string) => {
  switch (type) {
    case "message": return MessageCircle;
    case "order": return ShoppingCart;
    case "escrow": return ShieldCheck;
    default: return Bell;
  }
};

export default function SellerNotifications() {
  const navigate = useNavigate();
  const notifications = useQuery(api.reviews.getNotifications);
  const markAsRead = useMutation(api.reviews.markAsRead);

  const items = notifications ?? [];
  const unread = items.filter((n: any) => !n.read).length;

  return (
    <SellerLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-sm text-white/40 mt-0.5">{unread} unread</p>
            </div>
          </div>
          {unread > 0 && (
            <button
              onClick={() => markAsRead({})}
              className="text-xs px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-nx-violet hover:bg-white/[0.06] transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 rounded-xl bg-white/[0.02] border border-white/5">
            <Bell className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40 font-medium">No notifications yet</p>
            <p className="text-[11px] text-white/20 mt-1">Orders, messages, and approval updates will appear here</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white/[0.02] border border-white/5 divide-y divide-white/[0.04]">
            {items.map((n: any) => {
              const Icon = iconFor(n.type);
              return (
                <button
                  key={n._id}
                  onClick={() => {
                    if (!n.read) markAsRead({});
                    if (n.link) navigate(n.link);
                  }}
                  className={`w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-white/[0.02] transition-colors ${!n.read ? "bg-nx-violet/[0.04]" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${n.read ? "bg-white/5" : "bg-nx-violet/15"}`}>
                    <Icon className={`w-5 h-5 ${n.read ? "text-white/30" : "text-nx-violet"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${n.read ? "text-white/60" : "text-white font-semibold"}`}>{n.title}</p>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-nx-violet shrink-0" />}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-white/20 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
