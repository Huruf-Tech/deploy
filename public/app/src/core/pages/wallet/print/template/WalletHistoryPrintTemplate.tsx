import React from "react";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { buildWalletHTML } from "@/core/pages/wallet/print/wallet";
import { printDocument } from "@/core/lib/utils";
import { formatDateForInput } from "@/core/lib/utils";
import type { ThunderSDK } from "thunder-sdk";

// ── Types ────────────────────────────────────────────────────────────────────

type TWalletLedger =
  typeof ThunderSDK.walletLedgers.type.get$return.results[number];

export type WalletHistoryPrintData = {
  transactions: TWalletLedger[];
  walletOwner?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const LRI = "\u2066";
const PDI = "\u2069";

const CURRENCY_AR: Record<string, string> = {
  LYD: "د.ل", USD: "$", EUR: "€", GBP: "£",
};

function fmtAmount(amount: number, currency: string, lang: string) {
  const label = lang?.startsWith("ar")
    ? (CURRENCY_AR[currency.toUpperCase()] ?? currency)
    : currency.toUpperCase();
  const num = (Math.abs(amount) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${LRI}${num} ${label}${PDI}`;
}

function descriptionOf(tx: TWalletLedger): string {
  if (typeof tx.description === "string") return tx.description;
  if (tx.description && typeof tx.description === "object")
    return Object.values(tx.description).join(" ");
  return tx.purpose ?? tx.reference ?? "—";
}

// ── Template ─────────────────────────────────────────────────────────────────

export const WalletHistoryPrintTemplate = React.forwardRef<
  HTMLDivElement,
  { data: WalletHistoryPrintData }
>(({ data }, ref) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const { transactions, walletOwner } = data;
  const align = (start: boolean) => (start === !isRtl ? "text-left" : "text-right");

  const currency = transactions[0]?.currency ?? "LYD";
  const totalCredit = transactions.filter((tx) => tx.type === "credit").reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalDebit = transactions.filter((tx) => tx.type === "debit").reduce((s, tx) => s + Math.abs(tx.amount), 0);

  const summaryCards = [
    { label: t("Total Transactions"), value: String(transactions.length), cls: "text-gray-900", bg: "bg-gray-50" },
    { label: t("Total Credit"), value: fmtAmount(totalCredit, currency, i18n.language), cls: "text-green-600", bg: "bg-green-50" },
    { label: t("Total Debit"), value: fmtAmount(totalDebit, currency, i18n.language), cls: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div
      ref={ref}
      className="mx-auto flex w-full max-w-4xl flex-col bg-white p-8 text-gray-900"
      style={{ minHeight: "269mm" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 border-b-2 border-gray-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {t("Transaction History")}
          </p>
          {walletOwner && (
            <p className="mt-0.5 text-lg font-bold text-gray-900">{walletOwner}</p>
          )}
        </div>
        <div className={isRtl ? "text-start" : "text-end"}>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{t("Generated")}</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900">
            {new Date().toLocaleDateString(i18n.language, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {summaryCards.map(({ label, value, cls, bg }) => (
          <div key={label} className={`${bg} flex flex-col gap-1 rounded-lg border border-gray-100 px-4 py-3`}>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
            <span className={`text-base font-bold tabular-nums ${cls}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-y border-gray-200 text-gray-500">
            <th className="w-8 px-2 py-2 text-center font-bold uppercase tracking-wide">#</th>
            <th className={`px-2 py-2 font-bold uppercase tracking-wide ${align(true)}`}>{t("Type")}</th>
            <th className={`px-2 py-2 font-bold uppercase tracking-wide ${align(true)}`}>{t("Reference")}</th>
            <th className={`px-2 py-2 font-bold uppercase tracking-wide ${align(true)}`}>{t("Description")}</th>
            <th className={`px-2 py-2 font-bold uppercase tracking-wide ${align(false)}`}>{t("Amount")}</th>
            <th className={`w-28 px-2 py-2 font-bold uppercase tracking-wide ${align(false)}`}>{t("Date")}</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                {t("No transactions to display")}
              </td>
            </tr>
          ) : (
            transactions.map((tx, i) => {
              const isCredit = tx.type === "credit";
              const colorCls = isCredit ? "text-green-600" : "text-red-600";
              return (
                <tr key={tx._id} className="break-inside-avoid border-b border-gray-100">
                  <td className="px-2 py-2 text-center text-gray-400">{i + 1}</td>
                  <td className={`px-2 py-2 font-semibold ${colorCls}`}>{t(isCredit ? "Credit" : "Debit")}</td>
                  <td className={`px-2 py-2 font-mono text-gray-500 ${align(true)}`}>{tx.reference ?? "—"}</td>
                  <td className={`max-w-[180px] truncate px-2 py-2 text-gray-600 ${align(true)}`}>{descriptionOf(tx)}</td>
                  <td className={`px-2 py-2 font-semibold tabular-nums ${colorCls} ${align(false)}`}>
                    {isCredit ? "+" : "−"}{fmtAmount(tx.amount, tx.currency, i18n.language)}
                  </td>
                  <td className={`px-2 py-2 text-gray-500 ${align(false)}`}>
                    {formatDateForInput(tx.createdAt as any)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="mt-auto pt-8 text-center text-xs text-gray-400">
        {t("This is a system-generated document.")}
      </div>
    </div>
  );
});

WalletHistoryPrintTemplate.displayName = "WalletHistoryPrintTemplate";
export interface WalletHistoryPrintHandlerRef {
  print: () => void;
}

export const WalletHistoryPrintHandler = React.forwardRef<
  WalletHistoryPrintHandlerRef,
  { data: WalletHistoryPrintData }
>(({ data }, ref) => {
  const printRef = React.useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const lang = i18next.language || "en";

  React.useImperativeHandle(ref, () => ({
    print: async () => {
      if (!printRef.current) return;
      await printDocument(printRef, buildWalletHTML, {
        title: t("Transaction History"),
        lang,
        dir: i18next.dir(lang),
      });
    },
  }));

  return (
    <div className="hidden">
      <WalletHistoryPrintTemplate ref={printRef} data={data} />
    </div>
  );
});

WalletHistoryPrintHandler.displayName = "WalletHistoryPrintHandler";
