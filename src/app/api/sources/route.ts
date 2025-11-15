/**
 * API Endpoints: /api/sources
 *
 * GET - Listar todas las fuentes
 * POST - Crear nueva fuente
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getAllSources, createSource } from '@/lib/db/queries/sources';

/**
 * GET /api/sources
 * Obtiene todas las fuentes (activas e inactivas)
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
    return NextResponse.json(
      {
        error: 'Error obteniendo fuentes',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sources
 * Crea una nueva fuente
 */
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
    return NextResponse.json(
      {
        error: 'Error creando fuente',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
