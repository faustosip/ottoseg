ALTER TABLE "bulletins" ADD COLUMN "selected_news" jsonb;--> statement-breakpoint
ALTER TABLE "bulletins" ADD COLUMN "category_audios" jsonb;--> statement-breakpoint
ALTER TABLE "bulletins" ADD COLUMN "category_videos" jsonb;--> statement-breakpoint
ALTER TABLE "bulletins" ADD COLUMN "final_video_url" text;--> statement-breakpoint
ALTER TABLE "bulletins" ADD COLUMN "final_video_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "bulletins" ADD COLUMN "final_video_metadata" jsonb;