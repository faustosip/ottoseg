"use client";

import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  bulletinId: string;
}

/**
 * Botón para compartir el link público del boletín
 */
export function ShareButton({ bulletinId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/bulletin/${bulletinId}`;

    try {
      // Intentar compartir usando la API nativa de compartir si está disponible
      if (navigator.share && window.innerWidth <= 768) {
        await navigator.share({
          title: 'Boletín Informativo',
          text: 'Lee el boletín informativo de hoy',
          url: publicUrl,
        });
      } else {
        // Copiar al portapapeles
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);

        // Resetear el estado después de 2 segundos
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback: copiar al portapapeles
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleShare}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          Link Copiado
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Compartir Link Público
        </>
      )}
    </Button>
  );
}