CREATE TABLE "task_rooms" (
	"task_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	CONSTRAINT "task_rooms_task_id_room_id_pk" PRIMARY KEY("task_id","room_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"apartment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"all_rooms" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"frequency_interval" integer,
	"frequency_unit" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_frequency_pair_check" CHECK (("tasks"."frequency_interval" is null) = ("tasks"."frequency_unit" is null)),
	CONSTRAINT "tasks_frequency_interval_check" CHECK ("tasks"."frequency_interval" is null or "tasks"."frequency_interval" between 1 and 365),
	CONSTRAINT "tasks_frequency_unit_check" CHECK ("tasks"."frequency_unit" is null or "tasks"."frequency_unit" in ('day', 'week', 'month'))
);
--> statement-breakpoint
ALTER TABLE "task_rooms" ADD CONSTRAINT "task_rooms_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_rooms" ADD CONSTRAINT "task_rooms_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_active_name_idx" ON "tasks" USING btree ("apartment_id",lower("name")) WHERE "tasks"."archived_at" is null;