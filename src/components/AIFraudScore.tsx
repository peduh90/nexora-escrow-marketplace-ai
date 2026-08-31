import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Shield, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

interface FraudResult {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  flags: string[];
  recommendation: string;
  reason: string;
}

const levelConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  low: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", label: "Low Risk" },
  medium: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", label: "Medium Risk" },
  high: { color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", label: "High Risk" },
  critical: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", label: "Critical Risk" },
};

export default function AIFraudScore({
  sellerId,
  amount,
  category,
  buyerLocation,
  sellerLocation,
  sellerVerified,
  sellerRating,
  sellerTransactionCount,
}: {
  sellerId: string;
  amount: number;
  category: string;
  buyerLocation?: string;
  sellerLocation?: string;
  sellerVerified?: boolean;
  sellerRating?: number;
  sellerTransactionCount?: number;
}) {
  const scoreTransaction = useAction(api.ai.scoreTransaction);
  const [result, setResult] = useState<FraudResult | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await scoreTransaction({
        sellerId,
        amount,
        productCategory: category,
        buyerLocation,
        sellerLocation,
        sellerVerified,
        sellerRating,
        sellerTransactionCount,
      });
      setResult(res as FraudResult);
    } catch {
      setResult({
        score: 0,
        level: "low",
        flags: ["Analysis failed"],
        recommendation: "Manual review recommended",
        reason: "AI scoring unavailable",
      });
    } finally {
      setLoading(false);
    }
  };

  const config = result ? levelConfig[result.level] : levelConfig.low;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-nx-cyan" />
          <h4 className="text-xs font-semibold text-white">AI Fraud Analysis</h4>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-nx-cyan/10 text-[11px] text-nx-cyan hover:bg-nx-cyan/20 transition-colors disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {result ? "Re-analyze" : "Analyze"}
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          {/* Score */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl ${config.bg} border ${config.border} flex flex-col items-center justify-center`}>
              <span className={`text-xl font-bold ${config.color}`}>{result.score}</span>
              <span className="text-[8px] text-white/30">/100</span>
            </div>
            <div className="flex-1">
              <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
              <p className="text-[11px] text-white/40 mt-0.5">{result.reason}</p>
            </div>
          </div>

          {/* Score bar */}
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                result.level === "low" ? "bg-emerald-400" :
                result.level === "medium" ? "bg-amber-400" :
                result.level === "high" ? "bg-orange-400" :
                "bg-red-400"
              }`}
              style={{ width: `${result.score}%` }}
            />
          </div>

          {/* Flags */}
          {result.flags.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 mb-1.5">Risk Factors:</p>
              <div className="space-y-1">
                {result.flags.map((flag, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-400/60 shrink-0" />
                    <span className="text-[11px] text-white/40">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className={`p-2.5 rounded-lg ${config.bg} border ${config.border}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className={`w-3 h-3 ${config.color}`} />
              <span className={`text-[11px] font-medium ${config.color}`}>Recommendation</span>
            </div>
            <p className="text-[11px] text-white/50">{result.recommendation}</p>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="py-6 text-center">
          <Shield className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <p className="text-[11px] text-white/30">Click "Analyze" to scan this transaction for fraud risk</p>
        </div>
      )}
    </div>
  );
}
