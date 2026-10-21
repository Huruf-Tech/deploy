import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

/** Monospace value with a copy button, e.g. client IDs and key IDs. */
function CopyToClipboard({
  text,
  label,
  className,
}: {
  text: string;
  /** Visible label instead of the raw value. */
  label?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  return (
    <button
      type="button"
      onClick={() => copyToClipboard(text)}
      aria-label={t("Copy {{value}}", { value: label ?? text })}
      title={t("Copy")}
      className={cn(
        "group inline-flex max-w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <span className="truncate">{label ?? text}</span>
      {isCopied ? (
        <CheckIcon className="size-3 shrink-0 text-success" />
      ) : (
        <CopyIcon className="size-3 shrink-0 opacity-60 group-hover:opacity-100" />
      )}
    </button>
  );
}

export default CopyToClipboard;

/** Read-only field showing a secret once, with a prominent copy action. */
export function SecretField({ value }: { value: string }) {
  const { t } = useTranslation();
  const { copyToClipboard, isCopied } = useCopyToClipboard();

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-muted/40 py-1.5 ps-3 pe-1.5">
      <code className="flex-1 font-mono text-sm break-all select-all">
        {value}
      </code>
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(value)}
      >
        {isCopied ? <CheckIcon className="text-success" /> : <CopyIcon />}
        {isCopied ? t("Copied") : t("Copy")}
      </Button>
    </div>
  );
}
