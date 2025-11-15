/**
 * API Endpoint: GET /api/bulletins/:id/progress
 *
 * Obtiene el progreso en tiempo real de un bulletin
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getBulletinById, getBulletinLogs } from '@/lib/db/queries/bulletins';

interface SourceProgress {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  articles: number;
  enriched?: number;
  total?: number;
}

interface BulletinLog {
  step: string;
  status: string;
  metadata?: unknown;
  details?: {
    totalArticles?: number;
    sourcesSuccess?: number;
    sourcesFailed?: number;
    duration?: number;
    enrichedArticles?: number;
    failedArticles?: number;
  };
}

interface BulletinData {
  status: string;
  rawNews?: unknown;
  fullArticles?: unknown;
}

interface StatsData {
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
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const bulletinId = params.id;

    // Obtener bulletin
    const bulletin = await getBulletinById(bulletinId);

    if (!bulletin) {
      return NextResponse.json(
        { error: 'Boletín no encontrado' },
        { status: 404 }
      );
    }

    // Obtener logs
    const logs = await getBulletinLogs(bulletinId);

    // Calcular progreso
    const currentPhase = determineCurrentPhase(bulletin.status, logs);
    const progress = calculateProgress(logs, bulletin);
    const stats = extractStats(logs, bulletin);
    const sources = extractSourcesProgress(logs, bulletin);

    return NextResponse.json({
      logs,
      currentPhase,
      progress,
      stats,
      sources,
      isComplete:
        bulletin.status === 'ready' ||
        bulletin.status === 'published' ||
        bulletin.status === 'failed',
      error: bulletin.status === 'failed' ? 'Scraping falló' : undefined,
    });
  } catch (error) {
    console.error('Error getting bulletin progress:', error);
    return NextResponse.json(
      {
        error: 'Error obteniendo progreso',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * Determina la fase actual basado en el status y los logs
 */
function determineCurrentPhase(
  status: string,
  logs: BulletinLog[]
): 'scraping' | 'enrichment' | 'classifying' | 'summarizing' | 'completed' | 'failed' {
  if (status === 'failed') return 'failed';
  if (status === 'ready' || status === 'published') return 'completed';
  if (status === 'summarizing') return 'summarizing';
  if (status === 'classifying') return 'classifying';

  // Check last log
  const lastLog = logs[logs.length - 1];
  if (!lastLog) return 'scraping';

  if (lastLog.step === 'enrichment') return 'enrichment';
  if (lastLog.step === 'scraping') return 'scraping';

  return 'scraping';
}

/**
 * Calcula el progreso total (0-100)
 */
function calculateProgress(logs: BulletinLog[], bulletin: BulletinData): number {
  const status = bulletin.status;

  // Pesos de cada fase
  const weights = {
    scraping: 25, // 25%
    enrichment: 35, // 35%
    classifying: 20, // 20%
    summarizing: 20, // 20%
  };

  let progress = 0;

  // Scraping completado
  const scrapingLog = logs.find(
    (log) => log.step === 'scraping' && log.status === 'completed'
  );
  if (scrapingLog) {
    progress += weights.scraping;
  } else if (status === 'scraping') {
    progress += weights.scraping * 0.5;
  }

  // Enrichment completado
  const enrichmentLog = logs.find(
    (log) => log.step === 'enrichment'
  );
  if (enrichmentLog && enrichmentLog.status === 'completed') {
    progress += weights.enrichment;
  } else if (enrichmentLog && enrichmentLog.status === 'in_progress') {
    const enrichedCount = (enrichmentLog.metadata as { enrichedArticles?: number })?.enrichedArticles || 0;
    const totalCount = (enrichmentLog.metadata as { totalArticles?: number })?.totalArticles || 1;
    const enrichmentProgress = enrichedCount / totalCount;
    progress += weights.enrichment * enrichmentProgress;
  }

  // Classifying
  if (status === 'classifying') {
    progress += weights.scraping + weights.enrichment;
    progress += weights.classifying * 0.5;
  } else if (status === 'summarizing' || status === 'ready' || status === 'published') {
    progress += weights.scraping + weights.enrichment + weights.classifying;
  }

  // Summarizing
  if (status === 'summarizing') {
    progress += weights.summarizing * 0.5;
  } else if (status === 'ready' || status === 'published') {
    progress += weights.summarizing;
  }

  return Math.min(100, Math.round(progress));
}

/**
 * Extrae estadísticas de los logs
 */
function extractStats(logs: BulletinLog[], _bulletin: BulletinData): StatsData {
  const stats: StatsData = {};

  // FASE 1: Scraping
  const scrapingLog = logs.find(
    (log) => log.step === 'scraping' && log.status === 'completed'
  );
  if (scrapingLog && scrapingLog.details) {
    stats.phase1 = {
      totalArticles: scrapingLog.details.totalArticles || 0,
      sourcesSuccess: scrapingLog.details.sourcesSuccess || 0,
      sourcesFailed: scrapingLog.details.sourcesFailed || 0,
      duration: scrapingLog.details.duration || 0,
    };
  }

  // FASE 2: Enrichment
  const enrichmentLog = logs.find(
    (log) => log.step === 'enrichment' && log.status === 'completed'
  );
  if (enrichmentLog && enrichmentLog.details) {
    stats.phase2 = {
      totalArticles: enrichmentLog.details.totalArticles || 0,
      enrichedArticles: enrichmentLog.details.enrichedArticles || 0,
      failedArticles: enrichmentLog.details.failedArticles || 0,
      duration: enrichmentLog.details.duration || 0,
    };
  }

  return stats;
}

/**
 * Extrae el progreso de cada fuente
 */
function extractSourcesProgress(logs: BulletinLog[], bulletin: BulletinData): Record<string, SourceProgress> {
  const sources: Record<string, SourceProgress> = {};

  const sourceNames = ['primicias', 'laHora', 'elComercio', 'teleamazonas', 'ecu911'];

  for (const sourceName of sourceNames) {
    sources[sourceName] = {
      status: 'pending',
      articles: 0,
    };
  }

  if (bulletin.rawNews) {
    const rawNews = bulletin.rawNews as Record<string, unknown[]>;
    for (const sourceName of sourceNames) {
      const articles = rawNews[sourceName] || [];
      if (articles.length > 0) {
        sources[sourceName] = {
          ...sources[sourceName],
          status: 'completed',
          articles: articles.length,
        };
      }
    }
  }

  if (bulletin.fullArticles) {
    const fullArticles = bulletin.fullArticles as Record<string, Array<{ fullContent?: string }>>;
    for (const sourceName of sourceNames) {
      const articles = fullArticles[sourceName] || [];
      const enrichedCount = articles.filter((a) => a.fullContent).length;

      if (articles.length > 0) {
        sources[sourceName] = {
          ...sources[sourceName],
          total: articles.length,
          enriched: enrichedCount,
        };
      }
    }
  }

  return sources;
}
