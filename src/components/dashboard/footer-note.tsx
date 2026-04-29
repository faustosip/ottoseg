import type { ReactNode } from "react";

type FooterNoteProps = {
  children?: ReactNode;
};

export function FooterNote({ children }: FooterNoteProps) {
  return (
    <div
      className="font-mono-otto mt-10 pt-[18px]"
      style={{
        borderTop: "1px solid var(--otto-rule)",
        fontSize: "10px",
        color: "var(--otto-muted)",
        letterSpacing: ".1em",
      }}
    >
      {children ?? "OttoSeguridad · Console v2 · Todos los tiempos en America/Guayaquil"}
    </div>
  );
}
