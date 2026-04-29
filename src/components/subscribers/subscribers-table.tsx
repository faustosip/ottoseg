"use client";

import { useState } from "react";
import type { Subscriber } from "@/lib/schema";
import { SegmentChip, type SegmentVariant } from "./segment-chip";
import { EngagementBar } from "./engagement-bar";
import { MoreHorizontal, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SubscriberSegment = {
  key: SegmentVariant;
  label: string;
};

export type SubscriberRow = Subscriber & {
  engagementPct: number | null;
  segments: SubscriberSegment[];
  lastOpenLabel: string;
};

type SubscribersTableProps = {
  rows: SubscriberRow[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onEdit: (s: Subscriber) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, isActive: boolean) => void;
};

function formatJoinDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/\./g, "");
}

export function SubscribersTable({
  rows,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onStatusChange,
}: SubscribersTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && rows.some((r) => selectedIds.has(r.id));

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(rows.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const handleToggleActive = async (s: Subscriber) => {
    setBusyId(s.id);
    try {
      const res = await fetch(`/api/subscribers/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      if (!res.ok) throw new Error("Error");
      onStatusChange(s.id, !s.isActive);
      toast.success(!s.isActive ? "Suscriptor activado" : "Suscriptor desactivado");
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este suscriptor? Esta acción no se puede deshacer.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/subscribers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error");
      onDelete(id);
      toast.success("Suscriptor eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="overflow-hidden rounded-[14px] border bg-white"
      style={{
        borderColor: "var(--otto-rule)",
        boxShadow: "var(--otto-shadow-1)",
      }}
    >
      <table className="w-full text-left">
        <thead>
          <tr
            className="font-mono-otto"
            style={{
              fontSize: "10px",
              letterSpacing: ".12em",
              color: "var(--otto-muted)",
              fontWeight: 600,
              borderBottom: "1px solid var(--otto-rule)",
              background: "var(--otto-bg)",
            }}
          >
            <th className="w-[36px] px-3.5 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={toggleAll}
                className="cursor-pointer"
              />
            </th>
            <th className="px-3.5 py-3">Suscriptor</th>
            <th className="px-3.5 py-3">Segmento</th>
            <th className="px-3.5 py-3">Engagement</th>
            <th className="px-3.5 py-3">Última apertura</th>
            <th className="px-3.5 py-3">Suscrito</th>
            <th className="w-[40px] px-3.5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const checked = selectedIds.has(r.id);
            return (
              <tr
                key={r.id}
                style={{ borderBottom: "1px solid var(--otto-rule)" }}
                className="hover:bg-[var(--otto-bg)]"
              >
                <td className="px-3.5 py-3 align-middle">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(r.id)}
                    className="cursor-pointer"
                  />
                </td>
                <td className="px-3.5 py-3 align-middle">
                  <b
                    className="block text-[13px]"
                    style={{
                      color: r.isActive ? "var(--otto-ink)" : "var(--otto-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {r.email}
                  </b>
                  <span
                    className="font-mono-otto"
                    style={{
                      fontSize: "10px",
                      color: "var(--otto-muted)",
                      letterSpacing: ".04em",
                      textTransform: "none",
                    }}
                  >
                    {r.name ?? "—"}
                  </span>
                </td>
                <td className="px-3.5 py-3 align-middle">
                  {r.segments.length === 0 ? (
                    <SegmentChip>Estándar</SegmentChip>
                  ) : (
                    r.segments.map((seg) => (
                      <SegmentChip key={seg.label} variant={seg.key}>
                        {seg.label}
                      </SegmentChip>
                    ))
                  )}
                </td>
                <td className="px-3.5 py-3 align-middle">
                  <EngagementBar pct={r.engagementPct} />
                </td>
                <td
                  className="font-mono-otto px-3.5 py-3 align-middle"
                  style={{
                    fontSize: "11px",
                    color: "var(--otto-muted)",
                    letterSpacing: ".04em",
                    textTransform: "none",
                  }}
                >
                  {r.lastOpenLabel}
                </td>
                <td
                  className="font-mono-otto px-3.5 py-3 align-middle"
                  style={{
                    fontSize: "11px",
                    color: "var(--otto-muted)",
                    letterSpacing: ".04em",
                    textTransform: "none",
                  }}
                >
                  {formatJoinDate(r.createdAt)}
                </td>
                <td className="px-3.5 py-3 align-middle">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded-md p-1 hover:bg-[var(--otto-rule-2)]"
                        disabled={busyId === r.id}
                      >
                        <MoreHorizontal className="h-4 w-4" style={{ color: "var(--otto-muted)" }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(r)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(r)}>
                        {r.isActive ? (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" /> Desactivar
                          </>
                        ) : (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4" /> Activar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(r.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <div
          className="px-6 py-12 text-center text-sm"
          style={{ color: "var(--otto-muted)" }}
        >
          No hay suscriptores que coincidan con los filtros.
        </div>
      ) : null}
    </div>
  );
}
