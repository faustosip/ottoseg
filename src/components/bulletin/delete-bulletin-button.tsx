"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DeleteBulletinButtonProps {
  bulletinId: string;
  bulletinDate: string;
  isPublished?: boolean;
}

/**
 * Botón de eliminar boletín con confirmación
 */
export function DeleteBulletinButton({
  bulletinId,
  bulletinDate,
  isPublished = false,
}: DeleteBulletinButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/bulletins/${bulletinId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error eliminando boletín");
      }

      // Mostrar mensaje de éxito
      toast.success("Boletín eliminado", {
        description: "El boletín ha sido eliminado exitosamente",
      });

      // Cerrar modal
      setIsOpen(false);

      // Redirigir a la lista de boletines
      router.push("/dashboard/bulletin");
      router.refresh();
    } catch (error) {
      console.error("Error deleting bulletin:", error);
      toast.error("Error al eliminar", {
        description: (error as Error).message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isPublished) {
    return (
      <Button variant="destructive" className="gap-2" disabled>
        <Trash2 className="h-4 w-4" />
        No se puede eliminar
      </Button>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2" disabled={isDeleting}>
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Eliminando...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Eliminar
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este boletín?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el
            boletín del <strong>{bulletinDate}</strong> y todos sus datos
            asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Eliminando...
              </>
            ) : (
              "Eliminar boletín"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
