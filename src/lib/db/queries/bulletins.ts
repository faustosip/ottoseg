import { db } from "@/lib/db";
import {
  bulletins,
  bulletinLogs,
  type Bulletin,
  type NewBulletin,
  type NewBulletinLog,
} from "@/lib/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

// ============================================================================
// BULLETIN QUERIES
// ============================================================================

/**
 * Crea un nuevo boletín con status 'draft'
 *
 * @param data - Datos parciales del boletín (opcional)
 * @returns El boletín creado
 *
 * @example
 * ```ts
 * const bulletin = await createBulletin({ date: new Date() });
 * ```
 */
export async function createBulletin(
  data: Partial<NewBulletin> = {}
): Promise<Bulletin> {
  try {
    const [bulletin] = await db
      .insert(bulletins)
      .values({
        status: "draft",
        ...data,
      })
      .returning();

    return bulletin;
  } catch (error) {
    console.error("Error creating bulletin:", error);
    throw new Error("Failed to create bulletin");
  }
}

/**
 * Obtiene un boletín por ID
 *
 * @param id - UUID del boletín
 * @returns El boletín o null si no existe
 */
export async function getBulletinById(
  id: string
): Promise<Bulletin | null> {
  try {
    const [bulletin] = await db
      .select()
      .from(bulletins)
      .where(eq(bulletins.id, id))
      .limit(1);

    return bulletin || null;
  } catch (error) {
    console.error("Error fetching bulletin by ID:", error);
    throw new Error("Failed to fetch bulletin");
  }
}

/**
 * Opciones para getAllBulletins
 */
export interface GetAllBulletinsOptions {
  limit?: number;
  offset?: number;
  status?: string;
  orderBy?: "date" | "createdAt";
  order?: "asc" | "desc";
}

/**
 * Obtiene lista de boletines con filtros y paginación
 *
 * @param options - Opciones de filtrado y paginación
 * @returns Array de boletines
 *
 * @example
 * ```ts
 * const bulletins = await getAllBulletins({
 *   limit: 10,
 *   offset: 0,
 *   status: 'published',
 *   orderBy: 'date',
 *   order: 'desc'
 * });
 * ```
 */
export async function getAllBulletins(
  options: GetAllBulletinsOptions = {}
): Promise<Bulletin[]> {
  try {
    const {
      limit = 50,
      offset = 0,
      status,
      orderBy = "createdAt",
      order = "desc",
    } = options;

    let query = db.select().from(bulletins);

    // Filtro por status si se proporciona
    if (status) {
      query = query.where(eq(bulletins.status, status)) as any;
    }

    // Ordenamiento
    const orderColumn = orderBy === "date" ? bulletins.date : bulletins.createdAt;
    query = query.orderBy(order === "asc" ? orderColumn : desc(orderColumn)) as any;

    // Paginación
    query = query.limit(limit).offset(offset) as any;

    return await query;
  } catch (error) {
    console.error("Error fetching all bulletins:", error);
    throw new Error("Failed to fetch bulletins");
  }
}

/**
 * Actualiza el status de un boletín
 *
 * @param id - UUID del boletín
 * @param status - Nuevo status
 * @returns El boletín actualizado
 */
export async function updateBulletinStatus(
  id: string,
  status: string
): Promise<Bulletin> {
  try {
    const [bulletin] = await db
      .update(bulletins)
      .set({ status })
      .where(eq(bulletins.id, id))
      .returning();

    if (!bulletin) {
      throw new Error("Bulletin not found");
    }

    return bulletin;
  } catch (error) {
    console.error("Error updating bulletin status:", error);
    throw new Error("Failed to update bulletin status");
  }
}

/**
 * Actualiza las noticias raw de un boletín
 *
 * @param id - UUID del boletín
 * @param rawNews - Noticias scrapeadas sin procesar
 * @param totalNews - Total de noticias
 * @returns El boletín actualizado
 */
export async function updateBulletinRawNews(
  id: string,
  rawNews: Record<string, unknown>,
  totalNews: number
): Promise<Bulletin> {
  try {
    const [bulletin] = await db
      .update(bulletins)
      .set({ rawNews, totalNews })
      .where(eq(bulletins.id, id))
      .returning();

    if (!bulletin) {
      throw new Error("Bulletin not found");
    }

    return bulletin;
  } catch (error) {
    console.error("Error updating bulletin raw news:", error);
    throw new Error("Failed to update bulletin raw news");
  }
}

/**
 * Actualiza los artículos completos (full content) de un boletín
 *
 * @param id - UUID del boletín
 * @param fullArticles - Artículos completos con contenido enriquecido
 * @param crawl4aiStats - Estadísticas del proceso de Crawl4AI
 * @returns El boletín actualizado
 */
export async function updateBulletinFullArticles(
  id: string,
  fullArticles: Record<string, unknown>,
  crawl4aiStats?: Record<string, unknown>
): Promise<Bulletin> {
  try {
    const updateData: Partial<Bulletin> = { fullArticles };
    if (crawl4aiStats) {
      updateData.crawl4aiStats = crawl4aiStats;
    }

    const [bulletin] = await db
      .update(bulletins)
      .set(updateData)
      .where(eq(bulletins.id, id))
      .returning();

    if (!bulletin) {
      throw new Error("Bulletin not found");
    }

    return bulletin;
  } catch (error) {
    console.error("Error updating bulletin full articles:", error);
    throw new Error("Failed to update bulletin full articles");
  }
}

/**
 * Actualiza la clasificación de noticias de un boletín
 *
 * @param id - UUID del boletín
 * @param classifiedNews - Noticias clasificadas por categoría
 * @returns El boletín actualizado
 */
export async function updateBulletinClassification(
  id: string,
  classifiedNews: any
): Promise<Bulletin> {
  try {
    const [bulletin] = await db
      .update(bulletins)
      .set({ classifiedNews })
      .where(eq(bulletins.id, id))
      .returning();

    if (!bulletin) {
      throw new Error("Bulletin not found");
    }

    return bulletin;
  } catch (error) {
    console.error("Error updating bulletin classification:", error);
    throw new Error("Failed to update bulletin classification");
  }
}

/**
 * Datos de resúmenes para actualizar
 */
export interface BulletinSummaries {
  economia?: string;
  politica?: string;
  sociedad?: string;
  seguridad?: string;
  internacional?: string;
  vial?: string;
}

/**
 * Actualiza los resúmenes de las 6 categorías
 *
 * @param id - UUID del boletín
 * @param summaries - Resúmenes por categoría
 * @returns El boletín actualizado
 */
export async function updateBulletinSummaries(
  id: string,
  summaries: BulletinSummaries
): Promise<Bulletin> {
  try {
    const [bulletin] = await db
      .update(bulletins)
      .set(summaries)
      .where(eq(bulletins.id, id))
      .returning();

    if (!bulletin) {
      throw new Error("Bulletin not found");
    }

    return bulletin;
  } catch (error) {
    console.error("Error updating bulletin summaries:", error);
    throw new Error("Failed to update bulletin summaries");
  }
}

/**
 * Datos de video para actualizar
 */
export interface VideoData {
  videoUrl?: string;
  videoStatus: string;
  videoMetadata?: any;
}

/**
 * Actualiza la información de video de un boletín
 *
 * @param id - UUID del boletín
 * @param videoData - Datos del video
 * @returns El boletín actualizado
 */
export async function updateBulletinVideo(
  id: string,
  videoData: VideoData
): Promise<Bulletin> {
  try {
    const [bulletin] = await db
      .update(bulletins)
      .set(videoData)
      .where(eq(bulletins.id, id))
      .returning();

    if (!bulletin) {
      throw new Error("Bulletin not found");
    }

    return bulletin;
  } catch (error) {
    console.error("Error updating bulletin video:", error);
    throw new Error("Failed to update bulletin video");
  }
}

/**
 * Obtiene boletines en un rango de fechas
 *
 * @param startDate - Fecha inicial
 * @param endDate - Fecha final
 * @returns Array de boletines
 */
export async function getBulletinsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<Bulletin[]> {
  try {
    return await db
      .select()
      .from(bulletins)
      .where(
        and(
          gte(bulletins.date, startDate),
          lte(bulletins.date, endDate)
        )
      )
      .orderBy(desc(bulletins.date));
  } catch (error) {
    console.error("Error fetching bulletins by date range:", error);
    throw new Error("Failed to fetch bulletins by date range");
  }
}

/**
 * Obtiene el boletín de hoy si existe
 *
 * @returns El boletín de hoy o null
 */
export async function getTodayBulletin(): Promise<Bulletin | null> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [bulletin] = await db
      .select()
      .from(bulletins)
      .where(
        and(
          gte(bulletins.date, today),
          lte(bulletins.date, tomorrow)
        )
      )
      .limit(1);

    return bulletin || null;
  } catch (error) {
    console.error("Error fetching today's bulletin:", error);
    throw new Error("Failed to fetch today's bulletin");
  }
}

/**
 * Obtiene el boletín más reciente
 *
 * @returns El boletín más reciente o null
 */
export async function getLatestBulletin(): Promise<Bulletin | null> {
  try {
    const [bulletin] = await db
      .select()
      .from(bulletins)
      .orderBy(desc(bulletins.createdAt))
      .limit(1);

    return bulletin || null;
  } catch (error) {
    console.error("Error fetching latest bulletin:", error);
    throw new Error("Failed to fetch latest bulletin");
  }
}

// ============================================================================
// BULLETIN LOGS
// ============================================================================

/**
 * Crea un log de evento del boletín
 *
 * @param bulletinId - UUID del boletín
 * @param step - Paso del proceso
 * @param status - Estado del paso
 * @param message - Mensaje opcional
 * @param metadata - Metadata adicional
 * @returns El log creado
 */
export async function createBulletinLog(
  bulletinId: string,
  step: string,
  status: string,
  message?: string,
  metadata?: any
): Promise<any> {
  try {
    // Calcular duración si hay startTime en metadata
    let duration: number | undefined;
    if (metadata?.startTime && status === "completed") {
      duration = Date.now() - metadata.startTime;
    }

    const [log] = await db
      .insert(bulletinLogs)
      .values({
        bulletinId,
        step,
        status,
        message,
        metadata,
        duration,
      })
      .returning();

    return log;
  } catch (error) {
    console.error("Error creating bulletin log:", error);
    throw new Error("Failed to create bulletin log");
  }
}

/**
 * Obtiene todos los logs de un boletín ordenados por fecha
 *
 * @param bulletinId - UUID del boletín
 * @returns Array de logs
 */
export async function getBulletinLogs(bulletinId: string): Promise<any[]> {
  try {
    return await db
      .select()
      .from(bulletinLogs)
      .where(eq(bulletinLogs.bulletinId, bulletinId))
      .orderBy(bulletinLogs.createdAt);
  } catch (error) {
    console.error("Error fetching bulletin logs:", error);
    throw new Error("Failed to fetch bulletin logs");
  }
}
