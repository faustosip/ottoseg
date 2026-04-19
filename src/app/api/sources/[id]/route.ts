/**
 * API Endpoints: /api/sources/:id
 *
 * GET - Obtener una fuente específica
 * PUT - Actualizar una fuente
 * DELETE - Eliminar una fuente
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import {
  getSourceById,
  updateSource,
  deleteSource,
} from '@/lib/db/queries/sources';
import { errorResponse } from '@/lib/http/error-response';

/**
 * GET /api/sources/:id
 * Obtiene una fuente específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

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
    return errorResponse('Error obteniendo fuente', 500, error);
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
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

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
    return errorResponse('Error actualizando fuente', 500, error);
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
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

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
    return errorResponse('Error eliminando fuente', 500, error);
  }
}
