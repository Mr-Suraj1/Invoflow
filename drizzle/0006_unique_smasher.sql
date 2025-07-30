CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"purchase_bill_id" text,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"expense_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_bill_extra_charges" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_bill_id" text NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_bill_items" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_bill_id" text NOT NULL,
	"item_id" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"cost_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"batch_number" text,
	"expiry_date" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_bills" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"supplier_id" text,
	"bill_number" text NOT NULL,
	"bill_date" timestamp NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0' NOT NULL,
	"extra_charges_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"location" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "purchase_bill_id" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_purchase_bill_id_purchase_bills_id_fk" FOREIGN KEY ("purchase_bill_id") REFERENCES "public"."purchase_bills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_bill_extra_charges" ADD CONSTRAINT "purchase_bill_extra_charges_purchase_bill_id_purchase_bills_id_fk" FOREIGN KEY ("purchase_bill_id") REFERENCES "public"."purchase_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_bill_items" ADD CONSTRAINT "purchase_bill_items_purchase_bill_id_purchase_bills_id_fk" FOREIGN KEY ("purchase_bill_id") REFERENCES "public"."purchase_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_bill_items" ADD CONSTRAINT "purchase_bill_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_bills" ADD CONSTRAINT "purchase_bills_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_bills" ADD CONSTRAINT "purchase_bills_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_purchase_bill_id_purchase_bills_id_fk" FOREIGN KEY ("purchase_bill_id") REFERENCES "public"."purchase_bills"("id") ON DELETE set null ON UPDATE no action;