"use client";

/**
 * Componente de progreso detallado del pipeline de generación
 *
 * Muestra en tiempo real el progreso de:
 * - FASE 1: Firecrawl (descubrimiento)
 * - FASE 2: Crawl4AI (enriquecimiento)
 * - FASE 3: Clasificación
 * - FASE 4: Resumen
 */

import { useBulletinProgress, formatDuration, estimateTimeRemaining, getStatusColor } from '@/hooks/use-bulletin-progress';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface PipelineProgressProps {
  bulletinId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function PipelineProgress({ bulletinId, onComplete, onError }: PipelineProgressProps) {
  const progress = useBulletinProgress({
    bulletinId,
    onComplete,
    onError,
  });

  if (progress.isLoading && progress.logs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando progreso...</span>
      </div>
    );
  }

  const startTime = progress.logs[0]?.createdAt ? new Date(progress.logs[0].createdAt).getTime() : Date.now();
  const elapsedMs = Date.now() - startTime;

  return (
    <div className="space-y-6">
      {/* Header con progreso general */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pipeline de Generación</h3>
            <Badge variant="outline" className={getStatusColor(progress.currentPhase === 'completed' ? 'completed' : 'in_progress')}>
              {getPhaseLabel(progress.currentPhase)}
            </Badge>
          </div>

          {/* Barra de progreso principal */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso total</span>
              <span className="font-medium">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="h-3" />
          </div>

          {/* Tiempo */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Transcurrido: {formatDuration(elapsedMs)}</span>
            </div>
            {progress.progress > 0 && progress.progress < 100 && (
              <span>Estimado restante: {estimateTimeRemaining(progress.progress, elapsedMs)}</span>
            )}
          </div>
        </div>
      </Card>

      {/* FASE 1: Firecrawl */}
      {progress.stats.phase1 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">FASE 1: Firecrawl - Descubrimiento</h4>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Completada ({formatDuration(progress.stats.phase1.duration)})
              </Badge>
            </div>

            {/* Fuentes */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(progress.sources).map(([sourceName, sourceData]) => (
                <SourceCard
                  key={sourceName}
                  name={formatSourceName(sourceName)}
                  status={sourceData.status}
                  articles={sourceData.articles}
                />
              ))}
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <StatItem label="Total artículos" value={progress.stats.phase1.totalArticles} />
              <StatItem label="Fuentes exitosas" value={progress.stats.phase1.sourcesSuccess} variant="success" />
              <StatItem label="Fuentes fallidas" value={progress.stats.phase1.sourcesFailed} variant="error" />
            </div>
          </div>
        </Card>
      )}

      {/* FASE 2: Crawl4AI */}
      {(progress.currentPhase === 'enrichment' || progress.stats.phase2) && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {progress.stats.phase2 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                )}
                <h4 className="font-semibold">FASE 2: Crawl4AI - Enriquecimiento</h4>
              </div>
              {progress.stats.phase2 ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  Completada ({formatDuration(progress.stats.phase2.duration)})
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  En Proceso...
                </Badge>
              )}
            </div>

            {/* Progreso por fuente */}
            {Object.entries(progress.sources).filter(([_, data]) => data.total && data.total > 0).length > 0 && (
              <div className="space-y-3">
                {Object.entries(progress.sources)
                  .filter(([_, data]) => data.total && data.total > 0)
                  .map(([sourceName, sourceData]) => {
                    const enrichedPercent = sourceData.total
                      ? Math.round(((sourceData.enriched || 0) / sourceData.total) * 100)
                      : 0;

                    return (
                      <div key={sourceName} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{formatSourceName(sourceName)}</span>
                          <span className="text-muted-foreground">
                            {sourceData.enriched || 0}/{sourceData.total} ({enrichedPercent}%)
                          </span>
                        </div>
                        <Progress value={enrichedPercent} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Estadísticas */}
            {progress.stats.phase2 && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <StatItem label="Total procesados" value={progress.stats.phase2.totalArticles} />
                <StatItem label="Enriquecidos" value={progress.stats.phase2.enrichedArticles} variant="success" />
                <StatItem label="Fallidos" value={progress.stats.phase2.failedArticles} variant="error" />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* FASE 3: Clasificación */}
      {(progress.currentPhase === 'classifying' || progress.currentPhase === 'summarizing' || progress.currentPhase === 'completed') && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {progress.currentPhase === 'classifying' ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              <h4 className="font-semibold">FASE 3: Clasificación por Categorías</h4>
            </div>
            <Badge variant="outline" className={getStatusColor(progress.currentPhase === 'classifying' ? 'in_progress' : 'completed')}>
              {progress.currentPhase === 'classifying' ? 'En Proceso...' : 'Completada'}
            </Badge>
          </div>
        </Card>
      )}

      {/* FASE 4: Resumen */}
      {(progress.currentPhase === 'summarizing' || progress.currentPhase === 'completed') && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {progress.currentPhase === 'summarizing' ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              <h4 className="font-semibold">FASE 4: Generación de Resúmenes</h4>
            </div>
            <Badge variant="outline" className={getStatusColor(progress.currentPhase === 'summarizing' ? 'in_progress' : 'completed')}>
              {progress.currentPhase === 'summarizing' ? 'En Proceso...' : 'Completada'}
            </Badge>
          </div>
        </Card>
      )}

      {/* Error */}
      {progress.error && (
        <Card className="p-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-100">Error en el proceso</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{progress.error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Logs en tiempo real (opcional, colapsable) */}
      {progress.logs.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            Ver logs detallados ({progress.logs.length})
          </summary>
          <Card className="p-4 mt-2 max-h-64 overflow-y-auto">
            <div className="space-y-1 font-mono text-xs">
              {progress.logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-muted-foreground">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                  <span className={getLogStatusColor(log.status)}>{getLogIcon(log.status)}</span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </Card>
        </details>
      )}
    </div>
  );
}

// Componentes auxiliares

function SourceCard({
  name,
  status,
  articles,
}: {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  articles: number;
}) {
  return (
    <div className="p-3 rounded-lg border bg-card text-card-foreground">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium truncate">{name}</span>
        <StatusIcon status={status} />
      </div>
      <div className="text-2xl font-bold">{articles}</div>
      <div className="text-xs text-muted-foreground">artículos</div>
    </div>
  );
}

function StatItem({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'error';
}) {
  const colorClass = {
    default: 'text-foreground',
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
  }[variant];

  return (
    <div>
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusIcon({ status }: { status: 'pending' | 'in_progress' | 'completed' | 'failed' }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'in_progress':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
}

// Helpers

function formatSourceName(name: string): string {
  const names: Record<string, string> = {
    primicias: 'Primicias',
    laHora: 'La Hora',
    elComercio: 'El Comercio',
    teleamazonas: 'Teleamazonas',
    ecu911: 'ECU911',
  };
  return names[name] || name;
}

function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    scraping: 'Descubrimiento',
    enrichment: 'Enriquecimiento',
    classifying: 'Clasificación',
    summarizing: 'Resumen',
    completed: 'Completado',
    failed: 'Error',
  };
  return labels[phase] || phase;
}

function getLogStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-green-600';
    case 'in_progress':
      return 'text-blue-600';
    case 'failed':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

function getLogIcon(status: string): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'in_progress':
      return '🔄';
    case 'failed':
      return '❌';
    default:
      return '⏸️';
  }
}
