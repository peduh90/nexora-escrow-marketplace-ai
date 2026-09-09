import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Settings, Shield, Bell, Globe, CreditCard, Info } from "lucide-react";

/**
 * Platform settings are read-only here by design: the live values come from
 * the fee engine (src/convex/fees.ts), M-Pesa credentials from server env
 * vars, and delivery zones from the transport pricing logic. Showing fake
 * editable inputs with a dead Save button hid that — now the page states
 * exactly where each value is controlled.
 */
export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-sm text-white/40 mt-1">Live platform configuration — controlled by the backend engine</p>
      </div>

      <div className="flex gap-1 mb-6 flex-wrap">
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
                { label: "Support", value: "WhatsApp +254 769 739 216" },
              ].map(f => (
                <div key={f.label} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm text-white/80 mt-1">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
            <h3 className="text-sm font-semibold text-white mb-2">M-Pesa Configuration</h3>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-nx-cyan/[0.03] border border-nx-cyan/10">
              <Info className="w-4 h-4 text-nx-cyan shrink-0 mt-0.5" />
              <p className="text-xs text-white/40">
                M-Pesa Daraja credentials (Consumer Key, Consumer Secret, Passkey, Short Code) are stored
                as server-side environment variables and never exposed to the browser. Payments run through
                the wallet engine in <span className="text-nx-cyan">src/convex/mpesa.ts</span> and <span className="text-nx-cyan">src/convex/wallet.ts</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "fees" && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
            <h3 className="text-sm font-semibold text-white mb-1">Seller Commission Structure</h3>
            <p className="text-[11px] text-white/30 mb-4">Tiered schedule enforced by the fee engine. Withdrawals carry no Nexora percentage fee — only actual external provider costs.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "Seller Commission (KSh 1–4,999)", value: "3%" },
                { label: "Seller Commission (KSh 5,000–49,999)", value: "2.5%" },
                { label: "Seller Commission (KSh 50,000–199,999)", value: "2%" },
                { label: "Seller Commission (KSh 200,000+)", value: "1.5%" },
                { label: "Buyer Protection (KSh 1–10,000)", value: "1%" },
                { label: "Buyer Protection (KSh 10,001–50,000)", value: "0.75%" },
                { label: "Buyer Protection (KSh 50,001–200,000)", value: "0.5%" },
                { label: "Buyer Protection (KSh 200,000+)", value: "0.25%" },
                { label: "Freelancer Commission (KSh 1–5,000)", value: "3%" },
                { label: "Freelancer Commission (KSh 5,001–50,000)", value: "2%" },
                { label: "Freelancer Commission (KSh 50,001–250,000)", value: "1.5%" },
                { label: "Freelancer Commission (KSh 250,000+)", value: "1%" },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-white/40">{f.label}</span>
                  <span className="text-sm font-semibold text-white">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "delivery" && (
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-4">Delivery Zone Configuration</h3>
          <p className="text-xs text-white/30 mb-4">Transport pricing is computed by the Nexora delivery engine when an order is placed. Sellers cannot modify these settings.</p>
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
              <div key={z.zone} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-xs text-white/50 flex-1">{z.zone}</span>
                <span className="text-xs font-medium text-white w-24 text-right">{z.fee}</span>
                <span className="text-xs text-white/30 w-28 text-right">{z.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === "security" || activeTab === "notifications") && (
        <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
          <h3 className="text-sm font-semibold text-white mb-2">
            {activeTab === "security" ? "Security" : "Notifications"}
          </h3>
          <p className="text-xs text-white/30">
            {activeTab === "security"
              ? "Authentication, 2FA and password policies are enforced by the auth engine (src/convex/users.ts). Owner-level controls live in Owner Control."
              : "In-app notifications are generated automatically by escrow, KYC, dispute and order events. Per-user email/SMS preferences are coming with the East Africa expansion."}
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
