CREATE TABLE "cart_snapshots" (
	"user_id" text PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_type" text NOT NULL,
	"previous_orders" integer DEFAULT 0 NOT NULL,
	"items_json" text DEFAULT '[]' NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"cart_total" integer DEFAULT 0 NOT NULL,
	"last_activity_at" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"analysis_json" text,
	"analysis_source" text,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_id" text NOT NULL,
	"cart_fingerprint" text NOT NULL,
	"customer_name" text NOT NULL,
	"intent_score" integer NOT NULL,
	"decision" text NOT NULL,
	"message_text" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"gemini_calls" integer DEFAULT 1 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
