import { useState } from "react";
import { useNavigate } from "react-router";
import { Briefcase, PenLine, Wrench, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/**
 * POST A JOB — Part 8.
 *
 * "What are you looking for?" is asked FIRST, and the answer picks the entity
 * that is actually written. Three genuinely different objects, never a
 * generic product:
 *
 *   Employee        → employment vacancy  (convex/employment.ts → jobPosts)
 *   Freelancer      → freelance project  (convex/freelance.ts → freelanceTasks)
 *   Service Provider→ service request    (convex/services.ts  → serviceRequests)
 */
const CHOICES = [
  {
    key: "employee",
    title: "An Employee",
    blurb: "A person to work for you — full-time, part-time, contract, casual or internship.",
    examples: "House help · Driver · Cook · Shop attendant · Farm worker · Mechanic · Security · Teacher",
    icon: Briefcase,
    accent: "border-amber-400/25 bg-amber-500/[0.04] hover:border-amber-400/50",
    iconTint: "text-amber-400 bg-amber-500/10",
    route: "/employer/post-job/employment",
  },
  {
    key: "freelancer",
    title: "A Freelancer",
    blurb: "Defined online work you want delivered — writing, design, development, AI or research.",
    examples: "Write 5 product descriptions · Design a logo · Build a website · Data annotation",
    icon: PenLine,
    accent: "border-emerald-500/25 bg-emerald-500/[0.04] hover:border-emerald-500/50",
    iconTint: "text-emerald-400 bg-emerald-500/10",
    route: "/employer/post-job/freelance",
  },
  {
    key: "service_provider",
    title: "A Service Provider",
    blurb: "A local professional for one-off on-site work — plumber, electrician, mechanic, salon.",
    examples: "Plumber · Electrician · Cleaner · Mechanic · Hairdresser · Mover · Repair",
    icon: Wrench,
    accent: "border-nx-cyan/25 bg-nx-cyan/[0.04] hover:border-nx-cyan/50",
    iconTint: "text-nx-cyan bg-nx-cyan/10",
    route: "/employer/post-job/service",
  },
] as const;

export default function EmployerPostJob() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [picked, setPicked] = useState<string | null>(null);

  const name = (user as any)?.name || "Employer";

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-28 md:pb-16">
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
          <button
            onClick={() => navigate("/employer")}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            ← Back to employer dashboard
          </button>
          <h1 className="mt-3 text-2xl md:text-3xl font-black tracking-tight">Post a job</h1>
          <p className="text-sm text-white/45 mt-1.5">
            Hi {String(name).split(" ")[0]} — first tell us what kind of help you need. Each
            choice creates a different, trackable record.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <div className="space-y-3">
          {CHOICES.map((c) => {
            const Icon = c.icon;
            const active = picked === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setPicked(c.key)}
                className={`w-full text-left rounded-2xl border p-5 transition-all ${c.accent} ${
                  active ? "ring-1 ring-white/20" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.iconTint}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold">{c.title}</h2>
                    <p className="text-sm text-white/50 mt-1">{c.blurb}</p>
                    <p className="text-[11px] text-white/30 mt-2">{c.examples}</p>
                  </div>
                  {active && <ArrowRight className="w-5 h-5 text-white/60 shrink-0 mt-1" />}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            const choice = CHOICES.find((c) => c.key === picked);
            if (choice) navigate(choice.route);
          }}
          disabled={!picked}
          className="mt-6 w-full md:w-auto md:px-8 py-3 rounded-xl bg-nx-violet hover:bg-nx-violet/85 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {picked ? "Continue" : "Choose what you need"}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <ShieldCheck className="w-4 h-4 text-nx-cyan shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/40 leading-relaxed">
            No company required. Whether you are an individual, a household, a farmer or a
            registered business, post in your own name — company details are optional and only
            used as a label when you want them shown.
          </p>
        </div>
      </main>
    </div>
  );
}