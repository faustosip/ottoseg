import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  isActive: boolean("is_active").default(true).notNull(),
  allowedMenus: jsonb("allowed_menus").$type<string[] | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ============================================================================
// BULLETIN CATEGORIES TABLE
// ============================================================================

/**
 * Tabla de Categorías de Boletín
 * Categorías dinámicas que reemplazan las 6 categorías hardcoded
 */
export const bulletinCategories = pgTable("bulletin_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // slug: "economia", "ultima_hora"
  displayName: text("display_name").notNull(), // "Economía", "Última Hora"
  displayOrder: integer("display_order").notNull().default(0),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ============================================================================
// BULLETIN SYSTEM TABLES
// ============================================================================

/**
 * Tabla de Boletines
 * Almacena los boletines generados con todos sus datos y metadatos
 */
export const bulletins = pgTable("bulletins", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  status: text("status").notNull().default("draft"), // draft, scraping, classifying, summarizing, ready, authorized, video_processing, published, failed
  rawNews: jsonb("raw_news"), // Noticias scrapeadas sin procesar (Firecrawl - excerpts)
  fullArticles: jsonb("full_articles"), // Artículos completos (Crawl4AI - contenido full)
  classifiedNews: jsonb("classified_news"), // Noticias clasificadas por categoría

  // Resúmenes por categoría
  economia: text("economia"),
  politica: text("politica"),
  sociedad: text("sociedad"),
  seguridad: text("seguridad"),
  internacional: text("internacional"),
  vial: text("vial"),

  // URL del mapa de cierres viales
  roadClosureMapUrl: text("road_closure_map_url"),

  // Estadísticas
  totalNews: integer("total_news").default(0),
  crawl4aiStats: jsonb("crawl4ai_stats"), // Métricas de Crawl4AI (enriquecimiento)

  // Video (Legacy - individual avatar video)
  videoUrl: text("video_url"),
  videoStatus: text("video_status").default("pending"), // pending, processing, completed, failed
  videoMetadata: jsonb("video_metadata"),

  // Sistema de Video Automatizado
  selectedNews: jsonb("selected_news"), // Noticias seleccionadas para el video con imágenes
  categoryAudios: jsonb("category_audios"), // Audios generados por ElevenLabs {categoria: {url, duration}}
  categoryVideos: jsonb("category_videos"), // Videos de avatar por Simli {categoria: {simliUrl, mp4Url, duration}}
  finalVideoUrl: text("final_video_url"), // URL del video final compuesto
  finalVideoStatus: text("final_video_status").default("pending"), // pending, generating_audio, generating_avatars, rendering, completed, failed
  finalVideoMetadata: jsonb("final_video_metadata"), // Metadata del video final

  // Video manual (MP4 subido por el usuario)
  manualVideoUrl: text("manual_video_url"),

  // Logs y errores
  errorLog: jsonb("error_log"),

  // Diseño y branding
  designVersion: text("design_version").default("classic"), // classic, modern
  logoUrl: text("logo_url"),
  headerImageUrl: text("header_image_url"),
  footerImageUrl: text("footer_image_url"),
  brandColors: jsonb("brand_colors"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
  emailSentAt: timestamp("email_sent_at"),
});

/**
 * Tabla de Fuentes de Noticias
 * Configuración de las fuentes de donde se scrapean las noticias
 */
export const newsSources = pgTable("news_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // Primicias, La Hora, El Comercio, etc.
  url: text("url").notNull(),
  baseUrl: text("base_url").notNull(),
  selector: text("selector"), // CSS selector para scraping
  scrapeConfig: jsonb("scrape_config"), // Configuración de Firecrawl

  // Estado
  isActive: boolean("is_active").default(true).notNull(),
  lastScraped: timestamp("last_scraped"),
  lastScrapedStatus: text("last_scraped_status"), // success, failed, partial
  totalScraped: integer("total_scraped").default(0),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * Tabla de Templates de Boletín
 * Plantillas de prompts para generación con IA
 */
export const bulletinTemplates = pgTable("bulletin_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // economia, politica, sociedad, etc.
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template").notNull(),
  exampleOutput: text("example_output"),

  // Configuración
  maxWords: integer("max_words").default(50),
  tone: text("tone").default("profesional"), // profesional, informal, técnico

  // Versionado
  isActive: boolean("is_active").default(true).notNull(),
  version: integer("version").default(1),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * Tabla de Logs de Boletín
 * Registro de eventos del proceso de generación
 */
export const bulletinLogs = pgTable("bulletin_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  bulletinId: uuid("bulletin_id")
    .notNull()
    .references(() => bulletins.id, { onDelete: "cascade" }),

  step: text("step").notNull(), // scraping, classifying, summarizing, video_generation
  status: text("status").notNull(), // started, in_progress, completed, failed
  message: text("message"),
  metadata: jsonb("metadata"),
  duration: integer("duration"), // Duración en milisegundos

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Tabla de Auditoría de Boletines
 * Registra quién autorizó, publicó o eliminó cada boletín
 */
export const bulletinAuditLogs = pgTable("bulletin_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  bulletinId: uuid("bulletin_id")
    .notNull()
    .references(() => bulletins.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // "authorized", "published", "deleted"
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Tabla de Envíos de Email
 * Registra cada email individual enviado a cada suscriptor
 */
export const emailSends = pgTable("email_sends", {
  id: uuid("id").defaultRandom().primaryKey(),
  bulletinId: uuid("bulletin_id")
    .notNull()
    .references(() => bulletins.id, { onDelete: "cascade" }),
  subscriberId: uuid("subscriber_id")
    .references(() => subscribers.id, { onDelete: "set null" }),
  subscriberEmail: text("subscriber_email").notNull(),
  status: text("status").notNull().default("sent"), // sent, failed, bounced
  trackingId: text("tracking_id").notNull().unique(),
  openedAt: timestamp("opened_at"),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Tabla de Clics en Email
 * Registra cada clic individual en links del email
 */
export const emailClicks = pgTable("email_clicks", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailSendId: uuid("email_send_id")
    .notNull()
    .references(() => emailSends.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
});

/**
 * Tabla de Diseños de Boletín
 * Configuración de diferentes diseños/layouts
 */
export const bulletinDesigns = pgTable("bulletin_designs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // classic, modern, custom
  displayName: text("display_name").notNull(),
  description: text("description"),

  isActive: boolean("is_active").default(true).notNull(),

  // Configuración de diseño
  cssTemplate: text("css_template"),
  layoutConfig: jsonb("layout_config"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ============================================================================
// SUBSCRIBERS TABLE
// ============================================================================

/**
 * Tabla de Suscriptores
 * Almacena los suscriptores para envío de boletines por email
 */
export const subscribers = pgTable("subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  isActive: boolean("is_active").default(true).notNull(),
  unsubscribeToken: text("unsubscribe_token").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ============================================================================
// BULLETIN NEWS TYPES
// ============================================================================

/**
 * Estructura de una noticia individual scrapeada
 */
export interface BulletinNews {
  id: string; // UUID único
  title: string; // Título de la noticia
  content: string; // Resumen/extracto (de Firecrawl)
  fullContent?: string; // Contenido completo (de Crawl4AI)
  url: string; // URL de la noticia original
  imageUrl?: string; // URL de la imagen principal
  author?: string; // Autor del artículo (de Crawl4AI)
  publishedDate?: string; // Fecha de publicación (de Crawl4AI)
  source: string; // Fuente (Primicias, La Hora, etc.)
  selected: boolean; // Si está seleccionada para el boletín
  scrapedAt: string; // Timestamp del scraping
  category?: string; // Categoría asignada (economia, politica, etc.)
  metadata?: {
    wordCount?: number; // Número de palabras
    readingTime?: number; // Tiempo de lectura estimado (minutos)
    contentQuality?: number; // Score de calidad del contenido (0-100)
  };
}

/**
 * Estructura de noticias organizadas por categoría
 */
export interface CategorizedNews {
  economia: BulletinNews[];
  politica: BulletinNews[];
  sociedad: BulletinNews[];
  seguridad: BulletinNews[];
  internacional: BulletinNews[];
  vial: BulletinNews[];
}

/**
 * Estructura de noticias "raw" (sin categorizar, por fuente)
 */
export interface RawNewsBySource {
  [source: string]: BulletinNews[]; // Key = nombre de la fuente
}

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

// Better Auth tables
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

// Bulletin Categories table
export type BulletinCategory = typeof bulletinCategories.$inferSelect;
export type NewBulletinCategory = typeof bulletinCategories.$inferInsert;

// Bulletin System tables
export type Bulletin = typeof bulletins.$inferSelect;
export type NewBulletin = typeof bulletins.$inferInsert;
export type NewsSource = typeof newsSources.$inferSelect;
export type NewNewsSource = typeof newsSources.$inferInsert;
export type BulletinTemplate = typeof bulletinTemplates.$inferSelect;
export type NewBulletinTemplate = typeof bulletinTemplates.$inferInsert;
export type BulletinLog = typeof bulletinLogs.$inferSelect;
export type NewBulletinLog = typeof bulletinLogs.$inferInsert;
export type BulletinDesign = typeof bulletinDesigns.$inferSelect;
export type NewBulletinDesign = typeof bulletinDesigns.$inferInsert;

// Bulletin Audit Logs table
export type BulletinAuditLog = typeof bulletinAuditLogs.$inferSelect;
export type NewBulletinAuditLog = typeof bulletinAuditLogs.$inferInsert;

// Email tracking tables
export type EmailSend = typeof emailSends.$inferSelect;
export type NewEmailSend = typeof emailSends.$inferInsert;
export type EmailClick = typeof emailClicks.$inferSelect;
export type NewEmailClick = typeof emailClicks.$inferInsert;

// Subscribers table
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
