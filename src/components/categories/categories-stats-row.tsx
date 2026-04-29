type StatItem = {
  label: string;
  value: React.ReactNode;
};

type CategoriesStatsRowProps = {
  items: StatItem[];
};

export function CategoriesStatsRow({ items }: CategoriesStatsRowProps) {
  return (
    <div
      className="mb-[22px] grid gap-3.5"
      style={{
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
      }}
    >
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
        </div>
      ))}
    </div>
  );
}
