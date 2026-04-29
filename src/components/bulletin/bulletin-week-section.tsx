import type { ReactNode } from "react";

type Props = {
  title: string;
  stats: string;
  children: ReactNode;
};

export function BulletinWeekSection({ title, stats, children }: Props) {
  return (
    <section className="mt-7 first:mt-0">
      <header
        className="mb-3 flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5 pb-2.5"
        style={{ borderBottom: "1px solid var(--otto-rule)" }}
      >
        <h3
          className="font-display m-0 text-[17px] font-bold"
          style={{
            letterSpacing: "-.4px",
            color: "var(--otto-ink)",
          }}
        >
          {title}
        </h3>
        {stats ? (
          <span
            className="font-mono-otto"
            style={{
              fontSize: "10px",
              letterSpacing: ".1em",
              color: "var(--otto-muted)",
              fontWeight: 600,
            }}
          >
            {stats}
          </span>
        ) : null}
      </header>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}
