import i18n from "i18next"

import { loadFontsCSS, loadTailwindCSS } from "@/core/lib/utils"

/**
 * Handlebars (79kB) and the template source are only needed when someone
 * exports a PDF. Compiling at module scope pulled the whole compiler into the
 * initial bundle for every user. Imported on first use and cached.
 */
let compiled: HandlebarsTemplateDelegate | undefined

const getTemplate = async () => {
  if (!compiled) {
    const [{ default: Handlebars }, { default: source }] = await Promise.all([
      import("@/core/lib/handlebars"),
      import("./template/wallet-template.hbs?raw"),
    ])

    compiled = Handlebars.compile(source)
  }

  return compiled
}

export const buildWalletHTML = async (data: {
  title: string
  content: string
  lang?: string
  dir?: string
}) => {
  const [tailwind, fonts] = await Promise.all([
    loadTailwindCSS(),
    loadFontsCSS(),
  ])

  const lang = i18n.language || "ar"

  const template = await getTemplate()

  return template({
    lang,
    dir: lang === "en" ? "ltr" : "rtl",
    ...data,
    tailwind,
    fonts,
  })
}
