"use client";

import { cn } from "@/lib/utils";

export type GenerateStepStatus = "done" | "now" | "pending" | "error";

export type GenerateStep = {
  label: string;
  sub: string;
  status: GenerateStepStatus;
  count?: number;
};

type GenerateStepperProps = {
  steps: GenerateStep[];
};

export function GenerateStepper({ steps }: GenerateStepperProps) {
  return (
    <div
      className="mb-[22px] flex gap-2"
      style={{ display: "flex" }}
    >
      {steps.map((step, i) => (
        <div
          key={`${step.label}-${i}`}
          className={cn(
            "flex flex-1 items-center gap-2.5 rounded-[10px] border px-3.5 py-3",
          )}
          style={{
            background:
              step.status === "done"
                ? "var(--otto-ok-soft)"
                : step.status === "now"
                  ? "var(--otto-primary-soft)"
                  : step.status === "error"
                    ? "var(--otto-err-soft)"
                    : "var(--otto-surface)",
            borderColor:
              step.status === "done"
                ? "var(--otto-ok)"
                : step.status === "now"
                  ? "var(--otto-primary)"
                  : step.status === "error"
                    ? "var(--otto-err)"
                    : "var(--otto-rule)",
          }}
        >
          <div
            className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{
              fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
              background:
                step.status === "done"
                  ? "var(--otto-ok)"
                  : step.status === "now"
                    ? "var(--otto-primary)"
                    : step.status === "error"
                      ? "var(--otto-err)"
                      : "var(--otto-rule-2)",
              color:
                step.status === "pending" ? "var(--otto-muted)" : "#fff",
            }}
          >
            {step.status === "done"
              ? "✓"
              : step.status === "error"
                ? "!"
                : step.count ?? i + 1}
          </div>
          <div className="min-w-0">
            <div
              className="text-xs font-semibold"
              style={{
                color:
                  step.status === "pending"
                    ? "var(--otto-ink-2)"
                    : "var(--otto-ink)",
              }}
            >
              {step.label}
            </div>
            <span
              className="font-mono-otto block"
              style={{
                fontSize: "9px",
                letterSpacing: ".05em",
                textTransform: "uppercase",
                color: "var(--otto-muted)",
                marginTop: "1px",
                fontWeight: 500,
              }}
            >
              {step.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
