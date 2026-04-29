ALTER TABLE "bulletin_categories" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "bulletin_categories" ADD COLUMN "keywords" jsonb DEFAULT '[]'::jsonb;