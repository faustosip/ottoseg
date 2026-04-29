"use client";

import { Search } from "lucide-react";
import { useSession } from "@/lib/auth-client";

function initialsFromName(name?: string | null, email?: string | null) {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "";
  if (!source) return "OS";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

type ToplineProps = {
  crumbs?: string[];
};

export function Topline({ crumbs = ["OttoSeguridad", "Console"] }: ToplineProps) {
  const { data: session } = useSession();
  const initials = initialsFromName(session?.user?.name, session?.user?.email);

  return (
    <div className="mb-[18px] flex items-center justify-between gap-[18px]">
      <div
        className="font-mono-otto"
        style={{
          fontSize: "10px",
          letterSpacing: ".16em",
          color: "var(--otto-muted)",
        }}
      >
        {crumbs.join(" / ")}
      </div>
      <div
        className="flex items-center gap-3 text-[12px]"
        style={{ color: "var(--otto-muted)" }}
      >
        <div
          className="flex w-[300px] items-center gap-2 rounded-[10px] px-3 py-2 text-[12px]"
          style={{
            background: "var(--otto-surface)",
            border: "1px solid var(--otto-rule)",
            color: "var(--otto-muted)",
          }}
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Buscar boletines, fuentes…"
            className="flex-1 border-none bg-transparent text-[12px] outline-none"
            style={{ color: "var(--otto-ink)" }}
          />
          <kbd
            className="font-mono-otto rounded px-[5px] py-[2px] text-[10px]"
            style={{
              background: "var(--otto-bg)",
              letterSpacing: ".05em",
              textTransform: "none",
            }}
          >
            ⌘K
          </kbd>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{
            background: "var(--otto-primary)",
            letterSpacing: ".5px",
          }}
          aria-label={session?.user?.name ?? "Usuario"}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}
