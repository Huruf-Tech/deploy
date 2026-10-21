import Apple from "@/assets/providers/apple.svg";
import Atlassian from "@/assets/providers/atlassian.svg";
import Discord from "@/assets/providers/discord.svg";
import Dropbox from "@/assets/providers/dropbox.svg";
import Facebook from "@/assets/providers/facebook.svg";
import Github from "@/assets/providers/github.svg";
import Gitlab from "@/assets/providers/gitlab.svg";
import Google from "@/assets/providers/google.svg";
import Linkedin from "@/assets/providers/linkedin.svg";
import Microsoft from "@/assets/providers/microsoft.svg";
import Reddit from "@/assets/providers/reddit.svg";
import Slack from "@/assets/providers/slack.svg";
import Twitter from "@/assets/providers/twitter.svg";
import Vercel from "@/assets/providers/vercel.svg";

export type TAuthProvider = {
  icon: string;
  label: string;
  /** Monochrome logo that must be inverted on dark backgrounds. */
  invert?: boolean;
};

/** Social providers, enabled per deployment through capability flags. */
const providers = {
  google: { icon: Google, label: "Google" },
  apple: { icon: Apple, label: "Apple", invert: true },
  microsoft: { icon: Microsoft, label: "Microsoft" },
  github: { icon: Github, label: "GitHub", invert: true },
  gitlab: { icon: Gitlab, label: "GitLab" },
  facebook: { icon: Facebook, label: "Facebook" },
  twitter: { icon: Twitter, label: "X", invert: true },
  linkedin: { icon: Linkedin, label: "LinkedIn" },
  discord: { icon: Discord, label: "Discord" },
  slack: { icon: Slack, label: "Slack" },
  atlassian: { icon: Atlassian, label: "Atlassian" },
  dropbox: { icon: Dropbox, label: "Dropbox" },
  reddit: { icon: Reddit, label: "Reddit" },
  vercel: { icon: Vercel, label: "Vercel", invert: true },
} satisfies Record<string, TAuthProvider>;

export type TProviderId = keyof typeof providers;

export const authProviders: Record<TProviderId, TAuthProvider> = providers;

export const isProviderId = (value: string): value is TProviderId =>
  value in authProviders;
