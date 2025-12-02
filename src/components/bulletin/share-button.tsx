"use client";

import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  bulletinId: string;
  bulletinDate: Date;
}

/**
 * Botón para compartir el link público del boletín
 */
export function ShareButton({ bulletinId, bulletinDate }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  // Formatear fecha para la URL (01-dic-2025)
  const formatDateForUrl = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleShare = async () => {
    // Generar URL con formato de fecha amigable
    const dateUrl = formatDateForUrl(bulletinDate);
    const publicUrl = `${window.location.origin}/bulletin/${dateUrl}`;

    // También incluir URL alternativa con ID como fallback
    const fallbackUrl = `${window.location.origin}/bulletin/${bulletinId}`;

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