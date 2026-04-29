"use client";

import { UserAvatar } from "./user-avatar";
import { RolePill, deriveRole } from "./role-pill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  KeyRound,
  Settings2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isActive: boolean;
  allowedMenus: string[] | null;
  createdAt: string;
};

type UsersTableProps = {
  users: UserRow[];
  currentUserId?: string;
  onTogglePassword: (u: UserRow) => void;
  onTogglePermissions: (u: UserRow) => void;
  onToggleActive: (u: UserRow) => void;
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(d))
    .replace(/\./g, "");
}

export function UsersTable({
  users,
  currentUserId,
  onTogglePassword,
  onTogglePermissions,
  onToggleActive,
}: UsersTableProps) {
  return (
    <div
      className="overflow-hidden rounded-[14px] border bg-white"
      style={{
        borderColor: "var(--otto-rule)",
        boxShadow: "var(--otto-shadow-1)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--otto-rule)" }}
      >
        <h3
          className="font-display m-0 text-[16px] font-bold"
          style={{ letterSpacing: "-.3px", color: "var(--otto-ink)" }}
        >
          Equipo · {users.length} {users.length === 1 ? "usuario" : "usuarios"}
        </h3>
      </div>
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
            <th className="px-5 py-3">Usuario</th>
            <th className="px-3 py-3">Rol</th>
            <th className="px-3 py-3">Estado</th>
            <th className="px-3 py-3">Agregado</th>
            <th className="w-[40px] px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const role = deriveRole(u.allowedMenus);
            const isMe = currentUserId === u.id;
            const statusBg = u.isActive
              ? "var(--otto-ok-soft)"
              : "var(--otto-rule-2)";
            const statusColor = u.isActive
              ? "var(--otto-ok)"
              : "var(--otto-muted)";
            return (
              <tr
                key={u.id}
                style={{ borderBottom: "1px solid var(--otto-rule)" }}
                className="hover:bg-[var(--otto-bg)]"
              >
                <td className="px-5 py-3.5 align-middle">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.name} email={u.email} size={36} />
                    <div className="min-w-0">
                      <b
                        className="block text-[13px]"
                        style={{
                          color: "var(--otto-ink)",
                          fontWeight: 600,
                          marginBottom: "2px",
                        }}
                      >
                        {u.name || u.email.split("@")[0]}
                      </b>
                      <span
                        className="text-[12px]"
                        style={{ color: "var(--otto-muted)" }}
                      >
                        {u.email}
                        {isMe ? " · tú" : null}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 align-middle">
                  <RolePill role={role} />
                </td>
                <td className="px-3 py-3.5 align-middle">
                  <span
                    className="font-mono-otto inline-block rounded-full px-2.5 py-1"
                    style={{
                      fontSize: "9px",
                      letterSpacing: ".1em",
                      background: statusBg,
                      color: statusColor,
                    }}
                  >
                    {u.isActive ? "activo" : "inactivo"}
                  </span>
                </td>
                <td
                  className="font-mono-otto px-3 py-3.5 align-middle"
                  style={{
                    fontSize: "11px",
                    color: "var(--otto-muted)",
                    letterSpacing: ".04em",
                    textTransform: "none",
                  }}
                >
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-3 py-3.5 align-middle">
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
                      <DropdownMenuItem onClick={() => onTogglePermissions(u)}>
                        <Settings2 className="mr-2 h-4 w-4" /> Permisos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTogglePassword(u)}>
                        <KeyRound className="mr-2 h-4 w-4" /> Cambiar contraseña
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onToggleActive(u)}>
                        {u.isActive ? (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" /> Desactivar
                          </>
                        ) : (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4" /> Activar
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {users.length === 0 ? (
        <div
          className="px-6 py-12 text-center text-sm"
          style={{ color: "var(--otto-muted)" }}
        >
          No hay usuarios registrados.
        </div>
      ) : null}
    </div>
  );
}
