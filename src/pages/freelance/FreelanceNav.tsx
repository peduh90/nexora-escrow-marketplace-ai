import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Briefcase, ArrowLeft } from "lucide-react";

/**
 * Shared top bar for the public Freelance Marketplace pages (browse services,
 * jobs, tools, service details). Stays focused: logo, marketplace links,
 * and a single sign-in / dashboard action.
 */
export default function FreelanceNav({
  active = "services",
  showBack = true,
}: {
  active?: "services" | "jobs" | "tools";
  showBack?: boolean;
}) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const linkClass = (isActive: boolean) =>
    `text-xs font-medium transition-colors ${
      isActive ? "text-nx-violet" : "text-white/45 hover:text-white/80"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-[#08080F]/85 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => navigate("/freelance")} className="flex items-center gap-2 shrink-0">
            <Shield className="w-5 h-5 text-nx-violet" />
            <span className="text-sm font-bold text-white hidden sm:inline">
              NEXORA<span className="text-nx-violet">.</span>
              <span className="text-white/40 font-medium"> FREELANCE</span>
            </span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-5">
          <button onClick={() => navigate("/freelance")} className={linkClass(active === "services")}>
            Services & Tools
          </button>
          <button onClick={() => navigate("/freelance/jobs")} className={linkClass(active === "jobs")}>
            Jobs
          </button>
          <button onClick={() => navigate("/freelance/tools")} className={linkClass(active === "tools")}>
            Freelancer Tools
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-xs font-medium text-white/45 hover:text-white/80 transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/marketplace")}
            className="text-xs font-medium text-white/45 hover:text-white/80 transition-colors"
          >
            Main Marketplace
          </button>
        </div>

        {isAuthenticated && user ? (
          <button
            onClick={() =>
              navigate(
                user.role === "freelancer"
                  ? "/freelance/dashboard"
                  : user.role === "seller" || user.role === "driver"
                  ? "/seller"
                  : user.role === "employer"
                  ? "/employer"
                  : user.role === "admin"
                  ? "/admin"
                  : "/buyer",
              )
            }
            className="px-3.5 py-2 rounded-lg bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors shrink-0"
          >
            Dashboard
          </button>
        ) : (
          <button
            onClick={() => navigate("/freelance/join?returnTo=%2Ffreelance")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-nx-violet text-white text-xs font-semibold hover:bg-nx-violet/80 transition-colors shrink-0"
          >
            <Briefcase className="w-3.5 h-3.5" /> Get Started Free
          </button>
        )}
      </div>
    </nav>
  );
}
