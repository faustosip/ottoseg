"use client";

import { cn } from "@/lib/utils";

export type SegmentKey =
  | "all"
  | "active"
  | "recent"
  | "inactive";

type Tab = {
  key: SegmentKey;
  label: string;
  count: number;
};

type SegmentTabsProps = {
  tabs: Tab[];
  active: SegmentKey;
  onChange: (key: SegmentKey) => void;
};

export function SegmentTabs({ tabs, active, onChange }: SegmentTabsProps) {
  return (
    <div
      className="flex gap-1 rounded-[10px] border bg-white p-1"
      style={{ borderColor: "var(--otto-rule)" }}
    >
      {tabs.map((t) => {
        const on = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "rounded-[7px] px-3 py-1.5 text-[12px] font-medium transition-colors",
            )}
            style={{
              background: on ? "var(--otto-ink)" : "transparent",
              color: on ? "#fff" : "var(--otto-muted)",
            }}
          >
            {t.label}
            <span
              className="font-mono-otto ml-1.5"
              style={{
                fontSize: "10px",
                opacity: 0.7,
                textTransform: "none",
                letterSpacing: ".04em",
              }}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
