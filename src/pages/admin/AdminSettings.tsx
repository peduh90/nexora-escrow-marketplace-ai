import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Settings, Shield, Bell, Globe, CreditCard, Users, Save } from "lucide-react";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-sm text-white/40 mt-1">Configure platform-wide settings, fees, and policies</p>
      </div>

      <div className="flex gap-1 mb-6">
        {[
          { id: "general", label: "General", icon: Settings },
          { id: "fees", label: "Fees & Commission", icon: CreditCard },
          { id: "delivery", label: "Delivery Zones", icon: Globe },
          { id: "security", label: "Security", icon: Shield },
          { id: "notifications", label: "Notifications", icon: Bell },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === tab.id ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"}`}>
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
            <h3 className="text-sm font-semibold text-white mb-4">Platform Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Platform Name", value: "Nexora Market" },
                { label: "Currency", value: "KES (Kenyan Shilling)" },
                { label: "Primary Country", value: "Kenya" },
                { label: "Default Language", value: "English" },
                { label: "Support Email", value: "support@nexora.market" },
                { label: "Platform URL", value: "https://nexora.market" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">{f.label}</label>
                  <input defaultValue={f.value} className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white focus:border-nx-violet/30 focus:outline-none" />
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
            <h3 className="text-sm font-semibold text-white mb-4">M-Pesa Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Consumer Key</label>
                <input type="password" defaultValue="••••••••••••" className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/50 focus:border-nx-violet/30 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Consumer Secret</label>
                <input type="password" defaultValue="••••••••••••" className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/50 focus:border-nx-violet/30 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Passkey</label>
                <input type="password" defaultValue="••••••••••••" className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white/50 focus:border-nx-violet/30 focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Short Code</label>
                <input defaultValue="174379" className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white focus:border-nx-violet/30 focus:outline-none" />
              </div>
            </div>
            <p className="text-[10px] text-white/20 mt-3">M-Pesa credentials are stored securely on the server and never exposed to the frontend.</p>
          </div>
        </div>
      )}

      {activeTab === "fees" && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
            <h3 className="text-sm font-semibold text-white mb-4">Commission Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { tier: "Starter (Free)", fee: "5%", desc: "Standard sellers" },
                { tier: "Professional (KES 999/mo)", fee: "2.5%", desc: "Active sellers" },
                { tier: "Enterprise (KES 4,999/mo)", fee: "0.5%", desc: "High-volume sellers" },
              ].map(t => (
                <div key={t.tier} className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                  <p className="text-xs text-white/50 font-medium">{t.tier}</p>
                  <p className="text-2xl font-bold text-white mt-1">{t.fee}</p>
                  <p className="text-[10px] text-white/25 mt-1">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
            <h3 className="text-sm font-semibold text-white mb-4">Platform Fees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Escrow Fee", value: "1%" },
                { label: "Delivery Commission", value: "5%" },
                { label: "Withdrawal Fee (M-Pesa)", value: "KES 50" },
                { label: "Withdrawal Fee (Bank)", value: "KES 100" },
                { label: "Insurance Fee", value: "2% of item value" },
                { label: "Promoted Listing Fee", value: "KES 200/day" },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                  <span className="text-xs text-white/40">{f.label}</span>
                  <input defaultValue={f.value} className="w-32 px-2 py-1 rounded bg-white/[0.03] border border-white/5 text-xs text-white text-right focus:border-nx-violet/30 focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "delivery" && (
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4">Delivery Zone Configuration</h3>
          <p className="text-xs text-white/30 mb-4">Configure delivery fees and estimated times for each zone. Sellers cannot modify these settings.</p>
          <div className="space-y-3">
            {[
              { zone: "Nairobi CBD", fee: "FREE", time: "1-2 hours" },
              { zone: "Westlands / Karen / Kilimani", fee: "FREE", time: "1-3 hours" },
              { zone: "Kiambu / Ruiru / Thika", fee: "KES 200", time: "Same day" },
              { zone: "Nakuru", fee: "KES 400", time: "1-2 days" },
              { zone: "Kisumu", fee: "KES 500", time: "1-2 days" },
              { zone: "Eldoret", fee: "KES 600", time: "1-2 days" },
              { zone: "Mombasa", fee: "KES 800", time: "2-3 days" },
            ].map(z => (
              <div key={z.zone} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02]">
                <span className="text-xs text-white/50 flex-1">{z.zone}</span>
                <input defaultValue={z.fee} className="w-24 px-2 py-1 rounded bg-white/[0.03] border border-white/5 text-xs text-white text-right focus:border-nx-violet/30 focus:outline-none" />
                <input defaultValue={z.time} className="w-28 px-2 py-1 rounded bg-white/[0.03] border border-white/5 text-xs text-white text-right focus:border-nx-violet/30 focus:outline-none" />
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === "security" || activeTab === "notifications") && (
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <p className="text-xs text-white/30">Configuration options for {activeTab} settings.</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button className="px-6 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>
    </AdminLayout>
  );
}
