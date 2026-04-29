type StatItem = {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "error";
};

type SourcesStatsRowProps = {
  items: StatItem[];
};

export function SourcesStatsRow({ items }: SourcesStatsRowProps) {
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
              color: s.tone === "error" ? "var(--otto-err)" : "var(--otto-ink)",
            }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
