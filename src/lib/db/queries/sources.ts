import { db } from "@/lib/db";
import {
  newsSources,
  type NewsSource,
  type NewNewsSource,
} from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

// ============================================================================
// NEWS SOURCES QUERIES
// ============================================================================

/**
 * Obtiene todas las fuentes de noticias activas
 *
 * @returns Array de fuentes activas
 *
 * @example
 * ```ts
 * const sources = await getActiveSources();
 * // [{ name: 'Primicias', url: '...', isActive: true }, ...]
 * ```
 */
export async function getActiveSources(): Promise<NewsSource[]> {
  try {
    return await db
      .select()
      .from(newsSources)
      .where(eq(newsSources.isActive, true));
  } catch (error) {
    console.error("Error fetching active sources:", error);
    throw new Error("Failed to fetch active sources");
  }
}

/**
 * Obtiene una fuente por su nombre
 *
 * @param name - Nombre de la fuente (ej: "primicias", "la_hora")
 * @returns La fuente o null si no existe
 */
export async function getSourceByName(
  name: string
): Promise<NewsSource | null> {
  try {
    const [source] = await db
      .select()
      .from(newsSources)
      .where(eq(newsSources.name, name))
      .limit(1);

    return source || null;
  } catch (error) {
    console.error("Error fetching source by name:", error);
    throw new Error("Failed to fetch source");
  }
}

/**
 * Obtiene una fuente por su ID
 *
 * @param id - UUID de la fuente
 * @returns La fuente o null si no existe
 */
export async function getSourceById(
  id: string
): Promise<NewsSource | null> {
  try {
    const [source] = await db
      .select()
      .from(newsSources)
      .where(eq(newsSources.id, id))
      .limit(1);

    return source || null;
  } catch (error) {
    console.error("Error fetching source by id:", error);
    throw new Error("Failed to fetch source");
  }
}

/**
 * Actualiza la última vez que se scrapeó una fuente
 *
 * @param id - UUID de la fuente
 * @param status - Estado del scraping ('success', 'failed', 'partial')
 * @returns La fuente actualizada
 */
export async function updateSourceLastScraped(
  id: string,
  status: "success" | "failed" | "partial"
): Promise<NewsSource> {
  try {
    const [source] = await db
      .update(newsSources)
      .set({
        lastScraped: new Date(),
        lastScrapedStatus: status,
        // Incrementar totalScraped solo si fue exitoso
        ...(status === "success" && {
          totalScraped: sql`${newsSources.totalScraped} + 1`,
        }),
      })
      .where(eq(newsSources.id, id))
      .returning();

    if (!source) {
      throw new Error("Source not found");
    }

    return source;
  } catch (error) {
    console.error("Error updating source last scraped:", error);
    throw new Error("Failed to update source");
  }
}

/**
 * Crea una nueva fuente de noticias
 *
 * @param data - Datos de la fuente
 * @returns La fuente creada
 *
 * @example
 * ```ts
 * const source = await createSource({
 *   name: 'Primicias',
 *   url: 'https://www.primicias.ec',
 *   baseUrl: 'https://www.primicias.ec',
 *   scrapeConfig: { formats: ['markdown'], onlyMainContent: true }
 * });
 * ```
 */
export async function createSource(
  data: NewNewsSource
): Promise<NewsSource> {
  try {
    const [source] = await db
      .insert(newsSources)
      .values(data)
      .returning();

    return source;
  } catch (error) {
    console.error("Error creating source:", error);
    throw new Error("Failed to create source");
  }
}

/**
 * Actualiza una fuente de noticias existente
 *
 * @param id - UUID de la fuente
 * @param data - Datos a actualizar
 * @returns La fuente actualizada
 */
export async function updateSource(
  id: string,
  data: Partial<NewNewsSource>
): Promise<NewsSource> {
  try {
    const [source] = await db
      .update(newsSources)
      .set(data)
      .where(eq(newsSources.id, id))
      .returning();

    if (!source) {
      throw new Error("Source not found");
    }

    return source;
  } catch (error) {
    console.error("Error updating source:", error);
    throw new Error("Failed to update source");
  }
}

/**
 * Obtiene todas las fuentes (activas e inactivas)
 *
 * @returns Array de todas las fuentes
 */
export async function getAllSources(): Promise<NewsSource[]> {
  try {
    return await db.select().from(newsSources);
  } catch (error) {
    console.error("Error fetching all sources:", error);
    throw new Error("Failed to fetch sources");
  }
}

/**
 * Activa o desactiva una fuente
 *
 * @param id - UUID de la fuente
 * @param isActive - true para activar, false para desactivar
 * @returns La fuente actualizada
 */
export async function toggleSourceActive(
  id: string,
  isActive: boolean
): Promise<NewsSource> {
  try {
    const [source] = await db
      .update(newsSources)
      .set({ isActive })
      .where(eq(newsSources.id, id))
      .returning();

    if (!source) {
      throw new Error("Source not found");
    }

    return source;
  } catch (error) {
    console.error("Error toggling source active:", error);
    throw new Error("Failed to toggle source");
  }
}

/**
 * Elimina una fuente de noticias
 *
 * @param id - UUID de la fuente
 * @returns void
 */
export async function deleteSource(id: string): Promise<void> {
  try {
    await db.delete(newsSources).where(eq(newsSources.id, id));
  } catch (error) {
    console.error("Error deleting source:", error);
    throw new Error("Failed to delete source");
  }
}
