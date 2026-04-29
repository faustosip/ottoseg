import Link from "next/link";
import { cn } from "@/lib/utils";

export type BulletinPillVariant = "ok" | "run" | "err" | "warn" | "muted";

export type BulletinRow = {
  id: string;
  date: Date | string;
  title: string;
  meta?: string;
  stat: string;
  pill: { label: string; variant: BulletinPillVariant };
  href?: string;
  dateColor?: "default" | "error";
};

type Props = {
  rows: BulletinRow[];
  viewAllHref?: string;
};

function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const day = date.toLocaleDateString("es-EC", { weekday: "short" }).toUpperCase().slice(0, 3);
  const num = date.getDate().toString().padStart(2, "0");
  return `${day} ${num}`;
}

const PILL_STYLES: Record<BulletinPillVariant, { bg: string; color: string }> = {
  ok: { bg: "var(--otto-ok-soft)", color: "var(--otto-ok)" },
  run: { bg: "var(--otto-primary-soft)", color: "var(--otto-primary-ink)" },
  err: { bg: "var(--otto-err-soft)", color: "var(--otto-err)" },
  warn: { bg: "var(--otto-warn-soft)", color: "var(--otto-warn)" },
  muted: { bg: "var(--otto-rule-2)", color: "var(--otto-muted)" },
};

export function LastBulletinsPanel({ rows, viewAllHref = "/dashboard/bulletin" }: Props) {
  return (
    <div
      className="rounded-[14px] p-5"
      style={{
        background: "var(--otto-surface)",
        border: "1px solid var(--otto-rule)",
        boxShadow: "var(--otto-shadow-1)",
      }}
    >
      <div className="mb-3.5 flex items-center justify-between gap-2.5">
        <h3
          className="font-display m-0 text-[17px] font-bold"
          style={{ letterSpacing: "-.3px" }}
        >
          Últimos boletines
        </h3>
        <Link
          href={viewAllHref}
          className="font-mono-otto"
          style={{
            fontSize: "10px",
            letterSpacing: ".12em",
            color: "var(--otto-primary)",
            textDecoration: "none",
          }}
        >
          Ver todos →
        </Link>
      </div>

      {rows.length === 0 ? (
        <div
          className="px-6 py-12 text-center text-[13px]"
          style={{ color: "var(--otto-muted)" }}
        >
          Aún no hay boletines.
        </div>
      ) : (
        rows.map((row, idx) => {
          const pill = PILL_STYLES[row.pill.variant];
          const content = (
            <>
              <div
                className="font-mono-otto"
                style={{
                  fontSize: "11px",
                  letterSpacing: ".05em",
                  textTransform: "none",
                  color:
                    row.dateColor === "error" ? "var(--otto-err)" : "var(--otto-ink)",
                  fontWeight: 600,
                  width: "70px",
                }}
              >
                {formatDate(row.date)}
              </div>
              <div
                className="text-[13px] leading-[1.35]"
                style={{ color: "var(--otto-ink-2)" }}
              >
                <b style={{ color: "var(--otto-ink)", fontWeight: 600 }}>{row.title}</b>
                {row.meta ? <span className="ml-1">· {row.meta}</span> : null}
              </div>
              <div
                className="font-mono-otto"
                style={{
                  fontSize: "10px",
                  letterSpacing: ".05em",
                  textTransform: "none",
                  color: "var(--otto-muted)",
                }}
              >
                {row.stat}
              </div>
              <span
                className="font-mono-otto inline-block rounded-md px-2 py-1"
                style={{
                  fontSize: "9px",
                  letterSpacing: ".12em",
                  fontWeight: 600,
                  background: pill.bg,
                  color: pill.color,
                  lineHeight: 1.2,
                }}
              >
                {row.pill.label}
              </span>
            </>
          );

          const className = cn(
            "grid items-center gap-3.5 py-3 text-[13px]",
            idx < rows.length - 1 && "border-b",
          );
          const style = {
            gridTemplateColumns: "auto 1fr auto auto",
            borderColor: "var(--otto-rule)",
          } as React.CSSProperties;

          return row.href ? (
            <Link key={row.id} href={row.href} className={className} style={style}>
              {content}
            </Link>
          ) : (
            <div key={row.id} className={className} style={style}>
              {content}
            </div>
          );
        })
      )}
    </div>
  );
}
