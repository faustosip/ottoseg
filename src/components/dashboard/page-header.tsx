import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  highlight?: string;
  lede?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, highlight, lede, actions }: PageHeaderProps) {
  return (
    <div className="mb-[18px] flex flex-wrap items-start justify-between gap-[18px]">
      <div className="min-w-[280px] flex-1">
        <h1
          className="font-display m-0 mb-1.5 text-[38px] font-bold leading-[1.05]"
          style={{ letterSpacing: "-1.4px" }}
        >
          {title}
          {highlight ? (
            <em
              className="not-italic"
              style={{ color: "var(--otto-primary)" }}
            >
              {" "}
              {highlight}
            </em>
          ) : null}
        </h1>
        {lede ? (
          <p
            className="m-0 max-w-[640px] text-[14px] leading-[1.55]"
            style={{ color: "var(--otto-muted)" }}
          >
            {lede}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-shrink-0 items-center gap-2.5 pt-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
