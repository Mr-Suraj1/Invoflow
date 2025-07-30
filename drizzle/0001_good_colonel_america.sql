CREATE TABLE "bill_items" (
	"id" text PRIMARY KEY NOT NULL,
	"bill_id" text NOT NULL,
	"inventory_id" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"selling_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "client_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "bill_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "subtotal" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "tax" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "total" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" DROP COLUMN "vendor";--> statement-breakpoint
ALTER TABLE "bills" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "bills" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "bills" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "bills" DROP COLUMN "is_recurring";