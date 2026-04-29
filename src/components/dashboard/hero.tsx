import type { ReactNode } from "react";
import { PipelineSteps, type PipelineStep } from "./pipeline-steps";

type HeroProps = {
  tag: string;
  title: string;
  meta: ReactNode;
  steps: PipelineStep[];
  actions?: ReactNode;
};

export function Hero({ tag, title, meta, steps, actions }: HeroProps) {
  return (
    <section
      className="relative mb-[22px] overflow-hidden rounded-[18px] p-7 text-white"
      style={{
        background: "linear-gradient(135deg,#0e0e10 0%,#1d1d20 100%)",
        boxShadow: "var(--otto-shadow-2)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: "-90px",
          top: "-90px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--otto-primary) 0%, transparent 65%)",
          opacity: 0.55,
        }}
      />
      <div
        className="relative z-[2] grid items-center gap-8"
        style={{ gridTemplateColumns: "1.3fr 1fr" }}
      >
        <div>
          <span
            className="font-mono-otto mb-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-[5px]"
            style={{
              fontSize: "10px",
              letterSpacing: ".16em",
              color: "#ffb4b4",
              background: "rgba(214,40,40,.18)",
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: "var(--otto-primary)",
                boxShadow: "0 0 0 4px rgba(214,40,40,.25)",
              }}
            />
            {tag}
          </span>
          <h2
            className="font-display m-0 mb-2 text-[30px] font-bold leading-tight"
            style={{ letterSpacing: "-.8px" }}
          >
            {title}
          </h2>
          <p
            className="mb-[18px] text-[13px] leading-[1.5]"
            style={{ color: "#9d9da3" }}
          >
            {meta}
          </p>
          {actions ? (
            <div className="flex flex-wrap gap-2.5">{actions}</div>
          ) : null}
        </div>
        <PipelineSteps steps={steps} variant="dark" />
      </div>
    </section>
  );
}
