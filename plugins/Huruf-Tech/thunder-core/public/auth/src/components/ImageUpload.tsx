import { ImagePlusIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn, handleUpload, transformImage } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024;

/**
 * Picks an image, uploads it to ImageKit and reports the resulting URL.
 * Renders a square preview plus "Upload" / "Remove" actions.
 */
export function ImageUpload({
  value,
  onChange,
  path,
  fallback,
  shape = "circle",
  disabled,
}: {
  value?: string | null;
  onChange: (url: string | null) => void | Promise<void>;
  /** Folder inside the media library, e.g. [userId, "avatar"]. */
  path: string[];
  fallback?: React.ReactNode;
  shape?: "circle" | "square";
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const abortRef = React.useRef<AbortController>(null);
  const [progress, setProgress] = React.useState<number | null>(null);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error(t("Please choose an image file"));
    if (file.size > MAX_SIZE)
      return toast.error(t("Images must be smaller than 5 MB"));

    abortRef.current = new AbortController();
    setProgress(0);

    try {
      const { url } = await handleUpload(file, {
        path,
        filename: `${Date.now()}-${file.name}`,
        signal: abortRef.current.signal,
        onProgress: setProgress,
      });
      if (url) await onChange(url);
    } catch (error) {
      if (!abortRef.current.signal.aborted) {
        console.error(error);
        toast.error(t("Upload failed. Please try again."));
      }
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const busy = progress !== null;
  const rounded = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        aria-label={t("Upload image")}
        className={cn(
          "group relative size-16 shrink-0 cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring",
          rounded,
        )}
      >
        <Avatar className={cn("size-full ring-1 ring-foreground/8", rounded)}>
          {value && (
            <AvatarImage
              src={transformImage(value, { width: 128, height: 128 })}
            />
          )}
          <AvatarFallback
            className={cn("bg-muted text-muted-foreground", rounded)}
          >
            {fallback ?? <ImagePlusIcon className="size-5" />}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity",
            busy ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {busy ? (
            <span className="text-xs font-semibold">
              {Math.round(progress)}%
            </span>
          ) : (
            <ImagePlusIcon className="size-5" />
          )}
        </span>
      </button>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy && <Spinner />}
          {value ? t("Change") : t("Upload")}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || busy}
            onClick={() => onChange(null)}
          >
            {t("Remove")}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  );
}
