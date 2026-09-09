import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import BuyerLayout from "./BuyerLayout";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import {
  User, Shield, Bell, CreditCard, Globe, Lock, Fingerprint,
  ChevronRight, LogOut, HelpCircle, FileText, Eye, KeyRound, Loader2,
} from "lucide-react";
import { openWhatsApp, getWhatsAppSupportUrl } from "@/lib/whatsapp";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>
      {children}
    </motion.div>
  );
}

type SettingsItem = {
  icon: typeof User;
  label: string;
  desc: string;
  color: string;
  badge?: string;
  action?: () => void;
};

export default function BuyerSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const updatePassword = useMutation(api.users.updatePassword);
  const [showSecurity, setShowSecurity] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const kycBadge =
    (user as any)?.kycStatus === "verified" ? "Verified"
    : (user as any)?.kycStatus === "pending" ? "Pending"
    : undefined;

  const savePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await updatePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
        confirmPassword,
      });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowSecurity(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const settingsSections: { title: string; items: SettingsItem[] }[] = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile Information", desc: "Name, email, phone number", color: "#8B5CF6", action: () => navigate("/buyer/profile") },
        { icon: Fingerprint, label: "KYC Verification", desc: "Identity verification status", color: "#06B6D4", badge: kycBadge },
        { icon: Lock, label: "Security", desc: "Change your password", color: "#10B981", action: () => setShowSecurity((s) => !s) },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", desc: "Email, push, SMS preferences", color: "#F59E0B", action: () => navigate("/buyer/notifications") },
        { icon: Globe, label: "Language & Region", desc: "English, Kenya (KES)", color: "#8B5CF6" },
        { icon: CreditCard, label: "Payment Methods", desc: "M-Pesa, bank accounts", color: "#06B6D4", action: () => navigate("/buyer/wallet") },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        { icon: Shield, label: "Privacy Settings", desc: "Data sharing, visibility", color: "#EC4899" },
        { icon: Eye, label: "Blocked Users", desc: "Manage blocked accounts", color: "#F59E0B" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", desc: "Chat with our support team", color: "#06B6D4", action: () => openWhatsApp(getWhatsAppSupportUrl("Hello Nexora, I need help with my account.")) },
        { icon: FileText, label: "Terms & Privacy", desc: "Legal documents", color: "#8B5CF6", action: () => navigate("/terms") },
      ],
    },
  ];

  return (
    <BuyerLayout>
      <div className="space-y-6 max-w-3xl">
        <FadeIn>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-white/40 mt-1">Manage your account and preferences</p>
        </FadeIn>

        {/* Profile card */}
        <FadeIn delay={0.05}>
          <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-nx-cyan/15 flex items-center justify-center shrink-0">
              {user?.image ? (
                <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-nx-cyan">
                  {(user?.name || "B")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white">{user?.name || "Buyer"}</h3>
              <p className="text-sm text-white/40 truncate">{user?.email || "buyer@nexora.com"}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-nx-cyan bg-nx-cyan/10 px-1.5 py-0.5 rounded font-medium">BUYER</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/buyer/profile")}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </FadeIn>

        {/* Password change (opened from Security) */}
        {showSecurity && (
          <FadeIn>
            <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" /> Change Password
              </h3>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password (leave empty if none set)"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (8+ chars, upper, lower, number, symbol)"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-cyan/50 focus:outline-none"
              />
              <button
                onClick={savePassword}
                disabled={saving || !newPassword}
                className="px-4 py-2 rounded-lg bg-nx-cyan text-white text-xs font-medium hover:bg-nx-cyan/80 disabled:opacity-40 transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? "Saving…" : "Update Password"}
              </button>
            </div>
          </FadeIn>
        )}

        {/* Settings sections */}
        {settingsSections.map((section, si) => (
          <FadeIn key={section.title} delay={0.1 + si * 0.05}>
            <div>
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-1">{section.title}</h3>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] divide-y divide-white/[0.03]">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.015] transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}10` }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/80">{item.label}</p>
                      <p className="text-[11px] text-white/30">{item.desc}</p>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] text-nx-emerald bg-nx-emerald/10 px-1.5 py-0.5 rounded font-medium mr-2">
                        {item.badge}
                      </span>
                    )}
                    {item.action && <ChevronRight className="w-4 h-4 text-white/15" />}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>
        ))}

        {/* Sign out */}
        <FadeIn delay={0.3}>
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-400/10 bg-red-400/5 text-red-400 text-sm font-medium hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </FadeIn>
      </div>
    </BuyerLayout>
  );
}
