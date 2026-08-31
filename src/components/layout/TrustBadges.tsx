import { Shield, Lock, Award, Building2, CheckCircle2, Globe, Users, Zap } from "lucide-react";

export function TrustBanner() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 px-4 border-y border-white/5 bg-white/[0.01]">
      {[
        { icon: Shield, text: "CBK Licensed", color: "#8B5CF6" },
        { icon: Lock, text: "256-bit Encryption", color: "#06B6D4" },
        { icon: Award, text: "Insured Escrow", color: "#10B981" },
        { icon: Building2, text: "Nairobi HQ", color: "#F59E0B" },
        { icon: CheckCircle2, text: "100% Money-Back", color: "#EC4899" },
      ].map((badge) => (
        <div key={badge.text} className="flex items-center gap-1.5 text-[11px] text-white/35">
          <badge.icon className="w-3.5 h-3.5" style={{ color: badge.color }} />
          {badge.text}
        </div>
      ))}
    </div>
  );
}

export function TrustStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { icon: Users, value: "50,000+", label: "Verified Users", color: "#8B5CF6" },
        { icon: Shield, value: "KES 85B+", label: "Protected", color: "#06B6D4" },
        { icon: CheckCircle2, value: "99.8%", label: "Success Rate", color: "#10B981" },
        { icon: Zap, value: "< 3min", label: "Avg Response", color: "#F59E0B" },
      ].map((stat) => (
        <div key={stat.label} className="text-center p-3 rounded-lg border border-white/5 bg-white/[0.02]">
          <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
          <p className="text-lg font-bold text-white">{stat.value}</p>
          <p className="text-[10px] text-white/30">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

export function InsuranceBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-nx-emerald/10 border border-nx-emerald/20">
      <Shield className="w-3 h-3 text-nx-emerald" />
      <span className="text-[10px] font-medium text-nx-emerald">INSURED</span>
    </div>
  );
}

export function VerifiedSellerBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1 ${compact ? "px-1.5 py-0.5" : "px-2 py-0.5"} rounded bg-nx-cyan/10 border border-nx-cyan/20`}>
      <CheckCircle2 className="w-3 h-3 text-nx-cyan" />
      <span className="text-[10px] font-medium text-nx-cyan">VERIFIED</span>
    </div>
  );
}

export function EscrowProtectionBadge() {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-nx-violet/10 border border-nx-violet/20">
      <Lock className="w-3 h-3 text-nx-violet" />
      <span className="text-[10px] font-medium text-nx-violet">ESCROW</span>
    </div>
  );
}

export function SellerTrustCard({
  name,
  verified,
  reputation,
  totalSales,
  successfulDeliveries,
  joinDate,
}: {
  name: string;
  verified: boolean;
  reputation: number;
  totalSales: number;
  successfulDeliveries: number;
  joinDate: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-white/5 bg-nx-surface/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-nx-violet/15 flex items-center justify-center">
          <span className="text-sm font-bold text-nx-violet">{name[0]}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{name}</span>
            {verified && <VerifiedSellerBadge compact />}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-xs ${i < Math.floor(reputation) ? "text-nx-gold" : "text-white/10"}`}>★</span>
            ))}
            <span className="text-[10px] text-white/30 ml-1">{reputation.toFixed(1)}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs font-semibold text-white">{totalSales.toLocaleString()}</p>
          <p className="text-[9px] text-white/25">Sales</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{successfulDeliveries.toLocaleString()}</p>
          <p className="text-[9px] text-white/25">Delivered</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{joinDate}</p>
          <p className="text-[9px] text-white/25">Joined</p>
        </div>
      </div>
    </div>
  );
}
