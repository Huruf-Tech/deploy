import { CheckIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { checkStrength, cn } from "@/lib/utils";

const LEVELS = [
  { label: "Enter a password", color: "bg-border" },
  { label: "Weak", color: "bg-red-500" },
  { label: "Weak", color: "bg-orange-500" },
  { label: "Fair", color: "bg-amber-500" },
  { label: "Strong", color: "bg-emerald-500" },
];

/** Segmented strength meter + requirement checklist for a new password. */
export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();
  const requirements = checkStrength(password);
  const score = requirements.filter((r) => r.met).length;
  const level = LEVELS[score];

  return (
    <div className="flex flex-col gap-2.5">
      <div
        role="meter"
        aria-label={t("Password strength")}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
        className="flex items-center gap-3"
      >
        <div className="grid flex-1 grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={cn(
                "h-1 rounded-full transition-colors duration-300",
                score >= step ? level.color : "bg-border",
              )}
            />
          ))}
        </div>
        <span className="min-w-12 text-end text-xs font-medium text-muted-foreground">
          {t(level.label)}
        </span>
      </div>

      <ul
        aria-label={t("Password requirements")}
        className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2"
      >
        {requirements.map((req) => (
          <li key={req.text} className="flex items-center gap-1.5 text-xs">
            {req.met ? (
              <CheckIcon aria-hidden className="size-3.5 text-success" />
            ) : (
              <XIcon
                aria-hidden
                className="size-3.5 text-muted-foreground/60"
              />
            )}
            <span
              className={req.met ? "text-foreground" : "text-muted-foreground"}
            >
              {t(req.text)}
              <span className="sr-only">
                {req.met
                  ? t(" - requirement met")
                  : t(" - requirement not met")}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** react-hook-form validator enforcing every strength requirement. */
export const validatePassword =
  (t: (key: string) => string) => (value: string) =>
    checkStrength(value).every((r) => r.met) ||
    t("Password doesn't meet all the requirements");
