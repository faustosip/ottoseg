"use client";

type BulkBarProps = {
  selectedCount: number;
  total: number;
  onClear: () => void;
  onExport?: () => void;
  onPause?: () => void;
  onDelete?: () => void;
};

export function BulkBar({
  selectedCount,
  total,
  onClear,
  onExport,
  onPause,
  onDelete,
}: BulkBarProps) {
  if (selectedCount === 0) return null;
  return (
    <div
      className="mb-2.5 flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-[13px] text-white"
      style={{ background: "var(--otto-ink)" }}
    >
      <b className="font-semibold">{selectedCount} seleccionados</b>
      <span style={{ opacity: 0.7 }}>de {total}</span>
      <div className="ml-auto flex gap-1.5">
        {onExport ? (
          <button
            type="button"
            onClick={onExport}
            className="rounded-[6px] px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: "rgba(255,255,255,.1)", color: "#fff" }}
          >
            Exportar
          </button>
        ) : null}
        {onPause ? (
          <button
            type="button"
            onClick={onPause}
            className="rounded-[6px] px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: "rgba(255,255,255,.1)", color: "#fff" }}
          >
            Pausar envío
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-[6px] px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: "rgba(255,255,255,.1)", color: "#fff" }}
          >
            Eliminar
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClear}
          aria-label="Limpiar selección"
          className="rounded-[6px] px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: "rgba(255,255,255,.1)", color: "#fff" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
