import { cn } from "@/lib/utils";

export type PipelineStepStatus = "done" | "now" | "pending";

export type PipelineStep = {
  label: string;
  sub: string;
  status: PipelineStepStatus;
};

type PipelineStepsProps = {
  steps: PipelineStep[];
  variant?: "dark" | "light";
};

export function PipelineSteps({ steps, variant = "dark" }: PipelineStepsProps) {
  const dark = variant === "dark";
  return (
    <div
      className={cn("flex items-start gap-0 rounded-xl p-4")}
      style={{
        background: dark ? "rgba(255,255,255,.04)" : "var(--otto-surface)",
        border: dark
          ? "1px solid rgba(255,255,255,.06)"
          : "1px solid var(--otto-rule)",
      }}
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div
            key={`${step.label}-${i}`}
            className="relative flex-1 pr-1.5 text-left"
          >
            <div
              className="font-mono-otto mb-1.5 flex h-6 w-6 items-center justify-center rounded-full"
              style={{
                fontSize: "10px",
                letterSpacing: ".04em",
                textTransform: "none",
                background:
                  step.status === "done"
                    ? "var(--otto-ok)"
                    : step.status === "now"
                      ? "var(--otto-primary)"
                      : dark
                        ? "rgba(255,255,255,.08)"
                        : "var(--otto-rule-2)",
                color:
                  step.status === "pending"
                    ? dark
                      ? "#7c7c83"
                      : "var(--otto-muted)"
                    : "#fff",
                boxShadow:
                  step.status === "now"
                    ? "0 0 0 5px rgba(214,40,40,.25)"
                    : undefined,
              }}
            >
              {step.status === "done" ? "✓" : step.status === "now" ? "·" : i + 1}
            </div>
            <div
              className="text-[11px] font-semibold"
              style={{ color: dark ? "#fff" : "var(--otto-ink)" }}
            >
              {step.label}
            </div>
            <div
              className="font-mono-otto mt-0.5"
              style={{
                fontSize: "9px",
                letterSpacing: ".05em",
                textTransform: "none",
                color: dark ? "#7c7c83" : "var(--otto-muted)",
              }}
            >
              {step.sub}
            </div>
            {!isLast && (
              <span
                aria-hidden
                className="absolute"
                style={{
                  top: "11px",
                  left: "26px",
                  right: "6px",
                  height: "2px",
                  background:
                    step.status === "done"
                      ? "var(--otto-ok)"
                      : dark
                        ? "rgba(255,255,255,.06)"
                        : "var(--otto-rule)",
                  zIndex: -1,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
