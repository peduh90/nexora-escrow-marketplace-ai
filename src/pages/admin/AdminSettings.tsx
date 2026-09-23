import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import AdminLayout from "./AdminLayout";
import AvatarPicker from "@/components/AvatarPicker";
import { useAuth } from "@/hooks/use-auth";
import { Settings, Shield, Bell, Globe, CreditCard, Info, Flag, Loader2, MapPin, Plus, Power, CheckCircle2 } from "lucide-react";

/** Profile-name editor for the signed-in admin — defaults to the registration
 * name and saves straight to the account, so every admin surface shows it. */
function AdminProfileNameField() {
  const { user } = useAuth();
  const updateProfile = useMutation(api.users.updateProfile);
  const [value, setValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = value ?? user?.name ?? "";

  const save = async () => {
    if (!current.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ name: current.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-white/50 mb-1.5 block">Profile Name</label>
      <div className="flex gap-2">
        <input value={current} onChange={(e) => setValue(e.target.value)}
          placeholder="Your profile name"
          className="flex-1 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-gold/50 focus:outline-none" />
        <button onClick={save} disabled={saving || !current.trim() || current === (user?.name || "")}
          className="px-4 py-2 rounded-lg bg-nx-gold text-black text-xs font-semibold hover:bg-nx-gold/85 transition-colors disabled:opacity-40 flex items-center gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      <p className="text-[10px] text-white/20 mt-1">Defaults to the name you registered with — shown across the admin panel and marketplace.</p>
    </div>
  );
}

/**
 * Pickup Hubs tab (#71): admin-managed collection points that cut last-mile
 * cost. Buyers see the hub fee at checkout; changes are audit-logged.
 */
function PickupHubsTab() {
  const hubs = useQuery(api.hubs.adminListHubs, {});
  const createHub = useMutation(api.hubs.adminCreateHub);
  const updateHub = useMutation(api.hubs.adminUpdateHub);
  const [form, setForm] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  if (hubs === undefined) {
    return (
      <div className="p-10 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-nx-violet animate-spin" />
      </div>
    );
  }

  async function save() {
    if (!form.name?.trim() || !form.county?.trim() || !form.town?.trim()) {
      toast.error("Name, county and town are required");
      return;
    }
    setBusy(true);
    try {
      if (form._id) {
        await updateHub({
          hubId: form._id,
          name: form.name,
          county: form.county,
          town: form.town,
          landmark: form.landmark || undefined,
          directions: form.directions || undefined,
          phone: form.phone || undefined,
          hours: form.hours || undefined,
          fee: form.fee ? Number(form.fee) : 0,
          active: form.active,
        });
      } else {
        await createHub({
          name: form.name,
          county: form.county,
          town: form.town,
          landmark: form.landmark || undefined,
          directions: form.directions || undefined,
          phone: form.phone || undefined,
          hours: form.hours || undefined,
          fee: form.fee ? Number(form.fee) : 0,
        });
      }
      setForm(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save hub");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Pickup Hubs ({hubs.length})</h3>
        <button onClick={() => setForm({ name: "", county: "", town: "", fee: "" })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-violet text-white text-xs font-medium">
          <Plus className="w-3.5 h-3.5" /> Add hub
        </button>
      </div>
      <p className="text-[11px] text-white/30 mb-4">
        Collection points where buyers pick up orders instead of door delivery — cuts last-mile cost. Buyers see the fee at checkout.
      </p>

      {form && (
        <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2.5">
          <div className="grid sm:grid-cols-2 gap-2.5">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Hub name e.g. Kerugoya Collect Point" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-nx-violet/50" />
            <input value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} placeholder="Town" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none" />
            <input value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} placeholder="County" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none" />
            <input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder="Landmark e.g. opposite Total station" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none" />
            <input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="Hours e.g. Mon–Sat 8am–6pm" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none" />
            <input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="Collection fee KES (0 = free)" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Hub phone (optional)" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none" />
            {form._id && (
              <label className="flex items-center gap-2 text-xs text-white/60">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-nx-violet" /> Active (visible at checkout)
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={busy} className="px-4 py-2 rounded-lg bg-nx-violet text-white text-xs font-bold disabled:opacity-40">{busy ? "Saving…" : form._id ? "Update hub" : "Create hub"}</button>
            <button onClick={() => setForm(null)} className="px-4 py-2 rounded-lg border border-white/10 text-xs text-white/50 hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {hubs.length === 0 ? (
        <p className="text-xs text-white/35 bg-white/[0.02] rounded-xl p-4">No hubs yet. Add your first pickup point — start where demand is highest.</p>
      ) : (
        <div className="space-y-2">
          {hubs.map((h: any) => (
            <div key={h._id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <MapPin className="w-4 h-4 text-nx-cyan shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{h.name} {h.active === false && <span className="text-[10px] text-red-300">(inactive)</span>}</p>
                <p className="text-[11px] text-white/35">{h.town}, {h.county}{h.landmark ? ` · ${h.landmark}` : ""}{h.hours ? ` · ${h.hours}` : ""} · {h.fee ? `KES ${h.fee}` : "FREE"}</p>
              </div>
              <button onClick={() => setForm({ ...h, fee: h.fee ?? "", active: h.active !== false })} className="px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-white/60 hover:text-white">Edit</button>
              <button
                onClick={async () => { try { await updateHub({ hubId: h._id, name: h.name, county: h.county, town: h.town, landmark: h.landmark, directions: h.directions, phone: h.phone, hours: h.hours, fee: h.fee ?? 0, active: h.active === false }); } catch (err: any) { toast.error(err.message); } }}
                title={h.active === false ? "Activate" : "Deactivate"}
                className="p-2 rounded-lg text-white/30 hover:text-white"
              >
                <Power className={`w-3.5 h-3.5 ${h.active === false ? "" : "text-emerald-400"}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Feature Flags tab (#166–168): every major feature ships dark behind a flag
 * and rolls out per environment (development → pilot county → production)
 * without code deploys. Toggles write to the featureFlags table and every
 * change is audit-logged server-side.
 */
function FeatureFlagsTab() {
  const flags = useQuery(api.flags.getFlags, {});
  const setFlag = useMutation(api.flags.setFlag);
  const [busy, setBusy] = useState<string | null>(null);

  if (flags === undefined) {
    return (
      <div className="p-10 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-nx-violet animate-spin" />
      </div>
    );
  }

  const toggle = async (key: string, enabled: boolean) => {
    setBusy(key);
    try {
      await setFlag({ key, enabled });
    } catch (err: any) {
      toast.error(err.message || "Failed to update flag");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
      <h3 className="text-sm font-semibold text-white mb-1">Feature Flags</h3>
      <p className="text-[11px] text-white/30 mb-4">
        Roll out major features gradually — development → pilot county → full production — without code deploys. Every change is audit-logged.
      </p>
      <div className="space-y-2">
        {flags.map((f) => (
          <div key={f.key} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-white font-medium">{f.label}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  f.rollout === "production" ? "bg-emerald-400/10 text-emerald-400" :
                  f.rollout === "pilot" ? "bg-amber-400/10 text-amber-400" :
                  "bg-white/5 text-white/30"
                }`}>{f.rollout}</span>
              </div>
              <p className="text-[11px] text-white/30 mt-0.5">{f.description}</p>
            </div>
            <button
              onClick={() => toggle(f.key, !f.enabled)}
              disabled={busy === f.key}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 disabled:opacity-40 ${f.enabled ? "bg-emerald-500/80" : "bg-white/10"}`}
              aria-label={`${f.enabled ? "Disable" : "Enable"} ${f.label}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${f.enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        ))
        }
      </div>
    </div>
  );
}

/**
 * Platform settings are read-only here by design: the live values come from
 * the fee engine (src/convex/fees.ts), M-Pesa credentials from server env
 * vars, and delivery zones from the transport pricing logic. Showing fake
 * editable inputs with a dead Save button hid that — now the page states
 * exactly where each value is controlled.
 */
export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const { user } = useAuth();

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-sm text-white/40 mt-1">Live platform configuration — controlled by the backend engine</p>
      </div>

      {/* Admin profile icon + profile name */}
      <div className="mb-6 p-5 rounded-xl border border-white/5 bg-[#0A0A12]">
        <h3 className="text-sm font-semibold text-white mb-4">Your Profile</h3>
        <div className="flex items-start gap-6 flex-wrap">
          <AvatarPicker image={(user as any)?.image} name={user?.name} size="lg" />
          <div className="flex-1 min-w-[240px]">
            <AdminProfileNameField />
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 flex-wrap">
        {[
          { id: "general", label: "General", icon: Settings },
          { id: "fees", label: "Fees & Commission", icon: CreditCard },
          { id: "delivery", label: "Delivery Zones", icon: Globe },
          { id: "security", label: "Security", icon: Shield },
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "flags", label: "Feature Flags", icon: Flag },
          { id: "hubs", label: "Pickup Hubs", icon: MapPin },
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

      {activeTab === "flags" && <FeatureFlagsTab />}
      {activeTab === "hubs" && <PickupHubsTab />}

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
