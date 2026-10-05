import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { MapPin, Briefcase, Search, Loader2, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { KENYA_COUNTIES } from "@/lib/kenya-locations";

const CATEGORIES = [
  { slug: "", name: "All categories" },
  { slug: "house-help", name: "House help" },
  { slug: "driving", name: "Driver" },
  { slug: "cooking", name: "Cook" },
  { slug: "shops", name: "Shop attendant" },
  { slug: "agriculture", name: "Farm work" },
  { slug: "mechanics", name: "Mechanic" },
  { slug: "security", name: "Security" },
  { slug: "reception", name: "Reception" },
  { slug: "teaching", name: "Teaching" },
  { slug: "sales", name: "Sales" },
  { slug: "care", name: "Care & support" },
  { slug: "construction", name: "Construction" },
  { slug: "hospitality", name: "Hospitality" },
];

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
  casual: "Casual",
  commission: "Commission",
  other: "Other",
};

const FREQUENCY_LABELS: Record<string, string> = {
  per_hour: "per hour",
  per_day: "per day",
  per_week: "per week",
  per_month: "per month",
  per_project: "per project",
  negotiable: "negotiable",
};

function salaryLine(job: any): string {
  const { salaryMin, salaryMax, paymentFrequency } = job;
  const unit = FREQUENCY_LABELS[paymentFrequency ?? ""] ?? "";
  if (salaryMin && salaryMax) return `KES ${salaryMin.toLocaleString()} – ${salaryMax.toLocaleString()} ${unit}`;
  if (salaryMin) return `From KES ${salaryMin.toLocaleString()} ${unit}`;
  if (salaryMax) return `Up to KES ${salaryMax.toLocaleString()} ${unit}`;
  return "Pay negotiable";
}

/**
 * BROWSE JOBS (Part 7).
 *
 * Reads REAL rows from `jobPosts` — there is no demo array anywhere on this
 * page, so an empty database honestly shows "No jobs posted yet".
 */
export default function EmploymentJobs() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [search, setSearch] = useState("");

  const result = useQuery(api.employment.listOpenJobs, {
    category: category || undefined,
    county: county || undefined,
    employmentType: employmentType || undefined,
    search: search.trim() || undefined,
  });

  const jobs = result?.jobs ?? [];
  const select =
    "px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-nx-violet/50";

  return (
    <div className="min-h-screen bg-[#05050A] text-white pb-28 md:pb-16">
      <header className="border-b border-white/5 bg-gradient-to-b from-nx-violet/[0.08] to-transparent">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-400" /> Browse jobs
          </h1>
          <p className="text-sm text-white/45 mt-1.5 max-w-2xl">
            Real vacancies posted by employers on Nexora — households, farms, shops, NGOs and
            companies. Apply directly; the employer sees your application in their dashboard.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-nx-violet/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs…"
            />
          </div>
          <select className={select} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug} className="bg-[#0A0A12]">{c.name}</option>
            ))}
          </select>
          <select className={select} value={county} onChange={(e) => setCounty(e.target.value)}>
            <option value="" className="bg-[#0A0A12]">All counties</option>
            {KENYA_COUNTIES.map((c) => (
              <option key={c.name} value={c.name} className="bg-[#0A0A12]">{c.name}</option>
            ))}
          </select>
          <select className={select} value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
            <option value="" className="bg-[#0A0A12]">Any employment type</option>
            {Object.entries(EMPLOYMENT_LABELS).map(([v, l]) => (
              <option key={v} value={v} className="bg-[#0A0A12]">{l}</option>
            ))}
          </select>
        </div>

        {result === undefined ? (
          <div className="flex items-center gap-2 text-white/40 text-sm py-10 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading jobs…
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center">
            <p className="text-white/50 text-sm">No jobs match these filters yet.</p>
            <p className="text-white/30 text-xs mt-1.5">
              Jobs appear here the moment an employer publishes one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/35">
              {jobs.length} open job{jobs.length === 1 ? "" : "s"}
            </p>
            {jobs.map((job: any) => (
              <button
                key={job._id}
                onClick={() => navigate(`/employment/jobs/${job._id}`)}
                className="w-full text-left rounded-2xl border border-white/8 bg-white/[0.02] hover:border-nx-violet/40 hover:bg-white/[0.04] transition-colors p-4 md:p-5"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-white">{job.title}</h2>
                    <p className="text-xs text-white/40 mt-1">{job.byline}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] border border-white/10 bg-white/[0.04] text-white/60">
                    {EMPLOYMENT_LABELS[job.employmentType ?? ""] ?? "Open"}
                  </span>
                </div>
                <p className="text-sm text-white/55 mt-2.5 line-clamp-2">{job.description}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-white/40">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {job.location}, {job.county}
                  </span>
                  <span className="font-semibold text-emerald-400">{salaryLine(job)}</span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> {job.applicants ?? 0} applied
                  </span>
                  {job.positions ? <span>{job.positions} position(s)</span> : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}