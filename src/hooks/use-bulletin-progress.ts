/**
 * Hook para monitorear el progreso de un bulletin en tiempo real
 *
 * Hace polling cada 2 segundos para obtener los logs y calcular el progreso
 */

import { useEffect, useState, useCallback } from 'react';

export interface BulletinLog {
  id: string;
  step: string;
  status: 'in_progress' | 'completed' | 'failed';
  message: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface BulletinProgress {
  logs: BulletinLog[];
  currentPhase: 'scraping' | 'enrichment' | 'classifying' | 'summarizing' | 'completed' | 'failed';
  progress: number; // 0-100
  stats: {
    phase1?: {
      totalArticles: number;
      sourcesSuccess: number;
      sourcesFailed: number;
      duration: number;
    };
    phase2?: {
      totalArticles: number;
      enrichedArticles: number;
      failedArticles: number;
      duration: number;
    };
  };
  sources: {
    [key: string]: {
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      articles: number;
      enriched?: number;
      total?: number;
    };
  };
  isLoading: boolean;
  isComplete: boolean;
  error?: string;
}

interface UseBulletinProgressOptions {
  bulletinId: string;
  enabled?: boolean;
  pollInterval?: number; // milliseconds
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function useBulletinProgress({
  bulletinId,
  enabled = true,
  pollInterval = 2000, // 2 seconds
  onComplete,
  onError,
}: UseBulletinProgressOptions): BulletinProgress {
  const [progress, setProgress] = useState<BulletinProgress>({
    logs: [],
    currentPhase: 'scraping',
    progress: 0,
    stats: {},
    sources: {},
    isLoading: true,
    isComplete: false,
  });

  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/bulletins/${bulletinId}/progress`);

      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const data: BulletinProgress = await response.json();

      setProgress(() => ({
        ...data,
        isLoading: false,
        isComplete: data.currentPhase === 'completed' || data.currentPhase === 'failed',
      }));

      // Callbacks
      if (data.currentPhase === 'completed') {
        onComplete?.();
      } else if (data.currentPhase === 'failed' && data.error) {
        onError?.(data.error);
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setProgress(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      onError?.(errorMessage);
      return null;
    }
  }, [bulletinId, onComplete, onError]);

  useEffect(() => {
    if (!enabled || !bulletinId) {
      return;
    }

    // Initial fetch
    fetchProgress();

    // Setup polling
    const interval = setInterval(() => {
      fetchProgress().then(data => {
        // Stop polling if complete or failed
        if (data?.currentPhase === 'completed' || data?.currentPhase === 'failed') {
          clearInterval(interval);
        }
      });
    }, pollInterval);

    return () => {
      clearInterval(interval);
    };
  }, [bulletinId, enabled, pollInterval, fetchProgress]);

  return progress;
}

/**
 * Calcula el color del badge basado en el status
 */
export function getStatusColor(status: 'pending' | 'in_progress' | 'completed' | 'failed'): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

/**
 * Formatea la duración en formato legible
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Estima el tiempo restante basado en el progreso actual
 */
export function estimateTimeRemaining(
  progress: number,
  elapsedMs: number
): string {
  if (progress === 0 || progress === 100) {
    return '—';
  }

  const estimatedTotalMs = (elapsedMs / progress) * 100;
  const remainingMs = estimatedTotalMs - elapsedMs;

  return formatDuration(remainingMs);
}
