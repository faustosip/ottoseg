type EngagementBarProps = {
  pct: number | null;
};

export function EngagementBar({ pct }: EngagementBarProps) {
  const value = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  const color =
    pct == null
      ? "var(--otto-rule-2)"
      : value < 25
        ? "var(--otto-warn)"
        : "var(--otto-primary)";
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-[6px] w-[60px] overflow-hidden rounded-[3px]"
        style={{ background: "var(--otto-rule-2)" }}
      >
        <div
          className="h-full rounded-[3px]"
          style={{
            width: `${value}%`,
            background: color,
          }}
        />
      </div>
      <span
        className="font-mono-otto w-[32px] text-right"
        style={{
          fontSize: "11px",
          color: "var(--otto-ink)",
          fontWeight: 600,
          letterSpacing: ".04em",
          textTransform: "none",
        }}
      >
        {pct == null ? "—" : `${Math.round(value)}%`}
      </span>
    </div>
  );
}
