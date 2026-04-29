"use client";

import { forwardRef, type HTMLAttributes } from "react";
import type { BulletinCategory } from "@/lib/schema";
import { visualFor } from "@/lib/categories/visuals";
import { KeywordTags } from "./keyword-tags";
import { GripVertical, Edit, Trash2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryCardProps = HTMLAttributes<HTMLDivElement> & {
  category: BulletinCategory;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  count7d?: number;
};

export const CategoryCard = forwardRef<HTMLDivElement, CategoryCardProps>(
  (
    {
      category,
      dragHandleProps,
      isDragging,
      onEdit,
      onDelete,
      count7d,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const visual = visualFor(category.name);
    const keywords = (category.keywords as string[] | null) ?? [];

    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-[12px] border bg-white p-[18px] transition-colors hover:border-[var(--otto-ink-2)]",
          isDragging ? "shadow-lg" : "",
          className,
        )}
        style={{
          borderColor: "var(--otto-rule)",
          boxShadow: "var(--otto-shadow-1)",
          opacity: category.isActive ? 1 : 0.65,
          ...style,
        }}
        {...rest}
      >
        <div
          className="absolute bottom-0 left-0 top-0"
          style={{ width: "4px", background: visual.color }}
          aria-hidden
        />
        <div className="pl-2">
          <div className="mb-1 flex items-center gap-2">
            <span style={{ fontSize: "18px" }} aria-hidden>
              {visual.emoji}
            </span>
            <h4
              className="font-display m-0 truncate text-[16px] font-bold"
              style={{
                letterSpacing: "-.3px",
                color: "var(--otto-ink)",
              }}
            >
              {category.displayName}
            </h4>
            {category.isDefault ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                style={{
                  background: "var(--otto-rule-2)",
                  color: "var(--otto-ink-2)",
                }}
              >
                <Shield className="h-3 w-3" /> Default
              </span>
            ) : null}
          </div>

          <div
            className="mb-3 min-h-[34px] text-[12px] leading-[1.45]"
            style={{ color: "var(--otto-muted)" }}
          >
            {category.description ?? (
              <span style={{ fontStyle: "italic", opacity: 0.7 }}>
                Sin descripción.
              </span>
            )}
          </div>

          <KeywordTags keywords={keywords} />

          <div
            className="mt-3 flex items-center justify-between border-t pt-3"
            style={{
              borderColor: "var(--otto-rule)",
              fontFamily:
                "var(--font-jetbrains-mono), ui-monospace, monospace",
              fontSize: "10px",
              letterSpacing: ".06em",
              color: "var(--otto-muted)",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            <div>
              7d
              <b
                className="font-display ml-2 text-[15px]"
                style={{
                  fontWeight: 700,
                  color: "var(--otto-ink)",
                  letterSpacing: "-.4px",
                  textTransform: "none",
                }}
              >
                {count7d ?? 0}
              </b>
            </div>
            <div>
              orden
              <b
                className="font-display ml-2 text-[13px]"
                style={{
                  fontWeight: 700,
                  color: "var(--otto-ink)",
                  textTransform: "none",
                }}
              >
                #{category.displayOrder}
              </b>
            </div>
            <div
              style={{
                color: category.isActive
                  ? "var(--otto-ok)"
                  : "var(--otto-muted)",
              }}
            >
              {category.isActive ? "activa" : "pausada"}
            </div>
          </div>
        </div>

        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Editar"
              className="rounded-md p-1.5 hover:bg-[var(--otto-rule-2)]"
            >
              <Edit
                className="h-3.5 w-3.5"
                style={{ color: "var(--otto-muted)" }}
              />
            </button>
          ) : null}
          {onDelete && !category.isDefault ? (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Eliminar"
              className="rounded-md p-1.5 hover:bg-[var(--otto-rule-2)]"
            >
              <Trash2
                className="h-3.5 w-3.5"
                style={{ color: "var(--otto-err)" }}
              />
            </button>
          ) : null}
        </div>

        {dragHandleProps ? (
          <button
            type="button"
            className="absolute bottom-2 right-2 cursor-grab rounded-md p-1.5 opacity-30 transition-opacity hover:opacity-100 active:cursor-grabbing"
            aria-label="Reordenar"
            {...dragHandleProps}
          >
            <GripVertical
              className="h-4 w-4"
              style={{ color: "var(--otto-muted)" }}
            />
          </button>
        ) : null}
      </div>
    );
  },
);

CategoryCard.displayName = "CategoryCard";
