import { StrictMode } from "react"
import { useTranslation } from "react-i18next"
import { createRoot } from "react-dom/client"
import { initThunder } from "@/core/lib/thunder.ts"

import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip.tsx"
import { DirectionProvider } from "@/components/ui/direction.tsx"

import "./index.css"
import "./i18n.ts"

/**
 * `DirectionProvider` used to read `i18next.language` once, at mount, so
 * switching language updated the `dir` attribute but left every Base UI
 * component still laid out left-to-right until a reload.
 */
function Root() {
  const { i18n } = useTranslation()

  return (
    <DirectionProvider direction={i18n.dir() === "rtl" ? "rtl" : "ltr"}>
      <ThemeProvider>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </ThemeProvider>
    </DirectionProvider>
  )
}

initThunder().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Root />
    </StrictMode>
  )
})
