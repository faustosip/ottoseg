export type NextStep = {
  title: string;
  description: string;
};

type Props = {
  steps: NextStep[];
};

export function NextStepsPanel({ steps }: Props) {
  return (
    <div
      className="rounded-[14px] p-5"
      style={{
        background: "var(--otto-surface)",
        border: "1px solid var(--otto-rule)",
        boxShadow: "var(--otto-shadow-1)",
      }}
    >
      <h3
        className="font-display m-0 mb-3.5 text-[17px] font-bold"
        style={{ letterSpacing: "-.3px" }}
      >
        Próximos pasos
      </h3>
      {steps.length === 0 ? (
        <div
          className="px-6 py-10 text-center text-[13px]"
          style={{ color: "var(--otto-muted)" }}
        >
          Todo en orden. Sin pendientes.
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {steps.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3.5 py-3 text-[13px]"
              style={{
                color: "var(--otto-ink-2)",
                borderBottom:
                  i < steps.length - 1
                    ? "1px solid var(--otto-rule)"
                    : undefined,
              }}
            >
              <div
                className="font-mono-otto flex h-7 w-7 flex-none items-center justify-center rounded-lg"
                style={{
                  background: "var(--otto-primary-soft)",
                  color: "var(--otto-primary-ink)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  textTransform: "none",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <b
                  className="mb-0.5 block font-semibold"
                  style={{ color: "var(--otto-ink)" }}
                >
                  {step.title}
                </b>
                {step.description}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
