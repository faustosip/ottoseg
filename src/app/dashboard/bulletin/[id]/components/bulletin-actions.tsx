"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Send,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

interface BulletinActionsProps {
  bulletinId: string;
  status: string;
  hasClassifiedNews: boolean;
}

/**
 * Client component for bulletin actions (Authorize, Publish with Email option)
 */
export function BulletinActions({
  bulletinId,
  status,
  hasClassifiedNews,
}: BulletinActionsProps) {
  const router = useRouter();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

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

  // Only show actions if there's classified news
  if (!hasClassifiedNews) {
    return null;
  }

  return (
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
        <div className="flex items-center gap-4">
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
            disabled={isPublishing}
            className="gap-2"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publicar
          </Button>
        </div>
      )}
    </div>
  );
}
