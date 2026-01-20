"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Subscriber } from "@/lib/schema";

interface SubscriberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriber?: Subscriber | null;
  onSuccess: (subscriber: Subscriber) => void;
}

export function SubscriberFormDialog({
  open,
  onOpenChange,
  subscriber,
  onSuccess,
}: SubscriberFormDialogProps) {
  const isEditing = !!subscriber;

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({});

  // Reset form when dialog opens/closes or subscriber changes
  useEffect(() => {
    if (open) {
      if (subscriber) {
        setFormData({
          email: subscriber.email,
          name: subscriber.name || "",
          isActive: subscriber.isActive,
        });
      } else {
        setFormData({
          email: "",
          name: "",
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [open, subscriber]);

  const validateForm = () => {
    const newErrors: { email?: string; name?: string } = {};

    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const url = isEditing
        ? `/api/subscribers/${subscriber.id}`
        : "/api/subscribers";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name || null,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === "El email ya está registrado") {
          setErrors({ email: "Este email ya está registrado" });
          return;
        }
        throw new Error(error.error || "Error al guardar");
      }

      const result = await response.json();
      toast.success(
        isEditing ? "Suscriptor actualizado" : "Suscriptor creado"
      );
      onSuccess(result.subscriber);
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error((error as Error).message || "Error al guardar suscriptor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Suscriptor" : "Nuevo Suscriptor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza la información del suscriptor."
              : "Agrega un nuevo suscriptor para recibir los boletines por email."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre (opcional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Active status */}
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Estado activo</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
