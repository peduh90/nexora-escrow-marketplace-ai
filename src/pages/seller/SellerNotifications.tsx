import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import SellerLayout from "./SellerLayout";
import { Bell } from "lucide-react";

export default function SellerNotifications() {
  const { user } = useAuth();
  // Notifications would come from a Convex notifications table in production
  // For now show empty state with no fake data

  return (
    <SellerLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-white/40 mt-1">0 unread</p>
          </div>
          <button className="text-xs text-nx-violet hover:text-nx-violet/80">Mark all as read</button>
        </div>

        <div className="text-center py-20 rounded-xl bg-white/[0.02] border border-white/5">
          <Bell className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40 font-medium">No notifications yet</p>
          <p className="text-[11px] text-white/20 mt-1">You'll receive notifications about orders, messages, and payments here</p>
        </div>
      </div>
    </SellerLayout>
  );
}
