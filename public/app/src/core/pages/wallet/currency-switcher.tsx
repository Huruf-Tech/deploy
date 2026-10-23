"use client";

import { IconCheck, IconChevronDown  } from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

import { HEAD, ITEM, LIST, MORPH } from "../../lib/constants";
import { CopyButton } from "../../../components/ui/copy-button";



/**
 * Currency switcher whose trigger morphs into a panel that grows rightward to
 * full width (covering the header icons) and downward at the same time, via a
 * shared layoutId. Self-contained — not the generic MorphSelect.
 */

export type WalletCurrency = {
  id: string;
  name: string;
  symbol: string;
};


export function CurrencySwitcher({
  currencies,
  activeCurrency,
  onSelect,
}: {
  currencies: WalletCurrency[];
  activeCurrency: WalletCurrency | undefined;
  onSelect: (id: string) => void;
}) {
  const reduce = useReducedMotion() ?? false;
  const layoutId = `${useId()}-currency`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // Hover only arms after the morph settles — otherwise the panel expands under
  // the cursor and flashes a phantom hover bg on whatever item it lands on.
  const [armed, setArmed] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) {
      setArmed(false);
      return;
    }
    const t = window.setTimeout(() => setArmed(true), reduce ? 0 : 280);
    return () => window.clearTimeout(t);
  }, [open, reduce]);

  const morph = reduce ? { duration: 0 } : MORPH;

  return (
    // static (not relative) so the absolute trigger + panel anchor to the
    // header row and can span its full width, covering the icons.
    <div ref={rootRef} className="min-w-0">
      {/* in-flow sizer: reserves the widest possible trigger footprint (every
          currency name stacked in one grid cell) so the header row width never
          changes — neither when the trigger leaves the flow nor when a shorter
          currency name is selected. */}
      <div aria-hidden className={cn(HEAD, "pointer-events-none opacity-0")}>
        <span className="grid">
          {currencies.map((currency) => (
            <span
              key={currency.id}
              className="col-start-1 row-start-1 whitespace-nowrap text-sm font-medium"
            >
              {currency.name}
            </span>
          ))}
        </span>
        <IconChevronDown className="h-4 w-4" />
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {open ? null : (
          <motion.button
            key="trigger"
            layoutId={layoutId}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={false}
            onClick={() => setOpen(true)}
            transition={morph}
            style={{ borderRadius: 16 }}
            className={cn(
              HEAD,
              // shifted left by the padding so the avatar sits flush with the
              // card content edge (aligned with the balance + buttons below).
              "absolute top-0 -left-2 z-20 max-w-full outline-none transition-colors hover:bg-muted/60",
            )}
          >
            {activeCurrency ? (
              <>
                <motion.span
                  layout="position"
                  className="truncate text-sm font-medium text-foreground"
                >
                  {activeCurrency.name}
                </motion.span>
                <motion.span layout="position" className="text-muted-foreground">
                  <IconChevronDown className="h-4 w-4" />
                </motion.span>
              </>
            ) : null}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.div
            key="panel"
            layoutId={layoutId}
            role="listbox"
            transition={morph}
            style={{ borderRadius: 16 }}
            className="absolute top-0 -right-2 -left-2 z-30 overflow-hidden border border-border/30 bg-background backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn(HEAD, "w-full outline-none")}
            >

              <motion.span
                layout="position"
                className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
              >
                {activeCurrency?.name ?? "Select currency"}
              </motion.span>
              <motion.span
                layout="position"
                animate={{ rotate: 180 }}
                transition={morph}
                className="text-muted-foreground"
              >
                <IconChevronDown className="h-4 w-4" />
              </motion.span>
            </button>

            <motion.ul
              initial="hidden"
              animate="show"
              variants={reduce ? undefined : LIST}
              className={cn(
                "max-h-64 overflow-y-auto p-1.5",
                armed ? "" : "pointer-events-none",
              )}
            >
              {currencies.map((currency) => {
                const selected = currency.id === activeCurrency?.id;
                return (
                  <motion.li
                    key={currency.id}
                    variants={reduce ? undefined : ITEM}
                    className={cn(
                      "flex items-center rounded-xl pr-1 text-sm transition-colors",
                      selected
                        ? "bg-muted text-foreground"
                        : cn(
                            "text-muted-foreground",
                            armed && "hover:bg-muted hover:text-foreground",
                          ),
                    )}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onSelect(currency.id);
                        setOpen(false);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 text-left outline-none"
                    >

                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">
                          {currency.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {currency.symbol}
                        </span>
                      </span>
                      {selected ? (
                        <IconCheck className="h-4 w-4 shrink-0 text-foreground" />
                      ) : null}
                    </button>
                    <CopyButton value={currency.symbol} />
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
