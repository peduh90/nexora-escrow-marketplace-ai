import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Briefcase, Search, ArrowRight, Star, MapPin, Clock, Users,
  Shield, Globe, Zap, CheckCircle2, PenTool, Code, Palette,
  FileText, Camera, Megaphone, GraduationCap, ArrowUpRight, Store,
} from "lucide-react";

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

const FREELANCE_CATEGORIES = [
  { icon: Code, name: "Web Development", slug: "web-development", count: "2.4k+" },
  { icon: PenTool, name: "Writing & Content", slug: "writing", count: "1.8k+" },
  { icon: Palette, name: "Design & Creative", slug: "design", count: "1.5k+" },
  { icon: Megaphone, name: "Digital Marketing", slug: "marketing", count: "1.2k+" },
  { icon: FileText, name: "Business & Consulting", slug: "business", count: "800+" },
  { icon: Camera, name: "Video & Animation", slug: "video", count: "600+" },
  { icon: GraduationCap, name: "Education & Tutoring", slug: "education", count: "900+" },
  { icon: Zap, name: "AI & Tech", slug: "ai-tech", count: "500+" },
];

const SAMPLE_FREELANCERS = [
  { name: "Faith Wanjiku", title: "Full-Stack Developer", rating: 4.9, projects: 47, hourlyRate: 2500, avatar: "F", skills: ["React", "Node.js", "TypeScript"] },
  { name: "James Ochieng", title: "Content Writer", rating: 4.8, projects: 63, hourlyRate: 1200, avatar: "J", skills: ["SEO", "Blog Writing", "Copywriting"] },
  { name: "Amina Hassan", title: "UI/UX Designer", rating: 5.0, projects: 38, hourlyRate: 3000, avatar: "A", skills: ["Figma", "UI Design", "Prototyping"] },
  { name: "Peter Kamau", title: "Mobile Developer", rating: 4.7, projects: 29, hourlyRate: 3500, avatar: "P", skills: ["Flutter", "React Native", "iOS"] },
  { name: "Grace Nyambura", title: "Digital Marketer", rating: 4.9, projects: 51, hourlyRate: 1800, avatar: "G", skills: ["SEO", "Social Media", "Ads"] },
  { name: "David Mutua", title: "Data Analyst", rating: 4.6, projects: 22, hourlyRate: 2000, avatar: "D", skills: ["Python", "SQL", "Excel"] },
];

const SAMPLE_TASKS = [
  { title: "Build E-commerce Website", budget: 45000, category: "Web Development", skills: ["React", "Node.js"], applicants: 12, deadline: "2 weeks" },
  { title: "Write 20 SEO Blog Posts", budget: 25000, category: "Writing", skills: ["SEO", "Content Writing"], applicants: 8, deadline: "1 month" },
  { title: "Design Mobile App UI", budget: 35000, category: "Design", skills: ["Figma", "UI/UX"], applicants: 15, deadline: "3 weeks" },
  { title: "Social Media Management", budget: 15000, category: "Marketing", skills: ["Instagram", "TikTok"], applicants: 6, deadline: "Ongoing" },
];

export default function FreelanceLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const topFreelancers = useQuery(api.freelance.getTopFreelancers, { limit: 6 });
  const openTasks = useQuery(api.freelance.getOpenTasks, { limit: 4 });

  const displayFreelancers = (topFreelancers && topFreelancers.length > 0) ? topFreelancers : SAMPLE_FREELANCERS;
  const displayTasks = (openTasks && openTasks.length > 0) ? openTasks : SAMPLE_TASKS;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-nx-violet" />
              <span className="text-sm font-bold text-white">NEXORA<span className="text-nx-violet">.</span></span>
            </button>
            <div className="hidden md:flex items-center gap-1 text-sm">
              <span className="text-white/60 font-medium">Freelance</span>
              <span className="text-nx-violet">Marketplace</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/marketplace")} className="hidden md:flex text-xs text-white/40 hover:text-white/70 transition-colors">
              Main Marketplace
            </button>
            {user ? (
              <button onClick={() => navigate("/freelance/dashboard")} className="px-4 py-2 rounded-lg bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors">
                Dashboard
              </button>
            ) : (
              <button onClick={() => navigate("/auth?returnTo=/freelance/dashboard")} className="px-4 py-2 rounded-lg bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors">
                Get Started
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 md:pt-28 pb-12 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-nx-violet/5 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <FadeIn>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}
              className="w-20 h-20 rounded-2xl bg-nx-violet/15 flex items-center justify-center mx-auto mb-6 border border-nx-violet/20">
              <Briefcase className="w-10 h-10 text-nx-violet" />
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              <span className="text-white">Find Top </span>
              <span className="bg-gradient-to-r from-nx-violet via-nx-cyan to-nx-violet bg-clip-text text-transparent">Freelancers</span>
              <br />
              <span className="text-white">Across Africa</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-sm sm:text-base text-white/40 max-w-2xl mx-auto mt-4 leading-relaxed">
              Connect with skilled writers, developers, designers, and creatives.
              Every project protected by escrow. Payments secured until work is delivered.
            </p>
          </FadeIn>

          {/* Search */}
          <FadeIn delay={0.3}>
            <div className="w-full max-w-2xl mx-auto mt-6">
              <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-white/20 transition-colors">
                <div className="pl-4"><Search className="w-5 h-5 text-white/30" /></div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/freelance/find-work?q=${encodeURIComponent(searchQuery)}`)}
                  placeholder="Search skills, services, or tasks..."
                  className="flex-1 px-4 py-3.5 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
                />
                <button onClick={() => navigate(`/freelance/find-work?q=${encodeURIComponent(searchQuery)}`)}
                  className="px-5 py-3.5 bg-nx-violet text-white text-sm font-semibold hover:bg-nx-violet/80 transition-colors">
                  Search
                </button>
              </div>
            </div>
          </FadeIn>

          {/* Quick actions */}
          <FadeIn delay={0.4}>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button onClick={() => navigate(user ? "/freelance/post-task" : "/auth?returnTo=/freelance/post-task")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nx-violet/10 border border-nx-violet/20 text-nx-violet text-sm font-medium hover:bg-nx-violet/20 transition-colors">
                <Briefcase className="w-4 h-4" /> Post a Task
              </button>
              <button onClick={() => navigate("/freelance/find-work")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm font-medium hover:border-nx-cyan/30 hover:text-white transition-colors">
                <Search className="w-4 h-4" /> Find Work
              </button>
              <button onClick={() => navigate("/freelance/find-freelancers")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm font-medium hover:border-nx-cyan/30 hover:text-white transition-colors">
                <Users className="w-4 h-4" /> Hire Talent
              </button>
              <button onClick={() => navigate("/freelance/services")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm font-medium hover:border-nx-cyan/30 hover:text-white transition-colors">
                <Store className="w-4 h-4" /> Browse Services
              </button>
            </div>
          </FadeIn>

          {/* Trust badges */}
          <FadeIn delay={0.5}>
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              {[
                { label: "Escrow Protected", icon: Shield },
                { label: "AI Matched", icon: Zap },
                { label: "500+ Freelancers", icon: Users },
                { label: "Secure Payments", icon: Globe },
              ].map((b, i) => (
                <div key={b.label} className="flex items-center gap-2 text-xs text-white/35">
                  <b.icon className="w-3.5 h-3.5" />
                  {b.label}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Browse <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">Categories</span>
            </h2>
            <p className="text-sm text-white/40">Find the right talent for your project</p>
          </FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {FREELANCE_CATEGORIES.map((cat, i) => (
              <FadeIn key={cat.slug} delay={i * 0.04}>
                <button onClick={() => navigate(`/freelance/find-freelancers?category=${cat.slug}`)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/20 hover:bg-nx-violet/5 transition-all text-center group">
                  <div className="w-10 h-10 rounded-lg bg-nx-violet/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <cat.icon className="w-5 h-5 text-nx-violet" />
                  </div>
                  <span className="text-xs font-medium text-white">{cat.name}</span>
                  <span className="text-[10px] text-white/25">{cat.count}</span>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Top Freelancers */}
      <section className="py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Top <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">Freelancers</span>
            </h2>
            <p className="text-sm text-white/40">Work with the best talent on the continent</p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayFreelancers.map((fl: any, i: number) => (
              <FadeIn key={fl._id || i} delay={i * 0.06}>
                <div onClick={() => navigate(`/freelance/profile/${fl.userId || "sample"}`)}
                  className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/20 hover:bg-white/[0.04] transition-all cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-nx-violet/15 flex items-center justify-center text-nx-violet font-bold text-lg shrink-0">
                      {fl.avatar || (fl.displayName || "U")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white group-hover:text-nx-violet transition-colors">{fl.displayName || fl.name}</h3>
                      <p className="text-xs text-white/40 mt-0.5">{fl.title || "Freelancer"}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-nx-gold fill-nx-gold" />
                          <span className="text-xs font-medium text-white">{fl.avgRating || fl.rating || 4.8}</span>
                        </div>
                        <span className="text-[10px] text-white/25">{fl.completedProjects || fl.projects || 0} projects</span>
                        <span className="text-[10px] text-nx-emerald font-medium">KES {(fl.hourlyRate || 0).toLocaleString()}/hr</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(fl.skills || []).slice(0, 3).map((s: string) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-nx-violet/10 text-nx-violet/70">{s}</span>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <div className="text-center mt-6">
              <button onClick={() => navigate("/freelance/find-freelancers")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:border-nx-violet/30 hover:text-white transition-all">
                Browse All Freelancers <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Latest Tasks */}
      <section className="py-10 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Latest <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">Tasks</span>
            </h2>
            <p className="text-sm text-white/40">Find projects that match your skills</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayTasks.map((task: any, i: number) => (
              <FadeIn key={task._id || i} delay={i * 0.06}>
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/20 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-nx-violet/10 text-nx-violet font-medium">{task.category}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-nx-emerald/10 text-nx-emerald font-medium">Escrow</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">{task.title}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(task.skills || []).map((s: string) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{s}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-white/25">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.deadline || "Flexible"}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{task.applicants || 0} applicants</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-nx-emerald">KES {(task.budget || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-white/25 mt-0.5 capitalize">{task.budgetType || "fixed"}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <div className="text-center mt-6">
              <button onClick={() => navigate("/freelance/find-work")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:border-nx-violet/30 hover:text-white transition-all">
                View All Tasks <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              How It <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">Works</span>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: "01", title: "Post or Find", desc: "Employers post tasks, freelancers find work.", icon: Briefcase, color: "#8B5CF6" },
              { num: "02", title: "Apply & Match", desc: "Freelancers apply, employers hire the best.", icon: Users, color: "#06B6D4" },
              { num: "03", title: "Work Securely", desc: "Milestones tracked, funds in escrow.", icon: Shield, color: "#F59E0B" },
              { num: "04", title: "Get Paid", desc: "Confirm delivery, funds release instantly.", icon: CheckCircle2, color: "#10B981" },
            ].map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.08}>
                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all text-center h-full">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${step.color}12` }}>
                    <step.icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color: step.color }}>{step.num}</span>
                  <h3 className="text-sm font-semibold text-white mt-1 mb-2">{step.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 px-6 border-t border-white/5">
        <FadeIn>
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative p-12 rounded-2xl border border-white/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-nx-violet/5 via-transparent to-nx-cyan/5" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Ready to <span className="bg-gradient-to-r from-nx-violet to-nx-cyan bg-clip-text text-transparent">Start</span>?
                </h2>
                <p className="text-white/40 max-w-lg mx-auto text-sm mb-8">
                  Join thousands of African freelancers and employers building the future of work.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={() => navigate(user ? "/freelance/post-task" : "/auth?returnTo=/freelance/post-task")}
                    className="px-8 py-3.5 rounded-xl bg-nx-violet text-white font-medium text-sm hover:bg-nx-violet/80 transition-all hover:scale-[1.02]">
                    <span className="flex items-center gap-2 justify-center">Post a Task <ArrowRight className="w-4 h-4" /></span>
                  </button>
                  <button onClick={() => navigate(user ? "/freelance/find-work" : "/auth?returnTo=/freelance/find-work")}
                    className="px-8 py-3.5 rounded-xl border border-white/10 text-white/60 font-medium text-sm hover:border-nx-cyan/30 hover:text-white transition-all">
                    Find Work
                  </button>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-nx-violet" />
            <span className="text-xs font-bold text-white">NEXORA FREELANCE</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-white/25">
            <button onClick={() => navigate("/")} className="hover:text-white/50 transition-colors">Main Marketplace</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-white/50 transition-colors">Privacy</button>
            <button onClick={() => navigate("/terms")} className="hover:text-white/50 transition-colors">Terms</button>
          </div>
          <p className="text-[10px] text-white/15">&copy; 2025 Nexora Market. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

