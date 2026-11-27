import * as React from "react"
import { useTranslation } from "react-i18next"
import { IconExternalLink } from "@tabler/icons-react"

import { CopyButton } from "@/components/ui/copy-button"

export type TServerAddress = {
  _id: string
  name: string
  /** `<project>.<server>.srv.internal:<port>`: this server's replicas only. */
  internal?: string
  /** `http://<ip>:<public port>`. */
  url?: string
  /** The autoscaler's latest change here. */
  scaled?: { replicas: number; reason: string }
}

/** A long dotted name that wraps at its dots instead of being cut off. */
function Dotted({ value }: { value: string }) {
  const parts = value.split(".")
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <>
              .<wbr />
            </>
          )}
          {part}
        </React.Fragment>
      ))}
    </>
  )
}

/**
 * Reach it, per server (PLAN §8.3, §14): each server's own internal name,
 * public port and replicas, under its name, instead of one row per address.
 */
export function ServerAddresses({ servers }: { servers: TServerAddress[] }) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="reach-servers" className="border-t pt-2.5 pb-1">
      <h3
        id="reach-servers"
        className="text-xs font-medium text-muted-foreground"
      >
        {t("By server")}
      </h3>
      <ul className="flex flex-col">
        {servers.map((s) => (
          <li
            key={s._id}
            className="flex flex-col gap-1 border-b py-2.5 text-[13px] last:border-0"
          >
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              <span className="truncate font-medium">{s.name}</span>
              {s.scaled && (
                <span
                  className="text-xs text-muted-foreground"
                  title={s.scaled.reason}
                >
                  {t("{{n}} replicas now", { n: s.scaled.replicas })}
                </span>
              )}
            </div>
            {s.internal && (
              <div className="flex min-w-0 items-start gap-1">
                <span
                  dir="ltr"
                  className="min-w-0 pt-0.5 font-mono text-xs break-words text-muted-foreground"
                >
                  <Dotted value={s.internal} />
                </span>
                <CopyButton value={s.internal} />
              </div>
            )}
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className="inline-flex w-fit max-w-full min-w-0 items-center gap-1 font-mono text-xs text-brand-text underline-offset-4 hover:underline"
              >
                <span className="truncate">{s.url}</span>
                <IconExternalLink className="size-3 shrink-0" aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
