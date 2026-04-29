"use client";

import type { ReactNode } from "react";

type SummaryRow = {
  label: string;
  value: ReactNode;
};

type CategoryTag = {
  name: string;
  count: number;
};

type GenerateSummaryCardProps = {
  rows: SummaryRow[];
  categories?: CategoryTag[];
  selected?: number;
  total?: number;
  status?: "pending" | "running" | "ready" | "error";
  statusLabel?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  warning?: ReactNode;
};

export function GenerateSummaryCard({
  rows,
  categories,
  selected,
  total,
  status = "pending",
  statusLabel,
  primaryAction,
  secondaryAction,
  warning,
}: GenerateSummaryCardProps) {
  const pillBg =
    status === "ready"
      ? "var(--otto-ok-soft)"
      : status === "running"
        ? "var(--otto-primary-soft)"
        : status === "error"
          ? "var(--otto-err-soft)"
          : "var(--otto-rule-2)";
  const pillColor =
    status === "ready"
      ? "var(--otto-ok)"
      : status === "running"
        ? "var(--otto-primary-ink)"
        : status === "error"
          ? "var(--otto-err)"
          : "var(--otto-muted)";

  return (
    <aside
      className="rounded-[14px] border bg-white p-5"
      style={{
        position: "sticky",
        top: "1.5rem",
        borderColor: "var(--otto-rule)",
        boxShadow: "var(--otto-shadow-1)",
      }}
    >
      <h3
        className="font-display m-0 mb-3 text-[15px] font-bold"
        style={{ color: "var(--otto-ink)" }}
      >
        Resumen del envío
      </h3>

      <div className="flex flex-col">
        {rows.map((row, i) => (
          <div
            key={`${row.label}-${i}`}
            className="flex items-center justify-between py-2 text-[13px]"
            style={{
              borderBottom:
                i === rows.length - 1
                  ? "none"
                  : "1px dashed var(--otto-rule)",
            }}
          >
            <span style={{ color: "var(--otto-muted)" }}>{row.label}</span>
            <b
              className="font-display"
              style={{
                fontWeight: 700,
                fontSize: "14px",
                color: "var(--otto-ink)",
              }}
            >
              {row.value}
            </b>
          </div>
        ))}
      </div>

      {categories && categories.length > 0 ? (
        <>
          <div
            className="mt-4 mb-1.5"
            style={{
              fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: "10px",
              letterSpacing: ".12em",
              color: "var(--otto-muted)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Categorías incluidas
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span
                key={c.name}
                className="font-mono-otto"
                style={{
                  fontSize: "9px",
                  background: "var(--otto-rule-2)",
                  color: "var(--otto-ink-2)",
                  padding: "3px 7px",
                  borderRadius: "5px",
                  letterSpacing: ".06em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {c.name} · {c.count}
              </span>
            ))}
          </div>
        </>
      ) : null}

      {typeof selected === "number" && typeof total === "number" ? (
        <div
          className="mt-4 flex items-baseline justify-between pt-3"
          style={{ borderTop: "2px solid var(--otto-ink)" }}
        >
          <div>
            <div
              style={{
                fontFamily:
                  "var(--font-jetbrains-mono), ui-monospace, monospace",
                fontSize: "10px",
                letterSpacing: ".1em",
                color: "var(--otto-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Total seleccionadas
            </div>
            <div
              className="font-display"
              style={{
                fontWeight: 700,
                fontSize: "24px",
                letterSpacing: "-0.8px",
                color: "var(--otto-ink)",
              }}
            >
              {selected}{" "}
              <span
                style={{
                  fontSize: "14px",
                  color: "var(--otto-muted)",
                  fontWeight: 500,
                }}
              >
                / {total}
              </span>
            </div>
          </div>
          {statusLabel ? (
            <div
              className="font-mono-otto"
              style={{
                fontSize: "10px",
                padding: "3px 8px",
                borderRadius: "999px",
                letterSpacing: ".1em",
                background: pillBg,
                color: pillColor,
              }}
            >
              {statusLabel}
            </div>
          ) : null}
        </div>
      ) : null}

      {(primaryAction || secondaryAction) && (
        <div className="mt-4 flex flex-col gap-2">
          {primaryAction}
          {secondaryAction}
        </div>
      )}

      {warning ? (
        <div
          className="mt-3.5 rounded-[8px] px-3 py-2.5 text-[12px] leading-[1.45]"
          style={{
            background: "var(--otto-warn-soft)",
            color: "var(--otto-warn)",
          }}
        >
          {warning}
        </div>
      ) : null}
    </aside>
  );
}
