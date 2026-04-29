import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BulletinCardPillVariant = "ok" | "run" | "err" | "warn" | "muted";

const PILL_STYLES: Record<BulletinCardPillVariant, { bg: string; color: string }> = {
  ok: { bg: "var(--otto-ok-soft)", color: "var(--otto-ok)" },
  run: { bg: "var(--otto-primary-soft)", color: "var(--otto-primary-ink)" },
  err: { bg: "var(--otto-err-soft)", color: "var(--otto-err)" },
  warn: { bg: "var(--otto-warn-soft)", color: "var(--otto-warn)" },
  muted: { bg: "var(--otto-rule-2)", color: "var(--otto-muted)" },
};

export type BulletinCardRowProps = {
  href: string;
  date: Date | string;
  title: string;
  summary?: ReactNode;
  meta: Array<{ label: string; value: ReactNode }>;
  pill: { label: string; variant: BulletinCardPillVariant };
  openRate?: number | null;
  openCount?: number | null;
  isError?: boolean;
};

function dayParts(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const day = date.getDate().toString().padStart(2, "0");
  const dow = date
    .toLocaleDateString("es-EC", { weekday: "short" })
    .toUpperCase()
    .replace(/\./g, "")
    .slice(0, 3);
  return { day, dow };
}

export function BulletinCardRow({
  href,
  date,
  title,
  summary,
  meta,
  pill,
  openRate,
  openCount,
  isError,
}: BulletinCardRowProps) {
  const { day, dow } = dayParts(date);
  const pillStyle = PILL_STYLES[pill.variant];

  return (
    <Link
      href={href}
      className={cn(
        "group grid items-center gap-[18px] rounded-[12px] p-4 transition-all hover:shadow-[var(--otto-shadow-2)]",
      )}
      style={{
        gridTemplateColumns: "80px 1fr auto",
        background: "var(--otto-surface)",
        border: "1px solid var(--otto-rule)",
        borderLeft: isError ? "3px solid var(--otto-err)" : undefined,
        boxShadow: "var(--otto-shadow-1)",
      }}
    >
      <div
        className="font-display font-bold leading-none"
        style={{
          fontSize: "28px",
          letterSpacing: "-1.2px",
          color: isError ? "var(--otto-err)" : "var(--otto-ink)",
        }}
      >
        {day}
        <small
          className="font-mono-otto mt-1.5 block"
          style={{
            fontSize: "10px",
            letterSpacing: ".12em",
            color: "var(--otto-muted)",
            fontWeight: 600,
          }}
        >
          {dow}
        </small>
      </div>

      <div className="min-w-0">
        <h4
          className="font-display m-0 mb-1.5 text-[16px] font-bold leading-[1.3] transition-colors group-hover:text-[var(--otto-primary)]"
          style={{
            letterSpacing: "-.3px",
            color: "var(--otto-ink)",
          }}
        >
          {title}
        </h4>
        {summary ? (
          <div
            className="mb-2 text-[13px] leading-[1.45]"
            style={{ color: isError ? "var(--otto-err)" : "var(--otto-muted)" }}
          >
            {summary}
          </div>
        ) : null}
        <div
          className="font-mono-otto flex flex-wrap gap-3.5"
          style={{
            fontSize: "10px",
            letterSpacing: ".06em",
            color: "var(--otto-muted)",
            fontWeight: 500,
          }}
        >
          {meta.map((m, i) => (
            <span key={i}>
              <b
                className="font-display"
                style={{
                  color: "var(--otto-ink)",
                  fontWeight: 700,
                  fontSize: "13px",
                  marginRight: "4px",
                  letterSpacing: "-.2px",
                  textTransform: "none",
                }}
              >
                {m.value}
              </b>
              {m.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span
          className="font-mono-otto inline-block rounded-full px-2.5 py-1"
          style={{
            fontSize: "9px",
            letterSpacing: ".12em",
            fontWeight: 700,
            background: pillStyle.bg,
            color: pillStyle.color,
            lineHeight: 1.2,
          }}
        >
          {pill.label}
        </span>
        {openRate != null ? (
          <div
            className="font-display text-right font-bold"
            style={{
              fontSize: "22px",
              letterSpacing: "-.6px",
              color: "var(--otto-ink)",
            }}
          >
            {openRate}%
            <small
              className="font-mono-otto mt-0.5 block text-right"
              style={{
                fontSize: "10px",
                letterSpacing: ".1em",
                color: "var(--otto-muted)",
                fontWeight: 600,
              }}
            >
              {openCount != null ? `${openCount} lecturas` : "lecturas"}
            </small>
          </div>
        ) : (
          <small
            className="font-mono-otto block text-right"
            style={{
              fontSize: "10px",
              letterSpacing: ".1em",
              color: "var(--otto-muted)",
              fontWeight: 600,
            }}
          >
            {pill.variant === "err" ? "sin datos" : "aún no enviado"}
          </small>
        )}
      </div>
    </Link>
  );
}
