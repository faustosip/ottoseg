ALTER TABLE "subscribers" ADD COLUMN "unsubscribe_token" text;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token");