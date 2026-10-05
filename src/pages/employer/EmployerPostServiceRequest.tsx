import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { ArrowLeft, Wrench, Loader2, MapPin, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";

/**
 * FLOW B — service request (Part 4B / Part 8).
 *
 * A "Service Provider" post is NOT an employment vacancy and NOT a freelance
 * project: it is a booking against a real local provider profile, written to
 * `serviceRequests` by the existing `services.requestService` mutation. The
 * provider then accepts/declines, the booking is funded and escrowed.
 *
 * Providers are read live from `serviceProfiles` — the list is never faked.
 */
const CATEGORIES = [
  { slug: "plumbers", name: "Plumbers" },
  { slug: "electricians", name: "Electricians" },
  { slug: "auto", name: "Mechanics & car repair" },
  { slug: "cleaning", name: "Cleaning" },
  { slug: "laundry", name: "Laundry & ironing" },
  { slug: "beauty", name: "Salon & barber" },
  { slug: "home", name: "Home repairs" },
  { slug: "fundis", name: "Construction & fundis" },
  { slug: "tech-repair", name: "Phone & computer repair" },
  { slug: "garden", name: "Gardening & landscaping" },
  { slug: "photography", name: "Photography & video" },
  { slug: "boda", name: "Boda & delivery" },
];

export default function EmployerPostServiceRequest() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("plumbers");
  const [selected, setSelected] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers = useQuery(api.services.getProvidersByCategory, { category });
  const requestService = useMutation(api.services.requestService);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return setError("Choose a provider first");
    if (title.trim().length < 3) return setError("Add a short title for the work");
    setError(null);
    setSubmitting(true);
    try {
      await requestService({
        providerId: selected._id,
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
      });
      toast.success("Service request sent", {
        description: `${selected.displayName} will confirm. Pay stays in escrow until the work is done.`,
      });
      navigate("/employer");
    } catch (err: any) {
      setError(err?.message || "Could not send the request.");
    } finally {
      setSubmitting(false);
    }
  };

  const select =
    "px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-nx-violet/50";
  const input =
    "w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-nx-violet/50";

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-28 md:pb-16">
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button onClick={() => navigate("/employer/post-job")} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Change what you need
          </button>
          <h1 className="mt-3 text-2xl font-black tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-nx-cyan" /> Request a local service
          </h1>
          <p className="text-sm text-white/45 mt-1.5">
            Pick a real provider, describe the work and send the request. Payment is held in
            escrow until you confirm it is done.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1.5">What kind of service?</label>
          <select className={select} value={category} onChange={(e) => { setCategory(e.target.value); setSelected(null); }}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug} className="bg-[#0A0A12]">{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" /> Available providers
          </p>
          {providers === undefined ? (
            <p className="text-sm text-white/40 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading providers…</p>
          ) : providers.length === 0 ? (
            <p className="text-sm text-white/40">No providers registered in this category yet.</p>
          ) : (
            providers.map((p: any) => (
              <button
                type="button"
                key={p._id}
                onClick={() => setSelected(p)}
                className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                  selected?._id === p._id ? "border-nx-cyan/50 bg-nx-cyan/[0.06]" : "border-white/8 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{p.displayName}</span>
                  <span className="text-[11px] text-white/40">{p.serviceType}</span>
                  {p.basePrice ? (
                    <span className="ml-auto text-xs font-semibold text-emerald-400">
                      KES {Number(p.basePrice).toLocaleString()}
                    </span>
                  ) : (
                    <span className="ml-auto text-xs text-white/40">Quote</span>
                  )}
                </div>
                {p.tagline ? <p className="text-xs text-white/45 mt-1">{p.tagline}</p> : null}
                <p className="text-[11px] text-white/35 mt-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> {p.town}, {p.county}
                  {p.availability === "available_now" ? " · available now" : ""}
                </p>
              </button>
            ))
          )}
        </div>

        {selected && (
          <form onSubmit={submit} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-3">
            <h2 className="text-sm font-bold">Request from {selected.displayName}</h2>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">Title</label>
              <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fix leaking kitchen tap" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">What needs doing?</label>
              <textarea rows={3} className={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the job, when you need it, and anything the provider should bring." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">Where (optional)</label>
              <input className={input} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Karen, Nairobi" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3 rounded-xl bg-nx-violet hover:bg-nx-violet/85 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Send service request"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}