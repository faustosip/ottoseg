import { cn } from "@/lib/utils";

export type SegmentVariant =
  | "engaged"
  | "vip"
  | "cold"
  | "bounce"
  | "default";

type SegmentChipProps = {
  variant?: SegmentVariant;
  children: React.ReactNode;
};

const STYLES: Record<SegmentVariant, { bg: string; color: string }> = {
  engaged: { bg: "var(--otto-ok-soft)", color: "var(--otto-ok)" },
  vip: { bg: "var(--otto-primary-soft)", color: "var(--otto-primary-ink)" },
  cold: { bg: "var(--otto-warn-soft)", color: "var(--otto-warn)" },
  bounce: { bg: "var(--otto-err-soft)", color: "var(--otto-err)" },
  default: { bg: "var(--otto-rule-2)", color: "var(--otto-ink-2)" },
};

export function SegmentChip({ variant = "default", children }: SegmentChipProps) {
  const style = STYLES[variant];
  return (
    <span
      className={cn("font-mono-otto inline-block")}
      style={{
        fontSize: "9px",
        letterSpacing: ".06em",
        background: style.bg,
        color: style.color,
        padding: "3px 7px",
        borderRadius: "5px",
        fontWeight: 600,
        textTransform: "uppercase",
        marginRight: "4px",
      }}
    >
      {children}
    </span>
  );
}
