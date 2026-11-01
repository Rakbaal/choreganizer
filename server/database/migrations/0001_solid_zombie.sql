CREATE TABLE "apartments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"timezone" text DEFAULT 'Europe/Brussels' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"apartment_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_apartment_id_user_id_pk" PRIMARY KEY("apartment_id","user_id"),
	CONSTRAINT "memberships_role_check" CHECK ("memberships"."role" in ('owner', 'member'))
);
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;