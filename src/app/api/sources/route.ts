/**
 * API Endpoints: /api/sources
 *
 * GET - Listar todas las fuentes
 * POST - Crear nueva fuente
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { getAllSources, createSource } from '@/lib/db/queries/sources';
import { errorResponse } from '@/lib/http/error-response';

/**
 * GET /api/sources
 * Obtiene todas las fuentes (activas e inactivas)
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Obtener fuentes
    const sources = await getAllSources();

    // Filtrar por activas si se solicita
    const filteredSources = activeOnly
      ? sources.filter((s) => s.isActive)
      : sources;

    return NextResponse.json({
      sources: filteredSources,
      total: filteredSources.length,
    });
  } catch (error) {
    console.error('Error getting sources:', error);
    return errorResponse('Error obteniendo fuentes', 500, error);
  }
}

/**
 * POST /api/sources
 * Crea una nueva fuente
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    // Obtener datos del body
    const body = await request.json();

    // Validar campos requeridos
    if (!body.name || !body.url || !body.baseUrl) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, url, baseUrl' },
        { status: 400 }
      );
    }

    // Crear fuente
    const newSource = await createSource({
      name: body.name,
      url: body.url,
      baseUrl: body.baseUrl,
      selector: body.selector || null,
      scrapeConfig: body.scrapeConfig || null,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json({
      source: newSource,
      message: 'Fuente creada exitosamente',
    });
  } catch (error) {
    console.error('Error creating source:', error);
    return errorResponse('Error creando fuente', 500, error);
  }
}
