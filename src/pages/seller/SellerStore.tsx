import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import SellerLayout from "./SellerLayout";
import { Store, Save, Loader2 } from "lucide-react";

/**
 * Seller store profile. Saves to the user record (storeDescription /
 * storeWebsite / storeHours) which the public seller profile page displays.
 * The old version had a fake save button that only flipped local state —
 * nothing was ever persisted.
 */
export default function SellerStore() {
  const { user } = useAuth();
  const updateProfile = useMutation(api.users.updateProfile);

  const [form, setForm] = useState({
    storeName: (user as any)?.businessName || "",
    description: (user as any)?.storeDescription || "",
    phone: (user as any)?.phone || "",
    email: (user as any)?.email || "",
    website: (user as any)?.storeWebsite || "",
    county: (user as any)?.county || "",
    town: (user as any)?.town || "",
    hours: (user as any)?.storeHours || "",
  });
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  const handleSave = async () => {
    if (!form.storeName.trim()) {
      toast.error("Store name is required");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: form.storeName.trim(),
        storeDescription: form.description,
        storeWebsite: form.website,
        storeHours: form.hours,
        county: form.county,
        town: form.town,
      });
      toast.success("Store profile saved — visible on your public seller page");
      setSavedOnce(true);
    } catch (err: any) {
      toast.error(err?.message || "Could not save store profile");
    } finally {
      setSaving(false);
    }
  };

  const fields: Array<{
    label: string;
    key: string;
    placeholder: string;
    textarea?: boolean;
    readOnly?: boolean;
    hint?: string;
  }> = [
    { label: "Store Name", key: "storeName", placeholder: "Your store name" },
    { label: "Description", key: "description", placeholder: "Describe your store — this shows on your public seller page...", textarea: true },
    { label: "Phone", key: "phone", placeholder: "+254 7XX XXX XXX", readOnly: true, hint: "Change in Settings → Profile" },
    { label: "Email", key: "email", placeholder: "email@store.com", readOnly: true, hint: "Fixed to your account email" },
    { label: "Website", key: "website", placeholder: "https://", hint: "Shown on your public seller page" },
    { label: "County", key: "county", placeholder: "Nairobi" },
    { label: "Town", key: "town", placeholder: "Westlands" },
    { label: "Opening Hours", key: "hours", placeholder: "Mon-Sat 8AM-6PM", hint: "Shown on your public seller page" },
  ];

  return (
    <SellerLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Store Profile</h1>
          <p className="text-sm text-white/40 mt-1">
            Customize your store information — shown to buyers on your public seller page
          </p>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-16 h-16 rounded-xl bg-nx-violet/10 border border-white/5 flex items-center justify-center shrink-0">
            <Store className="w-7 h-7 text-nx-violet" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{form.storeName || "Your store"}</p>
            <p className="text-[11px] text-white/30">
              This is how buyers see your store across the marketplace
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-white/40 mb-1.5">
                {field.label}
                {"hint" in field && field.hint && (
                  <span className="text-white/20 ml-2">· {field.hint}</span>
                )}
              </label>
              {field.textarea ? (
                <textarea
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none resize-none"
                />
              ) : (
                <input
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  readOnly={"readOnly" in field && field.readOnly}
                  className={`w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/50 focus:outline-none ${
                    "readOnly" in field && field.readOnly ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-nx-violet text-white text-sm font-medium hover:bg-nx-violet/80 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> {savedOnce ? "Save again" : "Save Changes"}</>
          )}
        </button>
      </div>
    </SellerLayout>
  );
}
