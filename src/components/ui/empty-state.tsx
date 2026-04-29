import Link from "next/link";
import { type ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  cta,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8" : "py-14"
      }`}
    >
      {icon && (
        <div
          className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border"
          style={{
            borderColor: "var(--otto-rule)",
            color: "var(--otto-muted)",
            background: "var(--otto-bg)",
          }}
        >
          {icon}
        </div>
      )}
      <h3
        className="font-display text-[18px] font-bold"
        style={{ color: "var(--otto-ink)", letterSpacing: "-.3px" }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="mt-1.5 max-w-md text-[13px] leading-relaxed"
          style={{ color: "var(--otto-muted)" }}
        >
          {description}
        </p>
      )}
      {cta && (
        cta.href ? (
          <Link
            href={cta.href}
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background: "var(--otto-primary)",
              boxShadow: "0 4px 12px rgba(214,40,40,.3)",
            }}
          >
            {cta.label} →
          </Link>
        ) : (
          <button
            type="button"
            onClick={cta.onClick}
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background: "var(--otto-primary)",
              boxShadow: "0 4px 12px rgba(214,40,40,.3)",
            }}
          >
            {cta.label} →
          </button>
        )
      )}
    </div>
  );
}
