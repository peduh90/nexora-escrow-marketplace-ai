import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { KENYA_COUNTIES } from "@/lib/kenya-locations";

/**
 * FLOW A — employment vacancy form (Part 4A / Part 3).
 *
 * Every field here maps to the `jobPosts` table. There is NO company field as
 * a gate: the employer picks Individual / Business / Organization and the
 * company/organisation name stays optional and is only a display label.
 */

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
  { value: "casual", label: "Casual / one-off" },
  { value: "commission", label: "Commission" },
  { value: "other", label: "Other" },
];

const PAYMENT_FREQUENCIES = [
  { value: "per_hour", label: "Per hour" },
  { value: "per_day", label: "Per day" },
  { value: "per_week", label: "Per week" },
  { value: "per_month", label: "Per month" },
  { value: "per_project", label: "Per project" },
  { value: "negotiable", label: "Negotiable" },
];

const CATEGORIES = [
  { slug: "house-help", name: "House help & housekeeping" },
  { slug: "driving", name: "Driver / transport" },
  { slug: "cooking", name: "Cook / kitchen" },
  { slug: "shops", name: "Shop & retail" },
  { slug: "agriculture", name: "Farm & agriculture" },
  { slug: "mechanics", name: "Mechanic & repair" },
  { slug: "security", name: "Security guard" },
  { slug: "reception", name: "Reception & admin" },
  { slug: "teaching", name: "Teaching & tutoring" },
  { slug: "sales", name: "Sales" },
  { slug: "care", name: "Care & support" },
  { slug: "construction", name: "Construction & manual work" },
  { slug: "hospitality", name: "Hospitality" },
  { slug: "other", name: "Other" },
];

const SKILL_SUGGESTIONS = [
  "House cleaning", "Cooking", "Laundry", "Ironing", "Gardening", "Childcare",
  "Eldercare", "Driving (BCE)", "Driving (BOD)", "Motorbike repair", "Welding",
  "Fitting", "Masonry", "Plumbing", "Electrical", "Carpentry", "Painting",
  "Tailoring", "Hairdressing", "Nanny", "Security", "Cash handling", "Customer service",
];

export default function EmployerPostEmploymentJob() {
  const navigate = useNavigate();
  const createJob = useMutation(api.employment.createEmploymentJob);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("house-help");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [responsibilities, setResponsibilities] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [experienceRequired, setExperienceRequired] = useState("");
  const [location, setLocation] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState("per_month");
  const [positions, setPositions] = useState("1");
  const [workingHours, setWorkingHours] = useState("");
  const [applicationMethod, setApplicationMethod] = useState("Apply on Nexora");
  const [deadline, setDeadline] = useState("");
  const [employerType, setEmployerType] = useState<"individual" | "business" | "organization">("individual");
  const [companyName, setCompanyName] = useState("");
  const [employerDisplay, setEmployerDisplay] = useState("");

  const toggleSkill = (s: string) =>
    setRequiredSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length >= 8 ? prev : [...prev, s],
    );

  const toNum = (v: string) => {
    const n = Number(v);
    return v.trim() === "" || Number.isNaN(n) ? undefined : n;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 4) return setError("Give the job a clear title (at least 4 characters)");
    if (description.trim().length < 10) return setError("Describe the job in a little more detail");
    if (!county) return setError("Select the county");
    if (!location.trim()) return setError("Add the location (town or estate)");

    setSubmitting(true);
    try {
      const res = await createJob({
        title: title.trim(),
        description: description.trim(),
        category,
        employmentType,
        responsibilities: responsibilities
          .split(/\r?\n|;/)
          .map((s) => s.trim())
          .filter(Boolean),
        requiredSkills,
        experienceRequired: experienceRequired.trim() || undefined,
        location: location.trim(),
        county,
        town: town || undefined,
        salaryMin: toNum(salaryMin),
        salaryMax: toNum(salaryMax),
        paymentFrequency,
        positions: toNum(positions),
        workingHours: workingHours.trim() || undefined,
        applicationMethod: applicationMethod.trim() || undefined,
        deadline: deadline ? new Date(deadline).getTime() : undefined,
        employerType,
        companyName: companyType === "individual" ? undefined : companyName.trim() || undefined,
        employerDisplay: employerDisplay.trim() || undefined,
      });
      toast.success("Job published", {
        description: "Job seekers can now find and apply for it.",
      });
      navigate(`/employment/jobs/${(res as any).jobId}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Could not publish the job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const companyType = employerType;

  const input =
    "w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-nx-violet/50";
  const label = "block text-xs font-semibold text-white/60 mb-1.5";

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-28 md:pb-16">
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <button onClick={() => navigate("/employer/post-job")} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Change what you need
          </button>
          <h1 className="mt-3 text-2xl font-black tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-400" /> Post an employment job
          </h1>
          <p className="text-sm text-white/45 mt-1.5">
            A vacancy for a person to work for you. Applicants submit through Nexora — you
            shortlist and hire from your dashboard.
          </p>
        </div>
      </header>

      <form onSubmit={submit} className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div>
          <label className={label}>Job title</label>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="House Help Needed" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Category</label>
            <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug} className="bg-[#0A0A12]">{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Employment type</label>
            <select className={input} value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-[#0A0A12]">{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Description</label>
          <textarea className={`${input} min-h-[110px]`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What the person will do each day, who they will work for, and what you expect." />
        </div>

        <div>
          <label className={label}>Responsibilities (one per line)</label>
          <textarea className={`${input} min-h-[80px]`} value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} placeholder={"Clean the house\nCook lunch\nKeep the compound tidy"} />
        </div>

        <div>
          <label className={label}>Required skills (up to 8)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {requiredSkills.map((s) => (
              <button type="button" key={s} onClick={() => toggleSkill(s)} className="px-2.5 py-1 rounded-full text-[11px] border border-nx-violet/40 bg-nx-violet/10 text-white">
                {s} ✕
              </button>
            ))}
            {requiredSkills.length === 0 && <span className="text-[11px] text-white/30">None selected</span>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_SUGGESTIONS.filter((s) => !requiredSkills.includes(s)).slice(0, 14).map((s) => (
              <button type="button" key={s} onClick={() => toggleSkill(s)} className="px-2.5 py-1 rounded-full text-[11px] border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white transition-colors">
                + {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Experience</label>
            <select className={input} value={experienceRequired} onChange={(e) => setExperienceRequired(e.target.value)}>
              <option value="" className="bg-[#0A0A12]">Any experience</option>
              <option value="none" className="bg-[#0A0A12]">No experience needed</option>
              <option value="beginner" className="bg-[#0A0A12]">Beginner</option>
              <option value="intermediate" className="bg-[#0A0A12]">Intermediate</option>
              <option value="expert" className="bg-[#0A0A12]">Expert</option>
            </select>
          </div>
          <div>
            <label className={label}>Working hours</label>
            <input className={input} value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} placeholder="8am – 5pm, Mon–Fri" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>County</label>
            <select className={input} value={county} onChange={(e) => { setCounty(e.target.value); setTown(""); }}>
              <option value="" className="bg-[#0A0A12]">Select county…</option>
              {KENYA_COUNTIES.map((c) => (
                <option key={c.name} value={c.name} className="bg-[#0A0A12]">{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Town / estate</label>
            <input className={input} value={town} onChange={(e) => setTown(e.target.value)} placeholder="Karen" />
          </div>
        </div>

        <div>
          <label className={label}>Exact location (area description)</label>
          <input className={input} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kayole, off Ngong Road" />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Pay from (KES)</label>
            <input className={input} inputMode="numeric" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="15000" />
          </div>
          <div>
            <label className={label}>Pay to (KES)</label>
            <input className={input} inputMode="numeric" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="20000" />
          </div>
          <div>
            <label className={label}>Paid</label>
            <select className={input} value={paymentFrequency} onChange={(e) => setPaymentFrequency(e.target.value)}>
              {PAYMENT_FREQUENCIES.map((p) => (
                <option key={p.value} value={p.value} className="bg-[#0A0A12]">{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Number of positions</label>
            <input className={input} inputMode="numeric" value={positions} onChange={(e) => setPositions(e.target.value)} />
          </div>
          <div>
            <label className={label}>Application deadline</label>
            <input type="date" className={input} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>

        {/* ── Employer identity: NO mandatory company ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-3">
          <div>
            <h2 className="text-sm font-bold">Who is hiring?</h2>
            <p className="text-[11px] text-white/40 mt-0.5">
              Individual is the normal case — no company, registration number or corporate email.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: "individual" as const, l: "Individual", d: "Me / my household" },
              { v: "business" as const, l: "Business", d: "Shop or company" },
              { v: "organization" as const, l: "Organization", d: "NGO / group" },
            ]).map((o) => (
              <button
                type="button"
                key={o.v}
                onClick={() => setEmployerType(o.v)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  employerType === o.v ? "border-amber-400/50 bg-amber-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                }`}
              >
                <div className="text-xs font-bold">{o.l}</div>
                <p className="text-[10px] text-white/35 mt-0.5">{o.d}</p>
              </button>
            ))}
          </div>

          {employerType === "individual" ? (
            <div>
              <label className={label}>Shown as (optional)</label>
              <input className={input} value={employerDisplay} onChange={(e) => setEmployerDisplay(e.target.value)} placeholder="Household · Farm · Shop" />
              <p className="text-[10px] text-white/30 mt-1.5">
                Your job will read “Posted by {employerDisplay || "your name"}”. No company needed.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Company / organisation name (optional)</label>
                <input className={input} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Wanjiku Holdings" />
              </div>
              <div>
                <label className={label}>Shown as (optional)</label>
                <input className={input} value={employerDisplay} onChange={(e) => setEmployerDisplay(e.target.value)} placeholder="Home care team" />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className={label}>How applicants reach you</label>
          <input className={input} value={applicationMethod} onChange={(e) => setApplicationMethod(e.target.value)} placeholder="Apply on Nexora" />
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/25 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-3 rounded-xl bg-nx-violet hover:bg-nx-violet/85 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : "Publish job"}
          </button>
          <button type="button" onClick={() => navigate("/employer")} className="px-5 py-3 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}