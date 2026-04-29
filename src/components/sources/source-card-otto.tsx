"use client";

import { useState } from "react";
import type { NewsSource } from "@/lib/schema";
import { SourceFavicon } from "./source-favicon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

type SourceCardOttoProps = {
  source: NewsSource;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (isActive: boolean) => void;
};

function timeAgo(date: Date | string | null): string {
  if (!date) return "nunca";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hace segundos";
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `hace ${days}d`;
  return d.toLocaleDateString("es-EC", { day: "2-digit", month: "short" });
}

function formatHostname(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    return url;
  }
}

export function SourceCardOtto({
  source,
  onEdit,
  onDelete,
  onToggleActive,
}: SourceCardOttoProps) {
  const [busy, setBusy] = useState(false);
  const hasError = source.lastScrapedStatus === "failed";

  const handleToggle = async () => {
    setBusy(true);
    try {
      onToggleActive(!source.isActive);
    } finally {
      setBusy(false);
    }
  };

  const statusPill = !source.isActive
    ? { label: "pausada", bg: "var(--otto-rule-2)", color: "var(--otto-muted)" }
    : hasError
      ? { label: "error", bg: "var(--otto-err-soft)", color: "var(--otto-err)" }
      : { label: "activa", bg: "var(--otto-ok-soft)", color: "var(--otto-ok)" };

  return (
    <div
      className="grid items-center gap-3.5 rounded-[12px] border bg-white p-4 transition-colors hover:border-[var(--otto-ink-2)]"
      style={{
        gridTemplateColumns: "auto 1fr auto",
        borderColor: "var(--otto-rule)",
        borderLeft: hasError ? "3px solid var(--otto-err)" : undefined,
        boxShadow: "var(--otto-shadow-1)",
      }}
    >
      <SourceFavicon name={source.name} />
      <div className="min-w-0">
        <h4
          className="font-display m-0 mb-0.5 truncate text-[15px] font-bold"
          style={{ letterSpacing: "-.3px", color: "var(--otto-ink)" }}
        >
          {source.name}
        </h4>
        <div
          className="font-mono-otto truncate"
          style={{
            fontSize: "11px",
            color: "var(--otto-muted)",
            letterSpacing: ".02em",
            textTransform: "none",
          }}
        >
          {formatHostname(source.url)}
        </div>
        <div
          className="font-mono-otto mt-2 flex flex-wrap gap-3.5"
          style={{
            fontSize: "10px",
            color: "var(--otto-muted)",
            letterSpacing: ".04em",
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          <span>
            <b
              style={{
                color: hasError ? "var(--otto-err)" : "var(--otto-ink)",
                fontWeight: 600,
              }}
            >
              {source.totalScraped ?? 0}
            </b>{" "}
            artículos
          </span>
          <span>
            última{" "}
            <b style={{ color: "var(--otto-ink)", fontWeight: 600 }}>
              {timeAgo(source.lastScraped)}
            </b>
          </span>
          {source.lastScrapedStatus ? (
            <span>
              estado{" "}
              <b style={{ color: "var(--otto-ink)", fontWeight: 600 }}>
                {source.lastScrapedStatus}
              </b>
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span
          className="font-mono-otto rounded-full px-2.5 py-1"
          style={{
            fontSize: "9px",
            letterSpacing: ".1em",
            background: statusPill.bg,
            color: statusPill.color,
          }}
        >
          {statusPill.label}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            disabled={busy}
            aria-pressed={source.isActive}
            aria-label={source.isActive ? "Pausar fuente" : "Activar fuente"}
            className="relative h-5 w-9 rounded-full transition-colors disabled:opacity-50"
            style={{
              background: source.isActive ? "var(--otto-ok)" : "var(--otto-rule)",
            }}
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
              style={{
                left: source.isActive ? "18px" : "2px",
                boxShadow: "0 1px 3px rgba(0,0,0,.2)",
              }}
            />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-md p-1 hover:bg-[var(--otto-rule-2)]"
              >
                <MoreHorizontal
                  className="h-4 w-4"
                  style={{ color: "var(--otto-muted)" }}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
