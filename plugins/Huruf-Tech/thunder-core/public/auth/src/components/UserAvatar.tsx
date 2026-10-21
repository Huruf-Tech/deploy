import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials, transformImage } from "@/lib/utils";

/** Deterministic, theme-friendly hue per user so fallbacks aren't all grey. */
function hueFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash) % 360;
}

export function UserAvatar({
  name,
  email,
  image,
  size = 40,
  className,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  /** Rendered size in px; also used to request a matching image size. */
  size?: number;
  className?: string;
}) {
  const label = name || email || "";
  const hue = hueFor(label);

  return (
    <Avatar
      className={cn("ring-1 ring-foreground/8", className)}
      style={{ width: size, height: size }}
    >
      {image && (
        <AvatarImage
          src={transformImage(image, { width: size * 2, height: size * 2 })}
          alt={label}
        />
      )}
      <AvatarFallback
        className="font-semibold"
        style={{
          fontSize: Math.max(11, size * 0.36),
          color: `oklch(0.45 0.14 ${hue})`,
          background: `oklch(0.93 0.05 ${hue})`,
        }}
      >
        {getInitials(label)}
      </AvatarFallback>
    </Avatar>
  );
}
