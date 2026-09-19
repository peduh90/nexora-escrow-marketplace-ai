import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft, Bell, CheckCheck, Briefcase, Wallet, Shield, PenTool,
} from "lucide-react";

const typeIcon: Record<string, typeof Bell> = {
  freelance: Briefcase,
  escrow_fund: Wallet,
  escrow_release: Wallet,
  deposit: Wallet,
  withdrawal: Wallet,
  account: Shield,
  message: Bell,
};

/**
 * Freelance / Employer notifications — the real notifications table, which
 * the backend writes to on hire, escrow fund, work submission, revision
 * request, and payment release. Both panels share this page; the back button
 * and empty-state copy adapt to the caller's role.
 */
export default function FreelanceNotifications() {
  const navigate = useNavigate();
  const notifications = useQuery(api.reviews.getNotifications);
  const markAsRead = useMutation(api.reviews.markAsRead);
  const profile = useQuery(api.freelance.getMyProfile);

  const isEmployer = profile?.roleMode === "employer";
  const unread = (notifications ?? []).filter((n: any) => !n.read).length;

  useEffect(() => {
    document.title = "Notifications — Nexora Freelance";
    return () => {
      document.title = "Nexora Market — AI-Powered Escrow Marketplace";
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="hidden md:flex sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 items-center px-4 md:px-6">
          <button
            onClick={() => navigate(isEmployer ? "/employer" : "/freelance/dashboard")}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold text-white">Notifications</h1>
          {unread > 0 && (
            <span className="ml-auto flex items-center gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">
                {unread} unread
              </span>
              <button
                onClick={() => markAsRead({})}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white/40 hover:text-white/70 transition-colors"
              >
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            </span>
          )}
        </div>

        <div className="p-4 md:p-6">
          {notifications === undefined ? (
            <div className="py-16 text-center">
              <Bell className="w-8 h-8 text-white/10 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-white/30">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center rounded-xl bg-white/[0.02] border border-white/5">
              <PenTool className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-medium">No notifications yet</p>
              <p className="text-[11px] text-white/20 mt-1 max-w-xs mx-auto">
                {isEmployer
                  ? "Hiring confirmations, work submissions, and escrow updates will appear here."
                  : "Hire confirmations, escrow funding, revision requests, and payments will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-w-2xl">
              {notifications.map((n: any) => {
                const Icon = typeIcon[n.type] || Bell;
                return (
                  <button
                    key={n._id}
                    onClick={() => {
                      if (!n.read) markAsRead({});
                      if (n.link) navigate(n.link);
                    }}
                    className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${
                      n.read
                        ? "border-white/5 bg-white/[0.02] hover:border-white/10"
                        : "border-nx-violet/20 bg-nx-violet/[0.04] hover:border-nx-violet/35"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      n.read ? "bg-white/[0.03]" : "bg-nx-violet/15"
                    }`}>
                      <Icon className={`w-4 h-4 ${n.read ? "text-white/30" : "text-nx-violet"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${n.read ? "text-white/60" : "text-white font-medium"}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-nx-violet shrink-0" />}
                      </div>
                      <p className="text-xs text-white/35 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-white/20 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
