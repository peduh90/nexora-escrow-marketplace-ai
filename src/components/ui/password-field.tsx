import { useState } from "react";
import { Eye, EyeOff, ShieldAlert, Shield-check, Shield } from "lucide-react";
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
          onChange={(e) => {
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
          addonAfter={
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
      </div>

      {strength.level !== "too-short" && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {strength.level === "weak" ? (
              <ShieldAlert className={cn("w-3.5 h-3.5", strength.color)} />
            ) : strength.level === "fair" ? (
              <Shield className={cn("w-3.5 h-3.5", strength.color)} />
            ) : (
              <Shield-check className={cn("w-3.5 h-3.5", strength.color)} />
            )}
            <span className={cn("font-medium", strength.color)}>{strength.text}</span>
          </div>
          <span className="text-[10px] text-white/20 tabular-nums"> {strength.score}/100</span>
        </div>
      )}

      {requirements.length > 0 && (
        <ul className="space-y-1">
          {requirements.map((req, i) => (
            <li
              key={i}
              className={cn(
                "flex items-center gap-2 text-xs",
                req.met
                  ? "text-white/30"
                  : "text-white/20 italic [font-style:italic]",
              )}
            >
              <span
                className={cn(
                  "shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center",
                  req.met
                    ? "border-nx-violet/40 bg-nx-violet/10 text-nx-violet"
                    : "border-white/10 bg-transparent text-white/20",
                )}
              >
                {req.met ? (
                  <Shield-check className="w-3 h-3" />
                ) : (
                  <Shield className="w-3 h-3" />
                )}
              </span>
              {req.label}
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
