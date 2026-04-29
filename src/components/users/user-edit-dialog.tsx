"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, KeyRound, Save } from "lucide-react";
import { toast } from "sonner";
import { AVAILABLE_MENUS } from "@/lib/menu-items";
import type { UserRow } from "./users-table";

type UserEditDialogProps = {
  user: UserRow | null;
  open: boolean;
  initialTab?: "permissions" | "password";
  onOpenChange: (open: boolean) => void;
  onChanged: (u: UserRow) => void;
};

export function UserEditDialog({
  user,
  open,
  initialTab = "permissions",
  onOpenChange,
  onChanged,
}: UserEditDialogProps) {
  const [editMenus, setEditMenus] = useState<string[] | null>(null);
  const [pwd, setPwd] = useState("");
  const [tab, setTab] = useState<"permissions" | "password">(initialTab);
  const [savingPerms, setSavingPerms] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setEditMenus(user.allowedMenus ? [...user.allowedMenus] : null);
      setPwd("");
      setTab(initialTab);
    }
  }, [user, initialTab]);

  if (!user) return null;

  const handleToggleMenu = (slug: string) => {
    setEditMenus((prev) => {
      if (prev === null) {
        return AVAILABLE_MENUS.filter((m) => m.slug !== slug).map(
          (m) => m.slug,
        );
      }
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      const updated = [...prev, slug];
      if (updated.length === AVAILABLE_MENUS.length) return null;
      return updated;
    });
  };

  const handleSavePerms = async () => {
    setSavingPerms(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowedMenus: editMenus }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast.success("Permisos actualizados");
      onChanged({ ...user, allowedMenus: editMenus });
    } catch {
      toast.error("Error al guardar permisos");
    } finally {
      setSavingPerms(false);
    }
  };

  const handleSavePwd = async () => {
    if (pwd.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (!res.ok) throw new Error("Error al cambiar contraseña");
      toast.success("Contraseña actualizada");
      setPwd("");
    } catch {
      toast.error("Error al cambiar contraseña");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user.name || user.email}</DialogTitle>
        </DialogHeader>

        <div
          className="flex gap-1 rounded-[10px] border p-1"
          style={{ borderColor: "var(--otto-rule)" }}
        >
          {(["permissions", "password"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="flex-1 rounded-[7px] px-3 py-1.5 text-[12px] font-medium"
              style={{
                background: tab === t ? "var(--otto-ink)" : "transparent",
                color: tab === t ? "#fff" : "var(--otto-muted)",
              }}
            >
              {t === "permissions" ? "Permisos" : "Contraseña"}
            </button>
          ))}
        </div>

        {tab === "permissions" ? (
          <div className="space-y-4">
            <p className="text-xs" style={{ color: "var(--otto-muted)" }}>
              Si todos están marcados, el usuario tiene acceso total. Desmarca
              para restringir.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_MENUS.map((menu) => {
                const isChecked =
                  editMenus === null || editMenus.includes(menu.slug);
                return (
                  <label
                    key={menu.slug}
                    className="flex cursor-pointer items-center gap-2 text-sm"
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
            <div className="flex justify-end">
              <Button
                onClick={handleSavePerms}
                disabled={savingPerms}
                className="text-white"
                style={{ background: "var(--otto-primary)" }}
              >
                {savingPerms ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar permisos
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-pwd">Nueva contraseña</Label>
              <Input
                id="edit-pwd"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSavePwd}
                disabled={savingPwd || !pwd.trim()}
                className="text-white"
                style={{ background: "var(--otto-primary)" }}
              >
                {savingPwd ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                Cambiar contraseña
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
