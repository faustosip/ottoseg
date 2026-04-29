type StatItem = {
  label: string;
  value: React.ReactNode;
  delta?: { dir: "up" | "down" | "flat"; text: string };
};

type StatsRowProps = {
  items: StatItem[];
};

export function StatsRow({ items }: StatsRowProps) {
  return (
    <div className="mb-[22px] grid grid-cols-4 gap-3.5">
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-[12px] border bg-white p-4"
          style={{
            borderColor: "var(--otto-rule)",
            boxShadow: "var(--otto-shadow-1)",
          }}
        >
          <div
            className="font-mono-otto mb-2"
            style={{
              fontSize: "9px",
              letterSpacing: ".16em",
              color: "var(--otto-muted)",
              fontWeight: 600,
            }}
          >
            {s.label}
          </div>
          <div
            className="font-display"
            style={{
              fontWeight: 700,
              fontSize: "26px",
              lineHeight: 1,
              letterSpacing: "-1px",
              color: "var(--otto-ink)",
            }}
          >
            {s.value}
          </div>
          {s.delta ? (
            <div
              className="font-mono-otto mt-1.5"
              style={{
                fontSize: "10px",
                letterSpacing: ".04em",
                textTransform: "none",
                color:
                  s.delta.dir === "up"
                    ? "var(--otto-ok)"
                    : s.delta.dir === "down"
                      ? "var(--otto-err)"
                      : "var(--otto-muted)",
              }}
            >
              {s.delta.dir === "up"
                ? "▲ "
                : s.delta.dir === "down"
                  ? "▼ "
                  : "· "}
              {s.delta.text}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
