import { useState, type ChangeEvent } from "react";
import { Eye, EyeOff, ShieldAlert, ShieldCheck, Shield, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  passwordRequirements,
  passwordStrength,
  isPasswordValid,
  type PasswordRequirement,
} from "@/lib/password-strength";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  inputClassName?: string;
  addonIcon?: React.ReactNode;
  disabled?: boolean;
  error?: string | null;
  onValidChange?: (valid: boolean) => void;
  autoComplete?: string;
}

export function PasswordField({
  value,
  onChange,
  placeholder = "Create a strong password",
  label,
  className,
  inputClassName,
  addonIcon,
  disabled = false,
  error,
  onValidChange,
  autoComplete = "new-password",
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const strength = passwordStrength(value);
  const requirements = passwordRequirements(value);
  const valid = isPasswordValid(value);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-xs text-white/40 mb-1.5 block">
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
            onValidChange?.(isPasswordValid(e.target.value));
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            "pr-10 bg-white/[0.03] border-white/10",
            "placeholder:text-white/20",
            "focus:border-nx-violet/50",
            inputClassName,
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors",
            !value && "opacity-0 pointer-events-none"
          )}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {value.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {strength.level === "weak" || strength.level === "fair" || strength.level === "strong" || strength.level === "very-strong" ? (
              <>
                {strength.level === "weak" ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                ) : strength.level === "fair" ? (
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="font-medium">{strength.text}</span>
                <span className="text-[10px] text-white/20 tabular-nums">
                  {strength.score}/100
                </span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-white/20" />
                <span className="font-medium text-white/20">Start typing to check strength</span>
              </>
            )}
          </div>
          {valid && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              All requirements met
            </span>
          )}
        </div>
      )}

      {/* Only the requirements the password still misses appear here. Once a
          requirement is met it disappears; when everything is met nothing is
          shown (the green strength row above is the confirmation). */}
      {value.length > 0 && !valid && (
        <ul className="space-y-1">
          {requirements
            .filter((r) => !r.met)
            .map((r) => (
              <li key={r.label} className="flex items-center gap-1.5 text-[11px] text-red-400/90">
                <X className="w-3 h-3 shrink-0" />
                {r.label}
              </li>
            ))}
        </ul>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-400">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export { isPasswordValid, passwordStrength, passwordRequirements };
