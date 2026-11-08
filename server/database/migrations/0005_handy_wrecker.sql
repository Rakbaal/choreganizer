CREATE TABLE "log_rooms" (
	"log_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	CONSTRAINT "log_rooms_log_id_room_id_pk" PRIMARY KEY("log_id","room_id")
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"apartment_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"done_by" text NOT NULL,
	"done_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "logs_note_length_check" CHECK ("logs"."note" is null or length("logs"."note") <= 500)
);
--> statement-breakpoint
ALTER TABLE "log_rooms" ADD CONSTRAINT "log_rooms_log_id_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_rooms" ADD CONSTRAINT "log_rooms_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_done_by_user_id_fk" FOREIGN KEY ("done_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "logs_feed_idx" ON "logs" USING btree ("apartment_id","done_at" DESC NULLS FIRST,"id" DESC NULLS FIRST);