import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import FreelanceNav from "./FreelanceNav";
import { freelanceCategoryName } from "@/lib/freelance-marketplace";
import { shortKES } from "@/lib/fees";
import {
  FileText, PenTool, Sparkles, Calculator, Receipt, CheckSquare,
  X, Plus, Copy, Check, Trash2, Loader2, Briefcase, ArrowRight,
} from "lucide-react";

const TOOLS = [
  { key: "proposal", icon: FileText, label: "Proposal Writer", desc: "Turn any job post into a winning proposal" },
  { key: "cv", icon: PenTool, label: "CV Builder", desc: "Professional resumes in minutes" },
  { key: "writing", icon: Sparkles, label: "Writing Studio", desc: "Word counts & headline ideas" },
  { key: "pricing", icon: Calculator, label: "Pricing Calculator", desc: "What you earn after platform fees" },
  { key: "invoice", icon: Receipt, label: "Invoice Generator", desc: "Get paid with clean invoices" },
  { key: "tasks", icon: CheckSquare, label: "Task Planner", desc: "Organize your client work" },
] as const;

type ToolKey = (typeof TOOLS)[number]["key"];

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      disabled={!text.trim()}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nx-violet/15 text-nx-violet text-sm font-semibold hover:bg-nx-violet/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {copied ? <Check className="w-4 h-4 text-nx-emerald" /> : <Copy className="w-4 h-4" />} {copied ? "Copied!" : label}
    </button>
  );
}

function ProposalTool() {
  const [job, setJob] = useState("");
  const [skills, setSkills] = useState("");
  const [rate, setRate] = useState("");
  const [name, setName] = useState("");
  const output = useMemo(() => {
    if (!job.trim()) return "";
    const jobSnippet = job.trim().slice(0, 600);
    return [
      `Subject: Proposal — ${job.trim().split("\n")[0].slice(0, 90)}`,
      "",
      `Hi there,`,
      "",
      `I read your post about "${job.trim().split("\n")[0].slice(0, 90)}" and I'd love to help bring it to life.`,
      "",
      `What I can do for you:`,
      job.trim()
        .split("\n")
        .filter((l) => l.trim())
        .slice(0, 4)
        .map((l) => `• ${l.trim()}`)
        .join("\n"),
      "",
      `Relevant experience & skills: ${skills.trim() || "[add your key skills here]"}`,
      "",
      `Approach & timeline:`,
      `• I'll start within 24 hours of acceptance.`,
      `• Clear milestones with updates at every stage.`,
      `• Revisions included until you're happy with the result.`,
      "",
      `Budget: ${rate.trim() ? `KES ${Number(rate).toLocaleString() || rate} for this project (open to fair negotiation based on final scope).` : "[state your rate / range here]."}`,
      "",
      `Every payment stays protected by Nexora escrow, so you only release funds when the work is delivered and approved.`,
      "",
      `Would you like to hop on a quick chat to confirm the details? Happy to answer any questions.`,
      "",
      `Best regards,`,
      name.trim() || "[Your name]",
    ].join("\n");
  }, [job, skills, rate, name]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-white/60 mb-1.5 block">Paste the job post / description *</label>
        <textarea value={job} onChange={(e) => setJob(e.target.value)} rows={5}
          placeholder="Paste the job title and description here..."
          className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none resize-none" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Your key skills (comma separated)"
          className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
        <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Your rate (KES)"
          className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
          className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
      </div>
      {output && (
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
          <pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed max-h-72 overflow-y-auto">{output}</pre>
          <div className="flex justify-end mt-3"><CopyBtn text={output} /></div>
        </div>
      )}
    </div>
  );
}

function CVTool() {
  const [data, setData] = useState({
    name: "", title: "", email: "", phone: "", location: "", summary: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState("");

  const update = (k: string, v: string) => setData((p) => ({ ...p, [k]: v }));
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) { setSkills([...skills, s]); setSkillInput(""); }
  };

  const output = useMemo(() => {
    const head: string[] = [];
    if (data.name.trim()) head.push(data.name.trim().toUpperCase());
    if (data.title.trim()) head.push(data.title.trim());
    const contact = [data.email, data.phone, data.location].filter(Boolean).join(" · ");
    if (contact) head.push(contact);
    const body: string[] = [];
    if (data.summary.trim()) body.push("PROFESSIONAL SUMMARY", data.summary.trim(), "");
    if (skills.length) body.push("SKILLS", skills.join(", "), "");
    if (experience.trim()) body.push("EXPERIENCE", experience.trim(), "");
    return [...head, "", ...body].join("\n");
  }, [data, skills, experience]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Full name"
          className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
        <input value={data.title} onChange={(e) => update("title", e.target.value)} placeholder="Professional title (e.g. Content Writer)"
          className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
        <input value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="Email"
          className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
        <input value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone"
          className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
        <input value={data.location} onChange={(e) => update("location", e.target.value)} placeholder="Location (e.g. Nairobi, Kenya)"
          className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
      </div>
      <textarea value={data.summary} onChange={(e) => update("summary", e.target.value)} rows={3}
        placeholder="Professional summary — 2-3 sentences selling your strengths"
        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none resize-none" />
      <div>
        <label className="text-xs font-medium text-white/60 mb-1.5 block">Skills</label>
        <div className="flex gap-2 mb-2">
          <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            placeholder="Type a skill and press Enter"
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
          <button onClick={addSkill} className="px-3 rounded-lg bg-nx-violet/15 text-nx-violet hover:bg-nx-violet/25 transition-colors"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-nx-violet/10 text-nx-violet text-xs">
              {s}
              <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="hover:text-red-400"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      </div>
      <textarea value={experience} onChange={(e) => setExperience(e.target.value)} rows={4}
        placeholder="Experience — role • company • dates • key achievements"
        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none resize-none" />
      {output.trim() && (
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
          <pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">{output}</pre>
          <div className="flex justify-end mt-3"><CopyBtn text={output} /></div>
        </div>
      )}
    </div>
  );
}

function WritingTool() {
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const minutes = Math.ceil(words / 200);
    return { words, chars, minutes };
  }, [text]);

  const headlines = useMemo(() => {
    if (!topic.trim()) return [];
    const t = topic.trim();
    return [
      `10 Ways ${t[0].toUpperCase() + t.slice(1)} Can Transform Your Business`,
      `The Ultimate Guide to ${t[0].toUpperCase() + t.slice(1)} in 2026`,
      `Why ${t[0].toUpperCase() + t.slice(1)} Is the Smartest Investment You'll Make This Year`,
      `${t[0].toUpperCase() + t.slice(1)}: A Beginner-Friendly Walkthrough`,
      `How I Mastered ${t} (And You Can Too)`,
    ];
  }, [topic]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-white/60 mb-1.5 block">Your draft / notes</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6}
          placeholder="Paste or write your draft here..."
          className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none resize-none" />
        <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-white/30">
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5">{stats.words} words</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5">{stats.chars} characters</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5">≈ {stats.minutes} min read</span>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-white/60 mb-1.5 block">Headline ideas for</label>
        <div className="flex gap-2">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. AI writing tools"
            className="flex-1 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
        </div>
        {headlines.length > 0 && (
          <div className="space-y-2 mt-3">
            {headlines.map((h) => (
              <div key={h} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="flex-1 text-xs text-white/60">{h}</p>
                <button onClick={() => navigator.clipboard?.writeText(h).catch(() => {})} className="text-white/25 hover:text-white/70"><Copy className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PricingTool() {
  const [amount, setAmount] = useState("15000");
  const pricing = useQuery(api.freelance.calculateFreelancePricing, { amount: Number(amount) || 0 });

  return (
    <div className="space-y-4">
      <label className="text-xs font-medium text-white/60 mb-1.5 block">Project amount (KES)</label>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000"
        className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 text-lg text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
      {pricing ? (
        <div className="rounded-xl bg-white/[0.02] border border-white/5 divide-y divide-white/5">
          <div className="p-4 flex justify-between"><span className="text-sm text-white/40">Project amount</span><span className="text-sm font-semibold text-white">KES {pricing.projectAmount.toLocaleString()}</span></div>
          <div className="p-4 flex justify-between"><span className="text-sm text-white/40">Freelancer commission</span><span className="text-sm text-red-400">− KES {pricing.freelancerCommission.toLocaleString()}</span></div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-sm text-white/40">You receive (after fee)</span>
            <span className="text-base font-bold text-nx-emerald">KES {pricing.freelancerNetEarnings.toLocaleString()}</span>
          </div>
          <div className="p-4 flex justify-between"><span className="text-sm text-white/40">Client protection fee</span><span className="text-sm text-white/60">+ KES {pricing.employerProtectionFee.toLocaleString()}</span></div>
          <div className="p-4 flex justify-between"><span className="text-sm text-white/40">Client pays in total</span><span className="text-sm font-semibold text-white">KES {pricing.employerTotalPayable.toLocaleString()}</span></div>
        </div>
      ) : (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-nx-violet animate-spin" /></div>
      )}
      <p className="text-[11px] text-white/25">Tiered commission: 3% under KES 5K, 2% to KES 50K, 1.5% to KES 250K, then 1%.</p>
    </div>
  );
}

function InvoiceTool() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [items, setItems] = useState<{ desc: string; amount: string }[]>([{ desc: "", amount: "" }]);
  const [notes, setNotes] = useState("");
  const updateItem = (i: number, k: string, v: string) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  };
  const total = useMemo(() => items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0), [items]);

  const output = useMemo(() => {
    const lines = [
      "INVOICE",
      "————————————",
      `From: ${from.trim() || "[Your name / business]"}`,
      `Bill to: ${to.trim() || "[Client name]"}`,
      `Date: ${new Date().toLocaleDateString()}`,
      "",
      "Description                 Amount",
      ...items
        .filter((i) => i.desc.trim() || i.amount.trim())
        .map((i) => `${(i.desc.trim() || "(item)").padEnd(26)}  KES ${(Number(i.amount) || 0).toLocaleString()}`),
      "",
      `Total: KES ${total.toLocaleString()}`,
      "",
      `Payment: Nexora escrow — funds release when you approve delivery.`,
      notes.trim() ? `Notes: ${notes.trim()}` : "",
    ];
    return lines.filter((l) => l.trim()).join("\n");
  }, [from, to, items, total, notes]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From (your name / business)"
          className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Bill to (client)"
          className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input value={it.desc} onChange={(e) => updateItem(i, "desc", e.target.value)} placeholder="Item / service description"
              className="flex-1 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
            <input value={it.amount} onChange={(e) => updateItem(i, "amount", e.target.value)} placeholder="KES" type="number"
              className="w-28 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
            <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} disabled={items.length === 1}
              className="px-2 text-white/25 hover:text-red-400 disabled:opacity-20"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={() => setItems([...items, { desc: "", amount: "" }])}
          className="flex items-center gap-1.5 text-xs text-nx-violet hover:text-nx-violet/80 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add line item
        </button>
      </div>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms / notes (optional)"
        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
      {output.trim() && (
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
          <pre className="text-xs text-white/60 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">{output}</pre>
          <div className="flex justify-end mt-3"><CopyBtn text={output} /></div>
        </div>
      )}
    </div>
  );
}

function TaskTool() {
  const [tasks, setTasks] = useState<{ id: number; text: string; done: boolean }[]>([]);
  const [input, setInput] = useState("");
  const add = () => {
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: input.trim(), done: false }]);
    setInput("");
  };
  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task — e.g. Send proposal to client X"
          className="flex-1 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
        <button onClick={add} className="px-4 rounded-lg bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/80 transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/30">
        <span>{tasks.length} task{tasks.length === 1 ? "" : "s"}</span>
        <span>{done} done</span>
      </div>
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-10 rounded-xl bg-white/[0.02] border border-white/5">
            <CheckSquare className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-sm text-white/40">No tasks yet — plan your week and stay productive.</p>
          </div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <button
                onClick={() => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${t.done ? "bg-nx-emerald border-nx-emerald text-white" : "border-white/20 hover:border-nx-emerald/60"}`}
              >
                {t.done && <Check className="w-3 h-3" />}
              </button>
              <p className={`flex-1 text-sm ${t.done ? "text-white/25 line-through" : "text-white/80"}`}>{t.text}</p>
              <button onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))} className="text-white/20 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))
        )}
      </div>
      {tasks.some((t) => t.done) && (
        <button onClick={() => setTasks(tasks.filter((t) => !t.done))} className="text-xs text-white/30 hover:text-white/60">Clear completed</button>
      )}
    </div>
  );
}

export default function FreelancerTools() {
  const [active, setActive] = useState<ToolKey>("proposal");

  return (
    <div className="min-h-screen bg-background">
      <FreelanceNav active="tools" />

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8 pb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-nx-cyan text-xs font-semibold tracking-widest uppercase mb-3">
            <PenTool className="w-3.5 h-3.5" /> Freelancer Toolkit
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
            Tools to win work, <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">price it right & get paid</span>
          </h1>
          <p className="text-sm text-white/40 max-w-xl mx-auto">Free productivity tools for African freelancers — everything stays in your browser.</p>
        </div>

        {/* Tool marketplace */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          {TOOLS.map((tool) => (
            <button
              key={tool.key}
              onClick={() => setActive(tool.key)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                active === tool.key
                  ? "bg-nx-violet/10 border-nx-violet/30"
                  : "bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.03]"
              }`}
            >
              <tool.icon className={`w-5 h-5 mb-2 ${active === tool.key ? "text-nx-violet" : "text-white/40"}`} />
              <p className="text-xs font-semibold text-white leading-tight">{tool.label}</p>
              <p className="text-[10px] text-white/25 mt-1 leading-relaxed hidden md:block">{tool.desc}</p>
            </button>
          ))}
        </div>

        {/* Active tool panel */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5 md:p-6">
          {active === "proposal" && <ProposalTool />}
          {active === "cv" && <CVTool />}
          {active === "writing" && <WritingTool />}
          {active === "pricing" && <PricingTool />}
          {active === "invoice" && <InvoiceTool />}
          {active === "tasks" && <TaskTool />}
        </div>

        {/* Posted jobs — live from the jobs board, right below the tools */}
        <ToolsJobsStrip />
      </div>
    </div>
  );
}

/** Latest open jobs from the real freelance tasks table, linking into the jobs board. */
function ToolsJobsStrip() {
  const navigate = useNavigate();
  const jobs = useQuery(api.freelance.getOpenTasks, { limit: 5 });

  return (
    <div className="mt-10">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-nx-gold text-[11px] font-semibold tracking-widest uppercase mb-1">
            <Briefcase className="w-3.5 h-3.5" /> Posted Jobs
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white">Fresh jobs to apply for</h2>
        </div>
        <button
          onClick={() => navigate("/freelance/jobs")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-xs font-medium hover:border-nx-violet/30 hover:text-white transition-colors shrink-0"
        >
          View all jobs <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {jobs === undefined ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-nx-violet animate-spin" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-white/[0.02] border border-white/5">
          <Briefcase className="w-10 h-10 text-white/10 mx-auto mb-2" />
          <p className="text-sm text-white/40 font-medium">No open jobs right now</p>
          <p className="text-[11px] text-white/25 mt-1">Check the jobs board — new posts appear here the moment clients publish them.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job: any) => (
            <button
              key={job._id}
              onClick={() => navigate(`/freelance/jobs/${job._id}`)}
              className="w-full text-left p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/20 hover:bg-white/[0.03] transition-all group flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-nx-gold/10 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-nx-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-nx-violet transition-colors">{job.title}</p>
                <p className="text-[11px] text-white/30 mt-0.5 truncate">
                  {freelanceCategoryName(job.category)} · {job.applicants} applicant{job.applicants === 1 ? "" : "s"}
                </p>
              </div>
              <span className="text-sm font-bold text-nx-emerald shrink-0">{shortKES(job.budget)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
