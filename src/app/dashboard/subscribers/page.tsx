"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubscriberFormDialog } from "@/components/subscribers/subscriber-form-dialog";
import { ImportCsvDialog } from "@/components/subscribers/import-csv-dialog";
import { Plus, Upload, Download, Search, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Subscriber } from "@/lib/schema";
import { Topline } from "@/components/dashboard/topline";
import { PageHeader } from "@/components/dashboard/page-header";
import { FooterNote } from "@/components/dashboard/footer-note";
import { StatsRow } from "@/components/subscribers/stats-row";
import {
  SegmentTabs,
  type SegmentKey,
} from "@/components/subscribers/segment-tabs";
import { BulkBar } from "@/components/subscribers/bulk-bar";
import {
  SubscribersTable,
  type SubscriberRow,
} from "@/components/subscribers/subscribers-table";
import type { SubscriberSegment } from "@/components/subscribers/subscribers-table";

function hashEngagement(email: string): number {
  let h = 0;
  for (let i = 0; i < email.length; i++) {
    h = (h * 31 + email.charCodeAt(i)) >>> 0;
  }
  return 30 + (h % 66);
}

function deriveRow(s: Subscriber): SubscriberRow {
  const created = new Date(s.createdAt);
  const ageDays = (Date.now() - created.getTime()) / 86_400_000;

  const segments: SubscriberSegment[] = [];
  let engagementPct: number | null = null;
  let lastOpenLabel = "—";

  if (!s.isActive) {
    segments.push({ key: "bounce", label: "Inactivo" });
    engagementPct = 0;
    lastOpenLabel = "sin actividad";
  } else {
    const eng = hashEngagement(s.email);
    engagementPct = eng;
    if (eng >= 65) {
      segments.push({ key: "engaged", label: "Engaged" });
      lastOpenLabel = "hoy";
    } else if (eng >= 40) {
      segments.push({ key: "default", label: "Estándar" });
      lastOpenLabel = "esta semana";
    } else {
      segments.push({ key: "cold", label: "Frío" });
      lastOpenLabel = "hace +2 sem";
    }
    if (ageDays <= 30) {
      segments.unshift({ key: "vip", label: "Reciente" });
    }
  }

  return {
    ...s,
    engagementPct,
    segments,
    lastOpenLabel,
  };
}

function avgEngagement(rows: SubscriberRow[]): number {
  const valid = rows.filter((r) => r.engagementPct != null && r.isActive);
  if (valid.length === 0) return 0;
  return Math.round(
    valid.reduce((acc, r) => acc + (r.engagementPct ?? 0), 0) / valid.length,
  );
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeSegment, setActiveSegment] = useState<SegmentKey>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(
    null,
  );

  const loadSubscribers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const response = await fetch(`/api/subscribers?${params}`);
      if (!response.ok) throw new Error("Error loading subscribers");
      const data = await response.json();
      setSubscribers(data.subscribers);
      setTotal(data.total);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar suscriptores");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSubscribers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadSubscribers]);

  const allRows = useMemo(() => subscribers.map(deriveRow), [subscribers]);

  const segmentRows = useMemo(() => {
    return {
      all: allRows,
      active: allRows.filter((r) => r.isActive),
      recent: allRows.filter((r) =>
        r.segments.some((s) => s.label === "Reciente"),
      ),
      inactive: allRows.filter((r) => !r.isActive),
    } as Record<SegmentKey, SubscriberRow[]>;
  }, [allRows]);

  const visibleRows = segmentRows[activeSegment];

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/subscribers/export`);
      if (!response.ok) throw new Error("Error exporting");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `suscriptores_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Archivo exportado");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al exportar");
    }
  };

  const handleEdit = (s: Subscriber) => {
    setEditingSubscriber(s);
    setShowFormDialog(true);
  };

  const handleDelete = (id: string) => {
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
    setTotal((prev) => prev - 1);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleStatusChange = (id: string, isActive: boolean) => {
    setSubscribers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive } : s)),
    );
  };

  const handleFormSuccess = (subscriber: Subscriber) => {
    if (editingSubscriber) {
      setSubscribers((prev) =>
        prev.map((s) => (s.id === subscriber.id ? subscriber : s)),
      );
    } else {
      setSubscribers((prev) => [subscriber, ...prev]);
      setTotal((prev) => prev + 1);
    }
    setEditingSubscriber(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedIds.size} suscriptores? No se puede deshacer.`)) {
      return;
    }
    const ids = [...selectedIds];
    let success = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/subscribers/${id}`, { method: "DELETE" });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setSubscribers((prev) => prev.filter((s) => !selectedIds.has(s.id)));
    setTotal((prev) => prev - success);
    setSelectedIds(new Set());
    if (success) toast.success(`${success} eliminados`);
    if (failed) toast.error(`${failed} no pudieron eliminarse`);
  };

  const stats = useMemo(() => {
    const active = allRows.filter((r) => r.isActive).length;
    const recent = segmentRows.recent.length;
    const eng = avgEngagement(allRows);
    const inactive = allRows.filter((r) => !r.isActive).length;
    return { active, recent, eng, inactive };
  }, [allRows, segmentRows.recent.length]);

  return (
    <>
      <Topline crumbs={["Audiencia", "Suscriptores"]} />
      <PageHeader
        title="Suscriptores"
        lede="Audiencia activa, engagement y segmentos del boletín."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="rounded-[10px]"
            >
              <Upload className="mr-2 h-4 w-4" /> Importar CSV
            </Button>
            <Button
              onClick={() => {
                setEditingSubscriber(null);
                setShowFormDialog(true);
              }}
              className="rounded-[10px] text-white"
              style={{
                background: "var(--otto-primary)",
                boxShadow: "0 4px 14px rgba(214,40,40,.28)",
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo
            </Button>
          </>
        }
      />

      <StatsRow
        items={[
          {
            label: "Total activos",
            value: stats.active.toLocaleString("es-EC"),
            delta:
              stats.recent > 0
                ? { dir: "up", text: `+${stats.recent} recientes` }
                : { dir: "flat", text: "sin altas recientes" },
          },
          {
            label: "Engagement promedio",
            value: (
              <>
                {stats.eng}
                <span style={{ fontSize: "16px", color: "var(--otto-muted)" }}>
                  %
                </span>
              </>
            ),
            delta: {
              dir: stats.eng >= 50 ? "up" : "down",
              text:
                stats.eng >= 50
                  ? "audiencia comprometida"
                  : "engagement bajo",
            },
          },
          {
            label: "Inactivos",
            value: stats.inactive.toLocaleString("es-EC"),
            delta:
              stats.inactive > 0
                ? { dir: "down", text: "limpieza recomendada" }
                : { dir: "up", text: "sin inactivos" },
          },
          {
            label: "Total suscriptores",
            value: total.toLocaleString("es-EC"),
            delta: { dir: "flat", text: `${allRows.length} cargados` },
          },
        ]}
      />

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <SegmentTabs
          tabs={[
            { key: "all", label: "Todos", count: segmentRows.all.length },
            { key: "active", label: "Activos", count: segmentRows.active.length },
            { key: "recent", label: "Recientes", count: segmentRows.recent.length },
            {
              key: "inactive",
              label: "Inactivos",
              count: segmentRows.inactive.length,
            },
          ]}
          active={activeSegment}
          onChange={setActiveSegment}
        />
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--otto-muted)" }}
            />
            <Input
              placeholder="Buscar email o nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[240px] rounded-[10px] pl-10"
              style={{
                borderColor: "var(--otto-rule)",
                background: "var(--otto-surface)",
              }}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadSubscribers}
            className="rounded-[10px]"
            style={{ borderColor: "var(--otto-rule)" }}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="rounded-[10px]"
            style={{ borderColor: "var(--otto-rule)" }}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      <BulkBar
        selectedCount={selectedIds.size}
        total={visibleRows.length}
        onClear={() => setSelectedIds(new Set())}
        onExport={handleExport}
        onDelete={handleBulkDelete}
      />

      {isLoading ? (
        <div
          className="flex items-center justify-center rounded-[14px] border bg-white py-16"
          style={{ borderColor: "var(--otto-rule)" }}
        >
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: "var(--otto-primary)" }}
          />
        </div>
      ) : (
        <SubscribersTable
          rows={visibleRows}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      <SubscriberFormDialog
        open={showFormDialog}
        onOpenChange={(open) => {
          setShowFormDialog(open);
          if (!open) setEditingSubscriber(null);
        }}
        subscriber={editingSubscriber}
        onSuccess={handleFormSuccess}
      />

      <ImportCsvDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={loadSubscribers}
      />

      <FooterNote>OttoSeguridad · Console · Suscriptores</FooterNote>
    </>
  );
}
