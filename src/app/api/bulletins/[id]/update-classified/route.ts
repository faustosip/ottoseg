/**
 * API Endpoint: PUT /api/bulletins/[id]/update-classified
 *
 * Actualiza las noticias clasificadas de un boletín
 * Guarda los cambios editados manualmente o mejorados con IA
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { bulletins } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createBulletinLog } from '@/lib/db/queries/bulletins';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/bulletins/[id]/update-classified
 *
 * Actualiza las noticias clasificadas con contenido editado/mejorado
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const { classifiedNews } = await request.json();

    if (!classifiedNews) {
      return NextResponse.json(
        { error: 'classifiedNews es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el boletín existe
    const [existingBulletin] = await db
      .select()
      .from(bulletins)
      .where(eq(bulletins.id, id))
      .limit(1);

    if (!existingBulletin) {
      return NextResponse.json(
        { error: 'Boletín no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar las noticias clasificadas
    const [updatedBulletin] = await db
      .update(bulletins)
      .set({
        classifiedNews: classifiedNews,
      })
      .where(eq(bulletins.id, id))
      .returning();

    // Crear log del cambio
    await createBulletinLog(
      id,
      'manual_edit',
      'completed',
      'Noticias editadas y actualizadas manualmente',
      {
        editedBy: session.user.email,
        timestamp: new Date().toISOString()
      }
    );

    console.log(`✅ Boletín ${id} actualizado exitosamente`);

    return NextResponse.json({
      success: true,
      bulletin: updatedBulletin
    });
  } catch (error) {
    console.error('Error actualizando boletín:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}