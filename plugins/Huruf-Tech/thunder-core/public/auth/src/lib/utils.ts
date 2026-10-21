import { type ClassValue, clsx } from "clsx";
import { format, formatDistanceToNow } from "date-fns";
import { twMerge } from "tailwind-merge";
import { ThunderSDK } from "thunder-sdk";
import { upload } from "@imagekit/react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function applyThemeVars(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    if (k.startsWith("--")) root.style.setProperty(k, v);
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** "John Doe" → "JD", "john.doe@acme.com" → "JD", "" → "?" */
export function getInitials(name?: string | null) {
  const value = (name ?? "").trim();
  const words = (value.includes("@") ? value.split("@")[0] : value)
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function generateSecret(length: number = 32): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // Rejection sampling keeps the distribution uniform across the charset.
  const limit = 256 - (256 % charset.length);
  let secret = "";

  while (secret.length < length) {
    const values = crypto.getRandomValues(new Uint8Array(length));
    for (const value of values) {
      if (value < limit && secret.length < length)
        secret += charset[value % charset.length];
    }
  }

  return secret;
}

export const PASSWORD_MIN_LENGTH = 8;

export const checkStrength = (pass: string) => {
  const requirements = [
    {
      regex: new RegExp(`.{${PASSWORD_MIN_LENGTH},}`),
      text: `At least ${PASSWORD_MIN_LENGTH} characters`,
    },
    { regex: /[0-9]/, text: "At least 1 number" },
    { regex: /[a-z]/, text: "At least 1 lowercase letter" },
    { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
  ];

  return requirements.map((req) => ({
    met: req.regex.test(pass),
    text: req.text,
  }));
};

export function formatDate(
  date?: Date | string | null,
  pattern: "timeAgo" | "default" | string = "default",
): string {
  if (!date) return "N/A";

  const validDate = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(validDate.getTime())) return "N/A";

  if (pattern === "timeAgo")
    return formatDistanceToNow(validDate, { addSuffix: true });

  return format(validDate, pattern === "default" ? "PP, hh:mm a" : pattern);
}

export type TParsedUserAgent = ReturnType<typeof parseUserAgent>;

export function parseUserAgent(ua: string) {
  const userAgent = ua.toLowerCase();
  let os: "Windows" | "macOS" | "Linux" | "Android" | "iOS" | "Unknown" =
    "Unknown";
  let browser:
    | "Chrome"
    | "Firefox"
    | "Safari"
    | "Edge"
    | "Brave"
    | "Arc"
    | "Opera"
    | "Samsung Internet"
    | "Unknown" = "Unknown";

  const isTablet =
    /ipad|tablet/.test(userAgent) ||
    (userAgent.includes("android") && !userAgent.includes("mobile"));
  const isMobile = !isTablet && /mobi|android|iphone/.test(userAgent);

  if (userAgent.includes("edg/") || userAgent.includes("edge"))
    browser = "Edge";
  else if (userAgent.includes("opr") || userAgent.includes("opera"))
    browser = "Opera";
  else if (userAgent.includes("samsungbrowser")) browser = "Samsung Internet";
  else if (userAgent.includes("brave")) browser = "Brave";
  else if (userAgent.includes(" arc/")) browser = "Arc";
  else if (userAgent.includes("firefox") || userAgent.includes("fxios"))
    browser = "Firefox";
  else if (userAgent.includes("chrome") || userAgent.includes("crios"))
    browser = "Chrome";
  else if (userAgent.includes("safari")) browser = "Safari";

  // iOS must be checked before macOS: iPad/iPhone UAs contain "like Mac OS X".
  if (/iphone|ipad|ipod/.test(userAgent)) os = "iOS";
  else if (userAgent.includes("android")) os = "Android";
  else if (userAgent.includes("windows")) os = "Windows";
  else if (userAgent.includes("mac")) os = "macOS";
  else if (userAgent.includes("linux")) os = "Linux";

  return {
    browser,
    os,
    isMobile,
    isTablet,
    deviceType: isTablet
      ? ("tablet" as const)
      : isMobile
        ? ("mobile" as const)
        : ("desktop" as const),
    raw: ua,
  };
}

type TUserAgentData = {
  getHighEntropyValues: (hints: string[]) => Promise<Record<string, unknown>>;
};

/** Client hints (Chromium only) describing the current device. */
export async function getDeviceInfo() {
  const uaData = (navigator as Navigator & { userAgentData?: TUserAgentData })
    .userAgentData;

  return uaData?.getHighEntropyValues([
    "model", // e.g. "Pixel 7"
    "platform", // e.g. "Android"
    "platformVersion",
  ]);
}

export const handleUpload = async (
  file: File,
  opts?: {
    path?: string | string[];
    filename?: string;
    signal?: AbortSignal;
    onProgress?: (percentage: number) => void;
  },
) => {
  const path = Array.isArray(opts?.path) ? opts.path.join("/") : opts?.path;
  const { signature, expire, token, publicKey } =
    await ThunderSDK.imageKit.auth();

  return await upload({
    expire,
    token,
    signature,
    publicKey,
    file,
    fileName: [path?.replace(/^\/|\/$/g, ""), opts?.filename ?? file.name]
      .filter(Boolean)
      .join("/"),
    onProgress: (event) =>
      opts?.onProgress?.((event.loaded / event.total) * 100),
    abortSignal: opts?.signal,
  });
};

/** ImageKit resize transformation. Leaves non-ImageKit and empty URLs alone. */
export function transformImage(
  url?: string | null,
  opts?: { width: number; height: number },
) {
  if (!url) return undefined;
  if (!url.includes("imagekit.io") || url.includes("?")) return url;

  return `${url}?tr=w-${opts?.width ?? 100},h-${opts?.height ?? 100}`;
}

/** Absolute URL of a path inside this app (respects Vite's `base`). */
export function resolveURL(path?: string) {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
    .toString()
    .replace(/\/$/, "");

  return path ? [baseUrl, path.trim().replace(/^\//, "")].join("/") : baseUrl;
}

/**
 * Validates a redirect target before assigning it to `window.location`.
 * Only absolute http(s) URLs are allowed, which blocks `javascript:` / `data:`
 * payloads smuggled through query parameters.
 */
export function getSafeRedirect(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function formatDateForInput(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function downloadTextFile(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
