import { cn } from "@/lib/utils";

export type KpiDelta = {
  dir: "up" | "down" | "flat";
  text: string;
};

export type SparkPoint = {
  value: number;
  label?: string;
};

export type BreakdownItem = {
  label: string;
  value: string | number;
  tone?: "ink" | "ok" | "warn" | "err" | "muted";
};

export type StackSegment = {
  label: string;
  /** Numeric weight for relative width. */
  value: number;
  /** Display string (e.g. "1.2s"). */
  display?: string;
  color?: string;
};

type KpiCardProps = {
  title: string;
  value: string | number;
  suffix?: string;
  delta?: KpiDelta;
  sparkline?: number[] | SparkPoint[];
  /** Optional unit shown on the latest-bar tooltip + average line. Defaults to %. */
  sparkUnit?: string;
  /** Caption shown on the right side of the chart strip (e.g. "vs prom. 48%"). */
  sparkCaption?: string;
  /** Up to 3 secondary stats shown as a mini grid below the headline. */
  breakdown?: BreakdownItem[];
  /** Stacked horizontal bar with legend; useful for time-per-stage or share-of-total. */
  stack?: StackSegment[];
  /** Heading shown above the breakdown/stack. */
  blockTitle?: string;
  featured?: boolean;
};

function deltaArrow(dir: KpiDelta["dir"]) {
  if (dir === "up") return "▲";
  if (dir === "down") return "▼";
  return "▬";
}

function normalizeSpark(
  spark: number[] | SparkPoint[] | undefined,
): SparkPoint[] {
  if (!spark || spark.length === 0) return [];
  if (typeof spark[0] === "number") {
    return (spark as number[]).map((v) => ({ value: v }));
  }
  return spark as SparkPoint[];
}

function toneColor(tone: BreakdownItem["tone"], featured: boolean) {
  switch (tone) {
    case "ok":
      return featured ? "#7adf9b" : "var(--otto-ok)";
    case "warn":
      return "var(--otto-warn)";
    case "err":
      return "var(--otto-err)";
    case "muted":
      return featured ? "rgba(255,255,255,.55)" : "var(--otto-muted)";
    default:
      return featured ? "#fff" : "var(--otto-ink)";
  }
}

const STACK_PALETTE = [
  "var(--otto-primary)",
  "#0a7d3d",
  "#2563eb",
  "#b06b00",
  "#7c3aed",
];

export function KpiCard({
  title,
  value,
  suffix,
  delta,
  sparkline,
  sparkUnit = "%",
  sparkCaption,
  breakdown,
  stack,
  blockTitle,
  featured = false,
}: KpiCardProps) {
  const points = normalizeSpark(sparkline);
  const max = points.length ? Math.max(...points.map((p) => p.value), 1) : 1;
  const positive = points.filter((p) => p.value > 0);
  const avg =
    positive.length > 0
      ? Math.round(
          positive.reduce((acc, p) => acc + p.value, 0) / positive.length,
        )
      : 0;
  const lastIdx = points.length - 1;
  const latestValue = points[lastIdx]?.value ?? 0;

  const allEqual =
    points.length > 1 && points.every((p) => p.value === points[0].value);

  return (
    <div
      className={cn("rounded-[14px] p-[18px]")}
      style={{
        background: featured ? "var(--otto-ink)" : "var(--otto-surface)",
        color: featured ? "#fff" : "var(--otto-ink)",
        border: featured
          ? "1px solid var(--otto-ink)"
          : "1px solid var(--otto-rule)",
        boxShadow: featured ? undefined : "var(--otto-shadow-1)",
      }}
    >
      <div
        className="font-mono-otto mb-3.5"
        style={{
          fontSize: "9px",
          letterSpacing: ".16em",
          color: featured ? "#9d9da3" : "var(--otto-muted)",
        }}
      >
        {title}
      </div>
      <div
        className="font-display font-bold leading-none"
        style={{ fontSize: "34px", letterSpacing: "-1.5px" }}
      >
        {value}
        {suffix ? (
          <small
            className="font-bold"
            style={{
              fontSize: "18px",
              color: featured ? "#9d9da3" : "var(--otto-muted)",
              marginLeft: "2px",
            }}
          >
            {suffix}
          </small>
        ) : null}
      </div>
      {delta ? (
        <div
          className="font-mono-otto mt-2.5 flex items-center gap-1.5"
          style={{
            fontSize: "10px",
            letterSpacing: ".04em",
            textTransform: "none",
            color:
              delta.dir === "up"
                ? featured
                  ? "#7adf9b"
                  : "var(--otto-ok)"
                : delta.dir === "down"
                  ? "var(--otto-err)"
                  : featured
                    ? "#9d9da3"
                    : "var(--otto-muted)",
          }}
        >
          <span>{deltaArrow(delta.dir)}</span>
          <span>{delta.text}</span>
        </div>
      ) : null}

      {points.length > 0 ? (
        <div className="mt-4">
          {/* Header: scale + caption */}
          <div
            className="font-mono-otto mb-2 flex items-center justify-between"
            style={{
              fontSize: "9px",
              letterSpacing: ".16em",
              color: featured ? "rgba(255,255,255,.45)" : "var(--otto-muted)",
            }}
          >
            <span>Últimos {points.length} envíos</span>
            <span>
              {sparkCaption
                ? sparkCaption
                : avg > 0
                  ? `Prom. ${avg}${sparkUnit}`
                  : "Sin datos"}
            </span>
          </div>

          {/* Chart area with avg guideline */}
          <div className="relative h-[56px]">
            {/* Average horizontal guideline */}
            {!allEqual && avg > 0 ? (
              <div
                className="pointer-events-none absolute left-0 right-0 z-0 border-t border-dashed"
                style={{
                  borderColor: featured
                    ? "rgba(255,255,255,.18)"
                    : "var(--otto-rule)",
                  bottom: `${(avg / max) * 100}%`,
                }}
              />
            ) : null}

            <div className="relative z-10 flex h-full items-end gap-[3px]">
              {points.map((p, i) => {
                const isLatest = i === lastIdx;
                const isZero = p.value === 0;
                const heightPct = isZero
                  ? 6
                  : Math.max(10, Math.round((p.value / max) * 100));
                return (
                  <div
                    key={i}
                    className="group relative flex-1"
                    style={{ height: "100%" }}
                  >
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-sm transition-opacity"
                      style={{
                        height: `${heightPct}%`,
                        background: isZero
                          ? featured
                            ? "rgba(255,255,255,.10)"
                            : "var(--otto-rule)"
                          : isLatest
                            ? "var(--otto-primary)"
                            : featured
                              ? "rgba(214,40,40,.45)"
                              : "rgba(214,40,40,.55)",
                        boxShadow: isLatest
                          ? "0 0 0 1px rgba(214,40,40,.40), 0 4px 10px rgba(214,40,40,.35)"
                          : undefined,
                      }}
                    />
                    {/* Hover tooltip */}
                    {p.label || !isZero ? (
                      <div
                        className="font-mono-otto pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2 -translate-y-full rounded-md px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100"
                        style={{
                          background: "var(--otto-ink)",
                          color: "#fff",
                          fontSize: "9px",
                          letterSpacing: ".14em",
                          whiteSpace: "nowrap",
                          boxShadow: "var(--otto-shadow-2)",
                        }}
                      >
                        {p.label ? `${p.label} · ` : ""}
                        {isZero ? "sin envío" : `${p.value}${sparkUnit}`}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          {points.some((p) => p.label) ? (
            <div className="mt-1.5 flex items-center gap-[3px]">
              {points.map((p, i) => {
                const isLatest = i === lastIdx;
                return (
                  <div
                    key={i}
                    className="font-mono-otto flex-1 text-center"
                    style={{
                      fontSize: "8px",
                      letterSpacing: ".14em",
                      color: isLatest
                        ? featured
                          ? "#fff"
                          : "var(--otto-ink)"
                        : featured
                          ? "rgba(255,255,255,.40)"
                          : "var(--otto-muted)",
                      fontWeight: isLatest ? 700 : 600,
                    }}
                  >
                    {p.label ?? ""}
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Latest send footer chip */}
          {!isNaN(latestValue) && points.length > 0 ? (
            <div
              className="mt-3 flex items-center justify-between border-t pt-2.5"
              style={{
                borderColor: featured
                  ? "rgba(255,255,255,.10)"
                  : "var(--otto-rule)",
              }}
            >
              <span
                className="font-mono-otto"
                style={{
                  fontSize: "9px",
                  letterSpacing: ".16em",
                  color: featured ? "rgba(255,255,255,.55)" : "var(--otto-muted)",
                }}
              >
                Último{points[lastIdx]?.label ? ` · ${points[lastIdx]?.label}` : ""}
              </span>
              <span
                className="font-display font-bold"
                style={{
                  fontSize: "13px",
                  letterSpacing: "-.02em",
                  color: featured ? "#fff" : "var(--otto-ink)",
                }}
              >
                {latestValue}
                {sparkUnit}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ============== BREAKDOWN (mini stat row) ============== */}
      {breakdown && breakdown.length > 0 ? (
        <div className="mt-4">
          {blockTitle ? (
            <div
              className="font-mono-otto mb-2.5"
              style={{
                fontSize: "9px",
                letterSpacing: ".16em",
                color: featured ? "rgba(255,255,255,.45)" : "var(--otto-muted)",
              }}
            >
              {blockTitle}
            </div>
          ) : null}
          <div
            className="grid gap-3 border-t pt-3.5"
            style={{
              gridTemplateColumns: `repeat(${breakdown.length}, minmax(0,1fr))`,
              borderColor: featured
                ? "rgba(255,255,255,.10)"
                : "var(--otto-rule)",
            }}
          >
            {breakdown.map((b) => (
              <div key={b.label}>
                <div
                  className="font-mono-otto"
                  style={{
                    fontSize: "9px",
                    letterSpacing: ".16em",
                    color: featured
                      ? "rgba(255,255,255,.45)"
                      : "var(--otto-muted)",
                  }}
                >
                  {b.label}
                </div>
                <div
                  className="font-display mt-1 font-bold"
                  style={{
                    fontSize: "18px",
                    letterSpacing: "-.02em",
                    color: toneColor(b.tone, featured),
                  }}
                >
                  {b.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ============== STACK (horizontal stacked bar) ============== */}
      {stack && stack.length > 0 ? (
        <StackBlock
          segments={stack}
          featured={featured}
          title={blockTitle ?? "Composición"}
        />
      ) : null}
    </div>
  );
}

function StackBlock({
  segments,
  featured,
  title,
}: {
  segments: StackSegment[];
  featured: boolean;
  title: string;
}) {
  const total = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  if (total <= 0) return null;
  return (
    <div className="mt-4">
      <div
        className="font-mono-otto mb-2 flex items-center justify-between"
        style={{
          fontSize: "9px",
          letterSpacing: ".16em",
          color: featured ? "rgba(255,255,255,.45)" : "var(--otto-muted)",
        }}
      >
        <span>{title}</span>
        <span>{segments.length} etapas</span>
      </div>
      {/* The bar */}
      <div
        className="flex h-[10px] w-full overflow-hidden rounded-full"
        style={{
          background: featured
            ? "rgba(255,255,255,.08)"
            : "var(--otto-rule-2)",
        }}
      >
        {segments.map((s, i) => {
          const pct = (Math.max(0, s.value) / total) * 100;
          const color = s.color ?? STACK_PALETTE[i % STACK_PALETTE.length];
          if (pct === 0) return null;
          return (
            <div
              key={s.label}
              className="group relative h-full"
              style={{ width: `${pct}%`, background: color }}
              title={`${s.label} · ${s.display ?? s.value}`}
            />
          );
        })}
      </div>
      {/* Legend */}
      <ul className="mt-3 space-y-1.5">
        {segments.map((s, i) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          const color = s.color ?? STACK_PALETTE[i % STACK_PALETTE.length];
          return (
            <li
              key={s.label}
              className="flex items-center justify-between gap-3 text-[12px]"
              style={{
                color: featured ? "rgba(255,255,255,.85)" : "var(--otto-ink-2)",
              }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-sm"
                  style={{ background: color }}
                />
                <span className="truncate">{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-mono-otto"
                  style={{
                    fontSize: "9px",
                    letterSpacing: ".14em",
                    color: featured
                      ? "rgba(255,255,255,.45)"
                      : "var(--otto-muted)",
                  }}
                >
                  {pct}%
                </span>
                <span
                  className="font-display font-bold"
                  style={{
                    fontSize: "12px",
                    letterSpacing: "-.02em",
                    color: featured ? "#fff" : "var(--otto-ink)",
                  }}
                >
                  {s.display ?? s.value}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
