import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Globe,
  Lock,
  Fingerprint,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }} className={className}>
      {children}
    </motion.div>
  );
}

const settingsSections = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Profile Information", desc: "Name, email, phone number", color: "#8B5CF6" },
      { icon: Fingerprint, label: "KYC Verification", desc: "Identity verification status", color: "#06B6D4", badge: "Verified" },
      { icon: Lock, label: "Security", desc: "Password, 2FA, login history", color: "#10B981" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Bell, label: "Notifications", desc: "Email, push, SMS preferences", color: "#F59E0B" },
      { icon: Globe, label: "Language & Region", desc: "English, Kenya (KES)", color: "#8B5CF6" },
      { icon: CreditCard, label: "Payment Methods", desc: "M-Pesa, bank accounts", color: "#06B6D4" },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      { icon: Shield, label: "Privacy Settings", desc: "Data sharing, visibility", color: "#EC4899" },
      { icon: Lock, label: "API Keys", desc: "Manage developer access", color: "#10B981" },
    ],
  },
];

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6">
          <h2 className="text-sm font-semibold text-white">Settings</h2>
        </div>

        <div className="p-4 md:p-6 space-y-6 max-w-3xl">
          <FadeIn>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-white/40 mt-1">Manage your account and preferences</p>
          </FadeIn>

          {/* Profile card */}
          <FadeIn delay={0.05}>
            <div className="p-5 rounded-xl border border-white/5 bg-nx-surface/50 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-nx-violet/15 flex items-center justify-center">
                <span className="text-xl font-bold text-nx-violet">
                  {(user?.name || "U")[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">{user?.name || "User"}</h3>
                <p className="text-sm text-white/40">{user?.email || "user@nexora.com"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-nx-emerald bg-nx-emerald/10 px-1.5 py-0.5 rounded font-medium">VERIFIED</span>
                  <span className="text-[9px] text-nx-violet bg-nx-violet/10 px-1.5 py-0.5 rounded font-medium">PROFESSIONAL</span>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors">
                Edit Profile
              </button>
            </div>
          </FadeIn>

          {/* Settings sections */}
          {settingsSections.map((section, si) => (
            <FadeIn key={section.title} delay={0.1 + si * 0.05}>
              <div>
                <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-1">{section.title}</h3>
                <div className="rounded-xl border border-white/5 bg-nx-surface/50 divide-y divide-white/[0.03]">
                  {section.items.map((item) => (
                    <button
                      key={item.label}
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
                      <ChevronRight className="w-4 h-4 text-white/15" />
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </main>
    </div>
  );
}
