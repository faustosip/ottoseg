CREATE TABLE "email_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_send_id" uuid NOT NULL,
	"url" text NOT NULL,
	"clicked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bulletin_id" uuid NOT NULL,
	"subscriber_id" uuid,
	"subscriber_email" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"tracking_id" text NOT NULL,
	"opened_at" timestamp,
	"open_count" integer DEFAULT 0,
	"click_count" integer DEFAULT 0,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_sends_tracking_id_unique" UNIQUE("tracking_id")
);
--> statement-breakpoint
ALTER TABLE "bulletins" ADD COLUMN "email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "email_clicks" ADD CONSTRAINT "email_clicks_email_send_id_email_sends_id_fk" FOREIGN KEY ("email_send_id") REFERENCES "public"."email_sends"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_bulletin_id_bulletins_id_fk" FOREIGN KEY ("bulletin_id") REFERENCES "public"."bulletins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE set null ON UPDATE no action;