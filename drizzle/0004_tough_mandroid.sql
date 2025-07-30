CREATE TABLE "bill_extra_charges" (
	"id" text PRIMARY KEY NOT NULL,
	"bill_id" text NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "invoice_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "bill_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "tax_rate" numeric(5, 2) DEFAULT '10.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "extra_charges_total" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "bill_extra_charges" ADD CONSTRAINT "bill_extra_charges_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" DROP COLUMN "due_date";