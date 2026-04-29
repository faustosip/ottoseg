"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Topline } from "@/components/dashboard/topline";
import { PageHeader } from "@/components/dashboard/page-header";
import { FooterNote } from "@/components/dashboard/footer-note";
import { PermissionsGrid } from "@/components/users/permissions-grid";
import { UsersTable, type UserRow } from "@/components/users/users-table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UserEditDialog } from "@/components/users/user-edit-dialog";
import { deriveRole, type UserRole } from "@/components/users/role-pill";
import { useSession } from "@/lib/auth-client";

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editTab, setEditTab] = useState<"permissions" | "password">(
    "permissions",
  );

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Error cargando usuarios");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error("Error cargando usuarios");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleActive = async (u: UserRow) => {
    try {
      const newValue = !u.isActive;
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newValue }),
      });
      if (!res.ok) throw new Error("Error");
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isActive: newValue } : x)),
      );
      toast.success(newValue ? "Usuario activado" : "Usuario desactivado");
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const handleEditChanged = (updated: UserRow) => {
    setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    setEditing(updated);
  };

  const counts = useMemo<Record<UserRole, number>>(() => {
    const c = { admin: 0, editor: 0, viewer: 0 } as Record<UserRole, number>;
    for (const u of users) {
      c[deriveRole(u.allowedMenus)]++;
    }
    return c;
  }, [users]);

  return (
    <>
      <Topline crumbs={["Configuración", "Usuarios"]} />
      <PageHeader
        title="Usuarios y"
        highlight="permisos"
        lede="Equipo con acceso a la consola y los menús que cada miembro puede ver."
        actions={
          <Button
            onClick={() => setShowCreate(true)}
            className="rounded-[10px] text-white"
            style={{
              background: "var(--otto-primary)",
              boxShadow: "0 4px 14px rgba(214,40,40,.28)",
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Invitar usuario
          </Button>
        }
      />

      <PermissionsGrid counts={counts} />

      {isLoading ? (
        <div
          className="flex items-center justify-center rounded-[14px] border bg-white p-12"
          style={{ borderColor: "var(--otto-rule)" }}
        >
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: "var(--otto-primary)" }}
          />
        </div>
      ) : (
        <UsersTable
          users={users}
          currentUserId={session?.user?.id}
          onTogglePermissions={(u) => {
            setEditTab("permissions");
            setEditing(u);
          }}
          onTogglePassword={(u) => {
            setEditTab("password");
            setEditing(u);
          }}
          onToggleActive={handleToggleActive}
        />
      )}

      <UserFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={loadUsers}
      />

      <UserEditDialog
        user={editing}
        open={editing !== null}
        initialTab={editTab}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
        onChanged={handleEditChanged}
      />

      <FooterNote>OttoSeguridad · Console · Usuarios</FooterNote>
    </>
  );
}
