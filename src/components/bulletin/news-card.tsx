"use client";

import { cn } from "@/lib/utils";

type NewsCardProps = {
  title: string;
  source?: string | null;
  category?: string | null;
  excerpt?: string | null;
  time?: string | null;
  selected?: boolean;
  onToggle?: () => void;
};

export function NewsCard({
  title,
  source,
  category,
  excerpt,
  time,
  selected = false,
  onToggle,
}: NewsCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group flex items-start gap-2.5 rounded-[10px] border bg-white p-3.5 text-left transition-colors",
      )}
      style={{
        borderColor: selected
          ? "var(--otto-primary)"
          : "var(--otto-rule)",
        background: selected ? "var(--otto-primary-soft)" : "#fff",
      }}
    >
      <div
        className={cn(
          "mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[4px] border text-[11px] font-bold",
        )}
        style={{
          background: selected ? "var(--otto-primary)" : "#fff",
          borderColor: selected ? "var(--otto-primary)" : "var(--otto-rule)",
          color: "#fff",
        }}
        aria-hidden
      >
        {selected ? "✓" : ""}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="font-mono-otto mb-1 flex flex-wrap items-center gap-2"
          style={{
            fontSize: "9px",
            letterSpacing: ".08em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {category ? (
            <span style={{ color: "var(--otto-primary)" }}>
              <span
                className="mr-1.5 inline-block h-[5px] w-[5px] rounded-full align-middle"
                style={{ background: "var(--otto-primary)" }}
              />
              {category}
            </span>
          ) : null}
          {source ? (
            <span style={{ color: "var(--otto-muted)" }}>· {source}</span>
          ) : null}
          {time ? (
            <span style={{ color: "var(--otto-muted)" }}>· {time}</span>
          ) : null}
        </div>
        <h5
          className="font-display m-0 mb-1 text-[13px] font-semibold leading-[1.3]"
          style={{
            letterSpacing: "-0.2px",
            color: "var(--otto-ink)",
          }}
        >
          {title}
        </h5>
        {excerpt ? (
          <p
            className="m-0 line-clamp-2 text-[12px] leading-[1.4]"
            style={{ color: "var(--otto-muted)" }}
          >
            {excerpt}
          </p>
        ) : null}
      </div>
    </button>
  );
}
