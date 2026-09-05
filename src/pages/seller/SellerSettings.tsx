import { useState } from "react";
import SellerLayout from "./SellerLayout";
import { Settings,  Shield, Bell, CreditCard, User, Lock, Globe, Palette, ChevronRight, Phone } from "lucide-react";

const sections = [
  { icon: User, label: "Account", description: "Personal information and preferences" },
  { icon: Lock, label: "Security", description: "Password, two-factor authentication" },
  { icon: Bell, label: "Notifications", description: "Email and push notification preferences" },
  { icon: CreditCard, label: "Payment Methods", description: "M-Pesa and bank account settings" },
  { icon: Shield, label: "Verification", description: "Identity and business verification" },
  { icon: Globe, label: "Language", description: "English (default)" },
  { icon: Palette, label: "Theme", description: "Dark mode (active)" },
];

export default function SellerSettings() {
  const [activeSection, setActiveSection] = useState("Account");
  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-white/40 mt-1">Manage your account and preferences</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            {sections.map(s => (
              <button key={s.label} onClick={() => setActiveSection(s.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSection === s.label ? "bg-nx-violet/10 text-nx-violet" : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"}`}>
                <s.icon className="w-4 h-4 shrink-0" />
                <span className="text-left">{s.label}</span>
              </button>
            ))}
          </div>
          <div className="lg:col-span-3 p-6 rounded-xl bg-white/[0.02] border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">{activeSection}</h3>
            {activeSection === "Account" && (
              <div className="space-y-4">
                <div><label className="text-xs text-white/40 mb-1.5 block">Display Name</label><input defaultValue="TechZone Kenya" className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-nx-violet/50" /></div>
                <div><label className="text-xs text-white/40 mb-1.5 block">Email</label><input defaultValue="sales@techzone.co.ke" className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-nx-violet/50" /></div>
                <div><label className="text-xs text-white/40 mb-1.5 block">Phone</label><input defaultValue="+254 712 345 678" className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-nx-violet/50" /></div>
                <button className="px-4 py-2 rounded-lg bg-nx-violet text-white text-sm font-medium">Save Changes</button>
              </div>
            )}
            {activeSection === "Security" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div><p className="text-sm text-white">Change Password</p><p className="text-xs text-white/30">Last changed 30 days ago</p></div>
                  <button className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs text-white/40 hover:text-white/60">Change</button>
                </div>
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div><p className="text-sm text-white">Two-Factor Authentication</p><p className="text-xs text-white/30">Add an extra layer of security</p></div>
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-400/10 text-xs text-emerald-400">Enable</button>
                </div>
              </div>
            )}
            {activeSection === "Notifications" && (
              <div className="space-y-3">
                {["New order", "New message", "New offer", "Payment update", "Escrow release", "Dispute alert", "Product approval", "Review received"].map(n => (
                  <div key={n} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-sm text-white">{n}</span>
                    <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" defaultChecked className="sr-only peer" /><div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white/30 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-nx-violet peer-checked:after:bg-white"></div></label>
                  </div>
                ))}
              </div>
            )}
            {activeSection === "Payment Methods" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-400/5 border border-emerald-400/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400 text-lg font-bold">M</div>
                    <div><p className="text-sm text-white">M-Pesa</p><p className="text-xs text-white/30">+254 712 ***678</p></div>
                  </div>
                  <span className="text-[10px] text-emerald-400">Active</span>
                </div>
                <button className="w-full p-3 rounded-lg border border-dashed border-white/10 text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-colors">+ Add Bank Account</button>
                <div className="pt-4 border-t border-white/5 mt-4">
                  <button
                    onClick={() => window.open(`https://wa.me/254769739216?text=Hello%20Nexora%20Admin%2C%20I%20need%20help%20with%20my%20seller%20account`, '_blank')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-nx-gold/5 border border-nx-gold/10 text-nx-gold hover:bg-nx-gold/10 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <div><p className="text-sm font-medium">Contact Admin via WhatsApp</p><p className="text-[11px] text-white/30">For account issues, verification help, or support</p></div>
                  </button>
                </div>
              </div>
            )}
            {["Verification", "Language", "Theme"].includes(activeSection) && (
              <p className="text-sm text-white/40">Configure your {activeSection.toLowerCase()} settings here.</p>
            )}
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
