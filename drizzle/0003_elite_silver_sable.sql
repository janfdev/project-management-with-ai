CREATE TYPE "public"."review_decision" AS ENUM('pending', 'approved', 'adjusted', 'rejected');--> statement-breakpoint
CREATE TABLE "quality_verification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"reviewer_id" text,
	"decision" "review_decision" NOT NULL,
	"ai_score" integer,
	"pm_score" integer,
	"reason" text,
	"ai_confidence" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "ai_confidence_level" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "ai_strengths" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "ai_weaknesses" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "review_decision" "review_decision" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "pm_adjusted_score" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "pm_notes" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "quality_verification_logs" ADD CONSTRAINT "quality_verification_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_verification_logs" ADD CONSTRAINT "quality_verification_logs_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;