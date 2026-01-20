/**
 * Subscriber CRUD Operations
 *
 * Database queries for managing newsletter subscribers
 */

import { db } from "@/lib/db";
import { subscribers, type Subscriber, type NewSubscriber } from "@/lib/schema";
import { eq, desc, asc, ilike, and, SQL } from "drizzle-orm";

/**
 * Get all subscribers with optional filtering
 */
export async function getSubscribers(options?: {
  search?: string;
  isActive?: boolean;
  orderBy?: "email" | "name" | "createdAt";
  orderDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}): Promise<{ subscribers: Subscriber[]; total: number }> {
  const {
    search,
    isActive,
    orderBy = "createdAt",
    orderDir = "desc",
    limit = 50,
    offset = 0,
  } = options || {};

  // Build where conditions
  const conditions: SQL[] = [];

  if (search) {
    conditions.push(
      ilike(subscribers.email, `%${search}%`)
    );
  }

  if (isActive !== undefined) {
    conditions.push(eq(subscribers.isActive, isActive));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Build order clause
  const orderColumn = {
    email: subscribers.email,
    name: subscribers.name,
    createdAt: subscribers.createdAt,
  }[orderBy];

  const orderFn = orderDir === "asc" ? asc : desc;

  // Execute query
  const results = await db
    .select()
    .from(subscribers)
    .where(whereClause)
    .orderBy(orderFn(orderColumn))
    .limit(limit)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select()
    .from(subscribers)
    .where(whereClause);

  return {
    subscribers: results,
    total: countResult.length,
  };
}

/**
 * Get a single subscriber by ID
 */
export async function getSubscriberById(id: string): Promise<Subscriber | null> {
  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.id, id))
    .limit(1);

  return subscriber || null;
}

/**
 * Get a single subscriber by email
 */
export async function getSubscriberByEmail(email: string): Promise<Subscriber | null> {
  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email.toLowerCase()))
    .limit(1);

  return subscriber || null;
}

/**
 * Create a new subscriber
 */
export async function createSubscriber(data: NewSubscriber): Promise<Subscriber> {
  const [subscriber] = await db
    .insert(subscribers)
    .values({
      ...data,
      email: data.email.toLowerCase(),
    })
    .returning();

  return subscriber;
}

/**
 * Update a subscriber
 */
export async function updateSubscriber(
  id: string,
  data: Partial<NewSubscriber>
): Promise<Subscriber | null> {
  const updateData = { ...data };
  if (data.email) {
    updateData.email = data.email.toLowerCase();
  }

  const [subscriber] = await db
    .update(subscribers)
    .set(updateData)
    .where(eq(subscribers.id, id))
    .returning();

  return subscriber || null;
}

/**
 * Delete a subscriber
 */
export async function deleteSubscriber(id: string): Promise<boolean> {
  const result = await db
    .delete(subscribers)
    .where(eq(subscribers.id, id))
    .returning();

  return result.length > 0;
}

/**
 * Get all active subscribers (for email sending)
 */
export async function getActiveSubscribers(): Promise<Subscriber[]> {
  return db
    .select()
    .from(subscribers)
    .where(eq(subscribers.isActive, true))
    .orderBy(asc(subscribers.email));
}

/**
 * Bulk create subscribers (for CSV import)
 * Returns count of created and skipped (duplicates)
 */
export async function bulkCreateSubscribers(
  data: Array<{ email: string; name?: string }>
): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of data) {
    try {
      // Check if email already exists
      const existing = await getSubscriberByEmail(item.email);
      if (existing) {
        skipped++;
        continue;
      }

      await createSubscriber({
        email: item.email,
        name: item.name || null,
        isActive: true,
      });
      created++;
    } catch (error) {
      errors.push(`Error with ${item.email}: ${(error as Error).message}`);
    }
  }

  return { created, skipped, errors };
}

/**
 * Toggle subscriber active status
 */
export async function toggleSubscriberStatus(id: string): Promise<Subscriber | null> {
  const subscriber = await getSubscriberById(id);
  if (!subscriber) return null;

  return updateSubscriber(id, { isActive: !subscriber.isActive });
}
