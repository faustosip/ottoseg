"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  CheckCircle2,
  Loader2,
  Mail,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface BulletinActionsProps {
  bulletinId: string;
  status: string;
  hasClassifiedNews: boolean;
  hasVideo: boolean;
}

/**
 * Client component for bulletin actions (Authorize, Publish with Email option)
 */
export function BulletinActions({
  bulletinId,
  status,
  hasClassifiedNews,
  hasVideo,
}: BulletinActionsProps) {
  const router = useRouter();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  /**
   * Authorize the bulletin (ready -> authorized)
   */
  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    try {
      const response = await fetch(`/api/bulletins/${bulletinId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "authorized" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al autorizar");
      }

      toast.success("Boletín autorizado exitosamente");
      router.refresh();
    } catch (error) {
      console.error("Error authorizing:", error);
      toast.error((error as Error).message || "Error al autorizar el boletín");
    } finally {
      setIsAuthorizing(false);
    }
  };

  /**
   * Publish the bulletin (authorized -> published)
   * Optionally send email to subscribers
   */
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // First, update status to published
      const response = await fetch(`/api/bulletins/${bulletinId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al publicar");
      }

      toast.success("Boletín publicado exitosamente");

      // If sendEmail is enabled, trigger email sending
      if (sendEmail) {
        try {
          const emailResponse = await fetch(
            `/api/bulletins/${bulletinId}/send-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (emailResponse.ok) {
            const result = await emailResponse.json();
            toast.success(
              `Emails enviados a ${result.sentCount} suscriptores`
            );
          } else {
            toast.error("Error al enviar emails a suscriptores");
          }
        } catch (emailError) {
          console.error("Email sending error:", emailError);
          toast.error("Error al enviar emails");
        }
      }

      router.refresh();
    } catch (error) {
      console.error("Error publishing:", error);
      toast.error((error as Error).message || "Error al publicar el boletín");
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * Reactivate the bulletin (published -> authorized)
   */
  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const response = await fetch(`/api/bulletins/${bulletinId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "authorized" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al reactivar");
      }

      toast.success("Boletín reactivado. Puedes editarlo y volver a publicar.");
      router.refresh();
    } catch (error) {
      console.error("Error reactivating:", error);
      toast.error((error as Error).message || "Error al reactivar el boletín");
    } finally {
      setIsReactivating(false);
    }
  };

  /**
   * Send test email to specified address
   */
  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Ingresa un correo electrónico");
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await fetch(
        `/api/bulletins/${bulletinId}/send-test-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: testEmail.trim() }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al enviar prueba");
      }

      const result = await response.json();
      toast.success(`Email de prueba enviado a ${result.sentTo}`);
      setShowTestDialog(false);
    } catch (error) {
      console.error("Error sending test:", error);
      toast.error((error as Error).message || "Error al enviar email de prueba");
    } finally {
      setIsSendingTest(false);
    }
  };

  // Only show actions if there's classified news
  if (!hasClassifiedNews) {
    return null;
  }

  return (
    <>
    <div className="flex items-center gap-3">
      {/* Authorize button - only when ready */}
      {status === "ready" && (
        <Button
          onClick={handleAuthorize}
          disabled={isAuthorizing}
          className="gap-2 bg-amber-600 hover:bg-amber-700"
        >
          {isAuthorizing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Autorizar
        </Button>
      )}

      {/* Publish button with email toggle - only when authorized */}
      {status === "authorized" && (
        <div className="flex items-center gap-4 flex-wrap">
          {/* Test email button */}
          <Button
            variant="outline"
            onClick={() => setShowTestDialog(true)}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Enviar Prueba
          </Button>

          {/* Email toggle */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
            <Switch
              id="send-email"
              checked={sendEmail}
              onCheckedChange={setSendEmail}
              disabled={isPublishing}
            />
            <Label
              htmlFor="send-email"
              className="flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <Mail className="h-4 w-4 text-gray-500" />
              Enviar por email
            </Label>
          </div>

          {/* Publish button */}
          <Button
            onClick={handlePublish}
            disabled={isPublishing || !hasVideo}
            className="gap-2"
            title={!hasVideo ? "Debes subir un video antes de publicar" : undefined}
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publicar
          </Button>

          {/* Video warning */}
          {!hasVideo && (
            <div className="flex items-center gap-1.5 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Sube un video en la pestaña Editar para publicar</span>
            </div>
          )}
        </div>
      )}

      {/* Reactivate button - only when published */}
      {status === "published" && (
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            onClick={handleReactivate}
            disabled={isReactivating}
            variant="outline"
            className="gap-2 border-amber-500 text-amber-700 hover:bg-amber-50"
          >
            {isReactivating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Reactivar Boletín
          </Button>

          {/* Test email button */}
          <Button
            variant="outline"
            onClick={() => setShowTestDialog(true)}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Enviar Prueba
          </Button>
        </div>
      )}
    </div>

    {/* Test email dialog */}
    <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Email de Prueba</DialogTitle>
          <DialogDescription>
            Ingresa el correo electrónico donde deseas recibir la prueba del boletín.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            type="email"
            placeholder="correo@ejemplo.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowTestDialog(false)} disabled={isSendingTest}>
            Cancelar
          </Button>
          <Button onClick={handleSendTest} disabled={isSendingTest || !testEmail.trim()} className="gap-2">
            {isSendingTest ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
