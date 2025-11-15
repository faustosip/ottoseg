/**
 * API Endpoints: /api/sources/:id
 *
 * GET - Obtener una fuente específica
 * PUT - Actualizar una fuente
 * DELETE - Eliminar una fuente
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  getSourceById,
  updateSource,
  deleteSource,
} from '@/lib/db/queries/sources';

/**
 * GET /api/sources/:id
 * Obtiene una fuente específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: sourceId } = await params;

    // Obtener fuente
    const source = await getSourceById(sourceId);

    if (!source) {
      return NextResponse.json(
        { error: 'Fuente no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ source });
  } catch (error) {
    console.error('Error getting source:', error);
    return NextResponse.json(
      {
        error: 'Error obteniendo fuente',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sources/:id
 * Actualiza una fuente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: sourceId } = await params;

    // Verificar que la fuente existe
    const existingSource = await getSourceById(sourceId);
    if (!existingSource) {
      return NextResponse.json(
        { error: 'Fuente no encontrada' },
        { status: 404 }
      );
    }

    // Obtener datos del body
    const body = await request.json();

    // Actualizar fuente
    const updatedSource = await updateSource(sourceId, {
      name: body.name,
      url: body.url,
      baseUrl: body.baseUrl,
      selector: body.selector,
      scrapeConfig: body.scrapeConfig,
      isActive: body.isActive,
    });

    return NextResponse.json({
      source: updatedSource,
      message: 'Fuente actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error updating source:', error);
    return NextResponse.json(
      {
        error: 'Error actualizando fuente',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sources/:id
 * Elimina una fuente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: sourceId } = await params;

    // Verificar que la fuente existe
    const existingSource = await getSourceById(sourceId);
    if (!existingSource) {
      return NextResponse.json(
        { error: 'Fuente no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar fuente
    await deleteSource(sourceId);

    return NextResponse.json({
      message: 'Fuente eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json(
      {
        error: 'Error eliminando fuente',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
