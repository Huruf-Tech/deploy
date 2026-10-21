import React from "react";

const SCHEMES = ["light", "dark", "system"] as const;
const STORAGE_KEY = "theme";

export type TScheme = (typeof SCHEMES)[number];

type ThemeContextType = {
  /** The user's preference, which may be "system". */
  scheme: TScheme;
  /** The scheme actually applied to the document. */
  resolved: "light" | "dark";
  setScheme: (scheme: TScheme) => void;
};

const ThemeContext = React.createContext<ThemeContextType | null>(null);

const isScheme = (value: unknown): value is TScheme =>
  SCHEMES.includes(value as TScheme);

function readStored(): TScheme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isScheme(value) ? value : null;
  } catch {
    return null;
  }
}

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Resolves the color scheme from (in order) the `?theme=` query param, the
 * persisted preference, then the OS setting. An explicit query param is
 * persisted so it survives navigation inside the app.
 */
export function ThemeProvider({
  initial,
  children,
}: {
  initial?: string | null;
  children: React.ReactNode;
}) {
  const [scheme, setSchemeState] = React.useState<TScheme>(
    () => (isScheme(initial) ? initial : readStored()) ?? "system",
  );
  const [systemDark, setSystemDark] = React.useState(() => darkQuery().matches);

  React.useEffect(() => {
    const query = darkQuery();
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolved =
    scheme === "system" ? (systemDark ? "dark" : "light") : scheme;

  React.useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
  }, [resolved]);

  const setScheme = React.useCallback((next: TScheme) => {
    setSchemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the preference just won't persist.
    }
  }, []);

  // Follow a `?theme=` param that changes after mount (adjusting state during
  // render instead of in an effect avoids an extra commit).
  const [prevInitial, setPrevInitial] = React.useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    if (isScheme(initial)) setSchemeState(initial);
  }

  React.useEffect(() => {
    if (!isScheme(initial)) return;
    try {
      localStorage.setItem(STORAGE_KEY, initial);
    } catch {
      // Ignore unavailable storage.
    }
  }, [initial]);

  const value = React.useMemo(
    () => ({ scheme, resolved, setScheme }),
    [scheme, resolved, setScheme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
