import { useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Plus, Package, Briefcase, Menu, X,
  Search, Store, LogOut, PenLine,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/data-entry" },
  { icon: PenLine, label: "New Product", path: "/data-entry/new" },
  { icon: Package, label: "My Products", path: "/data-entry/products" },
  { icon: Briefcase, label: "Jobs", path: "/data-entry/jobs" },
];

const navLabels: Record<string, string> = {
  "/data-entry": "Data Entry Dashboard",
  "/data-entry/new": "Product Entry",
  "/data-entry/products": "My Products",
  "/data-entry/jobs": "Jobs",
  "/data-entry/invite": "Invitation",
};

export default function DataEntryLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth() as any;
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/data-entry" ? location.pathname === path : location.pathname.startsWith(path);

  const getPageLabel = () => {
    for (const [path, label] of Object.entries(navLabels)) {
      if (path === "/data-entry" ? location.pathname === path : location.pathname.startsWith(path)) {
        return label;
      }
    }
    return "Data Entry Panel";
  };

  const sidebar = (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => { navigate(item.path); setMobileOpen(false); }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive(item.path)
              ? "bg-nx-violet/15 text-white border border-nx-violet/30"
              : "text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent"
          }`}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          {item.label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#05050A] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/5 bg-[#0A0A12]/60 sticky top-0 h-screen">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-nx-violet/20 border border-nx-violet/30 flex items-center justify-center">
            <PenLine className="w-4 h-4 text-nx-violet" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">Data Entry</p>
            <p className="text-[10px] text-white/30">Worker Panel</p>
          </div>
        </div>
        {sidebar}
        <div className="mt-auto p-3 border-t border-white/5">
          <button
            onClick={() => navigate("/marketplace")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <Store className="w-4 h-4" /> Marketplace
          </button>
          <button
            onClick={() => signOut?.()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="hidden md:flex h-14 border-b border-white/5 bg-[#0A0A12]/80 backdrop-blur-xl sticky top-0 z-30 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-white">{getPageLabel()}</h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement)?.value.trim();
                navigate(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
              }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 w-64"
            >
              <Search className="w-3.5 h-3.5 text-white/20" />
              <input
                type="text"
                name="q"
                placeholder="Search the marketplace…"
                className="bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-none flex-1"
              />
            </form>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="w-6 h-6 rounded-full bg-nx-cyan/20 flex items-center justify-center text-nx-cyan text-[10px] font-bold">
                {(user?.name || user?.email || "W")[0]?.toUpperCase()}
              </div>
              <span className="text-xs text-white/60 hidden sm:block">
                {user?.name || user?.email?.split("@")[0] || "Worker"}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="lg:hidden flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-[#0A0A12]/80 overflow-x-auto">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/50 shrink-0"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive(item.path) ? "bg-nx-violet/15 text-white" : "text-white/40 bg-white/[0.03]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {mobileOpen && (
          <div className="lg:hidden border-b border-white/5 bg-[#0A0A12]">{sidebar}</div>
        )}

        <main className="p-4 md:p-6 pb-24 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
