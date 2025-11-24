'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Video, Loader2, CheckCircle2, AlertCircle} from 'lucide-react';
import {toast} from 'sonner';

interface GenerateVideoButtonProps {
  bulletinId: string;
  currentVideoStatus?: string;
  onVideoGenerated?: () => void;
}

export function GenerateVideoButton({
  bulletinId,
  currentVideoStatus,
  onVideoGenerated,
}: GenerateVideoButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoStatus, setVideoStatus] = useState(currentVideoStatus || 'pending');

  const handleGenerateVideo = async () => {
    try {
      setIsGenerating(true);
      setVideoStatus('processing');

      toast.info('🎬 Generando video del boletín...', {
        description: 'Este proceso puede tomar varios minutos.',
      });

      const response = await fetch(`/api/bulletins/${bulletinId}/generate-video`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error generando video');
      }

      setVideoStatus('completed');
      toast.success('✅ Video generado exitosamente', {
        description: 'El video está listo para ser visualizado.',
      });

      if (onVideoGenerated) {
        onVideoGenerated();
      }
    } catch (error) {
      console.error('Error generando video:', error);
      setVideoStatus('failed');
      toast.error('❌ Error al generar video', {
        description:
          error instanceof Error ? error.message : 'Ocurrió un error desconocido',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getButtonContent = () => {
    switch (videoStatus) {
      case 'processing':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando video...
          </>
        );
      case 'completed':
        return (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Video generado
          </>
        );
      case 'failed':
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            Reintentar
          </>
        );
      default:
        return (
          <>
            <Video className="mr-2 h-4 w-4" />
            Generar Video
          </>
        );
    }
  };

  const isDisabled = isGenerating || videoStatus === 'processing';

  return (
    <Button
      onClick={handleGenerateVideo}
      disabled={isDisabled}
      variant={videoStatus === 'completed' ? 'outline' : 'default'}
      className="w-full sm:w-auto"
    >
      {getButtonContent()}
    </Button>
  );
}
