"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  ArrowLeft,
  Loader2,
  UserPlus,
  Mail,
  Calendar,
  ChevronDown,
  ChevronUp,
  Save,
  KeyRound,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AVAILABLE_MENUS } from "@/lib/menu-items";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isActive: boolean;
  allowedMenus: string[] | null;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Expanded user panel
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editMenus, setEditMenus] = useState<string[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      toast.error("Todos los campos son requeridos");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear usuario");
      }

      toast.success("Usuario creado exitosamente");
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setShowAddForm(false);
      await loadUsers();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (userId: string, newValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newValue }),
      });

      if (!response.ok) throw new Error("Error al actualizar");

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: newValue } : u))
      );
      toast.success(newValue ? "Usuario activado" : "Usuario desactivado");
    } catch {
      toast.error("Error al cambiar estado del usuario");
    }
  };

  const handleExpandUser = (u: UserInfo) => {
    if (expandedUserId === u.id) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(u.id);
    setEditPassword("");
    setEditMenus(u.allowedMenus ? [...u.allowedMenus] : null);
  };

  const handleToggleMenu = (slug: string) => {
    setEditMenus((prev) => {
      // If null (all access), start with all menus checked minus the toggled one
      if (prev === null) {
        return AVAILABLE_MENUS.filter((m) => m.slug !== slug).map((m) => m.slug);
      }
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      const updated = [...prev, slug];
      // If all menus selected, set to null (all access)
      if (updated.length === AVAILABLE_MENUS.length) {
        return null;
      }
      return updated;
    });
  };

  const handleSaveMenus = async (userId: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowedMenus: editMenus }),
      });

      if (!response.ok) throw new Error("Error al guardar permisos");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, allowedMenus: editMenus } : u
        )
      );
      toast.success("Permisos actualizados");
    } catch {
      toast.error("Error al guardar permisos");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (userId: string) => {
    if (!editPassword.trim()) {
      toast.error("Ingresa una contraseña");
      return;
    }
    if (editPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: editPassword }),
      });

      if (!response.ok) throw new Error("Error al cambiar contraseña");

      setEditPassword("");
      toast.success("Contraseña actualizada");
    } catch {
      toast.error("Error al cambiar contraseña");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra los usuarios que pueden acceder al sistema
            </p>
          </div>

          <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Usuario
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Card className="p-4">
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm text-muted-foreground">Total usuarios</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{activeCount}</div>
            <div className="text-sm text-muted-foreground">Usuarios activos</div>
          </Card>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="p-6 mb-6 border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-green-700 dark:text-green-400" />
            <h3 className="text-lg font-semibold">Nuevo Usuario</h3>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="newName">Nombre</Label>
                <Input
                  id="newName"
                  placeholder="Juan Pérez"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newEmail">Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Usuario
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setNewEmail("");
                  setNewPassword("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando usuarios...</span>
        </div>
      )}

      {/* Users List */}
      {!isLoading && (
        <div className="space-y-3">
          {users.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No hay usuarios registrados</p>
            </Card>
          ) : (
            users.map((u) => (
              <Card
                key={u.id}
                className={`overflow-hidden transition-colors ${
                  !u.isActive ? "opacity-60" : ""
                }`}
              >
                {/* User row */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleExpandUser(u)}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                    {(u.name?.[0] || u.email[0]).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{u.name}</span>
                      {!u.isActive && (
                        <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {u.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(u.createdAt).toLocaleDateString("es-EC")}
                      </span>
                    </div>
                  </div>

                  {/* Active switch */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Label className="text-xs text-muted-foreground">
                      {u.isActive ? "Activo" : "Inactivo"}
                    </Label>
                    <Switch
                      checked={u.isActive}
                      onCheckedChange={(val) => handleToggleActive(u.id, val)}
                    />
                  </div>

                  {/* Expand icon */}
                  <div className="flex-shrink-0 text-muted-foreground">
                    {expandedUserId === u.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>

                {/* Expanded panel */}
                {expandedUserId === u.id && (
                  <div className="border-t px-4 py-5 bg-muted/30 space-y-6">
                    {/* Password change */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Cambiar Contraseña
                      </h4>
                      <div className="flex items-end gap-3">
                        <div className="flex-1 max-w-sm">
                          <Label htmlFor={`pwd-${u.id}`}>Nueva contraseña</Label>
                          <Input
                            id={`pwd-${u.id}`}
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleChangePassword(u.id)}
                          disabled={isSavingPassword || !editPassword.trim()}
                        >
                          {isSavingPassword && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Cambiar
                        </Button>
                      </div>
                    </div>

                    {/* Menu permissions */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">
                        Permisos de Menú
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Si todos están marcados, el usuario tiene acceso total.
                        Desmarca para restringir.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {AVAILABLE_MENUS.map((menu) => {
                          const isChecked =
                            editMenus === null || editMenus.includes(menu.slug);
                          return (
                            <label
                              key={menu.slug}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleToggleMenu(menu.slug)}
                              />
                              {menu.label}
                            </label>
                          );
                        })}
                      </div>
                      <div className="mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleSaveMenus(u.id)}
                          disabled={isSaving}
                        >
                          {isSaving && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Permisos
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
