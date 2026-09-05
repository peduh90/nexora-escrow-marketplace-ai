import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowLeft, Search, Star, Clock, Package, Filter, ChevronDown, Plus,
} from "lucide-react";

const SAMPLE_SERVICES = [
  { _id: "s1", freelancerId: "f1", freelancerName: "Faith Wanjiku", title: "I will build a professional React website for your business", description: "Modern, responsive React websites with clean code and fast performance.", category: "web-development", price: 25000, priceType: "fixed" as const, deliveryTime: "7 days", revisions: 3, features: ["Responsive design", "SEO optimized", "Contact form", "Admin panel"], tags: ["react", "website", "web development"], orders: 47, views: 230, status: "active" as const },
  { _id: "s2", freelancerId: "f2", freelancerName: "James Ochieng", title: "I will write 10 SEO-optimized articles for your blog", description: "High-quality, engaging content that ranks on Google and drives traffic.", category: "writing", price: 8000, priceType: "fixed" as const, deliveryTime: "5 days", revisions: 2, features: ["10 articles", "SEO optimized", "1500+ words each", "Topic research"], tags: ["seo", "blog", "writing", "content"], orders: 63, views: 180, status: "active" as const },
  { _id: "s3", freelancerId: "f3", freelancerName: "Amina Hassan", title: "I will design a stunning mobile app UI in Figma", description: "Professional UI/UX design for mobile apps with prototypes and design system.", category: "design", price: 35000, priceType: "starting_at" as const, deliveryTime: "10 days", revisions: 5, features: ["UI/UX design", "Prototyping", "Design system", "Figma file"], tags: ["figma", "ui", "ux", "mobile", "design"], orders: 38, views: 310, status: "active" as const },
  { _id: "s4", freelancerId: "f5", freelancerName: "Grace Nyambura", title: "I will manage your social media for 30 days", description: "Complete social media management with content creation and analytics.", category: "marketing", price: 15000, priceType: "fixed" as const, deliveryTime: "30 days", revisions: 0, features: ["Content calendar", "Post creation", "Engagement", "Analytics report"], tags: ["social media", "marketing", "instagram", "tiktok"], orders: 51, views: 150, status: "active" as const },
  { _id: "s5", freelancerId: "f4", freelancerName: "Peter Kamau", title: "I will develop a cross-platform mobile app with Flutter", description: "Beautiful, performant mobile apps for iOS and Android from a single codebase.", category: "web-development", price: 50000, priceType: "starting_at" as const, deliveryTime: "21 days", revisions: 3, features: ["iOS + Android", "Clean code", "API integration", "Push notifications"], tags: ["flutter", "mobile", "app", "ios", "android"], orders: 29, views: 200, status: "active" as const },
];

export default function FreelanceServices() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const services = useQuery(api.freelance.getActiveServices, {
    query: search || undefined,
    category: category === "all" ? undefined : category,
  });

  const display = (services && services.length > 0) ? services : SAMPLE_SERVICES;

  return (
    <div className="flex min-h-screen bg-[#05050A]">
      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 bg-[#08080F]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/freelance/dashboard")} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-semibold text-white">Browse Services</h1>
          </div>
          <button onClick={() => navigate("/freelance/services/new")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Offer Service
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/20 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/70 placeholder:text-white/20 focus:border-nx-violet/30 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {display.map((svc: any, i: number) => (
              <div key={svc._id || i} className="rounded-xl bg-white/[0.02] border border-white/5 hover:border-nx-violet/20 transition-all overflow-hidden group cursor-pointer">
                {/* Placeholder image area */}
                <div className="h-40 bg-gradient-to-br from-nx-violet/5 to-nx-cyan/5 flex items-center justify-center">
                  <Package className="w-10 h-10 text-white/10" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-nx-violet/15 flex items-center justify-center text-nx-violet text-[10px] font-bold">
                      {(svc.freelancerName || "U")[0]}
                    </div>
                    <span className="text-[10px] text-white/40">{svc.freelancerName}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      <Star className="w-3 h-3 text-nx-gold fill-nx-gold" />
                      <span className="text-[10px] text-white/50">4.9</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5 line-clamp-2 group-hover:text-nx-violet transition-colors">{svc.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-white/25 mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{svc.deliveryTime}</span>
                    <span>{svc.revisions} revisions</span>
                    <span>{svc.orders} orders</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-[10px] text-white/30">Starting at</span>
                    <span className="text-base font-bold text-nx-emerald">KES {svc.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
