import { cn } from "@/lib/utils";

export type KpiDelta = {
  dir: "up" | "down" | "flat";
  text: string;
};

type KpiCardProps = {
  title: string;
  value: string | number;
  suffix?: string;
  delta?: KpiDelta;
  sparkline?: number[];
  featured?: boolean;
};

function deltaArrow(dir: KpiDelta["dir"]) {
  if (dir === "up") return "▲";
  if (dir === "down") return "▼";
  return "▬";
}

export function KpiCard({
  title,
  value,
  suffix,
  delta,
  sparkline,
  featured = false,
}: KpiCardProps) {
  const max = sparkline && sparkline.length ? Math.max(...sparkline, 1) : 1;
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
      {sparkline && sparkline.length > 0 ? (
        <div className="mt-3.5 flex h-[30px] items-end gap-[3px]">
          {sparkline.map((v, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm"
              style={{
                background: "var(--otto-primary)",
                opacity: 0.85,
                height: `${Math.max(8, Math.round((v / max) * 100))}%`,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
