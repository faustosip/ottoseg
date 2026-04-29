import { cn } from "@/lib/utils";

export type UserRole = "admin" | "editor" | "viewer";

const STYLES: Record<UserRole, { bg: string; color: string; label: string }> = {
  admin: { bg: "var(--otto-ink)", color: "#fff", label: "Admin" },
  editor: {
    bg: "var(--otto-primary-soft)",
    color: "var(--otto-primary-ink)",
    label: "Editor",
  },
  viewer: {
    bg: "var(--otto-rule-2)",
    color: "var(--otto-ink-2)",
    label: "Viewer",
  },
};

type RolePillProps = {
  role: UserRole;
};

export function RolePill({ role }: RolePillProps) {
  const s = STYLES[role];
  return (
    <span
      className={cn("font-mono-otto inline-block")}
      style={{
        fontSize: "9px",
        letterSpacing: ".1em",
        textTransform: "uppercase",
        padding: "4px 8px",
        fontWeight: 600,
        borderRadius: "6px",
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}

export function deriveRole(allowedMenus: string[] | null): UserRole {
  if (allowedMenus === null) return "admin";
  if (allowedMenus.length === 0) return "viewer";
  // If has access to user management → admin; if not → editor
  if (allowedMenus.includes("usuarios")) return "admin";
  if (allowedMenus.includes("boletines") || allowedMenus.includes("dashboard"))
    return "editor";
  return "viewer";
}
