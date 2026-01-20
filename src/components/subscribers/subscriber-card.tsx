"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Mail, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Subscriber } from "@/lib/schema";

interface SubscriberCardProps {
  subscriber: Subscriber;
  onEdit: (subscriber: Subscriber) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, isActive: boolean) => void;
}

export function SubscriberCard({
  subscriber,
  onEdit,
  onDelete,
  onStatusChange,
}: SubscriberCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      const response = await fetch(`/api/subscribers/${subscriber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !subscriber.isActive }),
      });

      if (!response.ok) {
        throw new Error("Error al cambiar estado");
      }

      onStatusChange(subscriber.id, !subscriber.isActive);
      toast.success(
        subscriber.isActive ? "Suscriptor desactivado" : "Suscriptor activado"
      );
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cambiar estado");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/subscribers/${subscriber.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      onDelete(subscriber.id);
      toast.success("Suscriptor eliminado");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar suscriptor");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(subscriber.createdAt);

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-4">
          {/* Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar/Icon */}
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 truncate">
                  {subscriber.name || subscriber.email.split("@")[0]}
                </p>
                <Badge
                  variant={subscriber.isActive ? "default" : "secondary"}
                  className={
                    subscriber.isActive
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-gray-100 text-gray-500 border-gray-300"
                  }
                >
                  {subscriber.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 truncate">{subscriber.email}</p>
              <p className="text-xs text-gray-400">Desde {formattedDate}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <Switch
                checked={subscriber.isActive}
                onCheckedChange={handleToggleStatus}
                disabled={isToggling}
              />
              {isToggling && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>

            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(subscriber)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar suscriptor</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar a{" "}
              <strong>{subscriber.name || subscriber.email}</strong>? Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
