import {
  CheckIcon,
  LanguagesIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type TScheme, useTheme } from "@/contexts/Theme";
import { LANGUAGES, useLanguage } from "@/hooks/useLanguage";
import { features } from "@/lib/features";

const SCHEME_OPTIONS: {
  value: TScheme;
  label: string;
  icon: typeof SunIcon;
}[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

export function ThemeToggle() {
  const { t } = useTranslation();
  const { scheme, resolved, setScheme } = useTheme();
  const Icon = resolved === "dark" ? MoonIcon : SunIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("Change theme")}
          />
        }
      >
        <Icon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {SCHEME_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setScheme(option.value)}
          >
            <option.icon />
            {t(option.label)}
            {scheme === option.value && <CheckIcon className="ms-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("Change language")}
          />
        }
      >
        <LanguagesIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {LANGUAGES.map((lng) => (
          <DropdownMenuItem
            key={lng.code}
            onClick={() => changeLanguage(lng.code)}
          >
            {lng.label}
            {language.startsWith(lng.code) && <CheckIcon className="ms-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PreferenceControls() {
  if (!features.languageSwitcher && !features.themeSwitcher) return null;

  return (
    <div className="flex items-center gap-0.5">
      {features.languageSwitcher && <LanguageSwitcher />}
      {features.themeSwitcher && <ThemeToggle />}
    </div>
  );
}
