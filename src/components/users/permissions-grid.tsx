import { RolePill, type UserRole } from "./role-pill";

type RoleDef = {
  key: UserRole;
  description: string;
  perms: { label: string; allowed: boolean }[];
};

const ROLE_DEFS: RoleDef[] = [
  {
    key: "admin",
    description: "Acceso completo. Gestiona usuarios, fuentes y configuración.",
    perms: [
      { label: "Generar y enviar boletines", allowed: true },
      { label: "Gestionar suscriptores", allowed: true },
      { label: "Configurar fuentes y categorías", allowed: true },
      { label: "Invitar y eliminar usuarios", allowed: true },
    ],
  },
  {
    key: "editor",
    description:
      "Genera boletines y administra la audiencia. Sin acceso a configuración.",
    perms: [
      { label: "Generar y enviar boletines", allowed: true },
      { label: "Gestionar suscriptores", allowed: true },
      { label: "Configurar fuentes y categorías", allowed: false },
      { label: "Invitar y eliminar usuarios", allowed: false },
    ],
  },
  {
    key: "viewer",
    description:
      "Solo lectura. Ve boletines, métricas y suscriptores sin modificar.",
    perms: [
      { label: "Generar y enviar boletines", allowed: false },
      { label: "Gestionar suscriptores", allowed: false },
      { label: "Configurar fuentes y categorías", allowed: false },
      { label: "Invitar y eliminar usuarios", allowed: false },
    ],
  },
];

type PermissionsGridProps = {
  counts: Record<UserRole, number>;
};

export function PermissionsGrid({ counts }: PermissionsGridProps) {
  return (
    <div className="mb-[22px] grid grid-cols-3 gap-3.5">
      {ROLE_DEFS.map((r) => (
        <div
          key={r.key}
          className="rounded-[12px] border bg-white p-[18px]"
          style={{
            borderColor: "var(--otto-rule)",
            boxShadow: "var(--otto-shadow-1)",
          }}
        >
          <div className="mb-2.5 flex items-center gap-2">
            <RolePill role={r.key} />
          </div>
          <div
            className="mb-3 text-[12px] leading-[1.5]"
            style={{ color: "var(--otto-muted)" }}
          >
            {r.description}
          </div>
          <div
            className="text-[12px] leading-[1.7]"
            style={{ color: "var(--otto-ink-2)" }}
          >
            {r.perms.map((p) => (
              <div key={p.label}>
                {p.allowed ? (
                  <span
                    style={{
                      color: "var(--otto-ok)",
                      fontWeight: 600,
                      marginRight: "4px",
                    }}
                  >
                    ✓
                  </span>
                ) : (
                  <span
                    style={{ color: "var(--otto-muted)", marginRight: "4px" }}
                  >
                    ×
                  </span>
                )}
                {p.label}
              </div>
            ))}
          </div>
          <div
            className="font-mono-otto mt-3 border-t pt-3"
            style={{
              borderColor: "var(--otto-rule)",
              fontSize: "10px",
              color: "var(--otto-muted)",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Asignados
            <b
              className="font-display ml-2 text-[16px]"
              style={{
                fontWeight: 700,
                color: "var(--otto-ink)",
                letterSpacing: "-.3px",
                textTransform: "none",
              }}
            >
              {counts[r.key] ?? 0}
            </b>
          </div>
        </div>
      ))}
    </div>
  );
}
