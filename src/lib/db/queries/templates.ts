import { db } from "@/lib/db";
import {
  bulletinTemplates,
  type BulletinTemplate,
  type NewBulletinTemplate,
} from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

// ============================================================================
// BULLETIN TEMPLATES QUERIES
// ============================================================================

/**
 * Obtiene todos los templates activos
 *
 * @returns Array de templates activos
 *
 * @example
 * ```ts
 * const templates = await getActiveTemplates();
 * ```
 */
export async function getActiveTemplates(): Promise<BulletinTemplate[]> {
  try {
    return await db
      .select()
      .from(bulletinTemplates)
      .where(eq(bulletinTemplates.isActive, true));
  } catch (error) {
    console.error("Error fetching active templates:", error);
    throw new Error("Failed to fetch active templates");
  }
}

/**
 * Obtiene el template activo de una categoría específica
 *
 * @param category - Categoría del template (economia, politica, etc.)
 * @returns El template o null si no existe
 *
 * @example
 * ```ts
 * const template = await getTemplateByCategory('economia');
 * ```
 */
export async function getTemplateByCategory(
  category: string
): Promise<BulletinTemplate | null> {
  try {
    const [template] = await db
      .select()
      .from(bulletinTemplates)
      .where(
        and(
          eq(bulletinTemplates.category, category),
          eq(bulletinTemplates.isActive, true)
        )
      )
      .orderBy(desc(bulletinTemplates.version))
      .limit(1);

    return template || null;
  } catch (error) {
    console.error("Error fetching template by category:", error);
    throw new Error("Failed to fetch template");
  }
}

/**
 * Crea un nuevo template
 *
 * @param data - Datos del template
 * @returns El template creado
 *
 * @example
 * ```ts
 * const template = await createTemplate({
 *   name: 'Economía v2',
 *   category: 'economia',
 *   systemPrompt: 'Eres un experto en economía...',
 *   userPromptTemplate: 'Resume las siguientes noticias...',
 *   maxWords: 50,
 *   tone: 'profesional'
 * });
 * ```
 */
export async function createTemplate(
  data: NewBulletinTemplate
): Promise<BulletinTemplate> {
  try {
    const [template] = await db
      .insert(bulletinTemplates)
      .values(data)
      .returning();

    return template;
  } catch (error) {
    console.error("Error creating template:", error);
    throw new Error("Failed to create template");
  }
}

/**
 * Actualiza un template existente
 *
 * @param id - UUID del template
 * @param data - Datos a actualizar
 * @returns El template actualizado
 */
export async function updateTemplate(
  id: string,
  data: Partial<NewBulletinTemplate>
): Promise<BulletinTemplate> {
  try {
    const [template] = await db
      .update(bulletinTemplates)
      .set(data)
      .where(eq(bulletinTemplates.id, id))
      .returning();

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  } catch (error) {
    console.error("Error updating template:", error);
    throw new Error("Failed to update template");
  }
}

/**
 * Obtiene el historial de versiones de templates de una categoría
 *
 * @param category - Categoría del template
 * @returns Array de templates ordenados por versión (más reciente primero)
 *
 * @example
 * ```ts
 * const history = await getTemplateHistory('economia');
 * // [{ version: 3, ... }, { version: 2, ... }, { version: 1, ... }]
 * ```
 */
export async function getTemplateHistory(
  category: string
): Promise<BulletinTemplate[]> {
  try {
    return await db
      .select()
      .from(bulletinTemplates)
      .where(eq(bulletinTemplates.category, category))
      .orderBy(desc(bulletinTemplates.version));
  } catch (error) {
    console.error("Error fetching template history:", error);
    throw new Error("Failed to fetch template history");
  }
}

/**
 * Obtiene todos los templates (activos e inactivos)
 *
 * @returns Array de todos los templates
 */
export async function getAllTemplates(): Promise<BulletinTemplate[]> {
  try {
    return await db.select().from(bulletinTemplates);
  } catch (error) {
    console.error("Error fetching all templates:", error);
    throw new Error("Failed to fetch templates");
  }
}

/**
 * Desactiva un template específico
 *
 * @param id - UUID del template
 * @returns El template actualizado
 */
export async function deactivateTemplate(
  id: string
): Promise<BulletinTemplate> {
  try {
    const [template] = await db
      .update(bulletinTemplates)
      .set({ isActive: false })
      .where(eq(bulletinTemplates.id, id))
      .returning();

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  } catch (error) {
    console.error("Error deactivating template:", error);
    throw new Error("Failed to deactivate template");
  }
}

/**
 * Activa un template específico
 *
 * @param id - UUID del template
 * @returns El template actualizado
 */
export async function activateTemplate(
  id: string
): Promise<BulletinTemplate> {
  try {
    const [template] = await db
      .update(bulletinTemplates)
      .set({ isActive: true })
      .where(eq(bulletinTemplates.id, id))
      .returning();

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  } catch (error) {
    console.error("Error activating template:", error);
    throw new Error("Failed to activate template");
  }
}

/**
 * Crea una nueva versión de un template de categoría
 * Desactiva la versión anterior y crea una nueva con version+1
 *
 * @param category - Categoría del template
 * @param data - Datos del nuevo template
 * @returns El nuevo template creado
 */
export async function createTemplateVersion(
  category: string,
  data: Omit<NewBulletinTemplate, "category" | "version">
): Promise<BulletinTemplate> {
  try {
    // Obtener la versión actual
    const currentTemplate = await getTemplateByCategory(category);

    if (currentTemplate) {
      // Desactivar la versión actual
      await deactivateTemplate(currentTemplate.id);
    }

    // Crear nueva versión
    const newVersion = currentTemplate?.version ? currentTemplate.version + 1 : 1;

    return await createTemplate({
      ...data,
      category,
      version: newVersion,
      isActive: true,
    });
  } catch (error) {
    console.error("Error creating template version:", error);
    throw new Error("Failed to create template version");
  }
}
