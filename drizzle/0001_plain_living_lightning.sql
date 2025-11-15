CREATE TABLE "bulletin_designs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"css_template" text,
	"layout_config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bulletin_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bulletin_id" uuid NOT NULL,
	"step" text NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"metadata" jsonb,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bulletin_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"system_prompt" text NOT NULL,
	"user_prompt_template" text NOT NULL,
	"example_output" text,
	"max_words" integer DEFAULT 50,
	"tone" text DEFAULT 'profesional',
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bulletins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"raw_news" jsonb,
	"classified_news" jsonb,
	"economia" text,
	"politica" text,
	"sociedad" text,
	"seguridad" text,
	"internacional" text,
	"vial" text,
	"total_news" integer DEFAULT 0,
	"video_url" text,
	"video_status" text DEFAULT 'pending',
	"video_metadata" jsonb,
	"error_log" jsonb,
	"design_version" text DEFAULT 'classic',
	"logo_url" text,
	"header_image_url" text,
	"footer_image_url" text,
	"brand_colors" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "news_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"base_url" text NOT NULL,
	"selector" text,
	"scrape_config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_scraped" timestamp,
	"last_scraped_status" text,
	"total_scraped" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bulletin_logs" ADD CONSTRAINT "bulletin_logs_bulletin_id_bulletins_id_fk" FOREIGN KEY ("bulletin_id") REFERENCES "public"."bulletins"("id") ON DELETE cascade ON UPDATE no action;