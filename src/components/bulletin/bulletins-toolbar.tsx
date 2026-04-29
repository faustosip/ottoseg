"use client";

import { Calendar, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export type BulletinFilter = "all" | "sent" | "draft" | "error";

const FILTER_LABELS: Record<BulletinFilter, string> = {
  all: "Todos",
  sent: "Enviados",
  draft: "Borradores",
  error: "Errores",
};

type Props = {
  active: BulletinFilter;
  counts: Record<BulletinFilter, number>;
  onChange: (filter: BulletinFilter) => void;
  monthLabel: string;
  onExport?: () => void;
};

export function BulletinsToolbar({
  active,
  counts,
  onChange,
  monthLabel,
  onExport,
}: Props) {
  const order: BulletinFilter[] = ["all", "sent", "draft", "error"];

  return (
    <div className="mb-[18px] flex flex-wrap items-center gap-2.5">
      <div
        className="flex gap-1 rounded-[10px] border bg-white p-1"
        style={{ borderColor: "var(--otto-rule)" }}
      >
        {order.map((key) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "rounded-[7px] px-3 py-1.5 text-[12px] font-semibold transition-colors",
              )}
              style={
                isActive
                  ? { background: "var(--otto-ink)", color: "#fff" }
                  : { color: "var(--otto-muted)", background: "transparent" }
              }
            >
              {FILTER_LABELS[key]}
              <span
                className="font-mono-otto ml-1.5"
                style={{
                  fontSize: "10px",
                  textTransform: "none",
                  letterSpacing: ".04em",
                  opacity: isActive ? 0.85 : 0.6,
                }}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <div
        className="font-mono-otto flex items-center gap-1.5 rounded-[10px] border bg-white px-3 py-2 text-[11px]"
        style={{
          borderColor: "var(--otto-rule)",
          color: "var(--otto-ink-2)",
          textTransform: "uppercase",
          letterSpacing: ".12em",
          fontWeight: 600,
        }}
      >
        <Calendar
          className="h-3.5 w-3.5"
          strokeWidth={1.8}
          style={{ color: "var(--otto-muted)" }}
        />
        {monthLabel}
      </div>

      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center gap-1.5 rounded-[10px] border bg-white px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-[var(--otto-bg)]"
        style={{
          borderColor: "var(--otto-rule)",
          color: "var(--otto-ink)",
        }}
      >
        <Download
          className="h-3.5 w-3.5"
          strokeWidth={1.8}
          style={{ color: "var(--otto-muted)" }}
        />
        Exportar
      </button>
    </div>
  );
}
